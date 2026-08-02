import React, { useState } from 'react';
import {
  Eye, Mic, Camera, FileText, Languages,
  Shield, Heart,
  ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';

/* ── Reusable section heading ── */
const SectionHeading = ({ label, title, subtitle }) => (
  <div className="text-center mb-12 max-w-2xl mx-auto">
    <span className="badge badge-primary mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider">{label}</span>
    <h2 style={{ color: '#ffffff' }} className="text-3xl md:text-4xl font-black mb-4">
      {title}
    </h2>
    {subtitle && (
      <p style={{ color: '#cbd5e1' }} className="text-base sm:text-lg font-medium">
        {subtitle}
      </p>
    )}
  </div>
);

/* ── Feature card ── */
const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div
    style={{ backgroundColor: '#131c2e', borderColor: '#2e3d5c' }}
    className="p-6 flex flex-col border hover:border-indigo-500/60 transition-all rounded-2xl shadow-xl text-left"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <h3 style={{ color: '#ffffff' }} className="text-xl font-bold mb-2">
      {title}
    </h3>
    <p style={{ color: '#cbd5e1' }} className="text-sm leading-relaxed flex-1 font-medium">
      {desc}
    </p>
  </div>
);

/* ── FAQ item ── */
const FAQItem = ({ q, a, id }) => {
  const [open, setOpen] = useState(false);
  const contentId = `faq-content-${id}`;
  const buttonId = `faq-btn-${id}`;
  return (
    <div style={{ backgroundColor: '#131c2e', borderColor: '#2e3d5c' }} className="border rounded-xl overflow-hidden mb-3">
      <button
        id={buttonId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left font-bold hover:bg-slate-800/60 transition-colors"
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span style={{ color: '#ffffff' }} className="text-base sm:text-lg">
          {q}
        </span>
        {open ? (
          <ChevronUp size={20} className="text-indigo-400 flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown size={20} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
        )}
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        style={{ color: '#cbd5e1', borderColor: '#2e3d5c' }}
        className="px-5 pb-5 text-sm sm:text-base leading-relaxed border-t pt-4 font-medium"
      >
        {a}
      </div>
    </div>
  );
};

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Sign Language',
    color: 'bg-indigo-600',
    desc: 'Real-time Indian Sign Language (ISL) continuous sentence translation powered by MediaPipe and OpenAI GPT-4o Vision.',
  },
  {
    icon: Mic,
    title: 'Voice Form Filling',
    color: 'bg-violet-600',
    desc: 'Speak naturally — "My name is Rahul" — and the system auto-fills form fields using NLP-based extraction.',
  },
  {
    icon: Eye,
    title: 'Live Captions',
    color: 'bg-blue-600',
    desc: 'Real-time speech-to-text transcription with timestamps, auto-punctuation, and 10 Indian regional language support.',
  },
  {
    icon: FileText,
    title: 'OCR Document Scanner',
    color: 'bg-emerald-600',
    desc: 'Scan printed documents using your camera. Automatic fraud detection alerts for sensitive inputs like CVV or OTP.',
  },
  {
    icon: Languages,
    title: 'Multilingual Support',
    color: 'bg-orange-600',
    desc: 'Support for English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, and Punjabi.',
  },
  {
    icon: Shield,
    title: 'Emergency SOS',
    color: 'bg-red-600',
    desc: 'One-tap emergency alert shares your GPS location via SMS with haptic feedback vibration alerts.',
  },
];

const STEPS = [
  { n: '01', title: 'Create Your Account', desc: 'Choose your role — Regular User or Sensory Impaired — and register in seconds.' },
  { n: '02', title: 'Access Your Workstation', desc: 'You are automatically directed to your dashboard with voice guidance or gesture tools.' },
  { n: '03', title: 'Start Communicating', desc: 'Use sign language translation, voice forms, live captions, or document scanning.' },
];

const FAQS = [
  {
    q: 'Does AccessAble work offline?',
    a: 'Speech recognition and synthesis require browser web services. The AI gesture detection downloads once and runs in-browser.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'AccessAble works best on Google Chrome, Microsoft Edge, and Apple Safari.',
  },
  {
    q: 'Is my data stored on servers?',
    a: 'All AI vision inference runs in your browser. Account credentials are saved securely in your database.',
  },
  {
    q: 'Which Indian languages are supported?',
    a: 'English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, and Punjabi.',
  },
  {
    q: 'Is this WCAG 2.2 compliant?',
    a: 'Yes. Built with full keyboard navigation, dual ARIA live regions, focus rings, high contrast mode, and screen reader support.',
  },
];

