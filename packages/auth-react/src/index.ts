// Provider (required)
export * from './AuthProvider';

// Headless hooks — use these directly if you have your own design system
export * from './hooks/useSession';
export * from './hooks/useSignUp';
export * from './hooks/useSignIn';
export * from './hooks/useSignOut';
export * from './hooks/usePasswordReset';

// Default styled components — one tier, themeable via CSS variables + classNames
export * from './components/LoginForm';
export * from './components/SignupForm';
export * from './components/ForgotPasswordForm';
export * from './components/classnames';

// Types
export type { AuthUser, AuthClient } from './client';

// Import '@authdock/auth-react/theme.css' in your app for the default look.
