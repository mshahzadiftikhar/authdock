import { Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface DatabasePool {
  pool: Pool;
  /** Closes the pool only if this module built it (see buildDatabasePool below). */
  onModuleDestroy: () => Promise<void>;
}

/**
 * `database` is either a connection string (we build and own the Pool,
 * closing it on shutdown) or a Pool the caller already constructed (they
 * keep owning its lifecycle — it may be shared with the rest of their app,
 * so closing it here would be a surprise).
 *
 * Deliberately has zero dependency on better-auth — it's imported by
 * auth.module.spec.ts directly, and better-auth ships ESM, which breaks
 * ts-jest's default CJS transform when pulled in transitively.
 */
export function buildDatabasePool(database: Pool | string): DatabasePool {
  const ownsPool = typeof database === 'string';
  const pool = ownsPool ? new Pool({ connectionString: database }) : database;

  return {
    pool,
    onModuleDestroy: async () => {
      if (!ownsPool) {
        return;
      }
      await pool.end();
      new Logger('AuthModule').log('Closed the Postgres pool it created from a connection string.');
    },
  };
}
