import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';

/**
 * FormReader — reads form labels, placeholders, values, and errors aloud.
 *
 * Usage:
 *   <FormReader fields={[
 *     { label: 'Full Name', value: 'Rahul', placeholder: 'Enter name', error: '' },
 *     { label: 'Email',     value: '',      placeholder: 'your@email', error: 'Required' },
 *   ]} />
 *
 * Keyboard shortcuts:
 *   Space → Play / Pause
 *   Escape → Stop
 *   R      → Repeat current field
 */
const FormReader = ({ fields = [], onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | playing | paused | done
  const [progress, setProgress] = useState(0); // 0-100
  const utteranceRef = useRef(null);
  const synthRef     = useRef(window.speechSynthesis);

  const buildText = useCallback((field) => {
    const parts = [];
    parts.push(`Field ${field.label}.`);
    if (field.value)       parts.push(`Current value: ${field.value}.`);
    else if (field.placeholder) parts.push(`Placeholder: ${field.placeholder}.`);
    if (field.error)       parts.push(`Error: ${field.error}.`);
    return parts.join(' ');
  }, []);

  const speakField = useCallback((idx) => {
    if (idx >= fields.length) {
      setStatus('done');
      setCurrentIdx(fields.length - 1);
      return;
    }
    setCurrentIdx(idx);
    setProgress(Math.round(((idx + 1) / fields.length) * 100));

    const text = buildText(fields[idx]);
    const synth = synthRef.current;
    synth.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => speakField(idx + 1);
    utt.onerror = (e) => {
      if (e.error !== 'interrupted') console.warn('[FormReader]', e.error);
    };
    utteranceRef.current = utt;
    synth.speak(utt);
    setStatus('playing');
  }, [fields, buildText]);

  const play = () => {
    if (status === 'paused') {
      synthRef.current.resume();
      setStatus('playing');
    } else {
      speakField(currentIdx === (fields.length - 1) && status === 'done' ? 0 : currentIdx);
    }
  };

  const pause = () => {
    synthRef.current.pause();
    setStatus('paused');
  };

  const stop = () => {
    synthRef.current.cancel();
    setStatus('idle');
  };

  const repeat = () => {
    synthRef.current.cancel();
    speakField(currentIdx);
  };

  const jumpTo = (idx) => {
    synthRef.current.cancel();
    speakField(idx);
  };

  useEffect(() => {
    const synth = synthRef.current;
    const handler = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        status === 'playing' ? pause() : play();
      }
      if (e.code === 'Escape') stop();
      if (e.key.toLowerCase() === 'r') repeat();
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      synth.cancel();
    };
  }, [status, currentIdx, play, pause, stop, repeat]);

  const statusLabel = { idle: 'Ready', playing: 'Reading…', paused: 'Paused', done: 'Complete' }[status];

  return (
    <div className="card p-5 space-y-4" role="region" aria-label="Form Reader">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 size={18} style={{ color: 'var(--c-primary)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>Read Form Aloud</h3>
          <span className={`badge badge-sm ${status === 'playing' ? 'badge-success' : status === 'paused' ? 'badge-warning' : 'badge-neutral'}`}>
            {statusLabel}
          </span>
        </div>
        {onClose && (
          <button onClick={() => { stop(); onClose(); }} className="btn btn-ghost btn-icon btn-sm" aria-label="Close form reader">×</button>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--c-text-muted)' }}>
          <span>Field {Math.min(currentIdx + 1, fields.length)} of {fields.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="conf-bar">
          <div className="conf-bar-fill transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Current field highlight */}
      {fields[currentIdx] && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
          <p className="font-bold">{fields[currentIdx].label}</p>
          {fields[currentIdx].value && <p className="text-xs mt-0.5 opacity-80">Value: {fields[currentIdx].value}</p>}
          {fields[currentIdx].error && <p className="text-xs mt-0.5 text-red-500">Error: {fields[currentIdx].error}</p>}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {status !== 'playing' ? (
          <button onClick={play} className="btn btn-primary btn-sm" aria-label="Play (Space)">
            <Play size={15}/> {status === 'paused' ? 'Resume' : 'Play'}
          </button>
        ) : (
          <button onClick={pause} className="btn btn-secondary btn-sm" aria-label="Pause (Space)">
            <Pause size={15}/> Pause
          </button>
        )}
        <button onClick={stop}   className="btn btn-ghost btn-sm" aria-label="Stop (Escape)">
          <Square size={15}/> Stop
        </button>
        <button onClick={repeat} className="btn btn-ghost btn-sm" aria-label="Repeat (R)">
          <RotateCcw size={15}/> Repeat
        </button>
      </div>

      {/* Field list */}
      {fields.length > 1 && (
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {fields.map((f, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all
                ${i === currentIdx
                  ? 'font-bold'
                  : 'opacity-60 hover:opacity-100'
                }`}
              style={{
                background: i === currentIdx ? 'var(--c-primary-light)' : 'var(--c-surface-2)',
                color: i === currentIdx ? 'var(--c-primary)' : 'var(--c-text)',
              }}
              aria-current={i === currentIdx}
            >
              {i + 1}. {f.label} {f.error ? '⚠️' : f.value ? '✓' : ''}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--c-text-subtle)' }}>
        Shortcuts: <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono">Space</kbd> Play/Pause ·{' '}
        <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono">Esc</kbd> Stop ·{' '}
        <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono">R</kbd> Repeat
      </p>
    </div>
  );
};

export default FormReader;
