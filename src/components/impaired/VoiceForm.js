import React, { useState, useEffect, useContext, useRef } from 'react';

// Constant outside component — prevents array recreation on every render
const FREE_FIELDS = [
  'name', 'email', 'phone', 'age', 'address', 'dateOfBirth', 'gender', 'city', 'state', 'pincode'
];

import { useAssistant } from '../../hooks/useAssistant';
import { useOCR } from '../../hooks/useOCR';
import { extractFormFields } from '../../utils/formProcessor';
import { extractFieldFromSpeech, humaniseField } from '../../utils/nlpExtractor';
import { LANGUAGES, getOCRLang } from '../../utils/languages';
import { AccessibilityContext } from '../../context/AccessibilityContext';
import FormReader from './FormReader';
import {
  Camera, Mic, Loader2, CheckCircle, AlertTriangle,
  FileJson, BookOpen, RotateCcw, MicOff, Volume2
} from 'lucide-react';

const VoiceForm = () => {
  const [language, setLanguage] = useState('en-US');
  const { speak, listen, isMicActive } = useAssistant(language);
  const { scanImage } = useOCR(getOCRLang(language));
  const { speakGuidance } = useContext(AccessibilityContext);

  const [mode, setMode] = useState('choose'); // choose | scan | free
  const [status, setStatus] = useState('IDLE'); // IDLE | SCANNING | CONFIRM_PROCEED | FILLING | REVIEW
  const [fields, setFields] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [readerOpen, setReaderOpen] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  // Free mode states
  const [nlpFields, setNlpFields] = useState({});
  const [nlpListening, setNlpListening] = useState(false);
  const [nlpResult, setNlpResult] = useState(null);


  // Guard to prevent concurrent conversational loops
  const isRunningRef = useRef(false);

  /* ── Browser check & spoken guidance on mount ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setBrowserSupported(false);
      speakGuidance('Speech recognition is not supported in this browser.', 'assertive');
    } else {
      speakGuidance('Voice Form Assistant active. Choose Scan a Form or Free Voice Fill.', 'polite');
    }
  }, [speakGuidance]);

  /* ── Auto-trigger confirm on status change ── */
  // Note: we use a ref-based guard and only fire once per CONFIRM_PROCEED transition
  const didTriggerConfirmRef = useRef(false);
  useEffect(() => {
    if (status === 'CONFIRM_PROCEED' && !didTriggerConfirmRef.current) {
      didTriggerConfirmRef.current = true;
      confirmProceed();
    }
    if (status !== 'CONFIRM_PROCEED') {
      didTriggerConfirmRef.current = false;
    }
  }, [status]);

  /* ─────────────────────────────────
     SCAN MODE — OCR → Conversational Loop
  ───────────────────────────────── */
  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      const msg = 'Please select a valid image or PDF file.';
      setError(msg);
      await speak(msg);
      return;
    }

    setStatus('SCANNING');
    setError('');
    await speak('Scanning your form with optical character recognition. Please wait.');

    try {
      const rawText = await scanImage(file);
      if (!rawText?.trim()) {
        const msg = 'No text detected. Please try a clearer image with better contrast.';
        await speak(msg);
        setError(msg);
        setStatus('IDLE');
        return;
      }

      const detected = extractFormFields(rawText, getOCRLang(language));
      if (detected.length === 0) {
        const msg = 'No form fields detected. Make sure the image contains a clear form with field labels.';
        await speak(msg);
        setError(msg);
        setStatus('IDLE');
        return;
      }

      setFields(detected);
      setCurrentIdx(0);
      setFormData({});
      setStatus('CONFIRM_PROCEED');
    } catch (err) {
      const msg = err.message || 'Error scanning form.';
      await speak(msg);
      setError(msg);
      setStatus('IDLE');
    }
  };

  const confirmProceed = async () => {
    if (isRunningRef.current) return; // Prevent double-invocation
    isRunningRef.current = true;
    try {
      await speak(
        `Form scanned successfully. Found ${fields.length} fields: ${fields.join(', ')}. Shall we start filling them? Say yes or no.`
      );
      const response = await listen();
      if (response?.toLowerCase().match(/\b(yes|yeah|sure|ok|proceed|start)\b/)) {
        await speak('Starting voice form assistant.');
        setStatus('FILLING');
        runConversationalLoop(0);
      } else {
        await speak('Okay. Form filling cancelled.');
        setStatus('IDLE');
      }
    } finally {
      isRunningRef.current = false;
    }
  };

  const runConversationalLoop = async (index) => {
    if (index >= fields.length) {
      setStatus('REVIEW');
      await speak('Form completed successfully! Review your answers below or download JSON.');
      return;
    }

    const label = fields[index];
    setCurrentIdx(index);

    // 1. Assistant asks for field
    await speak(`Field ${index + 1} of ${fields.length}: Please say your ${label}.`);

    // 2. Assistant listens
    const input = await listen();
    if (!input?.trim()) {
      await speak("I didn't catch anything. Let's try again.");
      return runConversationalLoop(index);
    }

    // 3. NLP extraction fallback
    const extracted = extractFieldFromSpeech(input);
    const valueToUse = extracted?.value || input.trim();

    // 4. Conversational confirmation
    await speak(`You said: ${valueToUse} for ${label}. Is this correct? Say yes or no.`);
    const confirm = await listen();

    if (confirm?.toLowerCase().match(/\b(yes|yeah|correct|right|ok|sure)\b/)) {
      setFormData((prev) => ({ ...prev, [label]: valueToUse }));
      await speak(`${label} entered successfully.`);
      runConversationalLoop(index + 1);
    } else if (confirm?.toLowerCase().match(/\b(no|not|wrong|incorrect)\b/)) {
      await speak("Okay, let's try entering this field again.");
      runConversationalLoop(index);
    } else {
      await speak("I couldn't understand your response. Let's try this field again.");
      runConversationalLoop(index);
    }
  };

  /* ─────────────────────────────────
     FREE MODE — Conversational NLP Fill
  ───────────────────────────────── */
  const handleFreeVoice = async () => {
    if (nlpListening) return;
    setNlpListening(true);
    await speak('Please speak a natural sentence, for example: My name is Rahul, or My age is 22 years old.');
    const transcript = await listen();
    setNlpListening(false);

    if (!transcript?.trim()) {
      await speak("I didn't hear anything. Please try again.");
      return;
    }

    const extracted = extractFieldFromSpeech(transcript);
    if (extracted) {
      // Conversational confirmation for free mode
      await speak(
        `I recognized ${humaniseField(extracted.field)} as ${extracted.value}. Is this correct? Say yes or no.`
      );
      const confirm = await listen();

      if (confirm?.toLowerCase().match(/\b(yes|yeah|correct|right|ok)\b/)) {
        setNlpResult(extracted);
        setNlpFields((prev) => ({ ...prev, [extracted.field]: extracted.value }));
        await speak(`${humaniseField(extracted.field)} updated to ${extracted.value}.`);
      } else {
        await speak('Field update cancelled.');
        setNlpResult(null);
      }
    } else {
      await speak(
        "I couldn't recognize a specific field. Try saying: My name is Rahul, or My email is rahul at gmail dot com."
      );
      setNlpResult(null);
    }
  };

  const handleFreeManual = (field, value) =>
    setNlpFields((prev) => ({ ...prev, [field]: value }));

  const downloadJSON = () => {
    const data = mode === 'free' ? nlpFields : formData;
    const blob = new Blob(
      [JSON.stringify({ timestamp: new Date().toISOString(), data }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'voice_form_data.json',
    });
    a.click();
    URL.revokeObjectURL(url);
    speak('Form data downloaded as JSON file.', 'assertive');
  };

  const readerFields =
    mode === 'free'
      ? FREE_FIELDS.map((f) => ({
          label: humaniseField(f),
          value: nlpFields[f] || '',
          placeholder: `Say: My ${f} is…`,
          error: '',
        }))
      : fields.map((f) => ({
          label: f,
          value: formData[f] || '',
          placeholder: '',
          error: '',
        }));

  return (
    <div className="card flex flex-col" style={{ minHeight: '500px' }} role="region" aria-label="Conversational Voice Form Assistant">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-2">
          <Mic size={18} style={{ color: 'var(--c-primary)' }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
            Conversational Voice Form Assistant
          </h2>
          {isMicActive && (
            <span className="badge badge-success anim-fade-in flex items-center gap-1" aria-label="Microphone actively listening">
              <MicOff size={11} /> Listening…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field py-1.5 text-xs"
            aria-label="Form assistant speech language"
            style={{ maxWidth: '130px' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setReaderOpen((v) => !v)}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Toggle Form Reader aloud controls"
            title="Read form aloud"
          >
            <BookOpen size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Unsupported Warning */}
        {!browserSupported && (
          <div className="p-4 rounded-xl border border-red-300 bg-red-50 flex items-start gap-3" role="alert">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-red-700 text-sm">Browser Speech Recognition Required</p>
              <p className="text-red-600 text-xs mt-1">Please use Google Chrome, Microsoft Edge, or Apple Safari.</p>
            </div>
          </div>
        )}

        {/* Mode Chooser */}
        {mode === 'choose' && (
          <div className="space-y-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
              Select Form Assistant Mode:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setMode('scan');
                  speakGuidance('Selected Scan a Form mode. Upload a photo or PDF of a printed form.', 'polite');
                }}
                className="card card-hover p-5 text-left space-y-2 hover:border-amber-500 transition-all"
                aria-label="Scan a printed form image or PDF using OCR"
              >
                <Camera size={24} className="text-amber-500" />
                <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
                  Scan Printed Form (OCR)
                </p>
                <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                  Upload a photo of a document. AI extracts form fields and asks you each question aloud.
                </p>
              </button>

              <button
                onClick={() => {
                  setMode('free');
                  speakGuidance('Selected Free Conversational Voice Fill mode. Speak any sentence to auto-fill fields.', 'polite');
                }}
                className="card card-hover p-5 text-left space-y-2 hover:border-amber-500 transition-all"
                aria-label="Free Conversational Voice Fill mode"
              >
                <Mic size={24} className="text-amber-500" />
                <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
                  Free Conversational Voice Fill
                </p>
                <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                  Speak naturally — "My name is Rahul", "I am 22 years old" — and NLP automatically assigns the field.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* SCAN MODE */}
        {mode === 'scan' && (
          <>
            {status === 'IDLE' && (
              <div className="space-y-4">
                <button onClick={() => setMode('choose')} className="btn btn-ghost btn-sm" aria-label="Go back to mode selection">
                  ← Back
                </button>
                <label
                  htmlFor="form-scan-upload"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-amber-500"
                  style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-2)' }}
                  tabIndex="0"
                  role="button"
                  aria-label="Upload form image or PDF document"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      document.getElementById('form-scan-upload').click();
                    }
                  }}
                >
                  <Camera size={36} className="text-amber-500 mb-3" />
                  <p className="font-semibold text-base" style={{ color: 'var(--c-text)' }}>
                    Upload Form Image or PDF
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>
                    JPG, PNG, or PDF format
                  </p>
                </label>
                <input
                  id="form-scan-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleScan}
                  className="sr-only"
                />
                {error && (
                  <div role="alert" aria-live="assertive" className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm font-semibold">{error}</p>
                  </div>
                )}
              </div>
            )}

            {status === 'SCANNING' && (
              <div className="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-live="polite">
                <Loader2 className="text-amber-500 anim-spin" size={40} />
                <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
                  Scanning Form with OCR…
                </p>
                <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                  Extracting form labels and structure
                </p>
              </div>
            )}

            {(status === 'CONFIRM_PROCEED' || status === 'FILLING') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>
                    Conversational Progress: Field {currentIdx + 1} of {fields.length}
                  </p>
                  <span className="badge badge-warning flex items-center gap-1">
                    <Volume2 size={12} /> {isMicActive ? 'Listening…' : 'Assistant Speaking…'}
                  </span>
                </div>
                <div className="conf-bar">
                  <div
                    className="conf-bar-fill"
                    style={{ width: `${Math.round(((currentIdx + 1) / fields.length) * 100)}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {fields.map((f, i) => (
                    <div
                      key={f}
                      className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                        i === currentIdx ? 'ring-2 ring-amber-500 font-bold' : ''
                      }`}
                      style={{
                        background: i === currentIdx ? 'rgb(245 158 11 / .15)' : 'var(--c-surface-2)',
                      }}
                    >
                      <span style={{ color: 'var(--c-text)' }}>{f}</span>
                      {formData[f] ? (
                        <span className="badge badge-success">{formData[f]}</span>
                      ) : i < currentIdx ? (
                        <span className="badge badge-neutral">Skipped</span>
                      ) : i === currentIdx ? (
                        <span className="badge badge-warning">Active Field</span>
                      ) : (
                        <span className="badge badge-neutral">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === 'REVIEW' && (
              <div className="space-y-4" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={22} />
                  <p className="font-bold text-lg">Form Completed Successfully!</p>
                </div>
                {Object.entries(formData).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center p-3 rounded-xl text-sm" style={{ background: 'var(--c-surface-2)' }}>
                    <span className="font-medium" style={{ color: 'var(--c-text-muted)' }}>{k}</span>
                    <span className="font-bold" style={{ color: 'var(--c-text)' }}>{v}</span>
                  </div>
                ))}
                <div className="flex gap-2 flex-wrap pt-2">
                  <button onClick={downloadJSON} className="btn btn-primary btn-sm" aria-label="Download filled form data as JSON">
                    <FileJson size={15} /> Download JSON
                  </button>
                  <button
                    onClick={() => {
                      setStatus('IDLE');
                      setFormData({});
                      setFields([]);
                      setMode('choose');
                      speakGuidance('Form reset. Choose an assistant mode.', 'polite');
                    }}
                    className="btn btn-secondary btn-sm"
                    aria-label="Reset form and start over"
                  >
                    <RotateCcw size={15} /> Fill Another Form
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* FREE CONVERSATIONAL MODE */}
        {mode === 'free' && (
          <div className="space-y-5">
            <button onClick={() => setMode('choose')} className="btn btn-ghost btn-sm" aria-label="Go back to mode selection">
              ← Back
            </button>

            {nlpResult && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 anim-scale-in" role="status" aria-live="polite">
                <CheckCircle className="text-green-600" size={18} />
                <p className="text-sm text-green-800 font-semibold">
                  Recognized: {humaniseField(nlpResult.field)} → {nlpResult.value}
                </p>
              </div>
            )}

            <button
              onClick={handleFreeVoice}
              disabled={nlpListening || !browserSupported}
              className={`btn w-full btn-lg ${nlpListening ? 'btn-danger' : 'btn-accent'}`}
              aria-label={nlpListening ? 'Listening for natural speech input' : 'Tap to speak a sentence'}
              aria-pressed={nlpListening}
            >
              {nlpListening ? (
                <>
                  <MicOff className="animate-pulse" size={20} /> Assistant Listening…
                </>
              ) : (
                <>
                  <Mic size={20} /> Speak Sentence (NLP Auto-Fill)
                </>
              )}
            </button>

            <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
              💡 Say: "My name is Rahul" · "My email is rahul@gmail.com" · "I live in Bengaluru"
            </p>

            {/* Editable Field Inputs */}
            <div className="space-y-3">
              {FREE_FIELDS.map((f) => (
                <div key={f}>
                  <label htmlFor={`free-${f}`} className="label text-xs font-semibold">
                    {humaniseField(f)}
                  </label>
                  <input
                    id={`free-${f}`}
                    type="text"
                    value={nlpFields[f] || ''}
                    onChange={(e) => handleFreeManual(f, e.target.value)}
                    onFocus={() => speakGuidance(`${humaniseField(f)} edit box. Value: ${nlpFields[f] || 'Empty'}.`, 'polite')}
                    className="input-field text-sm py-2"
                    placeholder={`Say: My ${f} is…`}
                  />
                </div>
              ))}
            </div>

            {Object.keys(nlpFields).some((k) => nlpFields[k]) && (
              <div className="flex gap-2 flex-wrap pt-2">
                <button onClick={downloadJSON} className="btn btn-primary btn-sm" aria-label="Download free form data as JSON">
                  <FileJson size={15} /> Download JSON
                </button>
                <button
                  onClick={() => {
                    setNlpFields({});
                    setNlpResult(null);
                    speakGuidance('Form cleared.', 'polite');
                  }}
                  className="btn btn-secondary btn-sm"
                  aria-label="Clear all entered fields"
                >
                  <RotateCcw size={15} /> Clear Fields
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reader Component */}
        {readerOpen && readerFields.length > 0 && (
          <div className="mt-2">
            <FormReader fields={readerFields} onClose={() => setReaderOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceForm;
