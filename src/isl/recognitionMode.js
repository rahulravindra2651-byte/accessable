/**
 * ISL Recognition Mode Manager
 * ─────────────────────────────
 * Routes MediaPipe hand landmarks to the appropriate ISL classifier
 * based on the current recognition mode.
 *
 * Modes:
 *   ALPHABET — ISL A–Z finger spelling
 *   NUMBER   — ISL 0–9 (extendable to 100+)
 *   WORD     — ISL vocabulary signs (words/phrases)
 *   AUTO     — Try WORD first, then NUMBER, then ALPHABET
 */

import { extractFeatures, extractTwoHandFeatures } from './featureExtractor';
import { classifyISLAlphabet } from './islAlphabetClassifier';
import { classifyISLNumber }   from './islNumberClassifier';
import { classifyISLVocabulary } from './islVocabularyClassifier';

export const RECOGNITION_MODES = {
  ALPHABET: 'ALPHABET',
  NUMBER:   'NUMBER',
  WORD:     'WORD',
  AUTO:     'AUTO',
};

// Minimum confidence to accept a classification result
const CONFIDENCE_THRESHOLD = 0.65;

/**
 * Classify the current frame using the specified recognition mode.
 *
 * @param {Array}  landmarkSets - Array of landmark arrays from MediaPipe (1 or 2 hands)
 * @param {string} mode         - One of RECOGNITION_MODES
 * @returns {{
 *   type: 'letter'|'number'|'word'|null,
 *   value: string,
 *   label: string,
 *   confidence: number,
 *   wordId: string|null
 * } | null}
 */
export const classifyFrame = (landmarkSets, mode = RECOGNITION_MODES.AUTO) => {
  if (!landmarkSets || landmarkSets.length === 0) return null;

  const { dominant, offhand } = extractTwoHandFeatures(landmarkSets);
  if (!dominant) return null;

  switch (mode) {
    case RECOGNITION_MODES.ALPHABET:
      return runAlphabet(dominant);

    case RECOGNITION_MODES.NUMBER:
      return runNumber(dominant);

    case RECOGNITION_MODES.WORD:
      return runWord(dominant, offhand);

    case RECOGNITION_MODES.AUTO:
    default:
      // Try in priority order: WORD → NUMBER → ALPHABET
      return runWord(dominant, offhand)
        || runNumber(dominant)
        || runAlphabet(dominant);
  }
};

// ─── Runner helpers ───────────────────────────────────────────────────────────

const runAlphabet = (dominant) => {
  const result = classifyISLAlphabet(dominant);
  if (!result || result.confidence < CONFIDENCE_THRESHOLD) return null;
  return {
    type: 'letter',
    value: result.letter,
    label: `Letter ${result.letter}`,
    confidence: result.confidence,
    wordId: null,
  };
};

const runNumber = (dominant) => {
  const result = classifyISLNumber(dominant);
  if (!result || result.confidence < CONFIDENCE_THRESHOLD) return null;
  return {
    type: 'number',
    value: result.number,
    label: `Number ${result.number}`,
    numericValue: result.numericValue,
    confidence: result.confidence,
    wordId: null,
  };
};

const runWord = (dominant, offhand) => {
  const result = classifyISLVocabulary(dominant, offhand);
  if (!result || result.confidence < CONFIDENCE_THRESHOLD) return null;
  return {
    type: 'word',
    value: result.wordId,
    label: result.label,
    confidence: result.confidence,
    wordId: result.wordId,
  };
};
