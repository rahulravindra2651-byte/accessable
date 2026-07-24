import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import LandingPage  from './pages/LandingPage';
import Login        from './components/auth/Login';
import Register     from './components/auth/Register';
import AssistantMode   from './components/impaired/AssistantMode';
import TranslatorMode  from './components/regular/TranslatorMode';
import Navbar from './components/layout/Navbar';

function AppContent() {
  const { user } = useContext(AuthContext);
  const [view, setView] = useState('landing');

  /* ── Authenticated ── */
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

  /* ── Auth views ── */
  if (view === 'login') {
    return (
      <Login
        onSwitchToRegister={() => setView('register')}
        onBackToLanding={() => setView('landing')}
      />
    );
  }
  if (view === 'register') {
    return (
      <Register
        onSwitchToLogin={() => setView('login')}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  /* ── Landing ── */
  return (
    <LandingPage
      onGetStarted={() => setView('register')}
      onLogin={()       => setView('login')}
    />
  );
}

export default AppContent;
