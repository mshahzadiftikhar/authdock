import { useState } from 'react';
import { useAuthContext } from '../AuthProvider';

export function useSignOut() {
  const { client, setUser } = useAuthContext();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await client.signOut();
    } finally {
      setUser(null);
      setLoading(false);
    }
  }

  return { signOut, loading };
}
