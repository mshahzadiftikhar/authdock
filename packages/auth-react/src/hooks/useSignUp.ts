import { useState } from 'react';
import { useAuthContext } from '../AuthProvider';

/**
 * Headless — no markup. Bring your own form and call `signUp`, or use
 * <SignupForm /> from ../components if the default UI works for you.
 */
export function useSignUp() {
  const { client, setUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  async function signUp(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await client.signUp(email, password);
      setUser(result.user);
      setVerificationSent(result.verificationSent);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { signUp, loading, error, verificationSent };
}
