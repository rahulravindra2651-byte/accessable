import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';
import { useSpeech } from '../../hooks/useSpeech';
import {
  classifySingleFrameHand,
  formatISLSequenceToSentence,
} from '../../utils/islSequenceTranslator';
import { ISL_VOCABULARY, ISL_CATEGORIES } from '../../utils/islDictionary';
import {
  Play, Pause, Square, Volume2, Copy, Trash2, CheckCircle,
  Loader2, Sparkles, BookOpen, Plus, Target, Check,
  Cpu, Key, RefreshCw, Zap
} from 'lucide-react';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

const DEBOUNCE_FRAMES = 3;

const ISLTranslatorCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const recognizerRef = useRef(null);
  const visionTimerRef = useRef(null);

  const lastTokenRef = useRef('');
  const frameCountRef = useRef(0);

  // Engine selection: 'openai' | 'mediapipe'
  const [engineMode, setEngineMode] = useState('openai');
  const [signSystem, setSignSystem] = useState('ISL'); // ISL | ASL | BSL | AUTO

  const [modelState, setModelState] = useState('loading');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Detection states
  const [currentDetection, setCurrentDetection] = useState(null);
  const [visionAnalysis, setVisionAnalysis] = useState(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [openAiKey, setOpenAiKey] = useState(() => localStorage.getItem('accessableOpenAiKey') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [glossSequence, setGlossSequence] = useState([]);
  const [translatedSentence, setTranslatedSentence] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedExploreSign, setSelectedExploreSign] = useState(null);
  const [practiceSuccess, setPracticeSuccess] = useState(false);

  const { speak } = useSpeech();

  /* ── Save OpenAI API Key ── */
  const handleSaveApiKey = (key) => {
    setOpenAiKey(key);
    localStorage.setItem('accessableOpenAiKey', key);
    setShowKeyModal(false);
    speak('OpenAI API key saved successfully.');
  };

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
          numHands: 2,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });

        if (!cancelled) {
          recognizerRef.current = gr;
          setModelState('ready');
        }
      } catch (err) {
        console.error('[ISL MediaPipe] load error:', err);
        if (!cancelled) setModelState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Universal OpenAI Vision Frame Analysis Handler ── */
  const captureAndAnalyzeVision = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsVisionLoading(true);
    try {
      const res = await fetch('/api/gestures/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc,
          apiKey: openAiKey,
          signSystem: signSystem,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setVisionAnalysis(data);
        setTranslatedSentence(data.translation);
        if (data.sign) {
          setGlossSequence((prev) => [...prev, data.sign]);
        }
      }
    } catch (err) {
      console.warn('[OpenAI Vision] error:', err);
    } finally {
      setIsVisionLoading(false);
    }
  }, [openAiKey, signSystem]);

  /* ── Continuous Translation Loop ── */
  const processFrame = useCallback(() => {
    if (isPaused) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const gr = recognizerRef.current;
    const vid = webcamRef.current?.video;
    const cvs = canvasRef.current;

    if (!gr || !vid || vid.readyState < 4 || !cvs) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    cvs.width = vid.videoWidth;
    cvs.height = vid.videoHeight;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const nowMs = performance.now();
    const result = gr.recognizeForVideo(vid, nowMs);

    if (result.landmarks?.length) {
      const dUtils = new DrawingUtils(ctx);
      result.landmarks.forEach((lm, idx) => {
        const color = idx === 0 ? '#4f46e5' : '#f59e0b';
        dUtils.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS, {
          color: color,
          lineWidth: 3,
        });
        dUtils.drawLandmarks(lm, {
          color: '#ffffff',
          lineWidth: 1,
          radius: 4,
        });
      });

      const frameDetection = classifySingleFrameHand(result.landmarks[0], result.gestures);

      if (frameDetection) {
        setCurrentDetection(frameDetection);
        const detectedId = frameDetection.sign.id;

        if (selectedExploreSign && detectedId === selectedExploreSign.id) {
          setPracticeSuccess(true);
        }

        if (detectedId === lastTokenRef.current) {
          frameCountRef.current += 1;
          if (frameCountRef.current >= DEBOUNCE_FRAMES) {
            setGlossSequence((prev) => {
              if (prev[prev.length - 1] !== detectedId) {
                const updated = [...prev, detectedId];
                const formatted = formatISLSequenceToSentence(updated);
                setTranslatedSentence(formatted);
                return updated;
              } else {
                if (!translatedSentence) {
                  setTranslatedSentence(formatISLSequenceToSentence(prev));
                }
                return prev;
              }
            });
          }
        } else {
          lastTokenRef.current = detectedId;
          frameCountRef.current = 0;
        }
      }
    } else {
      setCurrentDetection(null);
      lastTokenRef.current = '';
      frameCountRef.current = 0;
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [isPaused, selectedExploreSign, translatedSentence]);

  const startTranslation = () => {
    setIsRunning(true);
    setIsPaused(false);
    rafRef.current = requestAnimationFrame(processFrame);

    if (engineMode === 'openai') {
      captureAndAnalyzeVision();
      visionTimerRef.current = setInterval(captureAndAnalyzeVision, 2500);
    }
  };

  const stopTranslation = () => {
    setIsRunning(false);
    setIsPaused(false);
    cancelAnimationFrame(rafRef.current);
    if (visionTimerRef.current) clearInterval(visionTimerRef.current);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCurrentDetection(null);
    lastTokenRef.current = '';
    frameCountRef.current = 0;
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const clearTranslation = () => {
    setGlossSequence([]);
    setTranslatedSentence('');
    setCurrentDetection(null);
    setVisionAnalysis(null);
    lastTokenRef.current = '';
    frameCountRef.current = 0;
  };

  const handleCopy = async () => {
    if (!translatedSentence) return;
    await navigator.clipboard.writeText(translatedSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (translatedSentence) speak(translatedSentence);
  };

  const addSignToSequence = (signItem) => {
    setGlossSequence((prev) => {
      const updated = [...prev, signItem.id];
      const formatted = formatISLSequenceToSentence(updated);
      setTranslatedSentence(formatted);
      return updated;
    });
    speak(`Added ${signItem.label} to sequence.`);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (visionTimerRef.current) clearInterval(visionTimerRef.current);
    };
  }, []);

  const filteredVocabulary =
    activeCategory === 'ALL'
      ? ISL_VOCABULARY
      : ISL_VOCABULARY.filter((v) => v.category === activeCategory);

  return (
    <div className="space-y-6" role="region" aria-label="Continuous Universal Sign Language Translator Engine">
      {/* ── Engine & Language System Switcher Bar ── */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={18} />
          <span className="font-bold text-sm">Target Sign Language:</span>
          <select
            value={signSystem}
            onChange={(e) => {
              setSignSystem(e.target.value);
              speak(`Target sign language set to ${e.target.value}`);
            }}
            className="input-field py-1 px-2 text-xs bg-slate-800 text-white border-slate-700"
            style={{ maxWidth: '180px' }}
          >
            <option value="ISL">🇮🇳 ISL (Indian Sign Language)</option>
            <option value="ASL">🇺🇸 ASL (American Sign Language)</option>
            <option value="BSL">🇬🇧 BSL (British Sign Language)</option>
            <option value="AUTO">🌐 Universal / Auto-Detect Any</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEngineMode('openai');
              speak('Switched to Universal OpenAI GPT-4o Vision Engine.');
            }}
            className={`btn btn-sm ${
              engineMode === 'openai' ? 'btn-primary' : 'btn-ghost text-slate-300'
            }`}
          >
            <Cpu size={15} /> OpenAI Vision (Universal AI)
          </button>

          <button
            onClick={() => {
              setEngineMode('mediapipe');
              speak('Switched to MediaPipe Local Engine.');
            }}
            className={`btn btn-sm ${
              engineMode === 'mediapipe' ? 'btn-primary' : 'btn-ghost text-slate-300'
            }`}
          >
            <Zap size={15} /> MediaPipe (Fast 30 FPS)
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className="btn btn-ghost btn-icon btn-sm text-slate-400 hover:text-white"
            title="Configure OpenAI API Key"
          >
            <Key size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Camera & Live Subtitle Display ── */}
      <div
        className="relative rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-2xl"
        style={{ aspectRatio: '16/9' }}
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
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning && !isPaused
                  ? 'bg-emerald-400 animate-pulse'
                  : isPaused
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            {engineMode === 'openai' ? (
              <span>OpenAI Universal Vision ({signSystem}) {isVisionLoading ? '(Analyzing...)' : '(Active)'}</span>
            ) : (
              <span>MediaPipe 3D Landmark Stream ({signSystem})</span>
            )}
          </div>

          {currentDetection && (
            <div className="px-3 py-1.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold anim-scale-in">
              {currentDetection.sign.emoji} {currentDetection.sign.label} (
              {(currentDetection.confidence * 100).toFixed(0)}%)
            </div>
          )}
        </div>

        {/* Live Subtitle Ticker Overlay */}
        <div className="absolute inset-x-4 bottom-4 glass rounded-2xl p-5 border border-white/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} /> Real-Time Translated Text ({signSystem} — {engineMode === 'openai' ? 'OpenAI GPT-4o' : 'MediaPipe'})
            </span>
            {glossSequence.length > 0 && (
              <span className="text-xs text-white/60">
                {glossSequence.length} sign{glossSequence.length !== 1 ? 's' : ''} detected
              </span>
            )}
          </div>

          <p className="text-2xl sm:text-3xl font-black text-white min-h-[40px] flex items-center leading-snug">
            {translatedSentence || (
              <span className="text-white/40 italic text-base font-normal">
                {isRunning
                  ? `Sign continuously in ${signSystem} in front of the camera to translate…`
                  : 'Press Start Continuous Translation to begin'}
              </span>
            )}
          </p>

          {/* Vision Gesture Explanation */}
          {visionAnalysis?.explanation && (
            <p className="text-xs text-indigo-200 mt-2 font-medium">
              💡 <strong>AI Analysis:</strong> {visionAnalysis.explanation}
            </p>
          )}

          {/* Raw Gloss Tokens Sequence */}
          {glossSequence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
              <span className="text-xs text-white/40 mr-1 self-center">Sequence Tokens:</span>
              {glossSequence.map((g, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-semibold"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {modelState === 'loading' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="text-indigo-400 anim-spin" size={44} />
            <p className="text-white font-bold text-lg">Initializing Universal Vision Engine…</p>
            <p className="text-white/50 text-xs">OpenAI Multimodal GPT-4o Vision Pipeline</p>
          </div>
        )}
      </div>

      {/* ── Control Bar ── */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {!isRunning ? (
            <button
              onClick={startTranslation}
              disabled={modelState !== 'ready'}
              className="btn btn-primary btn-lg flex-1 sm:flex-initial"
              aria-label="Start continuous sign translation"
            >
              <Play size={18} /> Start Continuous Translation
            </button>
          ) : (
            <>
              <button
                onClick={stopTranslation}
                className="btn btn-danger btn-lg"
                aria-label="Stop translation engine"
              >
                <Square size={18} /> Stop Engine
              </button>

              <button
                onClick={captureAndAnalyzeVision}
                disabled={isVisionLoading}
                className="btn btn-accent btn-lg"
                aria-label="Analyze frame now with OpenAI Vision"
              >
                <RefreshCw size={18} className={isVisionLoading ? 'animate-spin' : ''} />
                <span>Analyze Frame Now</span>
              </button>

              <button
                onClick={togglePause}
                className={`btn btn-lg ${isPaused ? 'btn-accent' : 'btn-secondary'}`}
                aria-label={isPaused ? 'Resume translation' : 'Pause translation'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </>
          )}
        </div>

        {/* Result Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSpeak}
            disabled={!translatedSentence}
            className="btn btn-primary btn-sm"
            aria-label="Speak translated sentence aloud"
          >
            <Volume2 size={16} /> Speak Aloud
          </button>
          <button
            onClick={handleCopy}
            disabled={!translatedSentence}
            className="btn btn-secondary btn-sm"
            aria-label="Copy translated text"
          >
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={clearTranslation}
            disabled={glossSequence.length === 0}
            className="btn btn-ghost btn-sm"
            aria-label="Clear translated sequence"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      {/* ── Selected Practice Sign Panel ── */}
      {selectedExploreSign && (
        <div
          className="card p-5 border-2 border-indigo-500/40 bg-indigo-50/20 anim-scale-in"
          style={{ background: 'var(--c-surface)' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedExploreSign.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg" style={{ color: 'var(--c-text)' }}>
                    {selectedExploreSign.label}
                  </h4>
                  <span className="badge badge-primary text-xs">
                    {selectedExploreSign.category}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                  <strong>How to perform:</strong> {selectedExploreSign.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => addSignToSequence(selectedExploreSign)}
                className="btn btn-primary btn-sm flex-1 sm:flex-initial"
              >
                <Plus size={15} /> Add to Translation
              </button>

              <button
                onClick={() => {
                  setPracticeSuccess(false);
                  if (!isRunning) startTranslation();
                  captureAndAnalyzeVision();
                  speak(`Target sign set to ${selectedExploreSign.label}. Perform the sign in front of the camera.`);
                }}
                className="btn btn-accent btn-sm flex-1 sm:flex-initial"
              >
                <Target size={15} /> Practice Live
              </button>

              <button
                onClick={() => {
                  setSelectedExploreSign(null);
                  setPracticeSuccess(false);
                }}
                className="btn btn-ghost btn-sm"
                aria-label="Close practice panel"
              >
                ✕
              </button>
            </div>
          </div>

          {practiceSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-xs flex items-center gap-2 anim-scale-in">
              <Check size={16} className="text-green-600" />
              Sign Recognized! Your camera gesture matches {selectedExploreSign.label}.
            </div>
          )}
        </div>
      )}

      {/* ── Scalable ISL Dictionary Explorer ── */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: 'var(--c-primary)' }} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--c-text)' }}>
              Sign Language Vocabulary Explorer ({ISL_VOCABULARY.length} Signs)
            </h3>
          </div>
          <span className="badge badge-primary">Universal AI Vision Dataset</span>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="ISL Categories">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`btn btn-xs whitespace-nowrap ${
              activeCategory === 'ALL' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            All Categories ({ISL_VOCABULARY.length})
          </button>
          {Object.values(ISL_CATEGORIES).map((cat) => {
            const count = ISL_VOCABULARY.filter((v) => v.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn btn-xs whitespace-nowrap ${
                  activeCategory === cat ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Vocabulary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto pr-1">
          {filteredVocabulary.map((v) => {
            const isSelected = selectedExploreSign?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedExploreSign(v);
                  setPracticeSuccess(false);
                  addSignToSequence(v);
                }}
                className={`p-3 rounded-2xl flex flex-col items-center text-center gap-1 border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500'
                    : 'hover:border-indigo-500/50 hover:bg-slate-50'
                }`}
                style={{
                  background: isSelected ? 'var(--c-primary-light)' : 'var(--c-surface-2)',
                  borderColor: isSelected ? 'var(--c-primary)' : 'var(--c-border)',
                }}
              >
                <span className="text-3xl mb-1">{v.emoji}</span>
                <p className="font-bold text-xs" style={{ color: 'var(--c-text)' }}>
                  {v.label}
                </p>
                <p className="text-[11px] truncate max-w-full" style={{ color: 'var(--c-text-muted)' }}>
                  {v.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── OpenAI API Key Modal ── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in">
          <div className="card p-6 max-w-md w-full space-y-4 anim-scale-in" style={{ background: 'var(--c-surface)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--c-border)' }}>
              <div className="flex items-center gap-2">
                <Key size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 className="font-bold text-lg" style={{ color: 'var(--c-text)' }}>OpenAI API Key Settings</h3>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="btn btn-ghost btn-icon btn-sm">✕</button>
            </div>

            <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
              Optional: Enter your custom OpenAI API key (`sk-...`) to enable direct GPT-4o Vision API translation for any sign language (ISL, ASL, BSL, etc.). Leave empty to use system default.
            </p>

            <input
              type="password"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              className="input-field text-sm"
              placeholder="sk-proj-..."
            />

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowKeyModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={() => handleSaveApiKey(openAiKey)} className="btn btn-primary btn-sm">Save Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISLTranslatorCamera;
