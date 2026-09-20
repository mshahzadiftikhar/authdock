import { FormEvent, useState } from 'react';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { AuthFormClassNames, cx } from './classnames';

export interface ResetPasswordFormProps {
  /** The reset token from the emailed link's `?token=` query param — read it with your router. */
  token: string;
  classNames?: AuthFormClassNames;
  onSuccess?: () => void;
}

/** Completes a password reset. Pairs with ForgotPasswordForm, which only requests the link. */
export function ResetPasswordForm({ token, classNames = {}, onSuccess }: ResetPasswordFormProps) {
  const { resetPassword, loading, error } = usePasswordReset();
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await resetPassword(token, password);
      onSuccess?.();
    } catch {
      // error state already surfaced by usePasswordReset
    }
  }

  return (
    <form className={cx('authdock-form', classNames.form)} onSubmit={handleSubmit}>
      <div className={cx('authdock-field', classNames.field)}>
        <label className={cx('authdock-label', classNames.label)} htmlFor="authdock-reset-password">
          New password
        </label>
        <input
          id="authdock-reset-password"
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
        {loading ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  );
}
