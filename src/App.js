import React, { useContext, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import LandingPage from './pages/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AssistantMode from './components/impaired/AssistantMode';
import TranslatorMode from './components/regular/TranslatorMode';
import Navbar from './components/layout/Navbar';
import './App.css';

// Google Client ID — set REACT_APP_GOOGLE_CLIENT_ID in your .env file
// In Render: add it to the Environment Variables dashboard
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { user } = useContext(AuthContext);
  const [view, setView] = useState('landing');

  /* ── Authenticated — role-based dashboard ── */
  if (user) {
    return (
      <div className={user.role === 'impaired' ? 'impaired-theme' : ''}>
        <Navbar />
        <main id="main-content" tabIndex="-1" className="outline-none">
          {user.role === 'impaired' ? <AssistantMode /> : <TranslatorMode />}
        </main>
      </div>
    );
  }

  /* ── Auth screens ── */
  if (view === 'login')
    return (
      <Login
        onSwitchToRegister={() => setView('register')}
        onBackToLanding={() => setView('landing')}
      />
    );
  if (view === 'register')
    return (
      <Register
        onSwitchToLogin={() => setView('login')}
        onBackToLanding={() => setView('landing')}
      />
    );

  /* ── Landing Page ── */
  return (
    <LandingPage
      onGetStarted={() => setView('register')}
      onLogin={() => setView('login')}
    />
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <AccessibilityProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
