import React, { useState } from 'react';
import {
  Eye, Mic, Camera, FileText, Languages,
  Shield, Heart,
  ChevronDown, ChevronUp, Star, ArrowRight, Check, Globe
} from 'lucide-react';

/* ── Reusable section heading ── */
const SectionHeading = ({ label, title, subtitle }) => (
  <div className="text-center mb-12 max-w-2xl mx-auto">
    <span className="badge badge-primary mb-3">{label}</span>
    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{title}</h2>
    {subtitle && <p className="text-slate-500 text-lg">{subtitle}</p>}
  </div>
);

/* ── Feature card ── */
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <div className={`card card-hover p-6 anim-slide-up delay-${delay} flex flex-col`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
  </div>
);

/* ── FAQ item ── */
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        {open ? <ChevronUp size={18} className="text-indigo-600 flex-shrink-0" />
          : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

const FEATURES = [
  {
    icon: Camera, title: 'AI Sign Language', color: 'bg-indigo-600', delay: 100,
    desc: 'Real-time gesture recognition powered by Google MediaPipe. Detects 15+ signs with live hand-landmark overlay and confidence scoring.'
  },
  {
    icon: Mic, title: 'Voice Form Filling', color: 'bg-violet-600', delay: 200,
    desc: 'Speak naturally — "My name is Rahul" — and the system auto-fills the correct form field using NLP-based extraction. No typing needed.'
  },
  {
    icon: Eye, title: 'Live Captions', color: 'bg-blue-600', delay: 300,
    desc: 'Real-time speech-to-text transcription with timestamps, speaker pauses, auto-punctuation, and one-click copy/download.'
  },
  {
    icon: FileText, title: 'OCR Document Scanner', color: 'bg-emerald-600', delay: 100,
    desc: 'Scan any printed form or document using your camera. Automatic fraud detection alerts for suspicious content like OTP or CVV requests.'
  },
  {
    icon: Languages, title: 'Multilingual Support', color: 'bg-orange-600', delay: 200,
    desc: 'Full support for English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, and Punjabi — switch at runtime.'
  },
  {
    icon: Shield, title: 'Emergency SOS', color: 'bg-red-600', delay: 300,
    desc: 'One-tap emergency button shares your GPS location via SMS. Vibration alerts for haptic feedback on mobile devices.'
  },
];

const STEPS = [
  { n: '01', title: 'Create Your Account', desc: 'Choose your role — Regular User or Sensory Impaired — and register in under 30 seconds.' },
  { n: '02', title: 'Access Your Dashboard', desc: 'You are automatically directed to your personalised dashboard with features tailored to your needs.' },
  { n: '03', title: 'Start Communicating', desc: 'Use sign language detection, voice forms, live captions, or document scanning — instantly.' },
];

const TESTIMONIALS = [
  {
    name: 'Priya R.', role: 'Hearing Impaired, Bengaluru', rating: 5,
    quote: 'The live captions feature has completely changed how I participate in meetings. The accuracy is incredible and it works in Kannada!'
  },
  {
    name: 'Arjun M.', role: 'Sign Language Interpreter, Chennai', rating: 5,
    quote: 'I use AccessAble to bridge communication gaps in real time. The MediaPipe gesture detection is far better than anything I\'ve used before.'
  },
  {
    name: 'Sanya T.', role: 'Visually Impaired Student, Mumbai', rating: 5,
    quote: 'The voice form filling feature helped me complete my college application without any help. The NLP field extraction is remarkably accurate.'
  },
];

const FAQS = [
  {
    q: 'Does AccessAble work offline?',
    a: 'Speech recognition and synthesis require browser APIs which need an internet connection. The AI gesture detection (MediaPipe) downloads the model once and can then run offline.'
  },
  {
    q: 'Which browsers are supported?',
    a: 'AccessAble works best on Chrome, Edge, and Safari. Firefox supports all features except some SpeechRecognition APIs.'
  },
  {
    q: 'Is my data stored on servers?',
    a: 'All AI inference runs locally in your browser. Only your account credentials are stored securely in our database. Voice, gestures, and documents never leave your device.'
  },
  {
    q: 'Which Indian languages are supported?',
    a: 'English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, and Punjabi — with more languages planned.'
  },
  {
    q: 'Is this WCAG 2.2 compliant?',
    a: 'Yes. AccessAble is built with full keyboard navigation, ARIA labels, focus indicators, high contrast mode, large font mode, and screen reader support.'
  },
];

const LandingPage = ({ onGetStarted, onLogin }) => (
  <div className="bg-white" id="landing">
    {/* ── Navbar ── */}
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="container-app h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-base">A</span>
          </div>
          <span className="text-lg font-black text-slate-900">AccessAble</span>
        </div>
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {['Features', 'How It Works', 'Testimonials', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="nav-link text-sm">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="btn btn-ghost btn-sm">Sign In</button>
          <button onClick={onGetStarted} className="btn btn-primary btn-sm">
            Get Started <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </header>

    {/* ── Hero ── */}
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28" aria-labelledby="hero-heading">
      {/* Blobs */}
      <div className="blob w-[500px] h-[500px] bg-indigo-400 -top-40 -left-40" />
      <div className="blob w-[400px] h-[400px] bg-violet-400 -bottom-20 -right-20" />

      <div className="container-app text-center relative z-10">
        <span className="badge badge-primary mb-6 text-sm px-4 py-2">
          🚀 Production Assistive Technology Engine
        </span>

        <h1 id="hero-heading"
          className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.08] mb-6 tracking-tight">
          Breaking{' '}
          <span className="gradient-text">Communication</span>
          <br />Barriers with AI
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          AccessAble is an AI-powered assistive technology platform that empowers
          sensory-impaired individuals and enables seamless communication between
          users of all abilities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button onClick={onGetStarted} className="btn btn-primary btn-xl">
            Start for Free <ArrowRight size={20} />
          </button>
          <button onClick={onLogin} className="btn btn-secondary btn-xl">
            Sign In to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { n: '15+', label: 'Sign Gestures' },
            { n: '10', label: 'Languages' },
            { n: '100%', label: 'In-Browser AI' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-indigo-600">{s.n}</p>
              <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features ── */}
    <section id="features" className="py-20 bg-slate-50" aria-labelledby="features-heading">
      <div className="container-app">
        <SectionHeading
          label="Features"
          title="Everything you need to communicate"
          subtitle="Six powerful AI-driven tools built for accessibility, usability, and independence."
          id="features-heading"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </div>
    </section>

    {/* ── How It Works ── */}
    <section id="how-it-works" className="py-20" aria-labelledby="how-heading">
      <div className="container-app">
        <SectionHeading
          label="Process"
          title="Up and running in minutes"
          id="how-heading"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />
          {STEPS.map((s, i) => (
            <div key={s.n} className={`relative text-center anim-slide-up delay-${(i + 1) * 100}`}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-5 shadow-lg">
                {s.n}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── User Types ── */}
    <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
      <div className="container-app">
        <SectionHeading label="User Types" title="Two dashboards, one mission" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: 'Regular User', icon: Languages, color: 'bg-blue-500/30 border-blue-400/30',
              features: ['AI Sign Language Detector', 'Real-time gesture recognition', 'Hand landmark overlay', 'Sentence builder', 'Text to Sign converter'],
              cta: 'Sign Language Translator'
            },
            {
              title: 'Sensory Impaired User', icon: Eye, color: 'bg-amber-500/20 border-amber-400/30',
              features: ['Voice Form Filling (NLP)', 'Live Speech Captions', 'OCR Document Scanner', 'Read Forms Aloud', 'Emergency SOS Button'],
              cta: 'Accessibility Assistant'
            },
          ].map(u => {
            const Icon = u.icon;
            return (
              <div key={u.title} className={`border rounded-2xl p-8 ${u.color}`}>
                <div className="flex items-center gap-3 mb-6">
                  <Icon size={28} />
                  <h3 className="text-2xl font-bold">{u.title}</h3>
                </div>
                <ul className="space-y-3 mb-8">
                  {u.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-white/90">
                      <Check size={16} className="text-white/70 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="btn btn-secondary btn-sm">
                  Try {u.cta} →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ── Testimonials ── */}
    <section id="testimonials" className="py-20 bg-slate-50">
      <div className="container-app">
        <SectionHeading label="Testimonials" title="Trusted by users across India" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={`card p-6 anim-slide-up delay-${(i + 1) * 100}`}>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-5 text-sm">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── FAQ ── */}
    <section id="faq" className="py-20">
      <div className="container-app max-w-2xl">
        <SectionHeading label="FAQ" title="Frequently asked questions" />
        <div className="space-y-3">
          {FAQS.map((f, i) => <FAQItem key={i} {...f} />)}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700">
      <div className="container-app text-center text-white">
        <Globe size={48} className="mx-auto mb-6 opacity-80 anim-float" />
        <h2 className="text-4xl font-black mb-4">Ready to break barriers?</h2>
        <p className="text-indigo-200 text-lg mb-8 max-w-md mx-auto">
          Join AccessAble today and experience a world of inclusive communication.
        </p>
        <button onClick={onGetStarted} className="btn btn-accent btn-xl">
          Get Started — It's Free <ArrowRight size={20} />
        </button>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="container-app flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">A</span>
          </div>
          <span className="text-white font-bold">AccessAble</span>
        </div>
        <p className="text-sm">© 2025 AccessAble Platform. Built with ❤️ for accessibility and inclusion.</p>
        <div className="flex items-center gap-1 text-sm">
          <Heart size={14} className="text-red-400" />
          <span>WCAG 2.2 Compliant</span>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
