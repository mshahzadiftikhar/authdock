import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@authdock/auth-react';
import '@authdock/auth-react/theme.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider baseUrl="http://localhost:3000/api/auth" autoDetectColorScheme>
      <App />
    </AuthProvider>
  </StrictMode>,
);
