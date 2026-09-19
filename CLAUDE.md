# CLAUDE.md

This file provides guidance to Claude (Cowork/Claude Code) when working in this repository.

## Project

**AuthDock** — a secure-by-default auth starter kit for **NestJS + React**,
built on [better-auth](https://www.better-auth.com) instead of hand-rolled
password hashing, session handling, and email-verification logic.

The problem it solves: every new project needs the same auth scaffolding —
signup, login, logout, email verification, password reset, protected routes
— and it's usually rebuilt (or copy-pasted) from scratch each time. That's
slow, and a common source of real security bugs (weak password hashing, no
rate limiting, no refresh-token rotation, secrets silently defaulting to
placeholder values — see "A concrete cautionary example" below).

AuthDock is a personal/portfolio project, not a company product. Its goal is
to be small, genuinely finished, well-tested, and demonstrable — not to
cover every possible auth method or framework. Resist scope creep; see
"Things NOT to do" below.

## Why better-auth, not hand-rolled auth

Password hashing, session fixation, token replay, and refresh rotation are
areas where subtle mistakes have severe, often invisible consequences.
better-auth is MIT-licensed, actively maintained (~29.5k GitHub stars,
~136k weekly npm downloads), and has an official NestJS integration path.
Wrapping it is the deliberate, defensible choice — see the planning doc's
"Landscape Research" and "Which auth is best?" discussion for the full
comparison against Auth.js, Passport.js, Lucia (deprecated), and hosted
options (Clerk/Supabase/Auth0, ruled out because they don't fit
NestJS + React self-hosted).

## Architecture

```
packages/
  auth-server/   # NestJS module
  auth-react/    # Headless hooks + default styled components
examples/
  nestjs-react-starter/   # (not yet built) — the deployable demo app
```

**`packages/auth-server`** — the NestJS integration. The single most
important file is `src/auth-engine.interface.ts`: it defines `AuthEngine`,
AuthDock's own interface for signUp/signIn/signOut/verifySession/etc.
`src/better-auth.engine.ts` implements that interface using better-auth —
**this is the only file that should ever need rewriting** if better-auth's
API changes or (following Lucia's precedent) it's ever abandoned. Nothing
else in the codebase (guards, `@CurrentUser()`, the controller, the React
hooks' wire format) depends on better-auth directly — always code against
`AuthEngine`/`AuthService`, never reach into `BetterAuthEngine` or
`better-auth`'s own types from outside that one file.

**`packages/auth-react`** — headless hooks (`useSignUp`, `useSignIn`,
`useSignOut`, `useSession`, `usePasswordReset`) with zero required markup,
plus ONE default styled form set (`LoginForm`, `SignupForm`,
`ForgotPasswordForm`) built on those hooks. Slot-based composition is an
explicit v2 idea, not implemented — don't add it speculatively.

## Key decisions already made (don't relitigate without reason)

- **Session transport: cookie-based by default** (`httpOnly`, `secure`,
  `sameSite=lax`). `SESSION_STRATEGY=jwt` exists as an opt-in for stateless
  API consumers, but cookie is the default and the one that gets security
  attention. Do not make bearer-JWT-in-localStorage the default — that was
  explicitly identified as the weaker pattern this project moves away from.
- **Database: PostgreSQL via Prisma.** Decided, not left generic — see
  `packages/auth-server/prisma/schema.prisma`. Don't add a second ORM/DB
  adapter without a real reason; better-auth's own adapter can be swapped
  later if genuinely needed.
- **No CLI, no `auth-core` package.** Both were cut from an earlier, more
  ambitious plan to keep the project finishable. The example app in
  `examples/` is the "quick start," not a code generator.
- **Config fails loudly, not quietly** — `src/config/auth-config.schema.ts`
  (zod) throws at boot in production if `SESSION_SECRET` is missing or left
  at an obvious placeholder, or if `RESEND_API_KEY`/`DATABASE_URL` is
  missing. Never weaken this to "just log a warning."
- **Email is pluggable** via `EmailProvider` (`src/email/`) — Resend in
  production, console logging in development/test. Never hardcode a
  provider call outside that interface.
- **Every default React component takes a `classNames` prop** and uses CSS
  variables (`--authdock-*` in `theme.css`) for color/spacing — restyling
  should never require forking the package. Keep this contract when adding
  components.

## A concrete cautionary example (read before touching auth logic)

An earlier project, `remindly-node`, hand-rolled almost this exact thing:
manual `bcrypt`/`crypto.randomBytes` tokens, hand-written Passport
strategies, a dozen auth columns bolted onto a `User` entity, and — the
detail that matters most — a single long-lived JWT with **no refresh
rotation and no rate limiting**, plus a `JWT_SECRET` that silently defaulted
to `'change-me'` if unset. AuthDock exists specifically to not repeat that.
If you're ever tempted to loosen the config validation, add a "temporary"
default secret, or skip rate limiting "just for now" — don't. That's the
exact failure mode this project is a response to.

## Commands

```bash
npm install

# auth-server
cd packages/auth-server
npx prisma generate        # requires DATABASE_URL in .env
npx prisma migrate dev
npx jest                    # unit tests, e.g. config validation

# auth-react
cd packages/auth-react
npx vitest run               # component tests
```

Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `SESSION_SECRET`
(generate with `openssl rand -base64 32`), and `RESEND_API_KEY` before
running anything that touches auth end to end.

## Things NOT to do

- Don't add OAuth/social login, magic links, passkeys, 2FA, a second DB
  adapter, a Fastify adapter, or multi-tenant support to the MVP — all are
  explicitly deferred backlog items (better-auth already supports most of
  them; exposing them is additive later, not urgent now).
- Don't build the CLI scaffolder. It was deliberately cut as the
  highest risk-to-value item in the original plan.
- Don't let `auth-server` or `auth-react` import from better-auth outside
  of `better-auth.engine.ts` — that seam is the whole point.
- Don't skip writing a test for anything security-relevant (token expiry,
  rate limiting, session invalidation, config validation) — this project's
  entire credibility rests on "we were careful here," not just "it works."

## Where the fuller plan lives

The full architecture discussion, alternatives considered, roadmap, and
open-decisions history live in a separate planning doc (not in this repo) —
ask the person working with you if you need that context and it isn't
already in this conversation.
