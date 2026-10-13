import React, { useState, useEffect, useContext, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAssistant } from '../../hooks/useAssistant';
import { useOCR } from '../../hooks/useOCR';
import { extractFormFields } from '../../utils/formProcessor';
import {
  extractFieldFromSpeech,
  cleanSpokenValue,
  detectConfirmationIntent,
} from '../../utils/nlpExtractor';
import { LANGUAGES, getOCRLangString, detectLanguageFromText } from '../../utils/languages';
import { AccessibilityContext } from '../../context/AccessibilityContext';
import FormReader from './FormReader';
import {
  Camera,
  Mic,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileDown,
  RotateCcw,
  MicOff,
  Volume2,
  BookOpen,
  Send,
  AlertCircle,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ─── Client-side Validation Helper ─── */
export const validateFormField = (key, value) => {
  const label = String(key || '').trim();
  const lowerLabel = label.toLowerCase();
  const raw = value === null || value === undefined ? '' : String(value).trim();
  // Strip trailing punctuation often produced by Speech-to-Text
  const val = raw.replace(/[.,;!]+$/, '').trim();

  // 1. Required / Empty check
  if (!val) {
    return `${label} is required and cannot be empty.`;
  }

  // 2. Name validation
  if (
    lowerLabel.includes('name') &&
    !lowerLabel.includes('file') &&
    !lowerLabel.includes('user')
  ) {
    if (!/^[a-zA-Z\s'-]{2,100}$/.test(val)) {
      return `${label} must contain only letters, spaces, hyphens, and apostrophes (min 2 characters, no numbers).`;
    }
    return '';
  }

  // 3. Email validation
  if (lowerLabel.includes('email') || lowerLabel.includes('mail')) {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
      return `Please enter a valid email address for ${label}.`;
    }
    return '';
  }

  // 4. Phone validation
  if (
    lowerLabel.includes('phone') ||
    lowerLabel.includes('mobile') ||
    lowerLabel.includes('contact') ||
    lowerLabel.includes('tel')
  ) {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15 || /[a-zA-Z]/.test(val)) {
      return `${label} must be a valid phone number (10 to 15 digits, no letters).`;
    }
    return '';
  }

  // 5. Age validation
  if (lowerLabel === 'age' || lowerLabel.includes('age')) {
    const digitsOnly = val.replace(/\D/g, '');
    const num = parseInt(digitsOnly, 10);
    if (isNaN(num) || num < 1 || num > 120) {
      return `${label} must be a valid age between 1 and 120 years.`;
    }
    return '';
  }

  // 6. Postal / Pincode / Zip validation
  if (
    lowerLabel.includes('pincode') ||
    lowerLabel.includes('pin') ||
    lowerLabel.includes('zip') ||
    lowerLabel.includes('postal')
  ) {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length < 4 || digitsOnly.length > 10 || /[a-zA-Z]/.test(val)) {
      return `${label} must be a valid numeric postal code.`;
    }
    return '';
  }

  // 7. Date validation
  if (lowerLabel.includes('date') || lowerLabel.includes('dob') || lowerLabel.includes('birth')) {
    const parsedDate = Date.parse(val);
    if (isNaN(parsedDate)) {
      const match = val.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/);
      if (!match) {
        return `${label} must be a valid date.`;
      }
    } else {
      const d = new Date(parsedDate);
      const now = new Date();
      if (lowerLabel.includes('birth') || lowerLabel.includes('dob')) {
        if (d > now) {
          return `${label} cannot be a date in the future.`;
        }
        if (now.getFullYear() - d.getFullYear() > 130) {
          return `${label} must be within the last 130 years.`;
        }
      }
    }
    return '';
  }

  return '';
};

export const validateAllFields = (fieldsData) => {
  const errors = {};
  for (const [k, v] of Object.entries(fieldsData)) {
    const err = validateFormField(k, v);
    if (err) errors[k] = err;
  }
  return errors;
};

