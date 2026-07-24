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

  // Announce page arrival on mount
  useEffect(() => {
    speakGuidance(
      'Welcome to AccessAble. You are on the Sign In page. Enter your email and password to access your dashboard.',
      'polite'
    );
  }, [speakGuidance]);

  // Voice fill for single field
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
        // Clean up email formatting if speaking an email (e.g. "rahul at gmail dot com" -> "rahul@gmail.com")
        let cleaned = result.trim();
        if (fieldName === 'email') {
          cleaned = cleaned
            .toLowerCase()
            .replace(/\s+at\s+/g, '@')
            .replace(/\s+dot\s+/g, '.')
            .replace(/\s+/g, '');
        }

        setter(cleaned);
        speakGuidance(`${fieldName} entered successfully: ${cleaned}`, 'polite');
      } else {
        speakGuidance(`Could not hear ${fieldName}. Please try again.`, 'polite');
      }
      setActiveListeningField(null);
    };

    recognition.onerror = () => {
      speakGuidance(`Speech recognition error for ${fieldName}.`, 'polite');
      setActiveListeningField(null);
    };

    recognition.onend = () => {
      setActiveListeningField(null);
    };

    try {
      recognition.start();
    } catch {
      setActiveListeningField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      const msg = 'Please fill in all required fields.';
      setError(msg);
      speakGuidance(msg, 'assertive');
      return;
    }
    if (!email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      speakGuidance(msg, 'assertive');
      return;
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
        setError(msg);
        speakGuidance(msg, 'assertive');
        return;
      }

      speakGuidance(`Login successful. Welcome back ${data.user.name}.`, 'assertive');
      login(data.user, data.token);
    } catch {
      const msg = 'Unable to connect to server. Please check your internet connection.';
      setError(msg);
      speakGuidance(msg, 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #fff 50%, #f5f3ff 100%)',
      }}
    >
      <a href="#login-form" className="skip-link">
        Skip to sign in form
      </a>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            }}
          >
            <span className="text-white text-2xl font-black">A</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">AccessAble</h1>
          <p className="text-slate-500 text-sm mt-1">
            Inclusive communication for everyone
          </p>
        </div>

        <div className="card p-8" id="login-form" tabIndex="-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <button
              type="button"
              onClick={() =>
                speakGuidance(
                  'Sign In form. Enter email address and password, or use the voice input buttons next to each field.',
                  'assertive'
                )
              }
              className="btn btn-ghost btn-sm gap-1"
              aria-label="Read form guidance aloud"
            >
              <Volume2 size={16} /> Listen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-email" className="label mb-0">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => listenForField('email', setEmail)}
                  className={`btn btn-xs gap-1 ${
                    activeListeningField === 'email'
                      ? 'btn-danger'
                      : 'btn-secondary'
                  }`}
                  aria-label="Speak email address input"
                >
                  <Mic size={12} className={activeListeningField === 'email' ? 'animate-pulse' : ''} />
                  {activeListeningField === 'email' ? 'Listening…' : 'Speak Email'}
                </button>
              </div>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() =>
                    speakGuidance('Email address edit box. Required.', 'polite')
                  }
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-describedby="email-desc"
                />
              </div>
              <p id="email-desc" className="sr-only">
                Enter your registered email address or use the Speak Email button.
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="label mb-0">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => listenForField('password', setPassword)}
                  className={`btn btn-xs gap-1 ${
                    activeListeningField === 'password'
                      ? 'btn-danger'
                      : 'btn-secondary'
                  }`}
                  aria-label="Speak password input"
                >
                  <Mic size={12} className={activeListeningField === 'password' ? 'animate-pulse' : ''} />
                  {activeListeningField === 'password' ? 'Listening…' : 'Speak Password'}
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() =>
                    speakGuidance('Password edit box. Required.', 'polite')
                  }
                  className="input-field pl-10 pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Spoken Error Alert */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-lg bg-red-50 border border-red-200"
              >
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg"
              aria-label="Sign in to your account"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full anim-spin" />
                  Signing In…
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
              aria-label="Go to registration page to create an account"
            >
              Sign up
            </button>
          </p>
        </div>

        {onBackToLanding && (
          <p className="text-center mt-4">
            <button
              onClick={onBackToLanding}
              className="text-slate-400 hover:text-slate-600 text-sm"
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