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
healthcheck), generates the Prisma client and applies migrations
(`auth-nestjs`'s schema — nothing duplicated here), then runs the API
(`http://localhost:3000`) and the web app (`http://localhost:5173`)
together, output interleaved and color-tagged by process.

To run the pieces individually instead: `npm run db:up` /
`npm run db:migrate` / `npm run db:down`, or `cd server && npm run dev` /
`cd web && npm run dev` on their own (once the DB is up and migrated).

## Known limitation

Email verification is completed by opening the link `ConsoleEmailProvider`
logs to the server's console directly (it's a plain `GET
/api/auth/verify-email?token=...` route) — there's no in-app "verify"
screen, since `@authdock/auth-react`'s client doesn't wrap that endpoint yet.
Same for password reset: `ForgotPasswordForm` only requests the reset
link; completing it (`POST /api/auth/reset-password`) has to be done
directly against the API for now.
