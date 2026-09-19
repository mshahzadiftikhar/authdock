import { FormEvent, useState } from 'react';
import { useSignIn } from '../hooks/useSignIn';
import { AuthFormClassNames, cx } from './classnames';

export interface LoginFormProps {
  classNames?: AuthFormClassNames;
  onSuccess?: () => void;
}

/** The default styled login form, built on useSignIn(). Fork-free restyling via `classNames` or CSS variables (theme.css). */
export function LoginForm({ classNames = {}, onSuccess }: LoginFormProps) {
  const { signIn, loading, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await signIn(email, password);
      onSuccess?.();
    } catch {
      // error state already surfaced by useSignIn
    }
  }

  return (
    <form className={cx('authdock-form', classNames.form)} onSubmit={handleSubmit}>
      <div className={cx('authdock-field', classNames.field)}>
        <label className={cx('authdock-label', classNames.label)} htmlFor="authdock-email">
          Email
        </label>
        <input
          id="authdock-email"
          className={cx('authdock-input', classNames.input)}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={cx('authdock-field', classNames.field)}>
        <label className={cx('authdock-label', classNames.label)} htmlFor="authdock-password">
          Password
        </label>
        <input
          id="authdock-password"
          className={cx('authdock-input', classNames.input)}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className={cx('authdock-error', classNames.error)}>{error}</p>}
      <button className={cx('authdock-button', classNames.button)} type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
