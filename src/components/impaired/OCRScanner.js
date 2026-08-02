import React, { useState } from 'react';
import { useAssistant } from '../../hooks/useAssistant';
import { useOCR } from '../../hooks/useOCR';
import { detectFraud } from '../../utils/fraudScanner';
import { LANGUAGES, getOCRLang } from '../../utils/languages';
import { Globe, ScanLine, AlertTriangle, CheckCircle, Loader2, FileText } from 'lucide-react';

const OCRScanner = () => {
  const [language, setLanguage] = useState('en-US');
  const [result, setResult] = useState('');
  const [fraudWarnings, setFraudWarnings] = useState([]);
  const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | done | error

  const { speak } = useAssistant(language);
  const { scanImage, loading } = useOCR(getOCRLang(language));

  const handleOCR = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setResult('');
    setFraudWarnings([]);

    if (!file.type || (!file.type.startsWith('image/') && file.type !== 'application/pdf')) {
      setScanStatus('error');
      await speak('Please choose a valid image or PDF file to scan.');
      return;
    }

    setScanStatus('scanning');
    speak('Scanning document with optical character recognition. Please wait.');
    if (navigator.vibrate) navigator.vibrate(200);

    try {
      const rawText = await scanImage(file);

      if (!rawText?.trim()) {
        setScanStatus('error');
        await speak('No text detected in document. Please try a clearer image with better contrast.');
        return;
      }

      const foundRisks = detectFraud(rawText);
      setResult(rawText);
      setFraudWarnings(foundRisks);
      setScanStatus('done');

      if (foundRisks.length > 0) {
        await speak(
          `Warning! This document contains ${foundRisks.length} suspicious pattern${foundRisks.length > 1 ? 's' : ''}: ${foundRisks.join(', ')}. Be cautious.`
        );
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } else {
        await speak(`Scanning finished. Document reads: ${rawText.slice(0, 300)}`);
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } catch (err) {
      console.error('[OCRScanner] Error:', err);
      setScanStatus('error');
      await speak('Error scanning document. Please try again.');
    } finally {
      // Reset file input so same file can be re-scanned
      e.target.value = '';
    }
  };

  return (
    <div
      className="card flex flex-col"
      style={{ minHeight: '480px' }}
      role="region"
      aria-label="OCR Document Scanner"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <div className="flex items-center gap-2">
          <ScanLine size={18} style={{ color: 'var(--c-primary)' }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
            OCR Document Scanner
          </h2>
          {loading && (
            <span
              className="flex items-center gap-1 badge badge-warning anim-fade-in"
              role="status"
              aria-live="polite"
            >
              <Loader2 size={12} className="anim-spin" />
              Scanning…
            </span>
          )}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <Globe size={14} style={{ color: 'var(--c-text-muted)' }} aria-hidden="true" />
          <label htmlFor="ocr-language" className="sr-only">
            Select OCR language
          </label>
          <select
            id="ocr-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field py-1 px-2 text-xs"
            aria-label="Select document language for OCR recognition"
            style={{ maxWidth: '130px' }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Area */}
      <div className="p-5 flex-1 space-y-4">
        {/* Fraud Warning Banner */}
        {fraudWarnings.length > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 rounded-xl border-2 border-red-400 bg-red-50 flex items-start gap-3"
          >
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
            <div>
              <p className="font-bold text-red-700 text-sm">⚠ Fraud Risk Detected</p>
              <p className="text-red-600 text-xs mt-1">
                Suspicious patterns found: <strong>{fraudWarnings.join(', ')}</strong>
              </p>
              <p className="text-red-500 text-xs mt-0.5">
                Do not share this document or provide any sensitive information.
              </p>
            </div>
          </div>
        )}

        {/* Success indicator */}
        {scanStatus === 'done' && fraudWarnings.length === 0 && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-xl border border-green-300 bg-green-50 flex items-center gap-2"
          >
            <CheckCircle className="text-green-600 flex-shrink-0" size={16} aria-hidden="true" />
            <p className="text-green-700 text-sm font-semibold">Document scanned successfully — no risks detected.</p>
          </div>
        )}

        {/* Upload Zone */}
        {scanStatus !== 'scanning' && (
          <label
            htmlFor="ocr-file-input"
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-amber-500"
            style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-2)' }}
            tabIndex="0"
            role="button"
            aria-label="Upload a document image or PDF to scan with OCR. Supports JPG, PNG, and PDF formats."
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('ocr-file-input')?.click();
              }
            }}
          >
            <ScanLine size={36} className="text-amber-500 mb-3" aria-hidden="true" />
            <p className="font-semibold text-base" style={{ color: 'var(--c-text)' }}>
              {scanStatus === 'done' ? 'Scan Another Document' : 'Upload Document to Scan'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>
              JPG, PNG, or PDF • Reads text aloud • Detects fraud patterns
            </p>
          </label>
        )}

        <input
          id="ocr-file-input"
          type="file"
          accept="image/*,application/pdf"
          onChange={handleOCR}
          className="sr-only"
          aria-label="Choose image or PDF file to scan"
          disabled={loading}
        />

        {/* Scanning State */}
        {scanStatus === 'scanning' && (
          <div
            className="flex flex-col items-center justify-center py-12 gap-3"
            role="status"
            aria-live="polite"
            aria-label="Scanning document, please wait"
          >
            <Loader2 className="text-amber-500 anim-spin" size={44} aria-hidden="true" />
            <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>
              Scanning with OCR…
            </p>
            <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
              This may take a few seconds for complex documents
            </p>
          </div>
        )}

        {/* Result Text */}
        {result && scanStatus === 'done' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText size={14} style={{ color: 'var(--c-text-muted)' }} aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
                Extracted Text
              </p>
            </div>
            <div
              className="p-4 rounded-xl text-sm leading-relaxed overflow-y-auto"
              style={{
                background: 'var(--c-surface-2)',
                color: 'var(--c-text)',
                maxHeight: '180px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              role="log"
              aria-label="OCR extracted text result"
              aria-live="polite"
              tabIndex="0"
            >
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRScanner;
