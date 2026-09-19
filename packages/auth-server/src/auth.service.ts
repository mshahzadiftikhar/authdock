import { Inject, Injectable } from '@nestjs/common';
import { AUTH_ENGINE } from './auth.constants';
import { AuthEngine } from './auth-engine.interface';

/**
 * Thin pass-through to the configured AuthEngine. The controller (and anything
 * else in the app) depends on THIS, not on BetterAuthEngine directly — keeping
 * the engine swap possible without touching call sites.
 */
@Injectable()
export class AuthService implements AuthEngine {
  constructor(@Inject(AUTH_ENGINE) private readonly engine: AuthEngine) {}

  signUp: AuthEngine['signUp'] = (input) => this.engine.signUp(input);
  signIn: AuthEngine['signIn'] = (input) => this.engine.signIn(input);
  signOut: AuthEngine['signOut'] = (token) => this.engine.signOut(token);
  verifySession: AuthEngine['verifySession'] = (token) => this.engine.verifySession(token);
  verifyEmail: AuthEngine['verifyEmail'] = (token) => this.engine.verifyEmail(token);
  resendVerificationEmail: AuthEngine['resendVerificationEmail'] = (email) =>
    this.engine.resendVerificationEmail(email);
  requestPasswordReset: AuthEngine['requestPasswordReset'] = (email) => this.engine.requestPasswordReset(email);
  resetPassword: AuthEngine['resetPassword'] = (token, newPassword) => this.engine.resetPassword(token, newPassword);
}
