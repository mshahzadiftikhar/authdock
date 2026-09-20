# @authdock/auth-react

Headless auth hooks + one themeable default form set for
[AuthDock](https://github.com/mshahzadiftikhar/authdock).

## Install

```bash
npm install @authdock/auth-react
```

Peer dependency: `react` (`^18.0.0 || ^19.0.0`).

## Usage

Wrap your app in `AuthProvider`, then use either the headless hooks or the
default styled forms.

```tsx
import { AuthProvider } from '@authdock/auth-react';
import '@authdock/auth-react/theme.css';

export function App() {
  return (
    <AuthProvider baseUrl="http://localhost:3000/api/auth">
      <YourApp />
    </AuthProvider>
  );
}
```

`baseUrl` is required — it's the base URL of your `@authdock/auth-nestjs`
API (the NestJS app's origin plus its auth route prefix, e.g.
`http://localhost:3000/api/auth` for a default setup, or your deployed
API's URL in production).

### Default styled forms

```tsx
import { LoginForm, SignupForm, ForgotPasswordForm } from '@authdock/auth-react';

<LoginForm classNames={{ form: 'my-login-form' }} />
```

Every default component takes a `classNames` prop and reads colors/spacing
from `--authdock-*` CSS variables (see `theme.css`) — restyling never
requires forking the package.

`ResetPasswordForm` and `VerifyEmailStatus` complete the two flows that
only *start* elsewhere (`ForgotPasswordForm` requests a reset; the signup
response says a verification email was sent). Both read the token
`@authdock/auth-nestjs` emails as a `?token=` query param — wire them up
at whatever route you point `FRONTEND_URL` + `/reset-password` /
`/verify-email` at:

```tsx
import { ResetPasswordForm, VerifyEmailStatus } from '@authdock/auth-react';

// e.g. a /reset-password route, reading `token` from your router
<ResetPasswordForm token={token} onSuccess={() => navigate('/login')} />

// e.g. a /verify-email route — verifies automatically on mount
<VerifyEmailStatus token={token} onSuccess={() => navigate('/login')} />
```

### Headless hooks

Use these directly if you have your own design system:

```tsx
import {
  useSignIn,
  useSignUp,
  useSignOut,
  useSession,
  usePasswordReset,
  useEmailVerification,
} from '@authdock/auth-react';

const { session, isLoading } = useSession();
const { signIn } = useSignIn();
const { requestReset, resetPassword } = usePasswordReset();
const { verifyEmail, resendVerification } = useEmailVerification();
```

## License

MIT
