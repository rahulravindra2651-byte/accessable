import React, { useState } from 'react';
import { useAssistant } from '../../hooks/useAssistant';
import { useOCR } from '../../hooks/useOCR';
import { detectFraud } from '../../utils/fraudScanner';
import { Globe } from 'lucide-react';

const OCRScanner = () => {
  const [language, setLanguage] = useState('en-US');

  const languages = [
    { code: 'en-US', name: 'English', ocr: 'eng' },
    { code: 'ta-IN', name: 'Tamil', ocr: 'tam' },
    { code: 'kn-IN', name: 'Kannada', ocr: 'kan' },
    { code: 'hi-IN', name: 'Hindi', ocr: 'hin' },
    { code: 'te-IN', name: 'Telugu', ocr: 'tel' },
  ];

  const getOCRLang = (lang) => {
    const langObj = languages.find(l => l.code === lang);
    return langObj ? langObj.ocr : 'eng';
  };

  const { speak } = useAssistant(language);
  const { scanImage, loading } = useOCR(getOCRLang(language));

  const handleOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type || (!file.type.startsWith('image/') && file.type !== 'application/pdf')) {
      await speak('Please choose a valid image or PDF file to scan.');
      return;
    }

    speak('Scanning document. Please hold.');
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    try {
      const rawText = await scanImage(file);

      const foundRisks = detectFraud(rawText);

      if (foundRisks.length > 0) {
        speak("Warning! This document contains suspicious patterns. Red flags detected: " + foundRisks.join(", "));
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        speak("Scanning finished. Document reads: " + rawText);
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      }
    } catch (err) {
      console.error('OCR error:', err);
      speak("Error scanning document.");
    }
  };

  return (
    <div className="block p-8 bg-zinc-900 rounded-3xl border-2 border-yellow-400 text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Globe size={20} className="text-yellow-400" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-zinc-800 text-white border border-yellow-400 rounded-lg px-3 py-1 text-sm"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>
      <label className="cursor-pointer">
        <span className="text-2xl text-yellow-400 font-black uppercase italic">
          {loading ? "PROCESSING..." : "SCAN DOCUMENT"}
        </span>
        <input type="file" onChange={handleOCR} className="hidden" accept="image/*,application/pdf" />
      </label>
    </div>
  );
};

export default OCRScanner;
