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

## Repo layout

```
packages/
  auth-nestjs/   # NestJS module — the AuthEngine seam + BetterAuthEngine adapter
  auth-react/    # Headless hooks + default styled components
examples/
  nestjs-react-starter/   # the deployable demo app — NestJS API + Vite/React frontend
```

## Install

Both packages are published to npm:

```bash
npm install @authdock/auth-nestjs better-auth @prisma/client
npm install @authdock/auth-react
```

See each package's own README for usage:
[`packages/auth-nestjs`](packages/auth-nestjs/README.md),
[`packages/auth-react`](packages/auth-react/README.md).

## Running the example app

```bash
cd examples/nestjs-react-starter
npm run dev   # starts Postgres (Docker), runs migrations, then the API + web app
```

See [`examples/nestjs-react-starter/README.md`](examples/nestjs-react-starter/README.md)
for setup details.

## Working on this repo

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, SESSION_SECRET, RESEND_API_KEY
```

`auth-nestjs` needs a running PostgreSQL instance and a generated Prisma
client (`packages/auth-nestjs/prisma/schema.prisma`):

```bash
cd packages/auth-nestjs
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
- **Config fails loudly, not quietly.** `packages/auth-nestjs/src/config/auth-config.schema.ts`
  throws at boot in production if `SESSION_SECRET` is missing or left at an
  obvious placeholder, or if `RESEND_API_KEY`/`DATABASE_URL` is missing.
- **No CLI, no `auth-core` package.** Both were cut deliberately from the
  original plan to keep the MVP finishable — see the planning doc's
  "Recommended Architecture (MVP, revised)" section for the reasoning.

## License

MIT
