import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import type { Response } from 'express';
import type { RequestWithUser } from './types/request-with-user';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { parseTtlToSeconds } from './utils/time';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('sign-up')
  @Public()
  @HttpCode(201)
  async signUp(@Body() body: SignUpDto) {
    return {
      value: await this.authService.signUp(body.username, body.password),
    };
  }

  @Post('sign-in')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async signIn(@Body() body: SignInDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signIn(body.username, body.password);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      value: { user: result.user, accessToken: result.accessToken },
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token || '';
    const result = await this.authService.refresh(token);
    this.setRefreshCookie(res, result.refreshToken);
    return { value: { user: result.user, accessToken: result.accessToken } };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = String(req.user?.userId || '');
    await this.authService.logout(userId);
    res.clearCookie('refresh_token', { path: '/auth' });
    return { value: { success: true } };
  }

  @Get('me')
  @HttpCode(200)
  async me(@Req() req: RequestWithUser) {
    const userId = String(req.user?.userId || '');
    return { value: await this.authService.me(userId) };
  }

  private setRefreshCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const refreshTtlRaw = this.config.get<string>('JWT_REFRESH_TTL') || '7d';
    const maxAge = parseTtlToSeconds(refreshTtlRaw) * 1000;
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/auth',
      maxAge,
    });
  }
}
