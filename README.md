# AuthDock

A secure-by-default auth starter kit for **NestJS + React**, built on
[better-auth](https://www.better-auth.com) instead of hand-rolled password
hashing, session, and email-verification logic.

## Why this exists

Every new project needs the same auth scaffolding — signup, login, logout,
email verification, password reset, protected routes — and it's usually
rebuilt (or copy-pasted) from scratch each time. That's slow and a common
source of real security bugs: weak password hashing, no rate limiting, no
refresh-token rotation, secrets silently defaulting to placeholder values.

This project wraps [better-auth](https://www.better-auth.com) — a
maintained, MIT-licensed auth engine — behind a small `AuthEngine` interface,
and ships two packages on top of it:

- **`@authdock/auth-nestjs`** — a NestJS module (`AuthModule.forRoot()`), guards,
  decorators, rate limiting, and boot-time config validation.
- **`@authdock/auth-react`** — headless hooks (`useSignIn`, `useSignUp`,
  `useSession`, …) plus one themeable default form set.

## Status

Early scaffold — see the planning doc (linked from the project this repo
belongs to) for the full architecture, decisions, and roadmap. Currently
implemented:

- [x] `AuthEngine` interface + `BetterAuthEngine` adapter (better-auth,
      Prisma/PostgreSQL, cookie sessions by default, opt-in JWT strategy)
- [x] Boot-time config validation (fails loudly in production on missing/
      placeholder secrets) — see `packages/auth-server/src/config`
- [x] `AuthModule.forRoot()`, guards (`@Public()`, `@CurrentUser()`), rate
      limiting on signup/login/forgot-password
- [x] Pluggable `EmailProvider` (Resend for production, console logging for
      local dev)
- [x] Headless React hooks + one default styled form set
      (`LoginForm`, `SignupForm`, `ForgotPasswordForm`), themeable via CSS
      variables and a `classNames` override prop
- [x] `examples/nestjs-react-starter` — NestJS host + Vite/React app,
      manually verified end to end (signup → verify → login → session →
      logout) against local Postgres. See its own README for setup and
      known limitations.
- [ ] Automated end-to-end tests against a real NestJS app + Postgres
      (the example above is manually verified only, not yet a test suite)
- [ ] Security test checklist: token replay, expiry boundaries, rate-limit
      triggering, session invalidation on logout, CSRF behavior

## Repo layout

```
packages/
  auth-server/   # NestJS module — the AuthEngine seam + BetterAuthEngine adapter
  auth-react/    # Headless hooks + default styled components
examples/
  nestjs-react-starter/   # (not yet built) — the deployable demo app
```

## Local setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, SESSION_SECRET, RESEND_API_KEY
```

`auth-server` needs a running PostgreSQL instance and a generated Prisma
client (`packages/auth-server/prisma/schema.prisma`):

```bash
cd packages/auth-server
npx prisma generate
npx prisma migrate dev
```

## Design decisions worth knowing before touching the code

- **Session transport is cookie-based by default** (`httpOnly`, `secure`,
  `sameSite=lax`), not a bearer JWT stored client-side. `SESSION_STRATEGY=jwt`
  is available for stateless API consumers, but cookie is the default and
  the one that gets the security review.
- **`AuthEngine` is the seam, not better-auth's own types.** Everything
  better-auth-specific lives in `better-auth.engine.ts`. If it's ever
  swapped out, that's the only file that should need rewriting.
- **Config fails loudly, not quietly.** `packages/auth-server/src/config/auth-config.schema.ts`
  throws at boot in production if `SESSION_SECRET` is missing or left at an
  obvious placeholder, or if `RESEND_API_KEY`/`DATABASE_URL` is missing.
- **No CLI, no `auth-core` package.** Both were cut deliberately from the
  original plan to keep the MVP finishable — see the planning doc's
  "Recommended Architecture (MVP, revised)" section for the reasoning.

## License

MIT (once published — see the planning doc's open decisions on public vs.
private).
