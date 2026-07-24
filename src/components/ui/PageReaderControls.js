import React, { useContext } from 'react';
import { Volume2, VolumeX, Play, Square, Mic, HelpCircle, X } from 'lucide-react';
import { AccessibilityContext } from '../../context/AccessibilityContext';

const PageReaderControls = () => {
  const {
    voiceGuidance,
    toggleVoiceGuidance,
    isReadingPage,
    readPageContent,
    stopReadingPage,
    isListeningNav,
    startVoiceNav,
    stopVoiceNav,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    showCommandsHelp,
    setShowCommandsHelp,
    VOICE_COMMANDS,
  } = useContext(AccessibilityContext);

  return (
    <>
      {/* Integrated Accessibility Bar */}
      <div
        className="p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 border mb-6"
        style={{
          background: 'var(--c-surface)',
          borderColor: 'var(--c-border)',
        }}
        role="region"
        aria-label="Accessibility & Voice Controls"
      >
        {/* Left: Guidance & Reader */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleVoiceGuidance}
            className={`btn btn-sm ${
              voiceGuidance ? 'btn-primary' : 'btn-secondary'
            }`}
            aria-label={
              voiceGuidance
                ? 'Disable Voice Guidance announcements'
                : 'Enable Voice Guidance announcements'
            }
            aria-pressed={voiceGuidance}
          >
            {voiceGuidance ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Voice Prompts {voiceGuidance ? 'ON' : 'OFF'}</span>
          </button>

          {!isReadingPage ? (
            <button
              onClick={readPageContent}
              className="btn btn-secondary btn-sm"
              aria-label="Read current page content aloud"
            >
              <Play size={15} /> Read Page
            </button>
          ) : (
            <button
              onClick={stopReadingPage}
              className="btn btn-danger btn-sm"
              aria-label="Stop reading page content"
            >
              <Square size={15} /> Stop Reading
            </button>
          )}

          <button
            onClick={() =>
              isListeningNav ? stopVoiceNav() : startVoiceNav()
            }
            className={`btn btn-sm ${
              isListeningNav ? 'btn-danger' : 'btn-accent'
            }`}
            aria-label={
              isListeningNav
                ? 'Stop voice navigation listener'
                : 'Start hands-free voice navigation'
            }
            aria-pressed={isListeningNav}
          >
            <Mic size={15} className={isListeningNav ? 'animate-pulse' : ''} />
            <span>Voice Nav {isListeningNav ? 'Active' : 'Start'}</span>
          </button>
        </div>

        {/* Right: Controls & Help */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Speech Speed */}
          <label className="flex items-center gap-1" style={{ color: 'var(--c-text-muted)' }}>
            <span>Speed:</span>
            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="input-field py-1 px-2 text-xs"
              aria-label="Select speech speed"
            >
              <option value="0.75">0.75x</option>
              <option value="0.95">1.0x (Normal)</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </label>

          {/* Speech Pitch */}
          <label className="flex items-center gap-1" style={{ color: 'var(--c-text-muted)' }}>
            <span>Pitch:</span>
            <select
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="input-field py-1 px-2 text-xs"
              aria-label="Select speech pitch"
            >
              <option value="0.8">Low</option>
              <option value="1.0">Normal</option>
              <option value="1.2">High</option>
            </select>
          </label>

          {/* Voice selection */}
          {availableVoices.length > 0 && (
            <label className="hidden sm:flex items-center gap-1" style={{ color: 'var(--c-text-muted)' }}>
              <span>Voice:</span>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const v = availableVoices.find((x) => x.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="input-field py-1 px-2 text-xs max-w-[140px]"
                aria-label="Select synthesis voice"
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name.slice(0, 18)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            onClick={() => setShowCommandsHelp(true)}
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="View voice navigation commands help"
            title="Voice Commands List"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Voice Commands Help Modal */}
      {showCommandsHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cmd-help-title"
        >
          <div
            className="card p-6 max-w-lg w-full space-y-4 anim-scale-in"
            style={{ background: 'var(--c-surface)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--c-border)' }}>
              <div className="flex items-center gap-2">
                <Mic size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 id="cmd-help-title" className="font-bold text-lg" style={{ color: 'var(--c-text)' }}>
                  Voice Navigation Commands
                </h3>
              </div>
              <button
                onClick={() => setShowCommandsHelp(false)}
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Close voice commands modal"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
              When Voice Navigation is active, you can speak any of the following natural commands:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {VOICE_COMMANDS.map((cmd) => (
                <div
                  key={cmd.id}
                  className="p-3 rounded-xl flex flex-col gap-1 border"
                  style={{
                    background: 'var(--c-surface-2)',
                    borderColor: 'var(--c-border)',
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-primary)' }}>
                    {cmd.description}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    Say: "{cmd.patterns[0].source.replace(/\\i|\\b|\/|\^|\$/g, '').replace(/\\s\+/g, ' ')}"
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCommandsHelp(false)}
              className="btn btn-primary w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PageReaderControls;
