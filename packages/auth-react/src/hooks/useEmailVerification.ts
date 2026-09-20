import { useState } from 'react';
import { useAuthContext } from '../AuthProvider';

export function useEmailVerification() {
  const { client } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function verifyEmail(token: string) {
    setLoading(true);
    setError(null);
    try {
      await client.verifyEmail(token);
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setLoading(true);
    setError(null);
    try {
      const result = await client.resendVerificationEmail();
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend verification email');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { verifyEmail, resendVerification, loading, error, verified, message };
}
