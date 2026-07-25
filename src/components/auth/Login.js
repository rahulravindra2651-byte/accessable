import React, { useState, useContext, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Mic, Volume2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { AccessibilityContext } from '../../context/AccessibilityContext';

const Login = ({ onSwitchToRegister, onBackToLanding }) => {
  const { login } = useContext(AuthContext);
  const { speakGuidance } = useContext(AccessibilityContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeListeningField, setActiveListeningField] = useState(null);

  useEffect(() => {
    speakGuidance(
      'Welcome to AccessAble. You are on the Sign In page. Enter your email and password to access your dashboard.',
      'polite'
    );
  }, [speakGuidance]);

  const listenForField = (fieldName, setter) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition is not supported in this browser.');
      speakGuidance('Speech recognition is not supported in this browser.', 'assertive');
      return;
    }
    setActiveListeningField(fieldName);
    speakGuidance(`Please say your ${fieldName}.`, 'polite');
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const result = e.results[0][0]?.transcript || '';
      if (result.trim()) {
        let cleaned = result.trim();
        if (fieldName === 'email') {
          cleaned = cleaned.toLowerCase().replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.').replace(/\s+/g, '');
        }
        setter(cleaned);
        speakGuidance(`${fieldName} entered successfully: ${cleaned}`, 'polite');
      } else {
        speakGuidance(`Could not hear ${fieldName}. Please try again.`, 'polite');
      }
      setActiveListeningField(null);
    };
    recognition.onerror = () => { speakGuidance(`Speech recognition error for ${fieldName}.`, 'polite'); setActiveListeningField(null); };
    recognition.onend = () => { setActiveListeningField(null); };
    try { recognition.start(); } catch { setActiveListeningField(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      const msg = 'Please fill in all required fields.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    if (!email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    setIsLoading(true);
    speakGuidance('Signing in, please wait.', 'polite');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || 'Login failed.';
        setError(msg); speakGuidance(msg, 'assertive'); return;
      }
      speakGuidance(`Login successful. Welcome back ${data.user.name}.`, 'assertive');
      login(data.user, data.token);
    } catch {
      const msg = 'Unable to connect to server. Please check your internet connection.';
      setError(msg); speakGuidance(msg, 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f8faff 50%, #f5f3ff 100%)' }}
    >
      <a href="#login-form" className="skip-link">Skip to sign in form</a>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            aria-hidden="true"
          >
            <span className="text-white text-2xl font-black">A</span>
          </div>
          <h1 className="text-3xl font-black" style={{ color: '#1e293b' }}>AccessAble</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Inclusive communication for everyone</p>
        </div>

        <div
          className="card p-8"
          id="login-form"
          tabIndex="-1"
          style={{ boxShadow: '0 8px 40px rgb(79 70 229 / .10)' }}
        >
          {/* Form Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Welcome Back</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-muted)' }}>Sign in to your account</p>
            </div>
            <button
              type="button"
              onClick={() => speakGuidance('Sign In form. Enter email address and password, or use the voice input buttons next to each field.', 'assertive')}
              className="btn btn-ghost btn-sm gap-1"
              aria-label="Read form guidance aloud"
            >
              <Volume2 size={15} /> Listen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div className="form-field">
              <div className="form-field-header">
                <label htmlFor="login-email" className="label">
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => listenForField('email', setEmail)}
                  className={`btn btn-xs gap-1 ${activeListeningField === 'email' ? 'btn-danger' : 'btn-secondary'}`}
                  aria-label="Speak email address"
                >
                  <Mic size={11} className={activeListeningField === 'email' ? 'animate-pulse' : ''} />
                  {activeListeningField === 'email' ? 'Listening…' : 'Speak'}
                </button>
              </div>
              <div className="relative">
                <Mail className="input-icon" size={16} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => speakGuidance('Email address edit box. Required.', 'polite')}
                  className="input-field pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-describedby="login-email-desc"
                />
                <span id="login-email-desc" className="sr-only">
                  Enter your registered email address or use the Speak button.
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="form-field">
              <div className="form-field-header">
                <label htmlFor="login-password" className="label">
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => listenForField('password', setPassword)}
                  className={`btn btn-xs gap-1 ${activeListeningField === 'password' ? 'btn-danger' : 'btn-secondary'}`}
                  aria-label="Speak password"
                >
                  <Mic size={11} className={activeListeningField === 'password' ? 'animate-pulse' : ''} />
                  {activeListeningField === 'password' ? 'Listening…' : 'Speak'}
                </button>
              </div>
              <div className="relative">
                <Lock className="input-icon" size={16} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => speakGuidance('Password edit box. Required.', 'polite')}
                  className="input-field pl-9 pr-11"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--c-text-subtle)', lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg"
              aria-label="Sign in to your AccessAble account"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full anim-spin" />
                  Signing In…
                </>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--c-text-muted)' }}>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-semibold"
              style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Go to registration page"
            >
              Sign up
            </button>
          </p>
        </div>

        {onBackToLanding && (
          <p className="text-center mt-4">
            <button
              onClick={onBackToLanding}
              className="text-sm"
              style={{ color: 'var(--c-text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Back to home page"
            >
              ← Back to home
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;