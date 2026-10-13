import React, { useState, useContext, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Accessibility, Languages, Mic, Volume2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { AccessibilityContext } from '../../context/AccessibilityContext';

const ROLES = [
  {
    id: 'regular',
    icon: Languages,
    title: 'Regular User',
    subtitle: 'I communicate with people who have sensory impairments',
    gradient: 'from-blue-400 to-indigo-600',
    ariaDesc: 'Regular User option. For users who communicate with people who have disabilities.',
  },
  {
    id: 'impaired',
    icon: Accessibility,
    title: 'Sensory Impaired User',
    subtitle: 'I have a visual or hearing impairment',
    gradient: 'from-amber-400 to-orange-500',
    ariaDesc: 'Sensory Impaired User option. Includes full voice guidance, page reader, and live transcription.',
  },
];

const NAME_REGEX = /^[a-zA-Z\s'-]{2,100}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
  const activeRecognitionRef = useRef(null);

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
    speakGuidance('Step 2 of 2: Enter your details to create your account.', 'polite');
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Name validation
    if (!cleanName || cleanName.length < 2) {
      const msg = 'Please enter your full name (at least 2 characters).';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }
    if (!NAME_REGEX.test(cleanName)) {
      const msg = 'Full name must contain only letters, spaces, hyphens, and apostrophes.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }

    // 2. Email validation
    if (!EMAIL_REGEX.test(cleanEmail)) {
      const msg = 'Please enter a valid email address.';
      setError(msg); speakGuidance(msg, 'assertive'); return;
    }

    // 3. Password validation
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
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || 'Registration failed.';
        setError(msg);
        speakGuidance(msg, 'assertive');
        return;
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
    <div className="clay-canvas min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Floating Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#7C3AED]/12 blur-3xl clay-blob-float" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#DB2777]/12 blur-3xl clay-blob-float-delayed" />
      </div>

      <a href="#register-form" className="skip-link">Skip to sign up form</a>

      <div className="w-full max-w-lg my-8 relative z-10">
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
            Join the inclusive communication network
          </p>
        </div>

        <div
          className="clay-card p-8 sm:p-10"
          id="register-form"
          tabIndex="-1"
          style={{ borderRadius: '36px' }}
        >
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8" role="progressbar" aria-valuenow={step} aria-valuemin="1" aria-valuemax="2">
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${step >= 1 ? 'text-[#7C3AED]' : 'text-[#635F69]'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-[#7C3AED] text-white shadow-clayOrb' : 'bg-white text-[#635F69] shadow-clayPill'}`}>
                1
              </span>
              Account Type
            </div>
            <div className="w-8 h-1 bg-[#d9d4e3] rounded-full" />
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${step === 2 ? 'text-[#7C3AED]' : 'text-[#635F69]'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-[#7C3AED] text-white shadow-clayOrb' : 'bg-white text-[#635F69] shadow-clayPill'}`}>
                2
              </span>
              Details
            </div>
          </div>

          {/* STEP 1: Select Role */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="clay-font-black text-2xl sm:text-3xl text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Choose Your Role
                  </h2>
                  <p className="clay-font-body text-sm text-[#635F69] mt-0.5">
                    Select how you will use AccessAble
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => speakGuidance('Choose Regular User if you communicate with sensory impaired people. Choose Sensory Impaired User if you need voice assistance and captions.', 'assertive')}
                  className="clay-pill text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#7C3AED]"
                  aria-label="Read role guidance aloud"
                >
                  <Volume2 size={15} /> Listen
                </button>
              </div>

              <div className="space-y-4" role="radiogroup" aria-label="Account type selection">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleRoleSelect(r.id)}
                      className={`w-full p-5 rounded-[24px] text-left transition-all duration-300 flex items-start gap-4 ${
                        isSelected
                          ? 'bg-white shadow-clayButton border-2 border-[#7C3AED] scale-[1.01]'
                          : 'clay-card p-5 hover:-translate-y-1'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${r.gradient} text-white shadow-clayOrb`}>
                        <Icon size={24} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="clay-font-heading text-lg font-black text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {r.title}
                          </p>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shadow-clayOrb">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="clay-font-body text-xs sm:text-sm text-[#635F69] mt-1 leading-relaxed">
                          {r.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div role="alert" aria-live="assertive" className="clay-pill bg-rose-50 text-[#DB2777] w-full text-sm font-bold p-3 rounded-2xl justify-center">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="clay-btn w-full text-lg py-3.5 rounded-[22px]"
                aria-label="Continue to details step"
              >
                <span>Continue</span>
                <ArrowRight size={18} strokeWidth={3} />
              </button>
            </div>
          )}

          {/* STEP 2: Enter Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="clay-font-black text-2xl sm:text-3xl text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Your Profile
                  </h2>
                  {selectedRole && (
                    <span className="clay-pill text-xs font-bold text-[#7C3AED] mt-1 py-0.5 px-2.5">
                      {selectedRole.title}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="clay-pill text-xs py-1.5 px-3 text-[#635F69] hover:text-[#7C3AED]"
                  aria-label="Change account type"
                >
                  Change Role
                </button>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Full Name */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="reg-name" className="clay-font-heading text-sm font-extrabold text-[#332F3A]">
                      Full Name <span className="text-[#DB2777]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => listenForField('full name', setName)}
                      className={`clay-pill text-xs h-7 px-3 inline-flex items-center justify-center gap-1.5 font-bold shrink-0 transition-all ${
                        activeListeningField === 'full name' ? 'bg-[#DB2777] text-white shadow-sm' : 'text-[#7C3AED] hover:bg-[#7C3AED]/10'
                      }`}
                      aria-label="Speak full name"
                    >
                      <Mic size={13} className={activeListeningField === 'full name' ? 'animate-pulse' : ''} />
                      <span>{activeListeningField === 'full name' ? 'Listening…' : 'Speak'}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#635F69] pointer-events-none z-10" size={18} aria-hidden="true" />
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => speakGuidance('Full name edit box. Required.', 'polite')}
                      className="clay-input has-icon-left pl-11"
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="reg-email" className="clay-font-heading text-sm font-extrabold text-[#332F3A]">
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
                      id="reg-email"
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

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="reg-password" className="clay-font-heading text-sm font-extrabold text-[#332F3A]">
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
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => speakGuidance('Password edit box. Minimum 6 characters. Required.', 'polite')}
                      className="clay-input has-icon-left has-icon-right pl-11 pr-12"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#635F69] hover:text-[#7C3AED] transition-colors p-1.5 rounded-lg z-10"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="reg-confirm" className="clay-font-heading text-sm font-extrabold text-[#332F3A]">
                      Confirm Password <span className="text-[#DB2777]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => listenForField('confirm password', setConfirmPassword)}
                      className={`clay-pill text-xs h-7 px-3 inline-flex items-center justify-center gap-1.5 font-bold shrink-0 transition-all ${
                        activeListeningField === 'confirm password' ? 'bg-[#DB2777] text-white shadow-sm' : 'text-[#7C3AED] hover:bg-[#7C3AED]/10'
                      }`}
                      aria-label="Speak confirm password"
                    >
                      <Mic size={13} className={activeListeningField === 'confirm password' ? 'animate-pulse' : ''} />
                      <span>{activeListeningField === 'confirm password' ? 'Listening…' : 'Speak'}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#635F69] pointer-events-none z-10" size={18} aria-hidden="true" />
                    <input
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => speakGuidance('Confirm password edit box. Required.', 'polite')}
                      className="clay-input has-icon-left has-icon-right pl-11 pr-12"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#635F69] hover:text-[#7C3AED] transition-colors p-1.5 rounded-lg z-10"
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div role="alert" aria-live="assertive" className="clay-pill bg-rose-50 text-[#DB2777] w-full text-sm font-bold p-3 rounded-2xl justify-center">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="clay-btn w-full text-lg py-3.5 rounded-[22px]"
                  aria-label="Create your AccessAble account"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full anim-spin" />
                      Creating Account…
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm mt-7 text-[#635F69] font-medium">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-extrabold text-[#7C3AED] hover:underline cursor-pointer bg-transparent border-0 p-0"
              aria-label="Go to login page"
            >
              Sign in
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

export default Register;