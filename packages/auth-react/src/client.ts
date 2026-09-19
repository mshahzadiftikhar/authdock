export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthClientConfig {
  /** Base URL of the auth-server API, e.g. 'http://localhost:3000/api/auth'. */
  baseUrl: string;
}

/**
 * Thin fetch wrapper. Cookie sessions mean `credentials: 'include'` is what
 * actually authenticates requests — no token to manage in JS by default
 * (session.strategy: 'jwt' mode would return a bearer token instead; not
 * needed for the cookie-default MVP).
 */
export function createAuthClient(config: AuthClientConfig) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.message ?? `Request to ${path} failed (${res.status})`);
    }
    return body as T;
  }

  return {
    signUp: (email: string, password: string) =>
      request<{ user: AuthUser; verificationSent: boolean }>('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signIn: (email: string, password: string) =>
      request<{ user: AuthUser }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signOut: () => request<{ message: string }>('/logout', { method: 'POST' }),
    getSession: () => request<{ user: AuthUser }>('/me'),
    requestPasswordReset: (email: string) =>
      request<{ message: string }>('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
