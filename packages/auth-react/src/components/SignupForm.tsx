import { FormEvent, useState } from 'react';
import { useSignUp } from '../hooks/useSignUp';
import { AuthFormClassNames, cx } from './classnames';

export interface SignupFormProps {
  classNames?: AuthFormClassNames;
  onSuccess?: (opts: { verificationSent: boolean }) => void;
}

export function SignupForm({ classNames = {}, onSuccess }: SignupFormProps) {
  const { signUp, loading, error } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await signUp(email, password);
      onSuccess?.({ verificationSent: result.verificationSent });
    } catch {
      // error state already surfaced by useSignUp
    }
  }

  return (
    <form className={cx('authdock-form', classNames.form)} onSubmit={handleSubmit}>
      <div className={cx('authdock-field', classNames.field)}>
        <label className={cx('authdock-label', classNames.label)} htmlFor="authdock-signup-email">
          Email
        </label>
        <input
          id="authdock-signup-email"
          className={cx('authdock-input', classNames.input)}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={cx('authdock-field', classNames.field)}>
        <label className={cx('authdock-label', classNames.label)} htmlFor="authdock-signup-password">
          Password
        </label>
        <input
          id="authdock-signup-password"
          className={cx('authdock-input', classNames.input)}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className={cx('authdock-error', classNames.error)}>{error}</p>}
      <button className={cx('authdock-button', classNames.button)} type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Sign up'}
      </button>
    </form>
  );
}
