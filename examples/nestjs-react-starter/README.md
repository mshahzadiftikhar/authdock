# nestjs-react-starter

The AuthDock quick start: a minimal NestJS host app (`server/`) mounting
`AuthModule.forRoot()`, and a Vite + React app (`web/`) using
`@authdock/auth-react`'s hooks and default forms. Demonstrates the full
signup → verify email → login → session → logout flow against a real
Postgres database.

## Setup

1. From the repo root: `npm install` (picks up all three workspace
   packages under `examples/nestjs-react-starter/`: this orchestration
   package plus `server/` and `web/`). Requires Docker Desktop running.
2. `cp examples/nestjs-react-starter/server/.env.example examples/nestjs-react-starter/server/.env`
   and fill in `SESSION_SECRET` (`openssl rand -base64 32`). The default
   `DATABASE_URL` already matches the Docker Postgres credentials below.
3. `cd examples/nestjs-react-starter && npm run dev`

That one command: starts Postgres via Docker Compose (waits for its
healthcheck), applies better-auth's schema directly via
`@better-auth/cli migrate` (no ORM, no codegen — see
`packages/auth-nestjs/better-auth.cli-config.ts`), then runs the API
(`http://localhost:3000`) and the web app (`http://localhost:5173`)
together, output interleaved and color-tagged by process.

To run the pieces individually instead: `npm run db:up` /
`npm run db:migrate` / `npm run db:down`, or `cd server && npm run dev` /
`cd web && npm run dev` on their own (once the DB is up and migrated).

## Email verification and password reset

`ConsoleEmailProvider` logs both links to the server's console instead of
sending real email. Both now open real in-app screens (`web/src/App.tsx`
renders `VerifyEmailStatus`/`ResetPasswordForm` from `@authdock/auth-react`
based on the URL) rather than a bare API response — `better-auth.engine.ts`
rewrites better-auth's own link to point at `FRONTEND_URL` instead of the
API for this reason.
