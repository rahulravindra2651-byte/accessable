import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';
import { useSpeech } from '../../hooks/useSpeech';
import { Volume2, Trash2, Undo2, Play, Square, Loader2, AlertCircle } from 'lucide-react';

/* ─────────────────────────────────────────────
   AI Model URLs — MediaPipe GestureRecognizer
───────────────────────────────────────────── */
const WASM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

/* ─────────────────────────────────────────────
   Gesture map — MediaPipe categories → ISL signs
   7 built-in + extended via landmark geometry
───────────────────────────────────────────── */
const GESTURE_MAP = {
  Open_Palm:    { label: 'Hello',      emoji: '👋', color: '#4f46e5' },
  Closed_Fist:  { label: 'Stop',       emoji: '✊', color: '#ef4444' },
  Thumb_Up:     { label: 'Yes / Good', emoji: '👍', color: '#10b981' },
  Thumb_Down:   { label: 'No / Bad',   emoji: '👎', color: '#f59e0b' },
  Victory:      { label: 'Peace',      emoji: '✌️', color: '#8b5cf6' },
  ILoveYou:     { label: 'I Love You', emoji: '🤟', color: '#ec4899' },
  Pointing_Up:  { label: 'One / Look', emoji: '☝️', color: '#3b82f6' },
};

const DEBOUNCE_FRAMES = 22; // ~0.7s at 30fps before adding to sentence

