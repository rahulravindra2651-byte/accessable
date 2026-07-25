import React, { useState } from 'react';
import { Languages, Star, Video, Sparkles } from 'lucide-react';
import ISLTranslatorCamera from './ISLTranslatorCamera';
import TextToSign from './TextToSign';

const TABS = [
  {
    id: 'isl_camera',
    icon: Video,
    label: 'Continuous ISL Translator',
    badge: 'Real-Time AI',
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
      className="min-h-[calc(100vh-64px)] pb-16"
      style={{ background: 'var(--c-bg)' }}
      id="main-content"
      tabIndex="-1"
    >
      <div className="container-app pt-8">
        {/* Header */}
        <header className="mb-8" role="banner">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">Regular Mode</span>
            <span className="badge badge-info flex items-center gap-1">
              <Sparkles size={12} /> Continuous ISL AI Engine
            </span>
          </div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--c-text)' }}>
            Indian Sign Language (ISL) Translator
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--c-text-muted)' }}>
            Real-time Continuous ISL-to-Text streaming translation powered by MediaPipe Dual-Hand 21-Landmark Tensor Engine
          </p>
        </header>

        {/* Tab Bar */}
        <div
          className="flex gap-1 mb-8 p-1 rounded-xl w-fit"
          style={{ background: 'var(--c-surface-2)', border: '1.5px solid var(--c-border)' }}
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${active ? 'shadow-sm' : 'hover:opacity-80'}`}
                style={
                  active
                    ? { background: 'var(--c-surface)', color: 'var(--c-primary)', boxShadow: 'var(--shadow-sm)' }
                    : { color: 'var(--c-text-muted)', background: 'transparent' }
                }
              >
                <Icon size={15} />
                {tab.label}
                {tab.badge && (
                  <span className="badge badge-primary text-xs">{tab.badge}</span>
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
          className="max-w-4xl"
        >
          {activeTab === 'isl_camera' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--c-text)' }}>
                    Continuous ISL Real-Time Translation Stream
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
                    Sign naturally in front of your camera. The AI tracks dual-hand 3D landmarks at 30 FPS, evaluates continuous gestures, and streams translated text live with optional speech playback.
                  </p>
                </div>
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
          className="max-w-3xl"
        >
          {activeTab === 'text_to_sign' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--c-text)' }}>
                Text to Sign Language Reference
              </h2>
              <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
                Type or speak a phrase to retrieve the corresponding sign language representation and audio guidance.
              </p>
              <TextToSign />
            </div>
          )}
        </div>

        {/* Technical Architecture Info Box */}
        <div className="mt-10 card p-5 max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(79 70 229 / .1)', color: '#4f46e5' }}>
              <Star size={18} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--c-text)' }}>
                Continuous ISL Architecture: Dual-Hand 21-Landmark Tensor Engine
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
                Engineered with MediaPipe Tasks Vision running in-browser via WASM/WebGL. Extracts 42 3D spatial points per frame to compute finger flexion vectors and dynamic movement trajectories. Filtered via 75% confidence thresholding to ignore noise and unrecognised signs.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TranslatorMode;
