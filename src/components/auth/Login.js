import React, { useState, useContext, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeListeningField, setActiveListeningField] = useState(null);
  // Guard: only one SpeechRecognition session at a time
  const activeRecognitionRef = useRef(null);

  useEffect(() => {
    speakGuidance(
      'Welcome to AccessAble. You are on the Sign In page. Enter your email and password, or use Continue with Google.',
      'polite'
    );
  }, [speakGuidance]);

  /* ── Voice input for fields ── */
  const listenForField = (fieldName, setter) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition is not supported in this browser.');
      speakGuidance('Speech recognition is not supported in this browser.', 'assertive');
      return;
    }
    // Abort any existing session first
    if (activeRecognitionRef.current) {
      try { activeRecognitionRef.current.abort(); } catch {}
      activeRecognitionRef.current = null;
    }
    setActiveListeningField(fieldName);
    speakGuidance(`Please say your ${fieldName}.`, 'polite');
    const recognition = new SR();
    activeRecognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    let handled = false;
    recognition.onresult = (e) => {
      handled = true;
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
      activeRecognitionRef.current = null;
      setActiveListeningField(null);
    };
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in browser settings.');
        speakGuidance('Microphone access denied. Please check your browser settings.', 'assertive');
      } else {
        speakGuidance(`Speech recognition error for ${fieldName}. Please try again.`, 'polite');
      }
      activeRecognitionRef.current = null;
      setActiveListeningField(null);
    };
    recognition.onend = () => {
      if (!handled) setActiveListeningField(null);
      activeRecognitionRef.current = null;
    };
    try { recognition.start(); } catch { setActiveListeningField(null); activeRecognitionRef.current = null; }
  };

  /* ── Email/password submit ── */
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

  /* ── Google OAuth success ── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsGoogleLoading(true);
    speakGuidance('Verifying your Google account, please wait.', 'polite');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.needsRole
          ? 'No AccessAble account found for this Google account. Please register and choose your account type first.'
          : data.message || 'Google sign-in failed.';
        setError(msg);
        speakGuidance(msg, 'assertive');
        return;
      }
      speakGuidance(`Google sign-in successful. Welcome back ${data.user.name}.`, 'assertive');
      login(data.user, data.token);
    } catch {
      const msg = 'Unable to connect to server. Please try again.';
      setError(msg); speakGuidance(msg, 'assertive');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /* ── Google OAuth error ── */
  const handleGoogleError = () => {
    const msg = 'Google sign-in was cancelled or failed. Please try again.';
    setError(msg);
    speakGuidance(msg, 'assertive');
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
              onClick={() => speakGuidance('Sign In form. Enter email address and password, or use Continue with Google.', 'assertive')}
              className="btn btn-ghost btn-sm gap-1"
              aria-label="Read form guidance aloud"
            >
              <Volume2 size={15} /> Listen
            </button>
          </div>

          {/* ── Google Sign-In ── */}
          <div className="mb-5">
            <div
              className="flex justify-center"
              role="group"
              aria-label="Sign in with Google"
            >
              {isGoogleLoading ? (
                <div
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border-2 font-semibold text-sm"
                  style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-4 h-4 border-2 border-indigo-400/40 border-t-indigo-500 rounded-full anim-spin" />
                  Verifying with Google…
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                  theme="outline"
                  size="large"
                  logo_alignment="left"
                />
              )}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--c-text-subtle)' }}>
              or sign in with email
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
          </div>

          {/* ── Email/Password Form ── */}
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