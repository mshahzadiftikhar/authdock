import { z } from 'zod';

const PLACEHOLDER_SECRETS = new Set([
  'change-me-generate-a-real-secret',
  'change-me',
  'secret',
  '',
]);

/**
 * Validated at boot. In production, a missing DATABASE_URL / SESSION_SECRET /
 * RESEND_API_KEY, or a SESSION_SECRET left at an obvious placeholder, throws
 * immediately — instead of silently limping along with an insecure default
 * (the exact mistake this project exists to avoid; see the planning doc's
 * "Lessons From a Past Project" section).
 */
export const AuthConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
    SESSION_STRATEGY: z.enum(['cookie', 'jwt']).default('cookie'),
    RESEND_API_KEY: z.string().optional().default(''),
    RESEND_FROM: z.string().default('onboarding@resend.dev'),
    FRONTEND_URL: z.string().url(),
    API_URL: z.string().url().optional(),
  })
  .superRefine((val, ctx) => {
    const isProd = val.NODE_ENV === 'production';

    if (isProd && PLACEHOLDER_SECRETS.has(val.SESSION_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message:
          'SESSION_SECRET is missing or left at a placeholder value. ' +
          'Generate a real one (e.g. `openssl rand -base64 32`) before running in production.',
      });
    }

    if (isProd && !val.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_API_KEY'],
        message:
          'RESEND_API_KEY is required in production — verification and password-reset emails cannot send without it.',
      });
    }
  });

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

/** Call once at boot (e.g. in main.ts) before creating the Nest app. Throws on invalid config. */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const result = AuthConfigSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid AuthDock configuration:\n${issues}`);
  }
  return result.data;
}
