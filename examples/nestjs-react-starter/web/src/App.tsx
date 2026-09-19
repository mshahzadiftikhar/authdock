import { useState, type ReactNode } from 'react';
import { LoginForm, SignupForm, ForgotPasswordForm, useSession, useSignOut } from '@authdock/auth-react';
import './App.css';

type Tab = 'login' | 'signup' | 'forgot';

export function App() {
  const { user, loading, isSignedIn } = useSession();
  const { signOut, loading: signingOut } = useSignOut();
  const [tab, setTab] = useState<Tab>('login');
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="example-page">
        <p className="example-message">Loading…</p>
      </div>
    );
  }

  if (isSignedIn && user) {
    let signOutLabel = 'Sign out';
    if (signingOut) {
      signOutLabel = 'Signing out…';
    }

    return (
      <div className="example-page">
        <span className="example-wordmark">AuthDock</span>
        <div className="example-session-card">
          <p className="example-session-email">
            Signed in as <strong>{user.email}</strong>
          </p>
          <button className="authdock-button" onClick={() => signOut()} disabled={signingOut}>
            {signOutLabel}
          </button>
        </div>
      </div>
    );
  }

  function handleSignupSuccess(result: { verificationSent: boolean }) {
    if (result.verificationSent) {
      setSignupMessage('Check the server console for the verification link, then open it directly.');
    } else {
      setSignupMessage('Account created.');
    }
  }

  let activeForm: ReactNode;
  if (tab === 'login') {
    activeForm = <LoginForm />;
  } else if (tab === 'signup') {
    let message: ReactNode = null;
    if (signupMessage) {
      message = <p className="example-message">{signupMessage}</p>;
    }
    activeForm = (
      <>
        <SignupForm onSuccess={handleSignupSuccess} />
        {message}
      </>
    );
  } else {
    activeForm = <ForgotPasswordForm />;
  }

  return (
    <div className="example-page">
      <span className="example-wordmark">AuthDock</span>

      <nav className="example-tabs">
        <button className="example-tab" onClick={() => setTab('login')} disabled={tab === 'login'}>
          Login
        </button>
        <button className="example-tab" onClick={() => setTab('signup')} disabled={tab === 'signup'}>
          Sign up
        </button>
        <button className="example-tab" onClick={() => setTab('forgot')} disabled={tab === 'forgot'}>
          Forgot password
        </button>
      </nav>

      {activeForm}
    </div>
  );
}
