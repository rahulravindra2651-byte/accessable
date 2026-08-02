/**
 * ISL Character Buffer
 * ─────────────────────
 * Temporal smoothing engine that converts frame-level detections into
 * confirmed, deduplicated tokens (letters, numbers, or words).
 *
 * Stability Algorithm:
 *   - Track the last N consecutive frames for the same token
 *   - Only "commit" a token after STABLE_FRAMES consecutive identical frames
 *   - Require a "break" (null detection or different token) before re-committing
 *     the same token (prevents double-letters)
 *   - Separate break threshold (BREAK_FRAMES) for double-letter support
 *
 * Usage:
 *   const buf = createCharacterBuffer();
 *   const committed = buf.push(frameResult); // returns string token or null
 *   buf.reset();
 *   const word = buf.currentWord();
 */

// Frames to hold a detection before committing it
const STABLE_FRAMES = 15;
// Frames of "no detection" required before the same token can be committed again
const BREAK_FRAMES = 8;

/**
 * Creates a new character buffer instance.
 * Call once per component mount.
 */
export const createCharacterBuffer = () => {
  let currentCandidate = null; // token string being tracked
  let candidateCount   = 0;    // consecutive frames of this candidate
  let lastCommitted    = null; // last token committed to word
  let breakCount       = 0;    // frames since last non-null detection
  let word             = [];   // array of committed letters/numbers

  return {
    /**
     * Push a new frame detection result into the buffer.
     *
     * @param {{ type, value, label, confidence } | null} frameResult
     * @returns {string | null} The committed token, or null if not yet stable
     */
    push(frameResult) {
      if (!frameResult || !frameResult.value) {
        // No detection this frame — count toward break
        breakCount++;
        if (breakCount >= BREAK_FRAMES) {
          // Allow re-committing the same token after a break
          lastCommitted = null;
        }
        // Reset candidate tracking
        currentCandidate = null;
        candidateCount   = 0;
        return null;
      }

      breakCount = 0;
      const token = frameResult.value;

      if (token === currentCandidate) {
        candidateCount++;
      } else {
        // New candidate detected — restart counter
        currentCandidate = token;
        candidateCount   = 1;
      }

      // Commit when we have STABLE_FRAMES consecutive frames of the same token
      if (candidateCount >= STABLE_FRAMES && token !== lastCommitted) {
        lastCommitted  = token;
        candidateCount = 0; // Reset so we don't re-commit immediately

        // For letters/numbers, add to word buffer
        if (frameResult.type === 'letter' || frameResult.type === 'number') {
          word.push(token);
        }

        return token;
      }

      return null;
    },

    /**
     * Get the currently accumulated word (from letters/numbers).
     * @returns {string}
     */
    currentWord() {
      return word.join('');
    },

    /**
     * Finalize and return the current word, then clear the letter buffer.
     * Call this when the user pauses (timeout) or makes a "space" gesture.
     * @returns {string}
     */
    finalizeWord() {
      const w = word.join('');
      word = [];
      lastCommitted = null;
      return w;
    },

    /**
     * Remove the last letter from the word buffer (backspace).
     * @returns {string} new word after removal
     */
    backspace() {
      word.pop();
      lastCommitted = null;
      return word.join('');
    },

    /**
     * Full reset — clears all state.
     */
    reset() {
      currentCandidate = null;
      candidateCount   = 0;
      lastCommitted    = null;
      breakCount       = 0;
      word             = [];
    },

    /**
     * Partial reset — only resets frame tracking, keeps the word buffer.
     * Use when switching recognition modes.
     */
    resetTracking() {
      currentCandidate = null;
      candidateCount   = 0;
      lastCommitted    = null;
      breakCount       = 0;
    },

    /**
     * Get stability progress (0–1) for the current candidate.
     * Useful for rendering a confidence progress bar.
     * @returns {number} 0 to 1
     */
    stability() {
      return Math.min(candidateCount / STABLE_FRAMES, 1);
    },

    /** Get the current candidate token being evaluated. */
    candidate() {
      return currentCandidate;
    },
  };
};
