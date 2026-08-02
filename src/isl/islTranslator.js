/**
 * ISL Sentence Translator
 * ────────────────────────
 * Translates an English ISL sentence into any supported Indian language
 * using the free MyMemory translation API (no API key required).
 *
 * Rate limit: 500 requests/day, 500 chars per request (free tier).
 * Falls back to original English if translation fails.
 *
 * Supported languages: all 13 Indian languages from languages.js
 */

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

// Cache translated results to reduce API calls
const translationCache = new Map();

/**
 * Translate text from English to the target language.
 *
 * @param {string} text       - English text to translate
 * @param {string} targetLang - BCP-47 language code (e.g. 'hi-IN', 'kn-IN')
 * @returns {Promise<string>} Translated text, or original on failure
 */
export const translateSentence = async (text, targetLang) => {
  if (!text || !text.trim()) return '';
  if (!targetLang || targetLang === 'en-US') return text;

  const cacheKey = `${targetLang}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // MyMemory uses simple language codes (e.g. 'hi', 'kn', 'ta')
  const langCode = targetLang.split('-')[0];

  try {
    const params = new URLSearchParams({
      q: text.trim(),
      langpair: `en|${langCode}`,
    });

    const res = await fetch(`${MYMEMORY_API}?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.warn('[ISLTranslator] MyMemory API error:', res.status);
      return text;
    }

    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    }

    console.warn('[ISLTranslator] Translation response issue:', data);
    return text;

  } catch (err) {
    console.warn('[ISLTranslator] Translation failed:', err);
    return text;
  }
};

/**
 * Get the appropriate BCP-47 TTS language code for speech synthesis.
 * Some languages need specific regional variants.
 *
 * @param {string} bcp47Code - e.g. 'hi-IN', 'kn-IN'
 * @returns {string} The best TTS language code for Web Speech API
 */
export const getTTSLanguageCode = (bcp47Code) => {
  // MyMemory uses short codes, but Web Speech API uses full BCP-47
  // Most Indian language TTS voices use the full code
  const TTS_MAP = {
    'en-US': 'en-US',
    'hi-IN': 'hi-IN',
    'kn-IN': 'kn-IN',
    'ta-IN': 'ta-IN',
    'te-IN': 'te-IN',
    'ml-IN': 'ml-IN',
    'mr-IN': 'mr-IN',
    'bn-IN': 'bn-IN',
    'gu-IN': 'gu-IN',
    'pa-IN': 'pa-IN',
    'or-IN': 'or-IN',
    'as-IN': 'as-IN',
    'ur-IN': 'ur-PK', // Urdu TTS often needs ur-PK
  };
  return TTS_MAP[bcp47Code] || bcp47Code;
};

/**
 * Speak translated text using Web Speech API.
 *
 * @param {string} text     - Text to speak
 * @param {string} langCode - BCP-47 language code
 */
export const speakTranslated = (text, langCode) => {
  if (!text || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getTTSLanguageCode(langCode);

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = langCode.split('-')[0];
  const matchedVoice = voices.find((v) => v.lang.startsWith(langPrefix));
  if (matchedVoice) utterance.voice = matchedVoice;

  window.speechSynthesis.speak(utterance);
};

/** Clear the translation cache (e.g. when resetting the session). */
export const clearTranslationCache = () => {
  translationCache.clear();
};
