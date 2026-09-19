import { FormEvent, useState } from 'react';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { AuthFormClassNames, cx } from './classnames';

export interface ForgotPasswordFormProps {
  classNames?: AuthFormClassNames;
}

export function ForgotPasswordForm({ classNames = {} }: ForgotPasswordFormProps) {
  const { requestReset, loading, error, message } = usePasswordReset();
  const [email, setEmail] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await requestReset(email);
  }

  return (
    <form className={cx('authdock-form', classNames.form)} onSubmit={handleSubmit}>
      <div className={cx('authdock-field', classNames.field)}>
        <label className={cx('authdock-label', classNames.label)} htmlFor="authdock-forgot-email">
          Email
        </label>
        <input
          id="authdock-forgot-email"
          className={cx('authdock-input', classNames.input)}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className={cx('authdock-error', classNames.error)}>{error}</p>}
      {message && <p className={cx('authdock-label', classNames.label)}>{message}</p>}
      <button className={cx('authdock-button', classNames.button)} type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
