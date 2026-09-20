import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider } from '../AuthProvider';
import { useSession } from './useSession';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider baseUrl="http://localhost:3000/api/auth">{children}</AuthProvider>;
}

describe('useSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts loading, then reports the signed-in user once getSession resolves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: { id: '1', email: 'a@b.com', emailVerified: true, createdAt: '2026-01-01' } }),
      }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.isSignedIn).toBe(false);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('reports signed-out (null user) when there is no session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }));

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
