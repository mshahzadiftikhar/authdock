# @authdock/auth-nestjs

NestJS auth module for [AuthDock](https://github.com/mshahzadiftikhar/authdock) —
wraps [better-auth](https://www.better-auth.com) behind an `AuthEngine`
interface, with cookie sessions on by default, boot-time config validation,
and rate limiting.

> **Breaking change in 0.1.0:** `AuthModule.forRoot({ prisma })` is now
> `AuthModule.forRoot({ database })`, taking a `pg.Pool` instead of a
> `PrismaClient`. Prisma is no longer used at all — see "Database setup"
> below. If you're on `0.0.1`, this requires a code change, not just a
> version bump.

## Install

```bash
npm install @authdock/auth-nestjs pg
```

Peer dependencies: `@nestjs/common`, `@nestjs/core`, `pg`. `better-auth`
ships as a regular dependency of this package, so you don't need to
install it yourself. No ORM required — better-auth talks to Postgres
directly through `pg`.

## Database setup (required before first use)

better-auth manages its own schema (`user`, `session`, `account`,
`verification` tables) through its built-in Kysely adapter — there's no
schema file to hand-write. This package ships a ready config file for
`@better-auth/cli` — copy it into your project rather than writing one
from scratch:

```bash
cp node_modules/@authdock/auth-nestjs/better-auth.cli-config.example.ts ./better-auth.cli-config.ts

npx @better-auth/cli generate --config better-auth.cli-config.ts   # preview the SQL
npx @better-auth/cli migrate --config better-auth.cli-config.ts    # apply it
```

It calls `createBetterAuthInstance` — the exact same builder
`AuthModule.forRoot()` uses internally — so the schema the CLI derives can
never drift from what your app actually configures at runtime. It reads
config from `process.env` the same way your app does, so run it wherever
`DATABASE_URL`/`SESSION_SECRET`/`FRONTEND_URL` are already set (e.g. after
`source .env`, or let `@better-auth/cli`'s bundled `dotenv` pick up a
`.env` file in your cwd).

Skipping this step is the most common way to hit a database error on the
first signup/login call — the module itself doesn't create these tables
for you.

## Usage

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@authdock/auth-nestjs';

@Module({
  imports: [
    AuthModule.forRoot({
      database: process.env.DATABASE_URL!,
    }),
  ],
})
export class AppModule {}
```

`database` takes either a connection string (`AuthModule` builds and owns
the `Pool`, closing it on shutdown — requires calling
`app.enableShutdownHooks()` in your `main.ts` for that cleanup to actually
run) or a `Pool` you've already constructed yourself, if you're sharing it
with the rest of your app — in that case `AuthModule` won't close it.

`AuthModule.forRoot()` loads and validates config from `process.env` (see
`loadAuthConfig`), wires up `AuthService`, registers a global `AuthGuard`,
and picks an `EmailProvider` (Resend in production, console logging
otherwise) unless you supply your own.

Guard routes with `@Public()`, and read the current user with
`@CurrentUser()`:

```ts
import { Controller, Get } from '@nestjs/common';
import { Public, CurrentUser, AuthUser } from '@authdock/auth-nestjs';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }
}
```

## Required environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (used to build the `pg.Pool`) |
| `SESSION_SECRET` | yes (production) | Boot fails if missing or left at a placeholder value in production |
| `RESEND_API_KEY` | yes (production) | Required unless you pass a custom `emailProvider` |
| `FRONTEND_URL` | yes (production) | Defaults to `http://localhost:5173` outside production, for quick local trials |
| `SESSION_STRATEGY` | no | `cookie` (default) or `jwt` |

See the [AuthDock repo](https://github.com/mshahzadiftikhar/authdock) for
the full architecture, the `examples/nestjs-react-starter` demo app, and
`.env.example`.

## License

MIT
