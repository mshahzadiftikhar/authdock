import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import type { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AUTH_CONFIG, AUTH_ENGINE } from './auth.constants';
import { BetterAuthEngine } from './better-auth.engine';
import { AuthConfig, loadAuthConfig } from './config/auth-config.schema';
import { EmailProvider } from './email/email-provider.interface';
import { ConsoleEmailProvider } from './email/console-email.provider';
import { ResendEmailProvider } from './email/resend-email.provider';

export interface AuthModuleOptions {
  prisma: PrismaClient;
  /** Defaults to loadAuthConfig(process.env) — pass explicitly to override for tests. */
  config?: AuthConfig;
  /** Defaults to Resend in production, console logging in development — see auth-config.schema. */
  emailProvider?: EmailProvider;
}

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const config = options.config ?? loadAuthConfig();
    const emailProvider =
      options.emailProvider ??
      (config.NODE_ENV === 'production'
        ? new ResendEmailProvider(config.RESEND_API_KEY, config.RESEND_FROM)
        : new ConsoleEmailProvider());

    return {
      module: AuthModule,
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]), // module-wide default; endpoints override via @Throttle
      ],
      controllers: [AuthController],
      providers: [
        { provide: AUTH_CONFIG, useValue: config },
        {
          provide: AUTH_ENGINE,
          useFactory: () => new BetterAuthEngine(options.prisma, config, emailProvider),
        },
        AuthService,
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
      exports: [AuthService],
      global: true,
    };
  }
}
