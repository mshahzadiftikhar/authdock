import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { AuthProvider } from '../AuthProvider';
import { SignupForm } from './SignupForm';

describe('SignupForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders email, password, and a submit button', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }));

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <SignupForm />
      </AuthProvider>,
    );

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy();
  });

  it('submits email/password and reports verificationSent to onSuccess', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) }) // AuthProvider's getSession()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            user: { id: '1', email: 'new@example.com', emailVerified: false, createdAt: '2026-01-01' },
            verificationSent: true,
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const onSuccess = vi.fn();
    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <SignupForm onSuccess={onSuccess} />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-horse-battery' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ verificationSent: true }));

    const signupCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('/signup'));
    expect(JSON.parse(signupCall![1].body)).toEqual({ email: 'new@example.com', password: 'correct-horse-battery' });
  });

  it('shows the server error message on a failed signup', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) }) // getSession()
      .mockResolvedValueOnce({ ok: false, status: 409, json: () => Promise.resolve({ message: 'Email already in use' }) });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <SignupForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-horse-battery' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(screen.getByText('Email already in use')).toBeTruthy());
  });
});
