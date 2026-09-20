import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider } from '../AuthProvider';
import { useSession } from './useSession';
import { useSignOut } from './useSignOut';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider baseUrl="http://localhost:3000/api/auth">{children}</AuthProvider>;
}

describe('useSignOut', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the logout endpoint and clears the session even if the request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: { id: '1', email: 'a@b.com', emailVerified: true, createdAt: '2026-01-01' } }),
      }) // AuthProvider's getSession() on mount
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({ message: 'server error' }) }); // logout fails
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(
      () => {
        const session = useSession();
        const signOut = useSignOut();
        return { session, signOut };
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current.session.isSignedIn).toBe(true));

    await result.current.signOut.signOut().catch(() => undefined);

    // Session is cleared client-side regardless of whether the logout call
    // itself succeeded — a failed logout request shouldn't leave the UI
    // stuck showing a signed-in user.
    await waitFor(() => expect(result.current.session.isSignedIn).toBe(false));

    const logoutCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('/logout'));
    expect(logoutCall).toBeTruthy();
  });
});
