// Config file for `npx @better-auth/cli generate` / `migrate` only — not
// imported by any runtime code. It reuses createBetterAuthInstance from
// better-auth.engine.ts so the schema the CLI derives can never drift from
// what AuthModule actually configures at runtime (see that file's comment
// for why this is exported instead of hand-duplicated here).
import { Pool } from 'pg';
import { createBetterAuthInstance } from './src/better-auth.engine';
import type { AuthConfig } from './src/config/auth-config.schema';
import { ConsoleEmailProvider } from './src/email/console-email.provider';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/authdock',
});

// A minimal, valid AuthConfig — only DATABASE_URL matters for schema
// generation/migration; the rest just need to satisfy the type.
const config: AuthConfig = {
  NODE_ENV: 'development',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/authdock',
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'cli-schema-generation-only-not-a-real-secret',
  SESSION_STRATEGY: 'cookie',
  RESEND_API_KEY: '',
  RESEND_FROM: 'onboarding@resend.dev',
  FRONTEND_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:3000/api',
};

export const auth = createBetterAuthInstance(pool, config, new ConsoleEmailProvider());
