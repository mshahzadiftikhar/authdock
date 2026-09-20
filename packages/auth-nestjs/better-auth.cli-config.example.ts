// Copy this file into your own project as `better-auth.cli-config.ts`, then:
//
//   npx @better-auth/cli generate --config better-auth.cli-config.ts   # preview the SQL
//   npx @better-auth/cli migrate --config better-auth.cli-config.ts    # apply it
//
// Not imported by any runtime code — used only by the CLI commands above.
// It reuses createBetterAuthInstance (the exact same builder
// AuthModule.forRoot() uses internally) so the schema the CLI derives can
// never drift from what your app actually configures at runtime.
import { Pool } from 'pg';
import { createBetterAuthInstance, loadAuthConfig, ConsoleEmailProvider } from '@authdock/auth-nestjs';

const config = loadAuthConfig();
const pool = new Pool({ connectionString: config.DATABASE_URL });

export const auth = createBetterAuthInstance(pool, config, new ConsoleEmailProvider());
