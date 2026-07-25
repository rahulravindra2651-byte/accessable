import React, { useState, useContext, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Accessibility, Languages, Mic, Volume2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { AccessibilityContext } from '../../context/AccessibilityContext';

const ROLES = [
  {
    id: 'regular',
    icon: Languages,
    title: 'Regular User',
    subtitle: 'I communicate with people who have disabilities',
    color: 'blue',
    gradient: 'from-blue-600 to-indigo-700',
    ariaDesc: 'Regular User option. For users who communicate with people who have disabilities.',
  },
  {
    id: 'impaired',
    icon: Accessibility,
    title: 'Sensory Impaired User',
    subtitle: 'I have a visual or hearing impairment',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    ariaDesc: 'Sensory Impaired User option. Includes full voice guidance, page reader, and live transcription.',
  },
];

const Register = ({ onSwitchToLogin, onBackToLanding }) => {
  const { login } = useContext(AuthContext);
  const { speakGuidance } = useContext(AccessibilityContext);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeListeningField, setActiveListeningField] = useState(null);

  useEffect(() => {
    speakGuidance(
      'Welcome to AccessAble. You are on the Sign Up page. Step 1 of 2: Please choose your account type.',
      'polite'
    );
  }, [speakGuidance]);

  const handleRoleSelect = (r) => {
    setRole(r);
    setError('');
    const selected = ROLES.find((x) => x.id === r);
    if (selected) speakGuidance(`Selected ${selected.title}. ${selected.subtitle}.`, 'polite');
  };

  const handleNext = () => {
    if (!role) {
      const msg = 'Please choose an account type to continue.';
      setError(msg);
      speakGuidance(msg, 'assertive');
      return;
    }
    setError('');
    setStep(2);
    speakGuidance(
      'Step 2 of 2: Enter your details. Please fill in your name, email, and password, or use the voice input buttons.',
      'polite'
    );
  };

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
    if (!name.trim() || name.trim().length < 2) {
      const msg = 'Please enter your full name (at least 2 characters).';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    if (!email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    setIsLoading(true);
    speakGuidance('Creating your account, please wait.', 'polite');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || 'Registration failed.';
        setError(msg); speakGuidance(msg, 'assertive'); return;
      }
      speakGuidance('Registration completed successfully. Redirecting to your dashboard.', 'assertive');
      login(data.user, data.token);
    } catch {
      const msg = 'Unable to connect to server. Please check your internet connection.';
      setError(msg); speakGuidance(msg, 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.id === role);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f8faff 50%, #f5f3ff 100%)' }}
    >
      <a href="#register-form" className="skip-link">Skip to sign up form</a>

      <div className="w-full max-w-lg">
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

        {/* Step indicator */}
        <div
          className="flex gap-2 mb-6"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin="1"
          aria-valuemax="2"
          aria-label={`Registration step ${step} of 2`}
        >
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: step >= s ? '100%' : '0%', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }}
              />
            </div>
          ))}
        </div>

        <div
          className="card p-8"
          id="register-form"
          tabIndex="-1"
          style={{ boxShadow: '0 8px 40px rgb(79 70 229 / .10)' }}
        >
          {step === 1 ? (
            <>
              {/* Step 1 Header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Choose Account Type</h2>
                <button
                  type="button"
                  onClick={() => speakGuidance('Choose Account Type. Option 1: Regular User. Option 2: Sensory Impaired User.', 'assertive')}
                  className="btn btn-ghost btn-sm gap-1"
                  aria-label="Listen to account type options"
                >
                  <Volume2 size={15} /> Listen
                </button>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--c-text-muted)' }}>Select how you'll use AccessAble</p>

              {/* Role Cards */}
              <div className="space-y-3 mb-6" role="radiogroup" aria-label="Account type selection">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const selected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={r.ariaDesc}
                      onClick={() => handleRoleSelect(r.id)}
                      onFocus={() => speakGuidance(r.ariaDesc, 'polite')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                      style={{
                        border: `2px solid ${selected ? (r.id === 'regular' ? '#4f46e5' : '#f59e0b') : 'var(--c-border)'}`,
                        background: selected ? (r.id === 'regular' ? 'rgb(79 70 229 / .06)' : 'rgb(245 158 11 / .06)') : 'var(--c-surface)',
                      }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${r.gradient} text-white`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{r.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{r.subtitle}</p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: selected ? (r.id === 'regular' ? '#4f46e5' : '#f59e0b') : 'var(--c-border)',
                          background: selected ? (r.id === 'regular' ? '#4f46e5' : '#f59e0b') : 'transparent',
                        }}
                      >
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div role="alert" aria-live="assertive" className="form-error mb-4">
                  {error}
                </div>
              )}

              <button onClick={handleNext} className="btn btn-primary w-full btn-lg" aria-label="Continue to enter personal details">
                Continue <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              {/* Step 2 Header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-ghost btn-icon"
                  aria-label="Go back to account type selection"
                  style={{ flexShrink: 0 }}
                >
                  ←
                </button>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Create Account</h2>
                  {selectedRole && (
                    <span className={`badge ${role === 'regular' ? 'badge-info' : 'badge-warning'} mt-1`}>
                      {selectedRole.title}
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* Full Name */}
                <div className="form-field">
                  <div className="form-field-header">
                    <label htmlFor="reg-name" className="label">
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => listenForField('full name', setName)}
                      className={`btn btn-xs gap-1 ${activeListeningField === 'full name' ? 'btn-danger' : 'btn-secondary'}`}
                      aria-label="Speak full name"
                    >
                      <Mic size={11} className={activeListeningField === 'full name' ? 'animate-pulse' : ''} />
                      {activeListeningField === 'full name' ? 'Listening…' : 'Speak'}
                    </button>
                  </div>
                  <div className="relative">
                    <User className="input-icon" size={16} aria-hidden="true" />
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => speakGuidance('Full name edit box. Required.', 'polite')}
                      className="input-field pl-9"
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-field">
                  <div className="form-field-header">
                    <label htmlFor="reg-email" className="label">
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
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => speakGuidance('Email address edit box. Required.', 'polite')}
                      className="input-field pl-9"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-field">
                  <div className="form-field-header">
                    <label htmlFor="reg-password" className="label">
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
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => speakGuidance('Password edit box. Minimum 6 characters.', 'polite')}
                      className="input-field pl-9 pr-11"
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--c-text-subtle)', lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-field">
                  <label htmlFor="reg-confirm" className="label">
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <Lock className="input-icon" size={16} aria-hidden="true" />
                    <input
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => speakGuidance('Confirm password edit box. Re-enter your password.', 'polite')}
                      className="input-field pl-9 pr-11"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--c-text-subtle)', lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
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
                  aria-label="Create your AccessAble account"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full anim-spin" />
                      Creating Account…
                    </>
                  ) : (
                    <>Create Account <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm mt-6" style={{ color: 'var(--c-text-muted)' }}>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold"
              style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Go to sign in page"
            >
              Sign in
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

export default Register;