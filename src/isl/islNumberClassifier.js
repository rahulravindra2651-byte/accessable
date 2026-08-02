/**
 * ISL Number Classifier (0–9, extendable to 100+)
 * ─────────────────────────────────────────────────
 * Classifies ISL number hand gestures (0–9) based on geometric landmark rules.
 *
 * Reference: ISL number conventions (differ from ASL in several positions).
 * Architecture: Each number is a pure function. Add new rules to RULES array.
 *
 * HOW TO ADD NEW NUMBERS (10–100):
 * 1. Add a rule function following the pattern below.
 * 2. Add it to the RULES array.
 * 3. For composite numbers (e.g. 13 = TEN + THREE), use the sentenceBuilder
 *    to compose them from atomic tokens.
 */

/**
 * @param {Object} f - Extracted features from featureExtractor.js
 * @returns {{ number: string, numericValue: number, confidence: number } | null}
 */
export const classifyISLNumber = (f) => {
  if (!f) return null;

  for (const rule of RULES) {
    const result = rule(f);
    if (result) return result;
  }
  return null;
};

const ok = (num, value, conf) => ({ number: num, numericValue: value, confidence: conf });

// ─── ISL Number Rules 0–9 ────────────────────────────────────────────────────

/**
 * 0 — All fingers closed, forming a tight O shape (similar to letter O).
 * Fingers and thumb all touching, compact round shape.
 */
const rule_0 = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbIndexPinch < 0.20 &&
      f.avgTipDist > 0.70 && f.avgTipDist < 1.05) {
    return ok('0', 0, 0.82);
  }
  return null;
};

/**
 * 1 — Index finger pointing straight up. All others curled.
 * Thumb may be slightly extended to the side.
 */
const rule_1 = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.indexExt > 1.4) {
    return ok('1', 1, 0.88);
  }
  return null;
};

/**
 * 2 — Index and middle fingers extended (V-shape or together).
 * In ISL, often shown as a peace sign (V-spread).
 */
const rule_2 = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.indexMidPinch > 0.20) {
    return ok('2', 2, 0.85);
  }
  return null;
};

/**
 * 3 — Thumb, index and middle fingers extended (rest curled).
 * In ISL: three fingers spread including thumb.
 */
const rule_3 = (f) => {
  if (f.thumbUp && f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp) {
    return ok('3', 3, 0.83);
  }
  return null;
};

/**
 * 4 — Four fingers extended (index, middle, ring, pinky), thumb tucked.
 */
const rule_4 = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && f.pinkyUp && !f.thumbUp &&
      f.thumbIndexPinch > 0.35) {
    return ok('4', 4, 0.86);
  }
  return null;
};

/**
 * 5 — All five fingers fully spread (open palm / starfish).
 * Large spread between index and pinky.
 */
const rule_5 = (f) => {
  if (f.thumbUp && f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      f.fingerSpread > 0.65) {
    return ok('5', 5, 0.90);
  }
  return null;
};

/**
 * 6 — Thumb and pinky touching (thumb-pinky pinch), other 3 fingers extended.
 * ISL-specific: "6" uses thumb touching pinky tip.
 */
const rule_6 = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && !f.pinkyUp &&
      f.thumbPinkyPinch < 0.25) {
    return ok('6', 6, 0.80);
  }
  return null;
};

/**
 * 7 — Thumb and ring finger touching, index+middle+pinky extended.
 * ISL-specific: "7" uses thumb-ring pinch.
 */
const rule_7 = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbRingPinch < 0.25) {
    return ok('7', 7, 0.79);
  }
  return null;
};

/**
 * 8 — Thumb and middle finger touching, index+ring+pinky extended.
 * ISL-specific: "8" uses thumb-middle pinch.
 */
const rule_8 = (f) => {
  if (f.indexUp && !f.midUp && f.ringUp && f.pinkyUp &&
      f.thumbMidPinch < 0.22) {
    return ok('8', 8, 0.79);
  }
  return null;
};

/**
 * 9 — Thumb and index finger touching (O-shape at top), others extended or curled.
 * ISL-specific: "9" uses thumb-index pinch with middle+ring+pinky slightly up.
 */
const rule_9 = (f) => {
  if (!f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      f.thumbIndexPinch < 0.22) {
    return ok('9', 9, 0.81);
  }
  return null;
};

// ─── Extendable: Tens (10–19 etc.) placeholder ───────────────────────────────
// To add 10: combine dominant-hand "1" + offhand "0" token in sentenceBuilder
// To add 20: combine dominant-hand "2" + offhand "0" token
// The characterBuffer handles the multi-token composition for double-digit numbers.

// ─── Rule Registry ────────────────────────────────────────────────────────────
// Ordered most-specific first to reduce false positives.
const RULES = [
  rule_5,  // 5: All spread (before 4)
  rule_6,  // 6: thumb-pinky pinch + 3 fingers (before 4)
  rule_7,  // 7: thumb-ring pinch
  rule_8,  // 8: thumb-middle pinch
  rule_9,  // 9: thumb-index pinch + 3 up
  rule_3,  // 3: thumb+index+middle (before 2)
  rule_4,  // 4: four fingers (before 2/1)
  rule_2,  // 2: index+middle
  rule_1,  // 1: index only
  rule_0,  // 0: O-shape (similar to letter O — last to avoid conflict)
];
