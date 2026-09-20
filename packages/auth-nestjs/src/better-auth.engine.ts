import { Injectable, Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import type { Pool } from 'pg';
import {
  AuthEngine,
  AuthSession,
  AuthUser,
  SignInInput,
  SignUpInput,
} from './auth-engine.interface';
import { EmailProvider } from './email/email-provider.interface';
import { AuthConfig } from './config/auth-config.schema';
import { toFrontendLink } from './verification-links';

// Typed as `any` deliberately: betterAuth()'s return type is a generic keyed to
// its exact options object, which fights TS when options are built dynamically
// (from our own config). This is the one place that trade-off is made — every
// call BetterAuthEngine makes below is still checked against
// auth-engine.interface.ts by `implements`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BetterAuthInstance = any;

/**
 * Builds the betterAuth() instance. Exported (not just constructed inline in
 * BetterAuthEngine below) so `better-auth.cli-config.ts` — used only for
 * `npx @better-auth/cli generate`/`migrate` — can share the exact same
 * config instead of hand-duplicating it. Two copies of this config drifting
 * apart is exactly the kind of bug a schema-generation tool exists to catch,
 * so it's not worth risking by hand-maintaining a second definition.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createBetterAuthInstance(pool: Pool, config: AuthConfig, emailProvider: EmailProvider): BetterAuthInstance {
  return betterAuth({
    // Origin only (no path) — better-auth appends its own basePath default
    // ('/api/auth'), which matches AuthController's actual mount (global
    // prefix 'api' + controller 'auth'). Passing the full API_URL (which
    // already includes '/api') would make better-auth skip appending that
    // path and build broken verification/reset links.
    baseURL: config.API_URL ? new URL(config.API_URL).origin : undefined,
    // A raw `pg.Pool` — better-auth structurally accepts it as Kysely's
    // PostgresPool and manages the Kysely adapter internally. No ORM/codegen
    // step: `npx @better-auth/cli generate`/`migrate` derive and apply the
    // schema straight from this config (see better-auth.cli-config.ts).
    database: pool,
    secret: config.SESSION_SECRET,
    session: {
      strategy: config.SESSION_STRATEGY, // 'cookie' (default) or 'jwt' — see architecture doc
      cookieCache: { enabled: true },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        await emailProvider.send(user.email, 'Reset your password', resetPasswordHtml(toFrontendLink(url, config, '/reset-password')));
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        await emailProvider.send(user.email, 'Verify your email', verificationHtml(toFrontendLink(url, config, '/verify-email')));
      },
    },
    // Required for signOut/verifySession below, which authenticate via
    // `Authorization: Bearer <session token>` — AuthController owns the
    // actual cookie (see SESSION_COOKIE in auth.controller.ts), so
    // better-auth itself is only ever driven over its bearer-token path,
    // never its own cookie.
    plugins: [bearer()],
  });
}

/**
 * The only AuthEngine implementation for now. Everything better-auth-specific
 * lives in this one file — if better-auth's API changes, or it's ever swapped
 * for something else, this is the only file that should need rewriting.
 *
 * NOTE: better-auth's exact method names/shapes move between versions —
 * pin a version in package.json and re-check this file against that version's
 * docs/changelog before upgrading it.
 */
@Injectable()
export class BetterAuthEngine implements AuthEngine {
  private readonly logger = new Logger(BetterAuthEngine.name);
  private readonly auth: BetterAuthInstance;

  constructor(pool: Pool, config: AuthConfig, emailProvider: EmailProvider) {
    this.auth = createBetterAuthInstance(pool, config, emailProvider);
  }

  async signUp(input: SignUpInput) {
    // better-auth requires a display `name` on signup even for email/password-only
    // apps; we don't collect one in the MVP form, so default it from the email.
    const result = await this.auth.api.signUpEmail({
      body: { email: input.email, password: input.password, name: input.email.split('@')[0] },
    });
    return { user: toAuthUser(result.user), verificationSent: true };
  }

  async signIn(input: SignInInput): Promise<AuthSession> {
    const result = await this.auth.api.signInEmail({
      body: { email: input.email, password: input.password },
    });
    // signInEmail's response carries the session token but not its exact expiry;
    // better-auth manages real expiry/rotation server-side via the cookie/session
    // store, so this is a display-only estimate — never used to decide access.
    return {
      user: toAuthUser(result.user),
      token: result.token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  async signOut(sessionToken: string): Promise<void> {
    await this.auth.api.signOut({ headers: { authorization: `Bearer ${sessionToken}` } });
  }

  async verifySession(sessionToken: string): Promise<AuthUser | null> {
    try {
      const result = await this.auth.api.getSession({
        headers: { authorization: `Bearer ${sessionToken}` },
      });
      return result?.user ? toAuthUser(result.user) : null;
    } catch {
      return null;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    await this.auth.api.verifyEmail({ query: { token } });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    await this.auth.api.sendVerificationEmail({ body: { email } });
  }

  async requestPasswordReset(email: string): Promise<void> {
    // better-auth returns success regardless of whether the account exists —
    // preserve that (don't leak account existence) if you touch this method.
    await this.auth.api.requestPasswordReset({ body: { email } });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.auth.api.resetPassword({ body: { token, newPassword } });
  }
}

function toAuthUser(user: { id: string; email: string; emailVerified: boolean; createdAt: Date }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function verificationHtml(verifyUrl: string): string {
  return `<p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`;
}

function resetPasswordHtml(resetUrl: string): string {
  return `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
}
