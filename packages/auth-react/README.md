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
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### Default styled forms

```tsx
import { LoginForm, SignupForm, ForgotPasswordForm } from '@authdock/auth-react';

<LoginForm classNames={{ form: 'my-login-form' }} />
```

Every default component takes a `classNames` prop and reads colors/spacing
from `--authdock-*` CSS variables (see `theme.css`) — restyling never
requires forking the package.

### Headless hooks

Use these directly if you have your own design system:

```tsx
import { useSignIn, useSignUp, useSignOut, useSession, usePasswordReset } from '@authdock/auth-react';

const { session, isLoading } = useSession();
const { signIn } = useSignIn();
```

## License

MIT
