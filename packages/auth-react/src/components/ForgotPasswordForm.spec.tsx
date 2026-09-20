import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { AuthProvider } from '../AuthProvider';
import { ForgotPasswordForm } from './ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders an email field and a submit button', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }));

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <ForgotPasswordForm />
      </AuthProvider>,
    );

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeTruthy();
  });

  it('shows the same confirmation message regardless of whether the account exists', async () => {
    // The API deliberately never reveals account existence (see
    // AuthController.forgotPassword) — the form just needs to surface
    // whatever message the API sent, unconditionally.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) }) // getSession()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'If an account with that email exists, a reset link has been sent.' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <ForgotPasswordForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'anyone@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText('If an account with that email exists, a reset link has been sent.')).toBeTruthy(),
    );

    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes('/forgot-password'));
    expect(JSON.parse(call![1].body)).toEqual({ email: 'anyone@example.com' });
  });
});
