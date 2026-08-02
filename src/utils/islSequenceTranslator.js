/**
 * ISL Sequence Translator (Compatibility + Pipeline Bridge)
 * ──────────────────────────────────────────────────────────
 * This module now bridges the old ISLTranslatorCamera API to the new
 * modular ISL pipeline in src/isl/.
 *
 * The main entry points used by ISLTranslatorCamera.js:
 *   - classifyFrame()  → routes landmarks to correct ISL classifier
 *   - formatISLSequenceToSentence() → formats gloss token arrays to sentences
 *
 * Legacy exports are maintained for compatibility.
 */

export { classifyFrame, RECOGNITION_MODES } from '../isl/recognitionMode';
export { createCharacterBuffer }            from '../isl/characterBuffer';
export { createSentenceBuilder }            from '../isl/sentenceBuilder';
export { translateSentence, speakTranslated, clearTranslationCache } from '../isl/islTranslator';
export { ISL_VOCABULARY, ISL_ALPHABETS, ISL_NUMBERS, ISL_ALL_SIGNS, ISL_GRAMMAR_PATTERNS, ISL_CATEGORIES } from './islDictionary';

import { ISL_VOCABULARY, ISL_GRAMMAR_PATTERNS } from './islDictionary';

/**
 * Format a raw gloss token array into a natural-language sentence.
 * Maintained for backward compatibility with any component that calls this directly.
 *
 * @param {string[]} glosses - Array of ISL gloss IDs (e.g. ['HELLO', 'MY', 'NAME'])
 * @returns {string} Human-readable sentence
 */
export const formatISLSequenceToSentence = (glosses) => {
  if (!glosses || !glosses.length) return '';

  // Deduplicate consecutive identical glosses
  const cleanGlosses = [];
  glosses.forEach((g) => {
    if (!g || typeof g !== 'string') return;
    const clean = g.toUpperCase().trim();
    if (!clean) return;
    if (cleanGlosses.length === 0 || cleanGlosses[cleanGlosses.length - 1] !== clean) {
      cleanGlosses.push(clean);
    }
  });

  if (cleanGlosses.length === 0) return '';

  const recentGlosses = cleanGlosses.slice(-8);

  // Check grammar patterns
  for (const pattern of ISL_GRAMMAR_PATTERNS) {
    if (
      pattern.glosses.length === recentGlosses.length &&
      pattern.glosses.every((val, idx) => val === recentGlosses[idx])
    ) {
      return pattern.sentence;
    }
  }

  // Fallback: concatenate labels
  const words = recentGlosses.map((id) => {
    const item = ISL_VOCABULARY.find((v) => v.id === id);
    return item ? item.label.split('/')[0].trim() : id;
  });

  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
};
