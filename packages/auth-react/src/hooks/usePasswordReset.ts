import { useState } from 'react';
import { useAuthContext } from '../AuthProvider';

export function usePasswordReset() {
  const { client } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function requestReset(email: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await client.requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(token: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await client.resetPassword(token, password);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { requestReset, resetPassword, loading, error, message };
}
