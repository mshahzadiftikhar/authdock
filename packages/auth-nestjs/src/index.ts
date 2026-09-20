export * from './auth.module';
export * from './auth.service';
export * from './auth-engine.interface';
export * from './decorators/public.decorator';
export * from './decorators/current-user.decorator';
export * from './config/auth-config.schema';
export * from './email/email-provider.interface';
export * from './email/resend-email.provider';
export * from './email/console-email.provider';

/**
 * Exported as a narrow, deliberate exception to "nothing outside
 * better-auth.engine.ts touches better-auth directly" — it exists so your
 * own better-auth.cli-config.ts (see better-auth.cli-config.example.ts,
 * shipped alongside this package) can reuse the exact same betterAuth()
 * config AuthModule.forRoot() builds at runtime, instead of hand-duplicating
 * it and risking the two drifting apart. Its return type is still `any`
 * deliberately (see better-auth.engine.ts) — this is CLI/schema-tooling
 * glue, not part of the app-facing API.
 */
export { createBetterAuthInstance } from './better-auth.engine';
