import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { AuthProvider } from '../AuthProvider';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a new-password field and a submit button', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }));

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <ResetPasswordForm token="a-token" />
      </AuthProvider>,
    );

    expect(screen.getByLabelText('New password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeTruthy();
  });

  it('submits the token and new password, and calls onSuccess', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) }) // AuthProvider's getSession()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ message: 'Password updated' }) });
    vi.stubGlobal('fetch', fetchMock);

    const onSuccess = vi.fn();
    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <ResetPasswordForm token="a-token" onSuccess={onSuccess} />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-correct-horse' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    const resetCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('/reset-password'));
    expect(resetCall).toBeTruthy();
    expect(JSON.parse(resetCall![1].body)).toEqual({ token: 'a-token', password: 'new-correct-horse' });
  });
});
