import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AuthClient, AuthUser, createAuthClient } from './client';

interface AuthContextValue {
  client: AuthClient;
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
}

export interface AuthProviderProps {
  baseUrl: string;
  children: ReactNode;
  autoDetectColorScheme?: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ baseUrl, children, autoDetectColorScheme = false }: AuthProviderProps) {
  const client = useMemo(() => createAuthClient({ baseUrl }), [baseUrl]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    if (!autoDetectColorScheme) {
      setColorScheme(null);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateColorScheme = () => setColorScheme(mediaQuery.matches ? 'dark' : 'light');
    updateColorScheme();
    mediaQuery.addEventListener('change', updateColorScheme);

    return () => mediaQuery.removeEventListener('change', updateColorScheme);
  }, [autoDetectColorScheme]);

  useEffect(() => {
    client
      .getSession()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [client]);

  return (
    <AuthContext.Provider value={{ client, user, loading, setUser }}>
      <div data-authdock-color-scheme={colorScheme ?? undefined}>{children}</div>
    </AuthContext.Provider>
  );
}

/** Internal — the public API is the useSignUp/useSignIn/useSession/etc. hooks below. */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthDock hooks must be used within <AuthProvider>');
  return ctx;
}
