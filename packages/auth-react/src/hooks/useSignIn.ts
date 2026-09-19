import { useState } from 'react';
import { useAuthContext } from '../AuthProvider';

export function useSignIn() {
  const { client, setUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await client.signIn(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}
