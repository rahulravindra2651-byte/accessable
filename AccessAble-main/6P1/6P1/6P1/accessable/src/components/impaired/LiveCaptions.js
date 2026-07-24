import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Copy, Download, Trash2, Globe, CheckCircle, ClipboardList } from 'lucide-react';
import { LANGUAGES, DEFAULT_LANG } from '../../utils/languages';

const LiveCaptions = () => {
  const [language,   setLanguage]   = useState(DEFAULT_LANG);
  const [isListening, setIsListening] = useState(false);
  const [lines,      setLines]      = useState([]); // [{id, time, text, isFinal}]
  const [interim,    setInterim]    = useState('');
  const [copied,     setCopied]     = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef      = useRef(null);
  const lineIdRef      = useRef(0);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterim('');
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SR();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e) => {
      let finalText = '';
      let interimText = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (finalText.trim()) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // Auto-capitalise first letter; add period if not ending with punctuation
        let text = finalText.trim();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        if (!/[.!?]$/.test(text)) text += '.';

        setLines(prev => [...prev, { id: ++lineIdRef.current, time, text, isFinal: true }]);
        setInterim('');
      } else {
        setInterim(interimText);
      }
    };

    recognition.onerror  = (e) => {
      if (e.error !== 'no-speech') console.warn('[LiveCaptions] error:', e.error);
    };
    recognition.onend = () => {
      setInterim('');
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current && isListening) {
        try { recognition.start(); } catch {}
      }
    };

    try { recognition.start(); }
    catch (err) { console.error(err); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Auto-scroll on new lines
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, interim]);

  // Cleanup on unmount
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const toggleListening = () => isListening ? stopListening() : startListening();

  const getFullTranscript = () =>
    lines.map(l => `[${l.time}] ${l.text}`).join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFullTranscript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getFullTranscript()], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `transcript_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card flex flex-col" style={{ minHeight: '520px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-2">
          <ClipboardList size={18} style={{ color: 'var(--c-primary)' }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--c-text)' }}>Live Speech Captions</h2>
          {isListening && (
            <span className="flex items-center gap-1 badge badge-success anim-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopy}     disabled={lines.length === 0}
                  className="btn btn-ghost btn-sm" aria-label="Copy transcript">
            {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15}/>}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button onClick={handleDownload} disabled={lines.length === 0}
                  className="btn btn-ghost btn-sm" aria-label="Download transcript">
            <Download size={15}/><span className="hidden sm:inline">Save</span>
          </button>
          <button onClick={() => setLines([])} disabled={lines.length === 0}
                  className="btn btn-ghost btn-sm" aria-label="Clear transcript">
            <Trash2 size={15}/>
          </button>
        </div>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-2)' }}>
        <Globe size={15} style={{ color: 'var(--c-text-muted)' }} />
        <select
          value={language}
          onChange={e => { stopListening(); setLanguage(e.target.value); }}
          className="input-field py-1.5 text-sm"
          aria-label="Select transcription language"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
      </div>

      {/* Transcript area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ background: 'var(--c-bg)', minHeight: '280px', maxHeight: '380px' }}
        role="log"
        aria-live="polite"
        aria-label="Speech transcript"
      >
        {lines.length === 0 && !interim && (
          <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: 'var(--c-text-subtle)' }}>
            <Mic size={40} className="opacity-30" />
            <p className="text-sm">Press the microphone to start transcribing…</p>
          </div>
        )}
        {lines.map(line => (
          <div key={line.id} className="flex items-start gap-3 anim-slide-up">
            <span className="flex-shrink-0 text-xs font-mono mt-0.5 px-2 py-0.5 rounded"
                  style={{ background: 'var(--c-surface-2)', color: 'var(--c-text-muted)' }}>
              {line.time}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text)' }}>{line.text}</p>
          </div>
        ))}
        {/* Interim (greyed-out) */}
        {interim && (
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 text-xs font-mono mt-0.5 px-2 py-0.5 rounded"
                  style={{ background: 'var(--c-surface-2)', color: 'var(--c-text-subtle)' }}>
              now
            </span>
            <p className="text-sm italic" style={{ color: 'var(--c-text-subtle)' }}>{interim}…</p>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--c-border)' }}>
        <p className="text-xs" style={{ color: 'var(--c-text-subtle)' }}>
          {lines.length} line{lines.length !== 1 ? 's' : ''} captured
        </p>
        <button
          onClick={toggleListening}
          className={`btn btn-lg gap-2 ${isListening ? 'btn-danger' : 'btn-primary'}`}
          aria-label={isListening ? 'Stop transcription' : 'Start transcription'}
          aria-pressed={isListening}
        >
          {isListening ? (
            <><MicOff size={18}/> Stop</>
          ) : (
            <><Mic size={18}/> Start Transcription</>
          )}
        </button>
      </div>
    </div>
  );
};

export default LiveCaptions;
