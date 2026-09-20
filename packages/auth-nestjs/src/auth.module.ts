import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Pool } from 'pg';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AUTH_CONFIG, AUTH_ENGINE } from './auth.constants';
import { BetterAuthEngine } from './better-auth.engine';
import { buildDatabasePool } from './database-pool';
import { AuthConfig, loadAuthConfig } from './config/auth-config.schema';
import { EmailProvider } from './email/email-provider.interface';
import { ConsoleEmailProvider } from './email/console-email.provider';
import { ResendEmailProvider } from './email/resend-email.provider';

export interface AuthModuleOptions {
  /**
   * A Postgres connection string (AuthModule builds and owns the `Pool`,
   * closing it on shutdown), or a `Pool` you've already constructed
   * yourself (you keep owning its lifecycle — AuthModule won't close it,
   * since you may be sharing it with other parts of your app).
   */
  database: Pool | string;
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

    const { pool, onModuleDestroy } = buildDatabasePool(options.database);

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
          useFactory: () => new BetterAuthEngine(pool, config, emailProvider),
        },
        AuthService,
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: 'AUTHDOCK_POOL_LIFECYCLE',
          useFactory: () => ({ onModuleDestroy }),
        },
      ],
      exports: [AuthService],
      global: true,
    };
  }
}
