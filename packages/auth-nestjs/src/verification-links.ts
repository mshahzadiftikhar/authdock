import { AuthConfig } from './config/auth-config.schema';

/**
 * better-auth builds `url` against the API (baseURL in better-auth.engine.ts),
 * but the token's position differs by flow: verify-email puts it in the query
 * string (`.../verify-email?token=...`), while reset-password puts it as the
 * last path segment (`.../reset-password/<token>?callbackURL=...`) — check
 * better-auth's own route source before assuming one shape covers both (this
 * exact mismatch silently dropped the reset-password token once already).
 * Emailing either URL directly would land the user on a bare JSON response
 * instead of the app, so rebuild the same token against FRONTEND_URL —
 * opening a real page, built with VerifyEmailStatus/ResetPasswordForm from
 * @authdock/auth-react, which then call the API themselves.
 *
 * Deliberately has zero dependency on better-auth (only the AuthConfig type)
 * — it's imported by verification-links.spec.ts directly, and better-auth
 * ships ESM, which breaks ts-jest's default CJS transform when pulled in
 * transitively via better-auth.engine.ts.
 */
export function toFrontendLink(apiUrl: string, config: AuthConfig, frontendPath: string): string {
  const parsed = new URL(apiUrl);
  const token = parsed.searchParams.get('token') ?? parsed.pathname.split('/').filter(Boolean).pop() ?? null;
  const frontendUrl = new URL(frontendPath, config.FRONTEND_URL);
  if (token) {
    frontendUrl.searchParams.set('token', token);
  }
  return frontendUrl.toString();
}
