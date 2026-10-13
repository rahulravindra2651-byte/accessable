import React, { useState, useContext, useEffect, useRef } from 'react';
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
  const activeRecognitionRef = useRef(null);

  useEffect(() => {
    speakGuidance(
      'Welcome to AccessAble. You are on the Sign In page. Enter your email and password.',
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
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      const msg = 'Please fill in all required fields.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const msg = 'Please enter a valid email address.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    setIsLoading(true);
    speakGuidance('Signing in, please wait.', 'polite');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
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
    <div className="clay-canvas min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Floating Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#7C3AED]/12 blur-3xl clay-blob-float" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#DB2777]/12 blur-3xl clay-blob-float-delayed" />
      </div>

      <a href="#login-form" className="skip-link">Skip to sign in form</a>

      <div className="w-full max-w-md my-8 relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] shadow-clayOrb mb-4 text-white font-black text-2xl"
            style={{ fontFamily: 'Nunito, sans-serif' }}
            aria-hidden="true"
          >
            A
          </div>
          <h1
            className="clay-font-black text-4xl text-[#332F3A] tracking-tight"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            AccessAble
          </h1>
          <p className="clay-font-body text-base text-[#635F69] mt-1 font-medium">
            Tactile, inclusive communication for everyone
          </p>
        </div>

        <div
          className="clay-card p-8 sm:p-10"
          id="login-form"
          tabIndex="-1"
          style={{ borderRadius: '36px' }}
        >
          {/* Form Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="clay-font-black text-2xl sm:text-3xl text-[#332F3A]"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Welcome Back
              </h2>
              <p className="clay-font-body text-sm text-[#635F69] mt-0.5">
                Sign in to your workstation
              </p>
            </div>
            <button
              type="button"
              onClick={() => speakGuidance('Sign In form. Enter email address and password.', 'assertive')}
              className="clay-pill text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#7C3AED]"
              aria-label="Read form guidance aloud"
            >
              <Volume2 size={15} /> Listen
            </button>
          </div>

          {/* ── Email/Password Form ── */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label htmlFor="login-email" className="clay-font-heading text-sm font-extrabold text-[#332F3A]">
                  Email Address <span className="text-[#DB2777]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => listenForField('email', setEmail)}
                  className={`clay-pill text-xs h-7 px-3 inline-flex items-center justify-center gap-1.5 font-bold shrink-0 transition-all ${
                    activeListeningField === 'email' ? 'bg-[#DB2777] text-white shadow-sm' : 'text-[#7C3AED] hover:bg-[#7C3AED]/10'
                  }`}
                  aria-label="Speak email address"
                >
                  <Mic size={13} className={activeListeningField === 'email' ? 'animate-pulse' : ''} />
                  <span>{activeListeningField === 'email' ? 'Listening…' : 'Speak'}</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#635F69] pointer-events-none z-10" size={18} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => speakGuidance('Email address edit box. Required.', 'polite')}
                  className="clay-input has-icon-left pl-11"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label htmlFor="login-password" className="clay-font-heading text-sm font-extrabold text-[#332F3A]">
                  Password <span className="text-[#DB2777]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => listenForField('password', setPassword)}
                  className={`clay-pill text-xs h-7 px-3 inline-flex items-center justify-center gap-1.5 font-bold shrink-0 transition-all ${
                    activeListeningField === 'password' ? 'bg-[#DB2777] text-white shadow-sm' : 'text-[#7C3AED] hover:bg-[#7C3AED]/10'
                  }`}
                  aria-label="Speak password"
                >
                  <Mic size={13} className={activeListeningField === 'password' ? 'animate-pulse' : ''} />
                  <span>{activeListeningField === 'password' ? 'Listening…' : 'Speak'}</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#635F69] pointer-events-none z-10" size={18} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => speakGuidance('Password edit box. Required.', 'polite')}
                  className="clay-input has-icon-left has-icon-right pl-11 pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#635F69] hover:text-[#7C3AED] transition-colors p-1.5 rounded-lg z-10"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="clay-pill bg-rose-50 text-[#DB2777] w-full text-sm font-bold p-3 rounded-2xl justify-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="clay-btn w-full text-lg py-3.5 rounded-[22px]"
              aria-label="Sign in to your AccessAble account"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full anim-spin" />
                  Signing In…
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-7 text-[#635F69] font-medium">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-extrabold text-[#7C3AED] hover:underline cursor-pointer bg-transparent border-0 p-0"
              aria-label="Go to registration page"
            >
              Sign up
            </button>
          </p>
        </div>

        {onBackToLanding && (
          <p className="text-center mt-6">
            <button
              onClick={onBackToLanding}
              className="clay-pill text-sm font-bold text-[#635F69] hover:text-[#7C3AED] cursor-pointer"
              aria-label="Back to home page"
            >
              ← Back to Home
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;