/**
 * AuthEngine is the seam between AuthDock's public API (guards, decorators,
 * AuthModule.forRoot()) and whatever library actually implements auth.
 *
 * Today the only implementation is BetterAuthEngine (see better-auth.engine.ts).
 * If better-auth is ever abandoned or changes direction, only a new class
 * implementing THIS interface needs to be written — nothing that consumes
 * AuthDock (guards, @CurrentUser(), the React hooks' wire format) needs to change.
 *
 * Keep this interface's surface small and stable. It should describe *what*
 * an auth engine must do, never *how* better-auth (or any future engine) does it.
 */

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthSession {
  user: AuthUser;
  /** Opaque to callers — set as a cookie by the engine, or returned as a bearer token in 'jwt' mode. */
  token: string;
  expiresAt: Date;
}

export interface SignUpInput {
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthEngine {
  signUp(input: SignUpInput): Promise<{ user: AuthUser; verificationSent: boolean }>;
  signIn(input: SignInInput): Promise<AuthSession>;
  signOut(sessionToken: string): Promise<void>;

  /** Validates a session token (cookie or bearer, depending on session.strategy) and returns the user, or null. */
  verifySession(sessionToken: string): Promise<AuthUser | null>;

  verifyEmail(token: string): Promise<void>;
  resendVerificationEmail(email: string): Promise<void>;

  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