const LandingPage = ({ onGetStarted, onLogin }) => (
  <div style={{ backgroundColor: '#090d16', color: '#ffffff' }} className="min-h-screen" id="landing">
    {/* Skip link for keyboard/screen reader users */}
    <a
      href="#features"
      className="skip-link"
      style={{ position: 'absolute', top: '-40px', left: 0, zIndex: 9999, padding: '8px 16px', background: '#4f46e5', color: '#fff', fontWeight: 'bold', borderRadius: '0 0 4px 0' }}
      onFocus={(e) => { e.currentTarget.style.top = '0'; }}
      onBlur={(e) => { e.currentTarget.style.top = '-40px'; }}
    >
      Skip to main content
    </a>
    {/* ── Header / Navbar ── */}
    <header style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="sticky top-0 z-50 backdrop-blur-xl border-b">
      <div className="container-app h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-base">A</span>
          </div>
          <span style={{ color: '#ffffff' }} className="text-xl font-black tracking-tight">AccessAble</span>
        </div>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {['Features', 'How It Works', 'FAQ'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ color: '#cbd5e1' }}
              className="hover:text-white font-semibold text-sm transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={onLogin} style={{ color: '#ffffff' }} className="btn btn-ghost btn-sm">
            Sign In
          </button>
          <button onClick={onGetStarted} className="btn btn-primary btn-sm">
            Get Started <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </header>

    {/* ── Hero Section ── */}
    <section className="relative overflow-hidden pt-20 pb-20 md:pt-28 md:pb-24 text-center">
      <div className="blob w-[500px] h-[500px] bg-indigo-600/20 -top-40 -left-40" />
      <div className="blob w-[400px] h-[400px] bg-violet-600/20 -bottom-20 -right-20" />

      <div className="container-app relative z-10 px-4">
        <span className="inline-block badge badge-primary mb-6 text-xs sm:text-sm px-4 py-2 font-bold uppercase tracking-wider">
          🚀 Production Assistive Technology Engine
        </span>

        <h1 style={{ color: '#ffffff' }} className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight mb-6 tracking-tight max-w-4xl mx-auto">
          Breaking <span className="gradient-text">Communication</span> Barriers with AI
        </h1>

        <p style={{ color: '#cbd5e1' }} className="text-base sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
          AccessAble is an AI-powered assistive technology platform that empowers sensory-impaired individuals and enables seamless communication.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <button onClick={onGetStarted} className="btn btn-primary btn-lg">
            Start for Free <ArrowRight size={18} />
          </button>
          <button onClick={onLogin} className="btn btn-secondary btn-lg">
            Sign In to Dashboard
          </button>
        </div>

        {/* Telemetry Stats */}
        <div style={{ backgroundColor: '#131c2e', borderColor: '#2e3d5c' }} className="grid grid-cols-3 gap-4 max-w-md mx-auto p-4 rounded-2xl border">
          {[
            { n: '50+', label: 'ISL Signs' },
            { n: '10', label: 'Locales' },
            { n: '30 FPS', label: 'AI Stream' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl sm:text-2xl font-black text-indigo-400">{s.n}</p>
              <p style={{ color: '#cbd5e1' }} className="text-xs font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features Section ── */}
    <section id="features" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="py-20 border-y">
      <div className="container-app px-4">
        <SectionHeading
          label="Core Engine Capabilities"
          title="Designed for Total Accessibility"
          subtitle="Empowering deaf, speech-impaired, and visually-impaired individuals with modern AI tools."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>

    {/* ── How It Works Section ── */}
    <section id="how-it-works" className="py-20">
      <div className="container-app px-4">
        <SectionHeading
          label="Simple Workflow"
          title="How AccessAble Works"
          subtitle="Three simple steps to unlock accessible real-time communication."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} style={{ backgroundColor: '#131c2e', borderColor: '#2e3d5c' }} className="p-6 border rounded-2xl text-left">
              <span className="text-3xl font-black text-indigo-400 block mb-2">{s.n}</span>
              <h3 style={{ color: '#ffffff' }} className="text-xl font-bold mb-2">{s.title}</h3>
              <p style={{ color: '#cbd5e1' }} className="text-sm leading-relaxed font-medium">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── FAQ Section ── */}
    <section id="faq" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="py-20 border-t">
      <div className="container-app max-w-3xl px-4">
        <SectionHeading
          label="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about AccessAble."
        />

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <FAQItem key={faq.q} id={idx} {...faq} />
          ))}
        </div>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer style={{ backgroundColor: '#090d16', borderColor: '#1e293b' }} className="py-8 border-t text-sm text-center">
      <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
        <p style={{ color: '#cbd5e1' }}>© 2025 AccessAble Platform. Built with ❤️ for accessibility and inclusion.</p>
        <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold">
          <Heart size={14} className="text-red-500" />
          <span>WCAG 2.2 AA Compliant Engine</span>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
