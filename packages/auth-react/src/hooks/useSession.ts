import { useAuthContext } from '../AuthProvider';

/** Current signed-in user (or null), and whether the initial session check is still in flight. */
export function useSession() {
  const { user, loading } = useAuthContext();
  return { user, loading, isSignedIn: !!user };
}
