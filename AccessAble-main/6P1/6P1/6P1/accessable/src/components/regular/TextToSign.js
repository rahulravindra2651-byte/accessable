import React, { useState } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import { getSignFromText } from '../../utils/gestureLibrary';
import { Mic, Volume2, Languages } from 'lucide-react';

const QUICK_PHRASES = ['Hello', 'Thank You', 'Yes', 'No', 'Help', 'Stop', 'Please', 'Sorry'];

const TextToSign = () => {
  const [text, setText]         = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError]       = useState('');
  const { speak, startListening, isSupported } = useSpeech();

  const handleListen = async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported. Please use Chrome or Edge.');
      return;
    }
    setError('');
    setIsListening(true);
    const result = await startListening();
    if (result.success && result.transcript) {
      setText(result.transcript);
    } else {
      setError(result.error || 'Could not capture speech. Please try again.');
    }
    setIsListening(false);
  };

  const signGuide = getSignFromText(text);

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div>
        <label htmlFor="tts-input" className="label">Text to Convert</label>
        <textarea
          id="tts-input"
          value={text}
          onChange={e => setText(e.target.value)}
          className="input-field resize-none"
          rows={3}
          placeholder="Type a word or phrase, or use voice input…"
          aria-label="Text for sign language conversion"
        />
      </div>

      {/* Quick phrase buttons */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-muted)' }}>Quick phrases:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PHRASES.map(p => (
            <button key={p} onClick={() => setText(p)}
                    className="badge badge-primary cursor-pointer hover:opacity-80 transition-opacity text-sm px-3 py-1.5">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Sign guide */}
      {text && (
        <div className="p-4 rounded-xl border-2 anim-scale-in"
             style={{ borderColor: 'var(--c-primary)', background: 'var(--c-primary-light)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1"
             style={{ color: 'var(--c-primary)' }}>Sign Language Guide</p>
          <p className="font-semibold" style={{ color: 'var(--c-text)' }}>
            <Languages size={16} className="inline mr-2" />
            {signGuide}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => speak(text)}
          disabled={!text.trim()}
          className="btn btn-primary flex-1"
          aria-label="Speak text aloud"
        >
          <Volume2 size={17} /> Speak Aloud
        </button>
        <button
          onClick={handleListen}
          disabled={!isSupported || isListening}
          className={`btn flex-1 ${isListening ? 'btn-danger' : 'btn-secondary'}`}
          aria-label={isListening ? 'Listening…' : 'Voice input'}
          aria-pressed={isListening}
        >
          <Mic size={17} className={isListening ? 'animate-pulse' : ''} />
          {isListening ? 'Listening…' : 'Voice Input'}
        </button>
      </div>
    </div>
  );
};

export default TextToSign;
