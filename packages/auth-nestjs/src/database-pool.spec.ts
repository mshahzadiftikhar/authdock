import { Pool } from 'pg';
import { buildDatabasePool } from './database-pool';

describe('buildDatabasePool — pool ownership', () => {
  // A leaked or wrongly-closed pool is a resource/availability bug, not a
  // cosmetic one — worth covering per CLAUDE.md's "test anything
  // security-relevant" bar.

  it('builds and closes its own Pool when given a connection string', async () => {
    const { pool, onModuleDestroy } = buildDatabasePool('postgresql://user:password@localhost:5432/authdock');
    expect(pool).toBeInstanceOf(Pool);
    await expect(onModuleDestroy()).resolves.toBeUndefined();
  });

  it('does not close a Pool the caller constructed and passed in', async () => {
    const end = jest.fn().mockResolvedValue(undefined);
    const callerOwnedPool = { end } as unknown as Pool;

    const { pool, onModuleDestroy } = buildDatabasePool(callerOwnedPool);
    expect(pool).toBe(callerOwnedPool);
    await onModuleDestroy();

    expect(end).not.toHaveBeenCalled();
  });
});
