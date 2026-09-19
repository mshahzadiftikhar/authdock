# @authdock/auth-nestjs

NestJS auth module for [AuthDock](https://github.com/mshahzadiftikhar/authdock) —
wraps [better-auth](https://www.better-auth.com) behind an `AuthEngine`
interface, with cookie sessions on by default, boot-time config validation,
and rate limiting.

## Install

```bash
npm install @authdock/auth-nestjs better-auth @prisma/client
```

Peer dependencies: `@nestjs/common`, `@nestjs/core`, `@prisma/client`.

## Usage

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@authdock/auth-nestjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Module({
  imports: [AuthModule.forRoot({ prisma })],
})
export class AppModule {}
```

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
| `DATABASE_URL` | yes | PostgreSQL connection string (Prisma) |
| `SESSION_SECRET` | yes (production) | Boot fails if missing or left at a placeholder value in production |
| `RESEND_API_KEY` | yes (production) | Required unless you pass a custom `emailProvider` |
| `SESSION_STRATEGY` | no | `cookie` (default) or `jwt` |

See the [AuthDock repo](https://github.com/mshahzadiftikhar/authdock) for
the full architecture, the `examples/nestjs-react-starter` demo app, and
`.env.example`.

## License

MIT
