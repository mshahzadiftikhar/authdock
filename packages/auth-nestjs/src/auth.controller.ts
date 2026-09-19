import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './auth-engine.interface';

const SESSION_COOKIE = 'authdock_session';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 signups/min/IP — see security checklist in the plan doc
  async signUp(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const { user, verificationSent } = await this.auth.signUp(body);
    return { user, verificationSent };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // 10 attempts/min/IP — brute-force mitigation
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.signIn(body);
    res.cookie(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
    });
    return { user: session.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) await this.auth.signOut(token);
    res.clearCookie(SESSION_COOKIE);
    return { message: 'Logged out' };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Public()
  @Get('verify-email')
  @HttpCode(200)
  async verifyEmail(@Query('token') token: string) {
    await this.auth.verifyEmail(token);
    return { message: 'Email verified' };
  }

  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@CurrentUser() user: AuthUser) {
    await this.auth.resendVerificationEmail(user.email);
    return { message: 'Verification email sent' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() body: { email: string }) {
    await this.auth.requestPasswordReset(body.email);
    // Always the same response, whether or not the account exists — never leak that.
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.auth.resetPassword(body.token, body.password);
    return { message: 'Password updated' };
  }
}
