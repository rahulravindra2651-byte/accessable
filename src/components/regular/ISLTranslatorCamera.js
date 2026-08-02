/**
 * ISL Translator Camera — Full ISL Recognition System
 * ──────────────────────────────────────────────────────
 * Three-level ISL recognition pipeline:
 *   Level 1: ISL Alphabets (A–Z)
 *   Level 2: ISL Numbers (0–9)
 *   Level 3: ISL Vocabulary (50+ words)
 *
 * Pipeline: Camera → MediaPipe Hands → Feature Extraction →
 *           ISL Classifier → Character Buffer → Sentence Builder →
 *           Translation → TTS
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';
import {
  Play, Pause, Square, Volume2, Copy, Trash2, CheckCircle,
  Loader2, Sparkles, BookOpen, Languages, Target, Check,
  Zap, ChevronRight, RotateCcw, Type, Hash, MessageSquare,
  Layers, AlignLeft
} from 'lucide-react';

import { LANGUAGES } from '../../utils/languages';
import { classifyFrame, RECOGNITION_MODES }  from '../../isl/recognitionMode';
import { createCharacterBuffer }              from '../../isl/characterBuffer';
import { createSentenceBuilder }              from '../../isl/sentenceBuilder';
import { translateSentence, speakTranslated } from '../../isl/islTranslator';
import {
  ISL_VOCABULARY, ISL_ALPHABETS, ISL_NUMBERS,
  ISL_ALL_SIGNS, ISL_CATEGORIES
} from '../../utils/islDictionary';

// ─── MediaPipe Config ──────────────────────────────────────────────────────────
const WASM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Milliseconds of no new committed token before a spelled word is finalized
const WORD_FINALIZE_TIMEOUT_MS = 2000;

// Mode display config
const MODE_CONFIG = {
  [RECOGNITION_MODES.ALPHABET]: { label: 'Alphabets', icon: Type,  color: '#6366f1', description: 'Spell words letter by letter (A–Z)' },
  [RECOGNITION_MODES.NUMBER]:   { label: 'Numbers',   icon: Hash,  color: '#f59e0b', description: 'Show ISL number gestures (0–9)' },
  [RECOGNITION_MODES.WORD]:     { label: 'Vocabulary',icon: MessageSquare, color: '#10b981', description: 'Show complete ISL word signs' },
  [RECOGNITION_MODES.AUTO]:     { label: 'Auto',      icon: Layers, color: '#8b5cf6', description: 'Auto-detect any ISL sign' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const ISLTranslatorCamera = () => {
  // Refs
  const webcamRef      = useRef(null);
  const canvasRef      = useRef(null);
  const rafRef         = useRef(null);
  const handLandmarker = useRef(null);
  const bufferRef      = useRef(createCharacterBuffer());
  const builderRef     = useRef(createSentenceBuilder());
  const finalizeTimer  = useRef(null);

  // Engine & mode
  const [mode, setMode]           = useState(RECOGNITION_MODES.WORD);
  const [modelState, setModelState] = useState('loading'); // loading | ready | error
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused]   = useState(false);

  // Recognition state
  const [currentDetection, setCurrentDetection] = useState(null); // latest frame result
  const [stabilityPct, setStabilityPct]         = useState(0);   // 0–100%
  const [currentWord, setCurrentWord]           = useState('');   // letters being spelled
  const [sentenceState, setSentenceState]       = useState({ tokens: [], sentence: '', glossString: '' });

  // Translation
  const [outputLang, setOutputLang]           = useState('en-US');
  const [translatedText, setTranslatedText]   = useState('');
  const [isTranslating, setIsTranslating]     = useState(false);
  const [copied, setCopied]                   = useState(false);

  // UI
  const [activeCategory, setActiveCategory]   = useState('ALL');
  const [selectedSign, setSelectedSign]       = useState(null);
  const [practiceSuccess, setPracticeSuccess] = useState(false);

  // ── Load MediaPipe HandLandmarker ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.40,
          minHandPresenceConfidence: 0.40,
          minTrackingConfidence: 0.40,
        });
        if (!cancelled) {
          handLandmarker.current = hl;
          setModelState('ready');
        }
      } catch (err) {
        console.error('[ISL HandLandmarker] load error:', err);
        if (!cancelled) setModelState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Translation Effect ────────────────────────────────────────────────────
  useEffect(() => {
    const sentence = sentenceState.sentence;
    if (!sentence) { setTranslatedText(''); return; }
    if (outputLang === 'en-US') { setTranslatedText(sentence); return; }

    setIsTranslating(true);
    translateSentence(sentence, outputLang)
      .then((t) => setTranslatedText(t))
      .finally(() => setIsTranslating(false));
  }, [sentenceState.sentence, outputLang]);

  // ── Finalize Spelled Word (timeout-based) ─────────────────────────────────
  const scheduleWordFinalize = useCallback(() => {
    if (finalizeTimer.current) clearTimeout(finalizeTimer.current);
    finalizeTimer.current = setTimeout(() => {
      const word = bufferRef.current.finalizeWord();
      if (word && word.length > 0) {
        builderRef.current.addSpelledWord(word);
        setSentenceState(builderRef.current.getState());
        setCurrentWord('');
      }
    }, WORD_FINALIZE_TIMEOUT_MS);
  }, []);

  // ── Main Frame Processing Loop ────────────────────────────────────────────
  const processFrame = useCallback(() => {
    if (isPaused) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const hl  = handLandmarker.current;
    const vid = webcamRef.current?.video;
    const cvs = canvasRef.current;

    if (!hl || !vid || vid.readyState < 4 || !cvs) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    cvs.width  = vid.videoWidth;
    cvs.height = vid.videoHeight;
    const ctx  = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Detect hands
    const nowMs = performance.now();
    const result = hl.detectForVideo(vid, nowMs);

    if (result.landmarks && result.landmarks.length > 0) {
      // Draw skeleton
      const dUtils = new DrawingUtils(ctx);
      result.landmarks.forEach((lm, idx) => {
        dUtils.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, {
          color: idx === 0 ? '#6366f1' : '#f59e0b',
          lineWidth: 2,
        });
        dUtils.drawLandmarks(lm, { color: '#ffffff', lineWidth: 1, radius: 3 });
      });

      // Classify the frame
      const frameResult = classifyFrame(result.landmarks, mode);
      setCurrentDetection(frameResult);

      // Push through buffer
      const committed = bufferRef.current.push(frameResult);
      setStabilityPct(Math.round(bufferRef.current.stability() * 100));

      if (committed) {
        // A new token was committed (stable for STABLE_FRAMES)
        if (frameResult.type === 'word') {
          // Vocabulary word → add directly to sentence
          builderRef.current.addToken({
            type: 'word',
            value: frameResult.wordId,
            label: frameResult.label,
          });
          setSentenceState(builderRef.current.getState());
          setCurrentWord('');
          if (finalizeTimer.current) clearTimeout(finalizeTimer.current);
        } else {
          // Letter or number → accumulate in character buffer
          const w = bufferRef.current.currentWord();
          setCurrentWord(w);
          scheduleWordFinalize();
        }

        // Practice mode check
        if (selectedSign && (committed === selectedSign.id || committed === selectedSign.gloss)) {
          setPracticeSuccess(true);
        }
      }
    } else {
      // No hands detected
      setCurrentDetection(null);
      const prev = bufferRef.current.stability();
      bufferRef.current.push(null);
      if (prev > 0) setStabilityPct(0);
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [isPaused, mode, selectedSign, scheduleWordFinalize]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const startTranslation = () => {
    bufferRef.current.reset();
    setCurrentWord('');
    setIsRunning(true);
    setIsPaused(false);
    rafRef.current = requestAnimationFrame(processFrame);
  };

  const stopTranslation = () => {
    setIsRunning(false);
    setIsPaused(false);
    cancelAnimationFrame(rafRef.current);
    if (finalizeTimer.current) clearTimeout(finalizeTimer.current);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCurrentDetection(null);
    setStabilityPct(0);
    bufferRef.current.resetTracking();
  };

  const togglePause = () => setIsPaused((p) => !p);

  const clearAll = () => {
    bufferRef.current.reset();
    builderRef.current.reset();
    setCurrentWord('');
    setCurrentDetection(null);
    setStabilityPct(0);
    setSentenceState({ tokens: [], sentence: '', glossString: '' });
    setTranslatedText('');
    if (finalizeTimer.current) clearTimeout(finalizeTimer.current);
  };

  const undoLast = () => {
    builderRef.current.undo();
    setSentenceState(builderRef.current.getState());
  };

  const handleCopy = async () => {
    const text = translatedText || sentenceState.sentence;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    const text = translatedText || sentenceState.sentence;
    if (text) speakTranslated(text, outputLang);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    bufferRef.current.resetTracking();
    setCurrentDetection(null);
    setStabilityPct(0);
    setCurrentWord('');
  };

  // Restart rAF loop when processFrame changes
  useEffect(() => {
    if (isRunning && !isPaused) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(processFrame);
    }
  }, [processFrame, isRunning, isPaused]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (finalizeTimer.current) clearTimeout(finalizeTimer.current);
    };
  }, []);

  // ── Vocabulary Explorer Filter ─────────────────────────────────────────────
  const allCats = ['ALL', ...Object.values(ISL_CATEGORIES)];
  const filteredSigns =
    activeCategory === 'ALL'
      ? ISL_ALL_SIGNS
      : ISL_ALL_SIGNS.filter((s) => s.category === activeCategory);

  const displaySentence = sentenceState.sentence;
  const displayTranslated = translatedText;
  const modeConf = MODE_CONFIG[mode];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5" role="region" aria-label="ISL Sign Language Translator">

      {/* ── Mode Selector Bar ── */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇮🇳</span>
          <div>
            <h2 className="font-black text-lg" style={{ color: 'var(--c-text)' }}>
              Indian Sign Language Recognizer
            </h2>
            <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
              ISLRTC Standard · MediaPipe Hands · Real-Time 30 FPS
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {Object.entries(MODE_CONFIG).map(([modeKey, cfg]) => {
            const Icon = cfg.icon;
            const active = mode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => handleModeChange(modeKey)}
                title={cfg.description}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={active ? { background: cfg.color } : {}}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Camera + Live Overlay ── */}
      <div
        className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-2xl"
        style={{ aspectRatio: '16/9', border: `3px solid ${modeConf.color}40` }}
      >
        <Webcam
          ref={webcamRef}
          mirrored={true}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Top Status Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning && !isPaused ? 'bg-emerald-400 animate-pulse' :
                isPaused ? 'bg-amber-400' : 'bg-slate-500'
              }`}
            />
            <span>
              {isRunning && !isPaused ? `🇮🇳 ISL · ${modeConf.label} Mode · LIVE` :
               isPaused ? 'Paused' : 'Ready'}
            </span>
          </div>

          {/* Live Detection Badge */}
          {currentDetection && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold backdrop-blur-md"
              style={{ background: `${modeConf.color}dd` }}
            >
              <span className="text-base">
                {currentDetection.type === 'letter' ? '🔤' :
                 currentDetection.type === 'number' ? '🔢' : '💬'}
              </span>
              <span>{currentDetection.label}</span>
              <span className="opacity-70">
                {(currentDetection.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Stability Progress Bar */}
        {isRunning && currentDetection && stabilityPct > 0 && (
          <div className="absolute top-14 left-3 right-3 pointer-events-none">
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${stabilityPct}%`,
                  background: stabilityPct >= 100 ? '#10b981' : modeConf.color,
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom Subtitle Area */}
        <div
          className="absolute inset-x-3 bottom-3 rounded-2xl p-4 backdrop-blur-md border"
          style={{ background: 'rgba(0,0,0,0.75)', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          {/* Letter Buffer Row (ALPHABET / NUMBER mode) */}
          {(mode === RECOGNITION_MODES.ALPHABET || mode === RECOGNITION_MODES.NUMBER || mode === RECOGNITION_MODES.AUTO) && (
            <div className="flex items-center gap-2 mb-2 flex-wrap min-h-[28px]">
              <span className="text-xs text-white/40 font-medium">
                {mode === RECOGNITION_MODES.NUMBER ? 'Digits:' : 'Letters:'}
              </span>
              {currentWord.split('').map((ch, i) => (
                <span
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white"
                  style={{ background: modeConf.color }}
                >
                  {ch}
                </span>
              ))}
              {currentWord.length === 0 && (
                <span className="text-xs text-white/30 italic">
                  {isRunning ? 'Finger-spell a letter…' : ''}
                </span>
              )}
              {currentWord.length > 0 && (
                <ChevronRight size={14} className="text-white/30" />
              )}
            </div>
          )}

          {/* Sentence Output */}
          <p className="text-xl sm:text-2xl font-black text-white min-h-[36px] leading-snug">
            {displaySentence || (
              <span className="text-white/30 italic text-sm font-normal">
                {isRunning ? `Sign in ISL to build a sentence…` : 'Press Start to begin recognition'}
              </span>
            )}
          </p>

          {/* Gloss token row */}
          {sentenceState.tokens.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
              <span className="text-[11px] text-white/30 self-center">ISL Gloss:</span>
              {sentenceState.tokens.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white/80"
                  style={{ background: `${modeConf.color}40`, border: `1px solid ${modeConf.color}60` }}
                >
                  {t.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {modelState === 'loading' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="text-indigo-400 animate-spin" size={44} />
            <p className="text-white font-bold text-lg">Loading ISL Hand Tracker…</p>
            <p className="text-white/50 text-xs">MediaPipe HandLandmarker · ISLRTC Rules</p>
          </div>
        )}

        {/* Error Overlay */}
        {modelState === 'error' && (
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="font-bold">Failed to load hand tracker</p>
              <p className="text-xs text-white/50 mt-1">Check internet connection and try refreshing</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Control Bar ── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {!isRunning ? (
            <button
              onClick={startTranslation}
              disabled={modelState !== 'ready'}
              className="btn btn-primary btn-lg flex-1 sm:flex-initial"
              id="isl-start-btn"
              aria-label="Start ISL recognition"
            >
              <Play size={18} /> Start Recognition
            </button>
          ) : (
            <>
              <button
                onClick={stopTranslation}
                className="btn btn-danger btn-lg"
                aria-label="Stop recognition"
              >
                <Square size={18} /> Stop
              </button>
              <button
                onClick={togglePause}
                className={`btn btn-lg ${isPaused ? 'btn-accent' : 'btn-secondary'}`}
                aria-label={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </>
          )}

          {sentenceState.tokens.length > 0 && (
            <button
              onClick={undoLast}
              className="btn btn-ghost btn-sm"
              title="Undo last word"
            >
              <RotateCcw size={15} /> Undo
            </button>
          )}
        </div>

        {/* Output actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleSpeak} disabled={!displaySentence} className="btn btn-primary btn-sm">
            <Volume2 size={15} /> Speak
          </button>
          <button onClick={handleCopy} disabled={!displaySentence} className="btn btn-secondary btn-sm">
            {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={clearAll} disabled={!displaySentence && !currentWord} className="btn btn-ghost btn-sm">
            <Trash2 size={15} /> Clear
          </button>
        </div>
      </div>

      {/* ── Translation Panel ── */}
      {displaySentence && (
        <div
          className="card p-5 space-y-4"
          style={{ borderLeft: `4px solid ${modeConf.color}` }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Languages size={18} style={{ color: modeConf.color }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>
                Translation Output
              </h3>
            </div>
            <select
              value={outputLang}
              onChange={(e) => setOutputLang(e.target.value)}
              className="input-field py-1 px-2 text-xs"
              style={{ maxWidth: '180px' }}
              aria-label="Output language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--c-text-muted)' }}>
              🇮🇳 ISL → English:
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--c-text)' }}>
              {displaySentence}
            </p>
          </div>

          {outputLang !== 'en-US' && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--c-text-muted)' }}>
                {LANGUAGES.find((l) => l.code === outputLang)?.flag}{' '}
                {LANGUAGES.find((l) => l.code === outputLang)?.name}:
              </p>
              {isTranslating ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--c-text-muted)' }}>
                  <Loader2 size={14} className="animate-spin" /> Translating…
                </div>
              ) : (
                <p
                  className="font-bold text-lg"
                  style={{ color: modeConf.color }}
                  dir={outputLang === 'ur-IN' ? 'rtl' : 'ltr'}
                >
                  {displayTranslated}
                </p>
              )}
              <button
                onClick={handleSpeak}
                disabled={!displayTranslated}
                className="btn btn-sm mt-2"
                style={{ background: `${modeConf.color}20`, color: modeConf.color, border: `1px solid ${modeConf.color}40` }}
              >
                <Volume2 size={13} /> Speak in {LANGUAGES.find((l) => l.code === outputLang)?.name}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Practice Panel ── */}
      {selectedSign && (
        <div
          className="card p-5 anim-scale-in"
          style={{ border: `2px solid ${modeConf.color}60` }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedSign.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg" style={{ color: 'var(--c-text)' }}>
                    {selectedSign.label}
                  </h4>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                    style={{ background: modeConf.color }}
                  >
                    {selectedSign.category}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                  <strong>How to sign:</strong> {selectedSign.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isRunning) startTranslation();
                  setPracticeSuccess(false);
                }}
                className="btn btn-sm btn-primary"
              >
                <Target size={14} /> Practice Live
              </button>
              <button
                onClick={() => { setSelectedSign(null); setPracticeSuccess(false); }}
                className="btn btn-ghost btn-icon btn-sm"
              >
                ✕
              </button>
            </div>
          </div>
          {practiceSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-xs flex items-center gap-2">
              <Check size={15} className="text-green-600" />
              Sign recognized! Great job with {selectedSign.label}.
            </div>
          )}
        </div>
      )}

      {/* ── ISL Dictionary Explorer ── */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: modeConf.color }} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--c-text)' }}>
              ISL Dictionary ({ISL_ALL_SIGNS.length} Signs)
            </h3>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-bold text-white self-start sm:self-auto"
            style={{ background: modeConf.color }}
          >
            ISLRTC Standard
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {allCats.map((cat) => {
            const count = cat === 'ALL'
              ? ISL_ALL_SIGNS.length
              : ISL_ALL_SIGNS.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn btn-xs whitespace-nowrap ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat === 'ALL' ? `All (${count})` : `${cat.split(' ')[0]} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Sign Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredSigns.map((sign) => {
            const isSelected = selectedSign?.id === sign.id;
            return (
              <button
                key={sign.id}
                onClick={() => {
                  setSelectedSign(sign);
                  setPracticeSuccess(false);
                }}
                className={`p-2.5 rounded-xl flex flex-col items-center text-center gap-1 border transition-all ${
                  isSelected ? 'shadow-md ring-2' : 'hover:shadow-sm'
                }`}
                style={{
                  background: isSelected ? `${modeConf.color}15` : 'var(--c-surface-2)',
                  borderColor: isSelected ? modeConf.color : 'var(--c-border)',
                  ringColor: isSelected ? modeConf.color : 'transparent',
                }}
              >
                <span className="text-2xl">{sign.emoji}</span>
                <p className="font-bold text-[11px] leading-tight" style={{ color: 'var(--c-text)' }}>
                  {sign.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Architecture Info Card ── */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlignLeft size={16} style={{ color: modeConf.color }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>ISL Recognition Pipeline</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]" style={{ color: 'var(--c-text-muted)' }}>
          {[
            '📷 Camera',
            '→',
            '🤚 MediaPipe Hands',
            '→',
            '📐 Feature Extraction',
            '→',
            modeConf.icon === Type ? '🔤 Alphabet Rules' : modeConf.icon === Hash ? '🔢 Number Rules' : '💬 Vocabulary Rules',
            '→',
            '⏱ Character Buffer',
            '→',
            '📝 Sentence Builder',
            '→',
            '🌐 Translation',
            '→',
            '🔊 TTS',
          ].map((step, i) => (
            <span
              key={i}
              className={step === '→' ? 'text-slate-400' : 'px-2 py-0.5 rounded-md font-medium'}
              style={step !== '→' ? { background: `${modeConf.color}15`, color: modeConf.color } : {}}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ISLTranslatorCamera;
