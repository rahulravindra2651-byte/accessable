/**
 * Shared language configuration used across LiveCaptions, VoiceForm,
 * OCRScanner, TextToSign, and any other multilingual component.
 * Add new languages here to enable them project-wide.
 */

export const LANGUAGES = [
  { code: 'en-US', name: 'English',    ocr: 'eng', flag: '🇺🇸' },
  { code: 'hi-IN', name: 'Hindi',      ocr: 'hin', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada',    ocr: 'kan', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil',      ocr: 'tam', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu',     ocr: 'tel', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam',  ocr: 'mal', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi',    ocr: 'mar', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali',    ocr: 'ben', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati',   ocr: 'guj', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi',    ocr: 'pan', flag: '🇮🇳' },
  { code: 'or-IN', name: 'Odia',       ocr: 'ori', flag: '🇮🇳' },
  { code: 'as-IN', name: 'Assamese',   ocr: 'asm', flag: '🇮🇳' },
  { code: 'ur-IN', name: 'Urdu',       ocr: 'urd', flag: '🇮🇳' },
];

/** Get the Tesseract OCR language code for a given BCP-47 code. */
export const getOCRLang = (bcp47Code) => {
  const found = LANGUAGES.find(l => l.code === bcp47Code);
  return found ? found.ocr : 'eng';
};

/**
 * Get combined OCR language string (e.g. 'kan+eng' or 'hin+eng')
 * ensuring regional OCR preserves both native script and English labels.
 */
export const getOCRLangString = (bcp47Code) => {
  const ocr = getOCRLang(bcp47Code);
  return ocr === 'eng' ? 'eng' : `${ocr}+eng`;
};

/**
 * Automatically detect language from extracted Unicode text by checking script ranges.
 * @param {string} text - Raw OCR text
 * @returns {string} BCP-47 language code (e.g. 'kn-IN', 'hi-IN', 'en-US')
 */
export const detectLanguageFromText = (text) => {
  if (!text || typeof text !== 'string') return DEFAULT_LANG;

  // Unicode Script Character Counter
  const counts = {
    'kn-IN': (text.match(/[\u0C80-\u0CFF]/g) || []).length, // Kannada
    'hi-IN': (text.match(/[\u0900-\u097F]/g) || []).length, // Devanagari (Hindi/Marathi)
    'ta-IN': (text.match(/[\u0B80-\u0BFF]/g) || []).length, // Tamil
    'te-IN': (text.match(/[\u0C00-\u0C7F]/g) || []).length, // Telugu
    'ml-IN': (text.match(/[\u0D00-\u0D7F]/g) || []).length, // Malayalam
    'bn-IN': (text.match(/[\u0980-\u09FF]/g) || []).length, // Bengali / Assamese
    'gu-IN': (text.match(/[\u0A80-\u0AFF]/g) || []).length, // Gujarati
    'pa-IN': (text.match(/[\u0A00-\u0A7F]/g) || []).length, // Gurmukhi (Punjabi)
    'or-IN': (text.match(/[\u0B00-\u0B7F]/g) || []).length, // Odia
    'ur-IN': (text.match(/[\u0600-\u06FF]/g) || []).length, // Urdu / Arabic
  };

  let maxCount = 0;
  let detected = DEFAULT_LANG;

  Object.entries(counts).forEach(([lang, count]) => {
    if (count > maxCount && count >= 3) { // Require at least 3 script chars
      maxCount = count;
      detected = lang;
    }
  });

  console.log(`🌐 [Language Detector] Analyzed script counts:`, counts, `-> Detected: ${detected}`);
  return detected;
};

/** Default language code. */
export const DEFAULT_LANG = 'en-US';