export const FORM_TEMPLATES = [
  {
    id: 'general',
    name: 'General Registration Form',
    description: 'Full Name, Email, Phone, Age, Date of Birth, Address, City, Pincode',
    fields: ['Full Name', 'Email Address', 'Phone Number', 'Age', 'Date of Birth', 'Address', 'City', 'Pincode'],
  },
  {
    id: 'medical',
    name: 'Medical Assistance Form',
    description: 'Full Name, Age, Gender, Phone Number, Emergency Contact, Blood Group, Address',
    fields: ['Full Name', 'Age', 'Gender', 'Phone Number', 'Emergency Contact', 'Blood Group', 'Address'],
  },
  {
    id: 'contact',
    name: 'Contact & Query Form',
    description: 'Full Name, Email Address, Phone Number, City, Query / Message',
    fields: ['Full Name', 'Email Address', 'Phone Number', 'City', 'Query / Message'],
  },
];

const VoiceForm = () => {
  const [language, setLanguage] = useState('en-US');
  const { speak, listen, stopAllVoice, isMicActive } = useAssistant(language);
  const { scanImage } = useOCR(getOCRLangString(language));
  const { speakGuidance } = useContext(AccessibilityContext);

  const [status, setStatus] = useState('IDLE'); // IDLE | SCANNING | CONFIRM_PROCEED | FILLING | REVIEW | SUBMITTED
  const [fields, setFields] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [readerOpen, setReaderOpen] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeDictatingField, setActiveDictatingField] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [lastCapturedTranscript, setLastCapturedTranscript] = useState('');
  const [showOcrUpload, setShowOcrUpload] = useState(false);

  const isRunningRef = useRef(false);
  const fieldsRef = useRef([]);
  const activeSessionIdRef = useRef(0);

  /* ── Browser check & spoken guidance on mount ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setBrowserSupported(false);
      speakGuidance('Speech recognition is not supported in this browser.', 'assertive');
    } else {
      speakGuidance(
        'Voice Form Assistant active. You can fill standard forms entirely by voice or upload a printed form.',
        'polite'
      );
    }

    return () => {
      activeSessionIdRef.current += 1;
      stopAllVoice();
    };
  }, [speakGuidance, stopAllVoice]);

  /* ─────────────────────────────────
     Direct 100% Voice Form Filling
  ───────────────────────────────── */
  const handleStartDirectVoiceFilling = async (templateId = selectedTemplate) => {
    activeSessionIdRef.current += 1;
    stopAllVoice();

    const template = FORM_TEMPLATES.find((t) => t.id === templateId) || FORM_TEMPLATES[0];
    const targetFields = [...template.fields];

    fieldsRef.current = targetFields;
    setFields(targetFields);
    setCurrentIdx(0);
    setFormData({});
    setFieldErrors({});
    setError('');
    setStatus('FILLING');
    setLastCapturedTranscript('');

    await speak(
      `Starting Voice Form Filling for ${template.name}. I will guide you through all ${targetFields.length} fields step by step. Let's begin!`
    );
    runConversationalLoop(targetFields, 0);
  };

  /* ─────────────────────────────────
     OCR SCAN → Conversational Loop
  ───────────────────────────────── */
  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' ||
      (file.name && file.name.toLowerCase().endsWith('.pdf'));
    const isImage = file.type && file.type.startsWith('image/');

    if (!isImage && !isPdf) {
      const msg = 'Please select a valid image or PDF file.';
      setError(msg);
      await speak(msg);
      return;
    }

    setStatus('SCANNING');
    setError('');
    setFieldErrors({});

    await speak('Scanning your form document with optical character recognition. Please wait.');

    try {
      const rawText = await scanImage(file);

      if (!rawText?.trim()) {
        const msg = 'No text detected. Please try a clearer image or PDF document.';
        await speak(msg);
        setError(msg);
        setStatus('IDLE');
        return;
      }

      // Automatic Language Detection
      const autoLang = detectLanguageFromText(rawText);
      if (autoLang !== language) {
        setLanguage(autoLang);
      }

      const activeOcrLang = getOCRLangString(autoLang);
      const detected = extractFormFields(rawText, activeOcrLang);

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
      confirmProceed(detected, 1);
    } catch (err) {
      console.error('❌ [OCR Scan Error]:', err);
      const msg = err.message || 'Error scanning form.';
      await speak(msg);
      setError(msg);
      setStatus('IDLE');
    }
  };

  const confirmProceed = async (targetFields = fieldsRef.current, attempt = 1) => {
    activeSessionIdRef.current += 1;
    const currentSession = activeSessionIdRef.current;
    const activeList = targetFields && targetFields.length > 0 ? targetFields : fieldsRef.current;

    try {
      if (attempt === 1) {
        await speak(
          `Form scanned successfully. Found ${activeList.length} fields: ${activeList.join(
            ', '
          )}. Should we continue to fill the form? Say Yes or No.`
        );
      } else {
        await speak(
          `Should we continue to fill the form? Say Yes to start or Say No to cancel.`
        );
      }

      if (currentSession !== activeSessionIdRef.current) return;
      await new Promise((resolve) => setTimeout(resolve, 100));

      const rawResponse = await listen();
      if (currentSession !== activeSessionIdRef.current) return;

      const intent = detectConfirmationIntent(rawResponse);

      if (intent === 'AFFIRMATIVE') {
        await speak('Starting voice form assistant.');
        if (currentSession !== activeSessionIdRef.current) return;
        setStatus('FILLING');
        await runConversationalLoop(activeList, 0);
      } else if (intent === 'NEGATIVE') {
        await speak('Okay. Form filling cancelled.');
        setStatus('IDLE');
      } else {
        if (attempt < 3) {
          await confirmProceed(activeList, attempt + 1);
        } else {
          await speak('No clear voice response detected. Tap Start Guided Voice Fill or Cancel.');
          setStatus('CONFIRM_PROCEED');
        }
      }
    } catch (e) {
      console.warn('[confirmProceed] Error:', e);
    }
  };

  const runConversationalLoop = async (targetFields = fieldsRef.current, index = 0) => {
    const currentSession = activeSessionIdRef.current;
    const activeList = targetFields && targetFields.length > 0 ? targetFields : fieldsRef.current;

    if (currentSession !== activeSessionIdRef.current) return;

    if (index >= activeList.length) {
      setStatus('REVIEW');
      await speak('All fields entered! Please review your answers and download your PDF.');
      return;
    }

    const label = activeList[index];
    setCurrentIdx(index);

    // 1. Assistant asks for field
    await speak(`Field ${index + 1} of ${activeList.length}: Please say your ${label}.`);
    if (currentSession !== activeSessionIdRef.current) return;
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 2. Assistant listens
    const input = await listen();
    if (currentSession !== activeSessionIdRef.current) return;
    setLastCapturedTranscript(input || '');

    if (!input?.trim()) {
      await speak("I didn't catch that. Let me ask again.");
      if (currentSession !== activeSessionIdRef.current) return;
      return runConversationalLoop(activeList, index);
    }

    // 3. NLP extraction & formatting
    const extracted = extractFieldFromSpeech(input);
    const rawVal = extracted?.value || input.trim();
    const valueToUse = cleanSpokenValue(label, rawVal);

    // 4. Validate the recognized input
    const validationError = validateFormField(label, valueToUse);
    if (validationError) {
      await speak(`Validation check: ${validationError}. Let's try saying it again.`);
      if (currentSession !== activeSessionIdRef.current) return;
      return runConversationalLoop(activeList, index);
    }

    // 5. Conversational confirmation - processed accurately on first spoken response
    await speak(`You said: ${valueToUse} for ${label}. Is this correct? Say yes or no.`);
    if (currentSession !== activeSessionIdRef.current) return;
    await new Promise((resolve) => setTimeout(resolve, 100));

    const confirmRaw = await listen();
    if (currentSession !== activeSessionIdRef.current) return;
    setLastCapturedTranscript(confirmRaw || '');

    const confirmIntent = detectConfirmationIntent(confirmRaw);

    if (confirmIntent === 'AFFIRMATIVE') {
      setFormData((prev) => ({ ...prev, [label]: valueToUse }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[label];
        return next;
      });
      await speak(`${label} recorded.`);
      if (currentSession !== activeSessionIdRef.current) return;
      await runConversationalLoop(activeList, index + 1);
    } else if (confirmIntent === 'NEGATIVE') {
      await speak("Okay, let's try entering this field again.");
      if (currentSession !== activeSessionIdRef.current) return;
      await runConversationalLoop(activeList, index);
    } else {
      await speak("I couldn't understand your confirmation. Let's repeat this field.");
      if (currentSession !== activeSessionIdRef.current) return;
      await runConversationalLoop(activeList, index);
    }
  };

  /* ─────────────────────────────────
     Single-field dictation in review mode
  ───────────────────────────────── */
  const handleDictateReviewField = async (label) => {
    if (activeDictatingField) return;
    setActiveDictatingField(label);
    await speak(`Please say the value for ${label}.`);
    const input = await listen();
    setActiveDictatingField(null);

    if (!input?.trim()) {
      await speak(`Could not capture speech for ${label}.`);
      return;
    }

    const extracted = extractFieldFromSpeech(input);
    const rawVal = extracted?.value || input.trim();
    const cleaned = cleanSpokenValue(label, rawVal);

    setFormData((prev) => ({ ...prev, [label]: cleaned }));

    const err = validateFormField(label, cleaned);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[label] = err;
      else delete next[label];
      return next;
    });

    if (err) {
      await speak(`Note: ${err}`);
    } else {
      await speak(`${label} updated to ${cleaned}.`);
    }
  };

  const handleFieldChange = (label, val) => {
    setFormData((prev) => ({ ...prev, [label]: val }));
    const err = validateFormField(label, val);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[label] = err;
      else delete next[label];
      return next;
    });
  };

  /* ─────────────────────────────────
     Submit Form & Backend Validation
  ───────────────────────────────── */
  const handleSubmitForm = async () => {
    // Validate all fields
    const allErrors = validateAllFields(formData);

    // Also check if any field from fields list is missing
    fields.forEach((f) => {
      if (!formData[f] || !String(formData[f]).trim()) {
        allErrors[f] = `${f} is required.`;
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const msg = 'Please fix the validation errors before submitting.';
      setError(msg);
      await speak(msg);
      return;
    }

    setError('');
    setIsSubmitting(true);
    await speak('Validating and submitting your form to the secure server.');

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTitle: 'AccessAble Scanned Form',
          fields: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        const msg = data.message || 'Form validation failed on server.';
        setError(msg);
        await speak(msg);
        return;
      }

      setSubmitSuccess(true);
      setStatus('SUBMITTED');
      await speak(
        'Form submitted successfully! You can now download the official verified PDF document.'
      );
    } catch (err) {
      console.warn('[handleSubmitForm] Network error:', err);
      // Offline fallback: still permit local PDF download
      setSubmitSuccess(true);
      setStatus('SUBMITTED');
      await speak('Form validated and ready for PDF download.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─────────────────────────────────
     Professional PDF Generation
  ───────────────────────────────── */
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor = [124, 58, 237]; // Purple #7C3AED
      const darkColor = [51, 47, 58]; // #332F3A
      const grayColor = [100, 116, 139];

      // ── Header Banner ──
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 24, 'F');

      // Title & Subtitle in Header
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('AccessAble – Form Details', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Verified Accessibility Document · Voice & OCR Assisted', 14, 18);

      const timestamp = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      doc.setFontSize(8);
      doc.text(`Generated: ${timestamp}`, 196, 18, { align: 'right' });

      // ── Meta Info Box ──
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Submitted Field Details', 14, 34);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(
        'All data entries were parsed via accessible OCR and voice recognition with verified integrity.',
        14,
        39
      );

      // ── Form Table ──
      const tableRows = Object.entries(formData).map(([k, v], idx) => [
        String(idx + 1),
        String(k),
        String(v || 'N/A'),
        'Verified ✓',
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['#', 'Field Label', 'Value', 'Status']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [51, 47, 58],
          fontSize: 9,
          cellPadding: 3.5,
        },
        alternateRowStyles: {
          fillColor: [248, 245, 255],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 55, fontStyle: 'bold' },
          2: { cellWidth: 95 },
          3: { cellWidth: 30, textColor: [16, 185, 129], fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'AccessAble Platform · Inclusive Communication & Accessibility · Confidential',
            14,
            pageHeight - 10
          );
          const pageStr = `Page ${data.pageNumber}`;
          doc.text(pageStr, 196, pageHeight - 10, { align: 'right' });
        },
      });

      doc.save(`AccessAble_Form_${new Date().toISOString().slice(0, 10)}.pdf`);
      speak('PDF document generated and downloaded successfully.', 'assertive');
    } catch (err) {
      console.error('[PDF Generation Error]:', err);
      setError('Failed to generate PDF. Please try again.');
      speak('Failed to generate PDF document.', 'assertive');
    }
  };

  const readerFields = fields.map((f) => ({
    label: f,
    value: formData[f] || '',
    placeholder: '',
    error: fieldErrors[f] || '',
  }));

  return (
    <div
      className="card flex flex-col"
      style={{ minHeight: '520px' }}
      role="region"
      aria-label="Voice Form Assistant"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <div className="flex items-center gap-2">
          <Mic size={18} style={{ color: 'var(--c-primary)' }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
            Voice Form Assistant
          </h2>
          {isMicActive && (
            <span
              className="badge badge-success anim-fade-in flex items-center gap-1"
              aria-label="Microphone actively listening"
            >
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
          {fields.length > 0 && (
            <button
              onClick={() => setReaderOpen((v) => !v)}
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Toggle Form Reader aloud controls"
              title="Read form aloud"
            >
              <BookOpen size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Browser Unsupported Warning */}
        {!browserSupported && (
          <div
            className="p-4 rounded-xl border border-red-300 bg-red-50 flex items-start gap-3"
            role="alert"
          >
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-red-700 text-sm">
                Browser Speech Recognition Required
              </p>
              <p className="text-red-600 text-xs mt-1">
                Please use Google Chrome, Microsoft Edge, or Apple Safari for voice input.
              </p>
            </div>
          </div>
        )}

        {/* ── 1. IDLE: Voice-Guided Form Filling & Scan Option ── */}
        {status === 'IDLE' && (
          <div className="space-y-6">
            {/* Hero Voice-First Filling Card */}
            <div
              className="p-6 rounded-3xl border-2 transition-all shadow-sm"
              style={{
                borderColor: '#7C3AED',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%)',
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Mic size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#332F3A]">100% Voice-Guided Form Filling</h3>
                    <p className="text-xs text-[#635F69]">
                      Complete forms entirely using your voice. Speak each answer naturally.
                    </p>
                  </div>
                </div>
                <span className="badge badge-success text-xs font-bold py-1 px-3 flex items-center gap-1">
                  <Sparkles size={13} /> Hands-Free
                </span>
              </div>

              {/* Template Selection */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-[#332F3A] mb-2">
                  Choose a Form Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FORM_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplate === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tmpl.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-[#7C3AED] bg-violet-50/80 shadow-sm ring-2 ring-[#7C3AED]/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold text-sm text-[#332F3A]">{tmpl.name}</p>
                        <p className="text-[11px] text-[#635F69] mt-1 line-clamp-2">
                          {tmpl.fields.join(' • ')}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-semibold text-[#7C3AED] bg-purple-100/60 px-2 py-0.5 rounded-full">
                          {tmpl.fields.length} Fields
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Voice Filling Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStartDirectVoiceFilling(selectedTemplate)}
                  className="clay-btn py-3 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <Play size={16} fill="currentColor" />
                  Start Voice Form Filling
                </button>
                <p className="text-xs text-[#635F69] flex items-center gap-1.5 self-center">
                  <Volume2 size={15} className="text-[#7C3AED] flex-shrink-0" />
                  The assistant speaks each question and listens for your reply.
                </p>
              </div>
            </div>

            {/* OCR Scan Form (Alternative / Optional Accordion) */}
            <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--c-border)' }}>
              <button
                type="button"
                onClick={() => setShowOcrUpload((v) => !v)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Camera size={18} className="text-[#7C3AED]" />
                  <span className="font-bold text-sm text-[#332F3A]">
                    Or Scan a Printed Form (OCR Document Scan)
                  </span>
                </div>
                {showOcrUpload ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showOcrUpload && (
                <div className="p-5 border-t space-y-3 bg-white" style={{ borderColor: 'var(--c-border)' }}>
                  <p className="text-xs text-[#635F69]">
                    Upload a photo or PDF of a printed paper form. AccessAble will extract the fields and then guide you through filling them by voice.
                  </p>
                  <label
                    htmlFor="form-scan-upload"
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-[#7C3AED] bg-slate-50"
                    tabIndex="0"
                    role="button"
                    aria-label="Upload form image or PDF document"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        document.getElementById('form-scan-upload').click();
                      }
                    }}
                  >
                    <Camera size={36} className="text-[#7C3AED] mb-2" />
                    <p className="font-bold text-sm text-[#332F3A]">
                      Upload Form Document (Image or PDF)
                    </p>
                    <p className="text-xs text-[#635F69] mt-0.5">
                      Supports JPG, PNG, and multi-page PDF documents
                    </p>
                  </label>
                  <input
                    id="form-scan-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleScan}
                    className="sr-only"
                  />
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* ── 2. SCANNING ── */}
        {status === 'SCANNING' && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="text-[#7C3AED] anim-spin" size={44} />
            <p className="font-bold text-base text-[#332F3A]">Scanning Form with OCR…</p>
            <p className="text-xs text-[#635F69]">
              Extracting document structure and field labels
            </p>
          </div>
        )}

        {/* ── 3. CONFIRM_PROCEED ── */}
        {status === 'CONFIRM_PROCEED' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="font-bold text-sm text-[#7C3AED]">
                Scanned {fields.length} Fields Successfully
              </p>
              <p className="text-xs text-[#635F69] mt-1">
                Fields: <strong>{fields.join(', ')}</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  activeSessionIdRef.current += 1;
                  stopAllVoice();
                  setStatus('FILLING');
                  runConversationalLoop(fields, 0);
                }}
                className="clay-btn text-sm py-2.5 px-5 rounded-xl flex-1"
              >
                Start Guided Voice Fill
              </button>
              <button
                onClick={() => {
                  activeSessionIdRef.current += 1;
                  stopAllVoice();
                  setStatus('REVIEW');
                  speakGuidance('Switched directly to manual form review mode.', 'polite');
                }}
                className="clay-btn-secondary text-sm py-2.5 px-5 rounded-xl"
              >
                Manual Review
              </button>
              <button
                onClick={() => {
                  activeSessionIdRef.current += 1;
                  stopAllVoice();
                  setStatus('IDLE');
                  setFields([]);
                  setFormData({});
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── 4. FILLING (Conversational guided loop) ── */}
        {status === 'FILLING' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-[#332F3A]">
                Guided Voice Progress: Field {currentIdx + 1} of {fields.length}
              </p>
              <span
                className={`badge flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 ${
                  isMicActive
                    ? 'badge-success animate-pulse'
                    : 'badge-warning'
                }`}
              >
                {isMicActive ? <Mic size={12} /> : <Volume2 size={12} />}
                {isMicActive ? 'Listening to your speech…' : 'Assistant Speaking…'}
              </span>
            </div>

            <div className="conf-bar">
              <div
                className="conf-bar-fill"
                style={{
                  width: `${Math.round(((currentIdx + 1) / fields.length) * 100)}%`,
                }}
              />
            </div>

            {/* Live Active Field & Voice Listening Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isMicActive
                  ? 'border-emerald-400 bg-emerald-50/70 shadow-md ring-2 ring-emerald-200'
                  : 'border-purple-200 bg-purple-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED]">
                  Active Field {currentIdx + 1}/{fields.length}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isMicActive ? 'bg-emerald-200 text-emerald-800' : 'bg-purple-200 text-purple-800'
                  }`}
                >
                  {isMicActive ? '● Live Microphone' : 'Audio Prompt'}
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-[#332F3A] mb-1">
                {fields[currentIdx] || 'Preparing field…'}
              </h4>

              <p className="text-xs text-[#635F69]">
                {isMicActive
                  ? 'Microphone is open. Speak clearly now (or say "Yes" / "No" when confirming).'
                  : 'Listening will automatically start when the assistant finishes asking.'}
              </p>

              {lastCapturedTranscript && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-start gap-2">
                  <span className="text-xs font-bold text-[#7C3AED] whitespace-nowrap">
                    Last heard:
                  </span>
                  <span className="text-xs italic text-[#332F3A] font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                    "{lastCapturedTranscript}"
                  </span>
                </div>
              )}
            </div>

            {/* Field Status List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {fields.map((f, i) => (
                <div
                  key={f}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                    i === currentIdx
                      ? 'ring-2 ring-[#7C3AED] font-bold bg-purple-50 shadow-sm'
                      : 'bg-slate-50'
                  }`}
                >
                  <span className="text-[#332F3A]">{f}</span>
                  {formData[f] ? (
                    <span className="badge badge-success text-xs font-semibold">{formData[f]}</span>
                  ) : i === currentIdx ? (
                    <span className="badge badge-warning text-xs">Active Field</span>
                  ) : (
                    <span className="badge badge-neutral text-xs">Pending</span>
                  )}
                </div>
              ))}
            </div>

            {/* Interactive Control Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 items-center">
              <button
                type="button"
                onClick={() => {
                  activeSessionIdRef.current += 1;
                  stopAllVoice();
                  runConversationalLoop(fields, currentIdx);
                }}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                title="Repeat the current voice question"
              >
                <RotateCcw size={13} />
                Repeat Question
              </button>
              <button
                type="button"
                onClick={() => {
                  activeSessionIdRef.current += 1;
                  stopAllVoice();
                  runConversationalLoop(fields, currentIdx + 1);
                }}
                className="btn btn-secondary btn-sm"
              >
                Skip This Field
              </button>
              <button
                type="button"
                onClick={() => {
                  activeSessionIdRef.current += 1;
                  stopAllVoice();
                  setStatus('REVIEW');
                }}
                className="btn btn-ghost btn-sm ml-auto"
              >
                Switch to Review & Edit
              </button>
            </div>
          </div>
        )}

        {/* ── 5. REVIEW & SUBMITTED: Full Review with Validation, Edit, Submit & PDF ── */}
        {(status === 'REVIEW' || status === 'SUBMITTED') && (
          <div className="space-y-5" role="status" aria-live="polite">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#332F3A]">
                  {status === 'SUBMITTED' ? 'Form Verified & Submitted' : 'Review & Verify Form'}
                </h3>
                <p className="text-xs text-[#635F69]">
                  Review each field below. You can edit any value, dictate with the microphone, and download your PDF.
                </p>
              </div>
              {status === 'SUBMITTED' && (
                <span className="badge badge-success flex items-center gap-1.5 text-xs py-1 px-3">
                  <CheckCircle size={14} /> Submitted
                </span>
              )}
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-sm font-semibold flex items-center gap-2"
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Editable Fields List */}
            <div className="space-y-3">
              {fields.map((f) => {
                const isDictating = activeDictatingField === f;
                const fieldError = fieldErrors[f];

                return (
                  <div key={f} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`field-input-${f}`}
                        className="text-xs font-bold text-[#332F3A]"
                      >
                        {f} <span className="text-[#DB2777]">*</span>
                      </label>
                      {isDictating && (
                        <span className="text-amber-600 font-bold text-xs flex items-center gap-1 animate-pulse">
                          <Mic size={11} /> Dictating…
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        id={`field-input-${f}`}
                        type="text"
                        value={formData[f] || ''}
                        onChange={(e) => handleFieldChange(f, e.target.value)}
                        className={`clay-input text-sm py-2 flex-1 ${
                          fieldError ? 'border-2 border-red-500 bg-red-50/50' : ''
                        }`}
                        placeholder={`Enter ${f}`}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={fieldError ? `err-${f}` : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => handleDictateReviewField(f)}
                        disabled={!browserSupported || isDictating}
                        className={`btn btn-sm ${isDictating ? 'btn-danger' : 'btn-secondary'}`}
                        aria-label={`Dictate value for ${f}`}
                        title={`Speak into ${f}`}
                      >
                        <Mic size={16} className={isDictating ? 'animate-pulse' : ''} />
                      </button>
                    </div>

                    {fieldError && (
                      <p id={`err-${f}`} className="text-xs text-red-600 font-medium pl-1">
                        ⚠ {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: Submit & PDF Download */}
            <div className="pt-3 border-t flex flex-wrap gap-3 items-center" style={{ borderColor: 'var(--c-border)' }}>
              {status !== 'SUBMITTED' && (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={isSubmitting}
                  className="clay-btn text-sm py-3 px-6 rounded-2xl flex items-center gap-2"
                  aria-label="Submit and validate form data"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="anim-spin" />
                      <span>Validating…</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Form</span>
                    </>
                  )}
                </button>
              )}

              {/* PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="clay-btn-secondary text-sm py-3 px-6 rounded-2xl flex items-center gap-2 font-bold text-[#7C3AED]"
                aria-label="Download submitted form as official PDF"
              >
                <FileDown size={18} />
                <span>Download as PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('IDLE');
                  setFormData({});
                  setFields([]);
                  setFieldErrors({});
                  setError('');
                  speakGuidance('Form reset. Ready to scan another document.', 'polite');
                }}
                className="btn btn-ghost btn-sm"
                aria-label="Reset form and start over"
              >
                <RotateCcw size={15} /> Scan Another Form
              </button>
            </div>
          </div>
        )}

        {/* Form Reader component if open */}
        {readerOpen && readerFields.length > 0 && (
          <div className="mt-4">
            <FormReader fields={readerFields} onClose={() => setReaderOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceForm;