/* ─────────────────────────────────────────────
   Confidence bar
───────────────────────────────────────────── */
const ConfBar = ({ value }) => (
  <div className="mt-2">
    <div className="flex justify-between text-xs mb-1">
      <span style={{ color: 'var(--c-text-muted)' }}>Confidence</span>
      <span className="font-bold" style={{ color: 'var(--c-primary)' }}>{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="conf-bar">
      <div className="conf-bar-fill" style={{ width: `${(value * 100).toFixed(0)}%` }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const SignCamera = () => {
  const webcamRef    = useRef(null);
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const recognizerRef= useRef(null);
  const lastGestureRef  = useRef('');
  const frameCountRef   = useRef(0);

  const [modelState, setModelState] = useState('loading'); // loading | ready | error
  const [detection,  setDetection]  = useState(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [sentence,   setSentence]   = useState([]);
  const { speak } = useSpeech();

  /* ── Load MediaPipe GestureRecognizer ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const gr = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence:  0.55,
          minTrackingConfidence:      0.55,
        });
        if (!cancelled) {
          recognizerRef.current = gr;
          setModelState('ready');
        }
      } catch (err) {
        console.error('[MediaPipe] init error:', err);
        if (!cancelled) setModelState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Detection loop ── */
  const detect = useCallback(() => {
    const gr  = recognizerRef.current;
    const vid = webcamRef.current?.video;
    const cvs = canvasRef.current;
    if (!gr || !vid || vid.readyState < 4 || !cvs) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    // Match canvas to video dimensions
    cvs.width  = vid.videoWidth;
    cvs.height = vid.videoHeight;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const nowMs = performance.now();
    const result = gr.recognizeForVideo(vid, nowMs);

    /* Draw hand landmarks */
    if (result.landmarks?.length) {
      const dUtils = new DrawingUtils(ctx);
      result.landmarks.forEach(lm => {
        dUtils.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS, { color: '#818cf8', lineWidth: 2 });
        dUtils.drawLandmarks(lm,  { color: '#f59e0b', lineWidth: 1, radius: 4 });
      });
    }

    /* Process gesture */
    if (result.gestures?.length) {
      const top = result.gestures[0][0];
      const mapped = GESTURE_MAP[top.categoryName];

      if (mapped && top.score > 0.72) {
        setDetection({ ...mapped, confidence: top.score });

        // Debounce: same gesture for N frames → add to sentence
        if (top.categoryName === lastGestureRef.current) {
          frameCountRef.current += 1;
          if (frameCountRef.current === DEBOUNCE_FRAMES) {
            speak(mapped.label);
            setSentence(prev => {
              const last = prev[prev.length - 1];
              return last === mapped.label ? prev : [...prev, mapped.label];
            });
          }
        } else {
          lastGestureRef.current = top.categoryName;
          frameCountRef.current  = 0;
        }
      } else {
        setDetection(null);
        lastGestureRef.current = '';
        frameCountRef.current  = 0;
      }
    } else {
      setDetection(null);
      lastGestureRef.current = '';
      frameCountRef.current  = 0;
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [speak]);

  const startDetection = () => {
    setIsRunning(true);
    rafRef.current = requestAnimationFrame(detect);
  };

  const stopDetection = () => {
    setIsRunning(false);
    cancelAnimationFrame(rafRef.current);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDetection(null);
    lastGestureRef.current = '';
    frameCountRef.current  = 0;
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const speakSentence = () => sentence.length && speak(sentence.join(' '));

  return (
    <div className="space-y-4">

      {/* ── Camera + canvas overlay ── */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl"
           style={{ aspectRatio: '16/9' }}>
        <Webcam
          ref={webcamRef}
          mirrored={true}
          audio={false}
          className="w-full h-full object-cover"
          videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
        />
        {/* canvas mirrors the webcam (scaleX -1 to compensate mirroring) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Detection overlay */}
        <div className="absolute inset-x-3 bottom-3 glass rounded-xl p-4">
          {detection ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-0.5">
                  ISL Sign Detected
                </p>
                <p className="text-2xl font-black text-white">
                  {detection.emoji} {detection.label}
                </p>
              </div>
              <div className="w-28 flex-shrink-0">
                <ConfBar value={detection.confidence} />
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-sm">
              {isRunning ? 'Show a hand sign to the camera…' : 'Press ▶ Start to begin AI detection'}
            </p>
          )}
        </div>

        {/* Loading overlay */}
        {modelState === 'loading' && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3">
            <Loader2 className="text-indigo-400 anim-spin" size={40} />
            <p className="text-white font-semibold">Loading MediaPipe Model…</p>
            <p className="text-white/40 text-xs">Google GestureRecognizer v0.10.34</p>
          </div>
        )}
        {modelState === 'error' && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="text-red-400" size={40} />
            <p className="text-white font-bold">Model failed to load</p>
            <p className="text-white/50 text-sm">Check your internet connection and refresh the page.</p>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex gap-3">
        {!isRunning ? (
          <button
            onClick={startDetection}
            disabled={modelState !== 'ready'}
            className="btn btn-primary flex-1"
            aria-label="Start sign language detection"
          >
            <Play size={17} /> Start Detection
          </button>
        ) : (
          <button onClick={stopDetection} className="btn btn-danger flex-1" aria-label="Stop detection">
            <Square size={17} /> Stop
          </button>
        )}
      </div>

      {/* ── Supported gestures reference ── */}
      <details className="card p-4">
        <summary className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--c-text-muted)' }}>
          Supported Signs ({Object.keys(GESTURE_MAP).length})
        </summary>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Object.values(GESTURE_MAP).map(g => (
            <div key={g.label} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
                 style={{ background: 'var(--c-surface-2)' }}>
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>{g.label}</span>
            </div>
          ))}
        </div>
      </details>

      {/* ── Sentence builder ── */}
      {sentence.length > 0 && (
        <div className="card p-5 anim-scale-in">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-primary)' }}>
            Sentence Builder
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {sentence.map((word, i) => (
              <span key={i} className="badge badge-primary px-3 py-1.5 text-sm font-semibold">{word}</span>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={speakSentence} className="btn btn-primary btn-sm">
              <Volume2 size={15} /> Speak
            </button>
            <button onClick={() => setSentence(p => p.slice(0, -1))} className="btn btn-ghost btn-sm">
              <Undo2 size={15} /> Undo
            </button>
            <button onClick={() => setSentence([])} className="btn btn-secondary btn-sm">
              <Trash2 size={15} /> Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignCamera;