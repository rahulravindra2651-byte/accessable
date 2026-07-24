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
];

/** Get the Tesseract OCR language code for a given BCP-47 code. */
export const getOCRLang = (bcp47Code) => {
  const found = LANGUAGES.find(l => l.code === bcp47Code);
  return found ? found.ocr : 'eng';
};

/** Default language code. */
export const DEFAULT_LANG = 'en-US';
