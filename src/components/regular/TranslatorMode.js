import React, { useState } from 'react';
import { Languages, Star, Video, Sparkles, Zap } from 'lucide-react';
import ISLTranslatorCamera from './ISLTranslatorCamera';
import TextToSign from './TextToSign';

const TABS = [
  {
    id: 'isl_camera',
    icon: Video,
    label: 'Continuous ISL Translator',
    badge: '30 FPS AI',
    desc: 'Continuous Indian Sign Language to live streaming text',
  },
  {
    id: 'text_to_sign',
    icon: Languages,
    label: 'Text → Sign Guide',
    badge: null,
    desc: 'Convert spoken or typed text into sign guide',
  },
];

const TranslatorMode = () => {
  const [activeTab, setActiveTab] = useState('isl_camera');

  return (
    <div
      className="clay-canvas min-h-[calc(100vh-80px)] pb-16 relative"
      id="main-content"
      tabIndex="-1"
    >
      {/* 3D Floating Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-[10%] -left-[5%] w-[40vw] h-[40vw] rounded-full bg-[#7C3AED]/10 blur-3xl clay-blob-float" />
        <div className="absolute top-[40%] -right-[5%] w-[40vw] h-[40vw] rounded-full bg-[#0EA5E9]/10 blur-3xl clay-blob-float-delayed" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-10">
        {/* Header */}
        <header className="mb-10" role="banner">
          <div className="flex items-center gap-3 mb-3">
            <span className="clay-pill text-xs font-bold text-[#7C3AED] bg-white">
              Regular Mode
            </span>
            <span className="clay-pill text-xs font-bold text-[#0EA5E9] bg-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#DB2777]" /> Continuous ISL AI Engine
            </span>
          </div>
          <h1
            className="clay-font-black text-4xl sm:text-5xl text-[#332F3A] tracking-tight"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Indian Sign Language Translator
          </h1>
          <p className="clay-font-body text-lg text-[#635F69] mt-2 max-w-3xl">
            Real-time continuous ISL-to-text streaming powered by MediaPipe dual-hand 21-landmark tensor vision.
          </p>
        </header>

        {/* Tab Bar */}
        <div
          className="clay-card rounded-full p-2 flex gap-2 mb-10 w-fit"
          role="tablist"
          aria-label="Translator module selection"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-base font-bold transition-all duration-300 ${
                  active
                    ? 'clay-btn text-white py-3'
                    : 'text-[#635F69] hover:text-[#7C3AED] bg-transparent border-0 cursor-pointer'
                }`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <Icon size={18} />
                {tab.label}
                {tab.badge && (
                  <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Panel: Continuous ISL Camera */}
        <div
          id="tabpanel-isl_camera"
          role="tabpanel"
          hidden={activeTab !== 'isl_camera'}
          aria-label="Continuous ISL Translator"
          className="max-w-5xl"
        >
          {activeTab === 'isl_camera' && (
            <div className="clay-card p-8 sm:p-10 space-y-6">
              <div>
                <h2
                  className="clay-font-black text-2xl sm:text-3xl text-[#332F3A] mb-2"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Continuous ISL Real-Time Translation Stream
                </h2>
                <p className="clay-font-body text-base text-[#635F69]">
                  Sign naturally in front of your camera. The engine tracks dual-hand 3D landmarks at 30 FPS, evaluates continuous gestures, and streams translated text live.
                </p>
              </div>
              <div className="rounded-[24px] overflow-hidden">
                <ISLTranslatorCamera />
              </div>
            </div>
          )}
        </div>

        {/* Tab Panel: Text to Sign Guide */}
        <div
          id="tabpanel-text_to_sign"
          role="tabpanel"
          hidden={activeTab !== 'text_to_sign'}
          aria-label="Text to Sign Guide"
          className="max-w-4xl"
        >
          {activeTab === 'text_to_sign' && (
            <div className="clay-card p-8 sm:p-10 space-y-6">
              <div>
                <h2
                  className="clay-font-black text-2xl sm:text-3xl text-[#332F3A] mb-2"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Text to Sign Language Reference
                </h2>
                <p className="clay-font-body text-base text-[#635F69]">
                  Type or speak a phrase to retrieve the corresponding sign language guide and audio pronunciation.
                </p>
              </div>
              <TextToSign />
            </div>
          )}
        </div>

        {/* Technical Architecture Info Box */}
        <div className="mt-12 clay-card p-6 max-w-5xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 text-white shadow-clayOrb">
              <Star size={22} />
            </div>
            <div>
              <p
                className="clay-font-heading text-base font-extrabold text-[#332F3A] mb-1"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Continuous ISL Architecture: Dual-Hand 21-Landmark Tensor Engine
              </p>
              <p className="clay-font-body text-sm text-[#635F69] leading-relaxed">
                Engineered with MediaPipe Tasks Vision running in-browser via WASM/WebGL. Extracts 42 3D spatial points per frame to compute finger flexion vectors and dynamic movement trajectories with 100% on-device privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorMode;
