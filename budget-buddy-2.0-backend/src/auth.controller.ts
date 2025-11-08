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
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('sign-up')
  // @Public()
  // @HttpCode(201)
  // async signUp(
  //   @Body('username') usernameRaw: string,
  //   @Body('password') passwordRaw: string,
  // ) {
  //   return {
  //     value: await this.authService.signUp(usernameRaw, passwordRaw),
  //   };
  // }

  @Post('sign-in')
  @Public()
  @HttpCode(200)
  async signIn(
    @Body('username') usernameRaw: string,
    @Body('password') passwordRaw: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(usernameRaw, passwordRaw);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      value: { user: result.user, accessToken: result.accessToken },
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token || '';
    const result = await this.authService.refresh(token);
    this.setRefreshCookie(res, result.refreshToken);
    return { value: { user: result.user, accessToken: result.accessToken } };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = String(req.user?.userId || '');
    await this.authService.logout(userId);
    res.clearCookie('refresh_token', { path: '/auth' });
    return { value: { success: true } };
  }

  @Get('me')
  @HttpCode(200)
  async me(@Req() req: any) {
    const userId = String(req.user?.userId || '');
    return { value: await this.authService.me(userId) };
  }

  private setRefreshCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
