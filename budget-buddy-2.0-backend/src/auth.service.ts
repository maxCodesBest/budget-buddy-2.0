import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USER_MODEL_NAME, UserDocument } from './schemas/user.schema';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(USER_MODEL_NAME)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(usernameRaw: string, passwordRaw: string) {
    const username = String(usernameRaw ?? '').trim();
    const password = String(passwordRaw ?? '');

    if (!username || !password) {
      throw new BadRequestException('username and password are required');
    }
    if (/\s/.test(username) || username.length < 3) {
      throw new BadRequestException('invalid username');
    }
    if (password.length < 8) {
      throw new BadRequestException('password too short');
    }

    const existing = await this.userModel.findOne({ username });
    if (existing) {
      throw new ConflictException('username already exists');
    }

    const salt = randomBytes(16).toString('hex');
    const hashBuffer = (await scrypt(password, salt, 64)) as Buffer;
    const passwordHash = `${salt}:${hashBuffer.toString('hex')}`;

    const created = await this.userModel.create({
      username,
      passwordHash,
    });

    return {
      id: String(created._id),
      username: created.username,
      createdAt: created.createdAt,
    };
  }

  async signIn(usernameRaw: string, passwordRaw: string) {
    const username = String(usernameRaw ?? '').trim();
    const password = String(passwordRaw ?? '');

    if (!username || !password) {
      throw new BadRequestException('username and password are required');
    }

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new BadRequestException('invalid credentials');
    }

    const [salt, storedHex] = String(user.passwordHash || '').split(':');
    if (!salt || !storedHex) {
      throw new BadRequestException('invalid credentials');
    }
    const hashBuffer = (await scrypt(password, salt, 64)) as Buffer;
    const computedHex = hashBuffer.toString('hex');
    if (computedHex !== storedHex) {
      throw new BadRequestException('invalid credentials');
    }

    const tokens = await this.issueTokens(String(user._id), user.username);
    await this.setRefreshTokenHash(String(user._id), tokens.refreshToken);
    return {
      user: { id: String(user._id), username: user.username },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException();
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'dev_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException();
    }
    const userId = String(payload.sub || '');
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();
    const [salt, storedHex] = String(user.refreshTokenHash).split(':');
    const buf = (await scrypt(refreshToken, salt, 64)) as Buffer;
    if (buf.toString('hex') !== storedHex) throw new UnauthorizedException();

    const tokens = await this.issueTokens(userId, user.username);
    await this.setRefreshTokenHash(userId, tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      user: { id: userId, username: user.username },
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1 },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { id: String(user._id), username: user.username };
  }

  private async issueTokens(userId: string, username: string) {
    const accessTtlRaw =
      this.configService.get<string>('JWT_ACCESS_TTL') || '15m';
    const accessExpiresIn = this.parseTtlToSeconds(accessTtlRaw);
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, username },
      {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'dev_access_secret',
        expiresIn: accessExpiresIn,
      },
    );
    const refreshTtlRaw =
      this.configService.get<string>('JWT_REFRESH_TTL') || '7d';
    const refreshExpiresIn = this.parseTtlToSeconds(refreshTtlRaw);
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, username },
      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'dev_refresh_secret',
        expiresIn: refreshExpiresIn,
      },
    );
    return { accessToken, refreshToken };
  }

  private async setRefreshTokenHash(userId: string, refreshToken: string) {
    const salt = randomBytes(16).toString('hex');
    const hashBuffer = (await scrypt(refreshToken, salt, 64)) as Buffer;
    const refreshTokenHash = `${salt}:${hashBuffer.toString('hex')}`;
    await this.userModel.findByIdAndUpdate(
      userId,
      { refreshTokenHash },
      { new: false },
    );
  }

  private parseTtlToSeconds(value?: string): number {
    if (!value) return 900;
    const v = String(value).trim().toLowerCase();
    const num = Number(v);
    if (!Number.isNaN(num)) return num;
    const match = v.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900;
    const amount = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return 900;
    }
  }
}
