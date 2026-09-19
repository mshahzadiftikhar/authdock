import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../AuthProvider';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email, password, and a submit button', () => {
    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <LoginForm />
      </AuthProvider>,
    );

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });

  it('applies classNames overrides without dropping the default classes', () => {
    render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth">
        <LoginForm classNames={{ button: 'my-button' }} />
      </AuthProvider>,
    );

    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button.className).toContain('authdock-button');
    expect(button.className).toContain('my-button');
  });

  it('detects and updates the preferred color scheme when enabled', () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let matches = true;
    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
      get matches() {
        return matches;
      },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }));

    const { container } = render(
      <AuthProvider baseUrl="http://localhost:3000/api/auth" autoDetectColorScheme>
        <LoginForm />
      </AuthProvider>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-authdock-color-scheme', 'dark');

    matches = false;
    act(() => listeners.forEach((listener) => listener({} as MediaQueryListEvent)));

    expect(container.firstElementChild).toHaveAttribute('data-authdock-color-scheme', 'light');
  });
});
