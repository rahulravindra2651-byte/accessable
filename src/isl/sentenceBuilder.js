/**
 * ISL Sentence Builder
 * ─────────────────────
 * Accumulates confirmed word tokens into a growing sentence.
 *
 * Word types:
 *   'letter'  → accumulates in characterBuffer → finalize on pause → word added
 *   'number'  → same as letter but displayed as digit string
 *   'word'    → vocabulary word added directly as a token
 *
 * Sentence logic:
 *   - Maintains a token array (max 12 tokens)
 *   - Applies ISL grammar patterns from islDictionary
 *   - Outputs natural English (or direct ISL gloss for translation)
 */

import { ISL_GRAMMAR_PATTERNS, ISL_VOCABULARY } from '../utils/islDictionary';

const MAX_SENTENCE_TOKENS = 12;

/**
 * Creates a new sentence builder instance.
 */
export const createSentenceBuilder = () => {
  let tokens = []; // Array of { type, value, label }

  return {
    /**
     * Add a committed word/vocabulary token to the sentence.
     * @param {{ type: string, value: string, label: string }} token
     */
    addToken(token) {
      if (!token || !token.value) return;

      // Deduplicate: don't add if same as last token
      const last = tokens[tokens.length - 1];
      if (last && last.value === token.value) return;

      tokens.push(token);

      // Cap at MAX_SENTENCE_TOKENS
      if (tokens.length > MAX_SENTENCE_TOKENS) {
        tokens = tokens.slice(-MAX_SENTENCE_TOKENS);
      }
    },

    /**
     * Add a spelled word (from characterBuffer) to the sentence as a word token.
     * @param {string} word - The finalized spelled word (e.g. "HELLO")
     */
    addSpelledWord(word) {
      if (!word || !word.trim()) return;
      this.addToken({
        type: 'spelled',
        value: word.toUpperCase(),
        label: word.toUpperCase(),
      });
    },

    /**
     * Get the current raw token array.
     */
    getTokens() {
      return [...tokens];
    },

    /**
     * Get an array of the current gloss IDs (for grammar pattern matching).
     */
    getGlosses() {
      return tokens.map((t) => t.value);
    },

    /**
     * Get the formatted sentence string.
     * Tries grammar pattern matches first, then falls back to label concatenation.
     */
    getSentence() {
      if (tokens.length === 0) return '';

      const glosses = this.getGlosses();

      // Try exact grammar pattern matches on full sequence or sub-sequences
      for (const pattern of ISL_GRAMMAR_PATTERNS) {
        if (
          pattern.glosses.length === glosses.length &&
          pattern.glosses.every((g, i) => g === glosses[i])
        ) {
          return pattern.sentence;
        }
      }

      // Partial pattern match on last N tokens
      for (let len = Math.min(glosses.length, 4); len >= 2; len--) {
        const subGlosses = glosses.slice(-len);
        for (const pattern of ISL_GRAMMAR_PATTERNS) {
          if (
            pattern.glosses.length === subGlosses.length &&
            pattern.glosses.every((g, i) => g === subGlosses[i])
          ) {
            const prefix = tokens
              .slice(0, tokens.length - len)
              .map(getLabel)
              .join(' ');
            return (prefix ? prefix + ' ' : '') + pattern.sentence;
          }
        }
      }

      // Fallback: concatenate labels
      const words = tokens.map(getLabel).join(' ');
      return words.charAt(0).toUpperCase() + words.slice(1) + '.';
    },

    /**
     * Get the ISL gloss string (raw tokens joined).
     * Useful for debug display.
     */
    getGlossString() {
      return tokens.map((t) => t.value).join(' ');
    },

    /**
     * Remove the last token (undo).
     */
    undo() {
      tokens.pop();
    },

    /**
     * Clear everything.
     */
    reset() {
      tokens = [];
    },

    /**
     * Get a summary object for React state.
     */
    getState() {
      return {
        tokens: [...tokens],
        sentence: this.getSentence(),
        glossString: this.getGlossString(),
      };
    },
  };
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const getLabel = (token) => {
  if (token.type === 'spelled' || token.type === 'letter' || token.type === 'number') {
    return token.value;
  }
  // Vocabulary token — look up readable label
  const entry = ISL_VOCABULARY.find((v) => v.id === token.value);
  return entry ? entry.label.split('/')[0].trim() : token.label || token.value;
};
