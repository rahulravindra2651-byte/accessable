/**
 * ISL Number Classifier (0–9, extendable to 100+)
 * ─────────────────────────────────────────────────
 * Classifies ISL number hand gestures (0–9) based on geometric landmark rules.
 *
 * Reference: ISL number conventions (differ from ASL in several positions).
 * ARCHITECTURE: Scored ranking — evaluates all candidate number rules and
 * returns the best scoring match with dynamic confidence.
 */

/**
 * @param {Object} f - Extracted features from featureExtractor.js
 * @returns {{ number: string, numericValue: number, confidence: number } | null}
 */
export const classifyISLNumber = (f) => {
  if (!f) return null;

  const candidates = [];
  for (const rule of RULES) {
    const result = rule(f);
    if (result) candidates.push(result);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    number: best.number,
    numericValue: best.numericValue,
    confidence: Math.min(best.score, 0.98),
  };
};

const score = (num, val, base, bonuses = 0) => ({
  number: num,
  numericValue: val,
  score: Math.max(0.50, base + bonuses),
});

const proximity = (val, ideal, range, maxBonus = 0.08) => {
  const dist = Math.abs(val - ideal);
  if (dist > range) return 0;
  return maxBonus * (1 - dist / range);
};

// ─── ISL Number Rules 0–9 ────────────────────────────────────────────────────

/**
 * 0 — Tight O shape, fingers and thumb touching.
 */
const rule_0 = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbIndexPinch < 0.22 &&
      f.avgTipDist > 0.70 && f.avgTipDist < 1.05) {
    const s = 0.80
      + proximity(f.thumbIndexPinch, 0.12, 0.10, 0.06);
    return score('0', 0, s);
  }
  return null;
};

/**
 * 1 — Index finger straight UP. Others curled, hand vertical.
 */
const rule_1 = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && !f.handIsHorizontal && f.indexExt > 1.35) {
    const s = 0.86
      + proximity(f.indexExt, 1.6, 0.25, 0.06)
      + (!f.handIsHorizontal ? 0.04 : 0);
    return score('1', 1, s);
  }
  return null;
};

/**
 * 2 — Index and middle fingers extended upward.
 */
const rule_2 = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && !f.handIsHorizontal && f.indexMidPinch > 0.15) {
    const s = 0.84
      + proximity(f.indexMidPinch, 0.30, 0.15, 0.05);
    return score('2', 2, s);
  }
  return null;
};

/**
 * 3 — Thumb, index and middle fingers extended.
 */
const rule_3 = (f) => {
  if (f.thumbUp && f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp) {
    const s = 0.84
      + proximity(f.thumbIndexPinch, 0.45, 0.15, 0.05);
    return score('3', 3, s);
  }
  return null;
};

/**
 * 4 — Four fingers extended, thumb tucked, palm faces camera.
 */
const rule_4 = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && f.pinkyUp && !f.thumbUp &&
      f.thumbIndexPinch > 0.35) {
    const s = 0.85
      + (f.palmFacingCamera ? 0.05 : 0);
    return score('4', 4, s);
  }
  return null;
};

/**
 * 5 — All five fingers fully spread (starfish). High spread.
 */
const rule_5 = (f) => {
  if (f.thumbUp && f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      f.fingerSpread > 0.60) {
    const s = 0.88
      + proximity(f.fingerSpread, 0.85, 0.20, 0.06)
      + (f.palmFacingCamera ? 0.03 : 0);
    return score('5', 5, s);
  }
  return null;
};

/**
 * 6 — Thumb and pinky touching (ISL 6), other 3 extended.
 */
const rule_6 = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && !f.pinkyUp &&
      f.thumbPinkyPinch < 0.25) {
    const s = 0.82
      + proximity(f.thumbPinkyPinch, 0.12, 0.12, 0.06);
    return score('6', 6, s);
  }
  return null;
};

/**
 * 7 — Thumb and ring finger touching (ISL 7), index+middle+pinky up.
 */
const rule_7 = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbRingPinch < 0.25) {
    const s = 0.81
      + proximity(f.thumbRingPinch, 0.12, 0.12, 0.06);
    return score('7', 7, s);
  }
  return null;
};

/**
 * 8 — Thumb and middle finger touching (ISL 8), index+ring+pinky up.
 */
const rule_8 = (f) => {
  if (f.indexUp && !f.midUp && f.ringUp && f.pinkyUp &&
      f.thumbMidPinch < 0.22) {
    const s = 0.81
      + proximity(f.thumbMidPinch, 0.10, 0.12, 0.06);
    return score('8', 8, s);
  }
  return null;
};

/**
 * 9 — Thumb and index finger touching (ISL 9), other 3 fingers up.
 */
const rule_9 = (f) => {
  if (!f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      f.thumbIndexPinch < 0.22) {
    const s = 0.82
      + proximity(f.thumbIndexPinch, 0.10, 0.12, 0.06);
    return score('9', 9, s);
  }
  return null;
};

// ─── Rule Registry ────────────────────────────────────────────────────────────
const RULES = [
  rule_5,  // 5: All spread
  rule_6,  // 6: thumb-pinky pinch + 3 up
  rule_7,  // 7: thumb-ring pinch + 3 up
  rule_8,  // 8: thumb-middle pinch + 3 up
  rule_9,  // 9: thumb-index pinch + 3 up
  rule_3,  // 3: thumb+index+mid
  rule_4,  // 4: four fingers up
  rule_2,  // 2: index+mid
  rule_1,  // 1: index only
  rule_0,  // 0: O-shape
];

