import React, { useState, useEffect, useContext, useRef } from 'react';

// Constant outside component — prevents array recreation on every render
const FREE_FIELDS = [
  'name', 'email', 'phone', 'age', 'address', 'dateOfBirth', 'gender', 'city', 'state', 'pincode'
];

import { useAssistant } from '../../hooks/useAssistant';
import { useOCR } from '../../hooks/useOCR';
import { extractFormFields } from '../../utils/formProcessor';
import { extractFieldFromSpeech, humaniseField, cleanSpokenValue, detectConfirmationIntent } from '../../utils/nlpExtractor';
import { LANGUAGES, getOCRLang, getOCRLangString, detectLanguageFromText } from '../../utils/languages';
import { AccessibilityContext } from '../../context/AccessibilityContext';
import FormReader from './FormReader';
import {
  Camera, Mic, Loader2, CheckCircle, AlertTriangle,
  FileJson, BookOpen, RotateCcw, MicOff, Volume2
} from 'lucide-react';

const VoiceForm = () => {
  const [language, setLanguage] = useState('en-US');
  const { speak, listen, isMicActive } = useAssistant(language);
  const { scanImage } = useOCR(getOCRLangString(language));
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
  const [activeSingleField, setActiveSingleField] = useState(null);

  // Guard to prevent concurrent conversational loops
  const isRunningRef = useRef(false);
  // Ref to hold current scanned fields so closure state is never stale
  const fieldsRef = useRef([]);

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

  /* ─────────────────────────────────
     SCAN MODE — OCR → Conversational Loop
  ───────────────────────────────── */
  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
    const isImage = file.type && file.type.startsWith('image/');

    if (!isImage && !isPdf) {
      const msg = 'Please select a valid image or PDF file.';
      setError(msg);
      await speak(msg);
      return;
    }

    setStatus('SCANNING');
    setError('');

    console.group('📄 [STAGE 1: Form Upload]');
    console.log('• File Name:', file.name);
    console.log('• File Type:', file.type || (isPdf ? 'application/pdf' : 'unknown'));
    console.log('• File Size:', file.size, 'bytes');
    console.groupEnd();

    await speak('Scanning your form document with optical character recognition. Please wait.');

    try {
      const ocrLangCode = getOCRLangString(language);
      console.group('🔍 [STAGE 2: OCR Extraction]');
      console.log('• Initial Target OCR Lang:', ocrLangCode);
      const rawText = await scanImage(file);
      console.log('• Raw Extracted Text Length:', rawText?.length || 0, 'characters');
      console.log('• Extracted Snippet:', JSON.stringify((rawText || '').slice(0, 150)));
      console.groupEnd();

      if (!rawText?.trim()) {
        const msg = 'No text detected. Please try a clearer image or PDF document.';
        await speak(msg);
        setError(msg);
        setStatus('IDLE');
        return;
      }

      // Stage 3: Automatic Language Detection
      const autoLang = detectLanguageFromText(rawText);
      console.group('🌐 [STAGE 3: Language Detection]');
      console.log('• Detected Language Code:', autoLang);
      console.log('• Active Language State:', language);
      if (autoLang !== language) {
        console.log(`• Language Auto-Switched: ${language} -> ${autoLang}`);
        setLanguage(autoLang);
      }
      console.groupEnd();

      const activeOcrLang = getOCRLangString(autoLang);
      const detected = extractFormFields(rawText, activeOcrLang);

      console.log('📋 [Extracted Form Fields]:', detected);

      if (detected.length === 0) {
        const msg = 'No form fields detected. Make sure the document contains clear form labels.';
        await speak(msg);
        setError(msg);
        setStatus('IDLE');
        return;
      }

      fieldsRef.current = detected;
      setFields(detected);
      setCurrentIdx(0);
      setFormData({});
      setStatus('CONFIRM_PROCEED');
      confirmProceed(detected, 1, autoLang);
    } catch (err) {
      console.error('❌ [OCR Scan Error]:', err);
      const msg = err.message || 'Error scanning form.';
      await speak(msg);
      setError(msg);
      setStatus('IDLE');
    }
  };

  const confirmProceed = async (targetFields = fieldsRef.current, attempt = 1) => {
    if (isRunningRef.current && attempt === 1) return; // Prevent double-invocation
    isRunningRef.current = true;
    const activeList = targetFields && targetFields.length > 0 ? targetFields : fieldsRef.current;

    try {
      if (attempt === 1) {
        await speak(
          `Form scanned successfully. Found ${activeList.length} fields: ${activeList.join(', ')}. Should we continue to fill the form? Say Yes or No.`
        );
      } else {
        await speak(
          `I didn't hear a clear response. Should we fill the form? Say Yes to start or Say No to cancel.`
        );
      }

      // Pause 600ms so TTS speaker audio output stops completely before mic recording begins
      await new Promise((resolve) => setTimeout(resolve, 600));

      const rawResponse = await listen();
      const intent = detectConfirmationIntent(rawResponse);

      console.log(`[VoiceForm confirmProceed] Attempt ${attempt}/3 | Intent: ${intent} | Raw: "${rawResponse}"`);

      if (intent === 'AFFIRMATIVE') {
        console.log('User confirmed. Starting form filling.');
        await speak('Starting voice form assistant.');
        setStatus('FILLING');
        await runConversationalLoop(activeList, 0);
      } else if (intent === 'NEGATIVE') {
        console.log('User cancelled form filling.');
        await speak('Okay. Form filling cancelled.');
        setStatus('IDLE');
      } else {
        // UNRECOGNIZED: Try up to 3 times before staying in CONFIRM_PROCEED mode
        if (attempt < 3) {
          console.log(`Unrecognized response on attempt ${attempt}. Retrying confirmation prompt...`);
          isRunningRef.current = false;
          await confirmProceed(activeList, attempt + 1);
        } else {
          console.warn('Max confirmation attempts reached without a clear answer.');
          await speak('No clear voice response detected. Tap Yes to start filling or No to cancel.');
          setStatus('CONFIRM_PROCEED');
        }
      }
    } finally {
      if (attempt === 1) {
        isRunningRef.current = false;
      }
    }
  };

  const runConversationalLoop = async (targetFields = fieldsRef.current, index = 0) => {
    const activeList = targetFields && targetFields.length > 0 ? targetFields : fieldsRef.current;

    if (index >= activeList.length) {
      setStatus('REVIEW');
      await speak('Form completed successfully! Review your answers below or download JSON.');
      return;
    }

    const label = activeList[index];
    setCurrentIdx(index);

    // 1. Assistant asks for field
    await speak(`Field ${index + 1} of ${activeList.length}: Please say your ${label}.`);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 2. Assistant listens
    const input = await listen();
    if (!input?.trim()) {
      await speak("I didn't catch anything. Let me ask again.");
      return runConversationalLoop(activeList, index);
    }

    // 3. NLP extraction & formatting fallback
    const extracted = extractFieldFromSpeech(input);
    const rawVal = extracted?.value || input.trim();
    const valueToUse = cleanSpokenValue(label, rawVal);

    // 4. Conversational confirmation
    await speak(`You said: ${valueToUse} for ${label}. Is this correct? Say yes or no.`);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const confirmRaw = await listen();
    const confirmIntent = detectConfirmationIntent(confirmRaw);

    if (confirmIntent === 'AFFIRMATIVE') {
      setFormData((prev) => ({ ...prev, [label]: valueToUse }));
      await speak(`${label} entered successfully.`);
      await runConversationalLoop(activeList, index + 1);
    } else if (confirmIntent === 'NEGATIVE') {
      await speak("Okay, let's try entering this field again.");
      await runConversationalLoop(activeList, index);
    } else {
      await speak("I couldn't understand your response. Let's try this field again.");
      await runConversationalLoop(activeList, index);
    }
  };

  /* ─────────────────────────────────
     FREE MODE — Conversational NLP Fill & Single Field Voice Input
  ───────────────────────────────── */
  const handleFreeVoice = async () => {
    if (nlpListening) return;
    setNlpListening(true);
    await speak('Please speak a natural sentence, for example: My name is Rahul, or My age is 22 years old.');
    const transcript = await listen();
    setNlpListening(false);

    if (!transcript?.trim()) {
      await speak("I didn't hear anything. Please try again or tap a field microphone button.");
      return;
    }

    const extracted = extractFieldFromSpeech(transcript);
    if (extracted) {
      // Conversational confirmation for free mode
      await speak(
        `I recognized ${humaniseField(extracted.field)} as ${extracted.value}. Is this correct? Say yes or no.`
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
      const confirmRaw = await listen();
      const confirmIntent = detectConfirmationIntent(confirmRaw);

      if (confirmIntent === 'AFFIRMATIVE') {
        setNlpResult(extracted);
        setNlpFields((prev) => ({ ...prev, [extracted.field]: extracted.value }));
        await speak(`${humaniseField(extracted.field)} updated to ${extracted.value}.`);
      } else {
        await speak('Field update cancelled.');
        setNlpResult(null);
      }
    } else {
      await speak(
        "I couldn't recognize a specific field sentence. You can also tap the mic icon next to any input field to dictate directly."
      );
      setNlpResult(null);
    }
  };

  const handleSingleFieldVoice = async (field) => {
    if (activeSingleField) return;
    setActiveSingleField(field);
    const fieldLabel = humaniseField(field);
    await speak(`Please speak your ${fieldLabel}.`);
    const transcript = await listen();
    setActiveSingleField(null);

    if (!transcript?.trim()) {
      await speak(`Could not hear ${fieldLabel}. Please try again.`);
      return;
    }

    const cleanedValue = cleanSpokenValue(field, transcript);
    setNlpFields((prev) => ({ ...prev, [field]: cleanedValue }));
    setNlpResult({ field, value: cleanedValue });
    await speak(`${fieldLabel} entered as ${cleanedValue}.`);
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
              {FREE_FIELDS.map((f) => {
                const isFieldActive = activeSingleField === f;
                return (
                  <div key={f}>
                    <label htmlFor={`free-${f}`} className="label text-xs font-semibold flex items-center justify-between">
                      <span>{humaniseField(f)}</span>
                      {isFieldActive && (
                        <span className="text-amber-500 font-bold animate-pulse text-[11px] flex items-center gap-1">
                          <Mic size={10} /> Listening…
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`free-${f}`}
                        type="text"
                        value={nlpFields[f] || ''}
                        onChange={(e) => handleFreeManual(f, e.target.value)}
                        onFocus={() => speakGuidance(`${humaniseField(f)} edit box. Value: ${nlpFields[f] || 'Empty'}.`, 'polite')}
                        className="input-field text-sm py-2 flex-1"
                        placeholder={`Say: My ${f} is… or tap mic`}
                      />
                      <button
                        type="button"
                        onClick={() => handleSingleFieldVoice(f)}
                        disabled={!browserSupported || activeSingleField !== null || nlpListening}
                        className={`btn btn-sm ${isFieldActive ? 'btn-danger' : 'btn-secondary'}`}
                        aria-label={`Dictate ${humaniseField(f)} by voice`}
                        title={`Speak into ${humaniseField(f)}`}
                      >
                        <Mic size={16} className={isFieldActive ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                  </div>
                );
              })}
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
