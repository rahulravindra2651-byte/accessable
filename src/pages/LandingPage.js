import React, { useState } from 'react';
import {
  Eye, Mic, Camera, FileText, Languages,
  Shield, Heart, ChevronDown, ChevronUp, ArrowRight,
  Sparkles, CheckCircle2, Zap, Star
} from 'lucide-react';

/* ── Section Heading Component (Claymorphic) ── */
const SectionHeading = ({ label, title, subtitle }) => (
  <div className="text-center mb-16 max-w-3xl mx-auto relative z-10">
    {label && (
      <div className="inline-block mb-4">
        <span className="clay-pill text-sm uppercase tracking-wider text-[#7C3AED] bg-white">
          <Sparkles size={15} className="text-[#DB2777]" />
          {label}
        </span>
      </div>
    )}
    <h2
      className="clay-font-black text-4xl sm:text-5xl md:text-6xl text-[#332F3A] mb-4 tracking-tight leading-[1.15]"
      style={{ fontFamily: 'Nunito, sans-serif' }}
    >
      {title}
    </h2>
    {subtitle && (
      <p className="clay-font-body text-lg sm:text-xl text-[#635F69] max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

/* ── Bento Clay Feature Card ── */
const FeatureCard = ({ icon: Icon, title, desc, gradient, badge }) => (
  <div className="clay-card p-8 flex flex-col justify-between group">
    <div>
      {/* 3D Convex Icon Orb */}
      <div className="flex items-center justify-between mb-6">
        <div
          className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${gradient} flex items-center justify-center shadow-clayOrb group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={28} className="text-white" strokeWidth={2.5} />
        </div>
        {badge && (
          <span className="clay-pill text-xs font-bold text-[#7C3AED] bg-white/90">
            {badge}
          </span>
        )}
      </div>

      <h3
        className="clay-font-heading text-2xl font-extrabold text-[#332F3A] mb-3 group-hover:text-[#7C3AED] transition-colors"
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        {title}
      </h3>

      <p className="clay-font-body text-base sm:text-lg text-[#635F69] leading-relaxed">
        {desc}
      </p>
    </div>

    <div className="mt-6 pt-4 border-t border-purple-100 flex items-center justify-between text-sm font-bold text-[#7C3AED]">
      <span className="flex items-center gap-1.5">
        <CheckCircle2 size={16} className="text-[#10B981]" />
        Browser-Native
      </span>
      <span className="text-[#635F69] text-xs font-semibold uppercase tracking-wider">
        30 FPS AI
      </span>
    </div>
  </div>
);

/* ── Recessed Clay FAQ Item ── */
const FAQItem = ({ q, a, id }) => {
  const [open, setOpen] = useState(false);
  const contentId = `faq-content-${id}`;
  const buttonId = `faq-btn-${id}`;

  return (
    <div
      className={`rounded-[28px] overflow-hidden transition-all duration-300 mb-4 ${
        open ? 'bg-white shadow-clayPressed p-1' : 'clay-card p-1'
      }`}
    >
      <button
        id={buttonId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer bg-transparent border-0 focus:outline-none"
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span
          className="clay-font-heading text-xl sm:text-2xl text-[#332F3A] pr-4 font-extrabold"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {q}
        </span>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
            open ? 'bg-[#7C3AED] text-white shadow-clayOrb' : 'bg-white text-[#332F3A] shadow-clayPill'
          }`}
        >
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {open && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={buttonId}
          className="px-6 pb-6 pt-2 text-base sm:text-lg text-[#635F69] leading-relaxed clay-font-body"
        >
          {a}
        </div>
      )}
    </div>
  );
};

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Sign Language',
    desc: 'Real-time Indian Sign Language (ISL) continuous sentence translation powered by MediaPipe and spatial landmark inference.',
    gradient: 'from-violet-400 to-violet-600',
    badge: 'Vision AI',
  },
  {
    icon: Mic,
    title: 'Voice Form Filling',
    desc: 'Speak naturally — "My name is Rahul" — and the engine automatically extracts and populates complex bank & government forms.',
    gradient: 'from-pink-400 to-pink-600',
    badge: 'NLP Engine',
  },
  {
    icon: Eye,
    title: 'Live Captions & TTS',
    desc: 'Real-time speech-to-text with multi-speaker support, dual-screen conversation terminal, and 10 regional Indian languages.',
    gradient: 'from-blue-400 to-blue-600',
    badge: 'Audio STT',
  },
  {
    icon: FileText,
    title: 'OCR Document Scanner',
    desc: 'Instant camera document reader with automated fraud alerts to protect sensitive fields like CVV numbers and OTPs.',
    gradient: 'from-emerald-400 to-emerald-600',
    badge: 'Fraud Shield',
  },
  {
    icon: Languages,
    title: '10 Regional Locales',
    desc: 'Built-in support for English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, and Punjabi.',
    gradient: 'from-amber-400 to-amber-600',
    badge: 'Multilingual',
  },
  {
    icon: Shield,
    title: 'Emergency SOS Alert',
    desc: 'One-tap emergency distress signal broadcasting live GPS coordinates via SMS with tactile haptic vibration alerts.',
    gradient: 'from-rose-400 to-rose-600',
    badge: 'GPS Distress',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Choose Your Mode',
    desc: 'Select Sensory Impaired Mode or Regular User Mode for your personalized assistive workstation.',
    color: 'from-violet-400 to-violet-600',
  },
  {
    n: '02',
    title: 'Access Workstation',
    desc: 'Instantly launch voice navigation, camera sign language tracking, or screen reader TTS guidance.',
    color: 'from-pink-400 to-pink-600',
  },
  {
    n: '03',
    title: 'Communicate Freely',
    desc: 'Translate continuous signs, auto-populate paperwork, or stream live captioned dialogue in real time.',
    color: 'from-emerald-400 to-emerald-600',
  },
];

const FAQS = [
  {
    q: 'Does AccessAble run inference locally in my browser?',
    a: 'Yes! All AI hand gesture tracking, landmark normalization, and OCR text recognition execute directly on your device via WebAssembly. No camera video or personal data is ever sent to external servers.',
  },
  {
    q: 'Which Indian regional languages are supported?',
    a: 'AccessAble supports 10 languages: English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, and Punjabi.',
  },
  {
    q: 'Can visually impaired users operate without a mouse?',
    a: 'Absolutely. Built with full keyboard navigation, screen reader TTS guidance, and a global voice-command listener ("Open Camera", "Start Form", "Read Page").',
  },
  {
    q: 'Is this WCAG 2.2 AA compliant?',
    a: 'Yes. Features dual ARIA live regions, custom high-contrast mode, large font scalers, focus rings, and accessible touch target sizes.',
  },
  {
    q: 'What browsers are supported?',
    a: 'AccessAble works smoothly on Google Chrome, Microsoft Edge, and Apple Safari with standard camera and microphone permissions enabled.',
  },
];

const LandingPage = ({ onGetStarted, onLogin }) => {
  return (
    <div className="clay-canvas min-h-screen relative overflow-hidden selection:bg-[#7C3AED] selection:text-white" id="landing">
      {/* ── 3D Ambient Floating Blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-[#7C3AED]/12 blur-3xl clay-blob-float" />
        <div className="absolute top-[30%] -right-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-[#DB2777]/12 blur-3xl clay-blob-float-delayed" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-[#0EA5E9]/12 blur-3xl clay-blob-float-slow" />
      </div>

      {/* Skip link for keyboard accessibility */}
      <a
        href="#features"
        className="skip-link"
        style={{
          position: 'absolute',
          top: '-50px',
          left: '1.5rem',
          zIndex: 9999,
          padding: '10px 22px',
          background: '#7C3AED',
          color: '#ffffff',
          fontWeight: '800',
          borderRadius: '20px',
          boxShadow: '0 10px 20px rgba(124, 58, 237, 0.4)',
          transition: 'top 0.2s ease',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '12px'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-50px'; }}
      >
        Skip to main content
      </a>

      {/* ── Floating Clay Pill Navbar ── */}
      <header className="sticky top-6 z-50 max-w-5xl mx-auto px-4">
        <nav
          className="clay-card rounded-full px-6 py-3.5 flex items-center justify-between gap-4"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] flex items-center justify-center shadow-clayOrb text-white font-black text-xl">
              A
            </div>
            <span
              className="clay-font-black text-2xl text-[#332F3A] tracking-tight"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              AccessAble
            </span>
          </div>

          {/* Links (Desktop) */}
          <div className="hidden md:flex items-center gap-7 font-bold text-[#635F69]">
            {['Features', 'How It Works', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-[#7C3AED] transition-colors py-1 text-base"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="clay-btn-secondary text-sm py-2.5 px-5 rounded-[18px]"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="clay-btn text-sm py-2.5 px-6 rounded-[18px]"
            >
              <span>Get Started</span>
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 text-center max-w-5xl mx-auto px-4 z-10">
        {/* Floating Category Pill */}
        <div className="inline-block mb-6">
          <span className="clay-pill text-sm sm:text-base text-[#7C3AED] px-5 py-2">
            <Sparkles size={16} className="text-[#DB2777]" />
            AI-Powered Sensory Inclusion Engine
          </span>
        </div>

        {/* Hero Display Headline */}
        <h1
          className="clay-font-black text-5xl sm:text-7xl md:text-8xl leading-[1.08] mb-6 max-w-4xl mx-auto tracking-tight clay-text-gradient"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Breaking Communication Barriers with AI
        </h1>

        {/* Subtitle */}
        <p className="clay-font-body text-xl sm:text-2xl text-[#635F69] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          AccessAble brings tangible, multi-modal assistive intelligence to everyone — bridging sign language,
          conversational voice forms, and real-time dialogue.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center mb-16">
          <button
            onClick={onGetStarted}
            className="clay-btn text-xl py-4 px-9 rounded-[24px] w-full sm:w-auto"
          >
            <span>Start for Free</span>
            <ArrowRight size={20} strokeWidth={3} />
          </button>
          <button
            onClick={onLogin}
            className="clay-btn-secondary text-xl py-4 px-9 rounded-[24px] w-full sm:w-auto"
          >
            Sign In to Dashboard
          </button>
        </div>

        {/* 3D Floating Stat Orbs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { n: '50+', label: 'ISL Signs Trained', color: 'from-violet-400 to-violet-600' },
            { n: '10', label: 'Indian Locales', color: 'from-pink-400 to-pink-600' },
            { n: '30 FPS', label: 'Real-Time Stream', color: 'from-blue-400 to-blue-600' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="clay-card p-6 flex items-center gap-4 text-left hover:scale-[1.03] transition-transform duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-clayOrb flex-shrink-0 text-white font-black text-xl clay-breathe`}
              >
                <Zap size={24} />
              </div>
              <div>
                <p
                  className="clay-font-black text-3xl sm:text-4xl text-[#332F3A] leading-tight"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {stat.n}
                </p>
                <p className="clay-font-body text-sm sm:text-base font-bold text-[#635F69]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Bento Grid Section ── */}
      <section id="features" className="py-24 max-w-5xl mx-auto px-4 relative z-10">
        <SectionHeading
          label="Multi-Modal Engine"
          title="Designed for Total Inclusion"
          subtitle="Empowering deaf, speech-impaired, and visually-impaired users with tactile, high-precision AI tools."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 max-w-5xl mx-auto px-4 relative z-10">
        <SectionHeading
          label="Simple Workflow"
          title="How AccessAble Works"
          subtitle="Three simple steps to unlock accessible real-time communication on any device."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="clay-card p-8 text-left group">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-black text-xl shadow-clayOrb mb-6 group-hover:scale-110 transition-transform duration-300`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {step.n}
              </div>
              <h3
                className="clay-font-heading text-2xl font-extrabold text-[#332F3A] mb-3"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {step.title}
              </h3>
              <p className="clay-font-body text-base sm:text-lg text-[#635F69] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-4 relative z-10">
        <SectionHeading
          label="Assistance & Answers"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about inference, safety, and regional support."
        />

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <FAQItem key={faq.q} id={idx} {...faq} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-16 pb-14 max-w-5xl mx-auto px-4 relative z-10">
        <div className="clay-card rounded-[40px] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h4
              className="clay-font-black text-3xl text-[#332F3A] mb-2"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              AccessAble Platform
            </h4>
            <p className="clay-font-body text-base sm:text-lg text-[#635F69]">
              © 2026 AccessAble Engine. Crafted with ❤️ for accessibility and inclusion.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="clay-pill text-sm text-[#7C3AED] bg-white">
              <Heart size={16} className="text-[#DB2777] fill-[#DB2777]" />
              WCAG 2.2 AA Compliant
            </span>
            <button
              onClick={onGetStarted}
              className="clay-btn text-sm py-3 px-6 rounded-[20px]"
            >
              Launch Studio 🚀
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
