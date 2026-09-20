import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../AuthProvider';
import { VerifyEmailStatus } from './VerifyEmailStatus';

function mockFetchOnce(ok: boolean, body: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 400,
      json: () => Promise.resolve(body),
    }),
  );
}

describe('VerifyEmailStatus', () => {
  beforeEach(() => {
    // AuthProvider's own getSession() call on mount — kept separate from the
    // per-test mock below, which only needs to cover the verify-email call.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('verifies the token on mount and shows success', async () => {
    mockFetchOnce(true, { message: 'Email verified' });

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <VerifyEmailStatus token="a-token" />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText(/your email is verified/i)).toBeTruthy());

    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[0]).includes('/verify-email'),
    );
    expect(call?.[0]).toContain('token=a-token');
  });

  it('shows an error and a resend option when verification fails', async () => {
    mockFetchOnce(false, { message: 'Invalid or expired token' });

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <VerifyEmailStatus token="bad-token" />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText(/invalid or expired token/i)).toBeTruthy());
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeTruthy();
  });
});
