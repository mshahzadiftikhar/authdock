import { useEffect, useRef, type ReactNode } from 'react';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { AuthFormClassNames, cx } from './classnames';

export interface VerifyEmailStatusProps {
  /** The verification token from the emailed link's `?token=` query param — read it with your router. */
  token: string;
  classNames?: Pick<AuthFormClassNames, 'form' | 'error' | 'label' | 'button'>;
  onSuccess?: () => void;
}

/** Verifies the token on mount and shows the result. No form — the token drives everything. */
export function VerifyEmailStatus({ token, classNames = {}, onSuccess }: VerifyEmailStatusProps) {
  const { verifyEmail, resendVerification, loading, error, verified, message } = useEmailVerification();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) {
      return;
    }
    attempted.current = true;
    verifyEmail(token)
      .then(() => onSuccess?.())
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  let status: ReactNode;
  if (loading) {
    status = <p className={cx('authdock-label', classNames.label)}>Verifying…</p>;
  } else if (verified) {
    status = <p className={cx('authdock-label', classNames.label)}>Your email is verified.</p>;
  } else if (error) {
    status = (
      <div>
        <p className={cx('authdock-error', classNames.error)}>{error}</p>
        <button
          className={cx('authdock-button', classNames.button)}
          type="button"
          onClick={() => resendVerification()}
          disabled={loading}
        >
          Resend verification email
        </button>
        {message && <p className={cx('authdock-label', classNames.label)}>{message}</p>}
      </div>
    );
  } else {
    status = null;
  }

  return <div className={cx('authdock-form', classNames.form)}>{status}</div>;
}
