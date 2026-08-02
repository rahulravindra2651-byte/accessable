/**
 * ISL Alphabet Classifier (A–Z)
 * ──────────────────────────────
 * Classifies ISL finger-spelled letters based on geometric landmark rules.
 *
 * Reference: ISLRTC (Indian Sign Language Research and Training Centre)
 * ISL uses ONE-HANDED finger-spelling for most letters.
 *
 * Each rule returns { letter, confidence } or null if no match.
 *
 * HOW TO ADD A NEW LETTER:
 * 1. Add a rule function below following the `rule_X` pattern.
 * 2. Add it to the RULES array at the bottom.
 * 3. The pipeline picks up the rule automatically.
 */

/**
 * @param {Object} f - Extracted features from featureExtractor.js
 * @returns {{ letter: string, confidence: number } | null}
 */
export const classifyISLAlphabet = (f) => {
  if (!f) return null;

  for (const rule of RULES) {
    const result = rule(f);
    if (result) return result;
  }
  return null;
};

// ─── Helper shorthand ────────────────────────────────────────────────────────
const ok = (letter, conf) => ({ letter, confidence: conf });

// ─── ISL Alphabet Rules ───────────────────────────────────────────────────────
// Based on ISLRTC ISL finger-spelling chart (one-handed system)

/**
 * A — Closed fist, thumb resting on side of index finger (not tucked under).
 * All fingers curled, thumb alongside index.
 */
const rule_A = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbExt < 1.35 && f.thumbIndexPinch < 0.35 &&
      f.avgTipDist < 1.0) {
    return ok('A', 0.82);
  }
  return null;
};

/**
 * B — Four fingers extended together, thumb folded across palm.
 * Fingers straight, spread minimal, thumb tucked.
 */
const rule_B = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      !f.thumbUp && f.thumbIndexPinch > 0.4 &&
      f.fingerSpread < 0.8) {
    return ok('B', 0.84);
  }
  return null;
};

/**
 * C — Curved hand forming a C-shape. All fingers slightly bent,
 * thumb opposing. Thumb-index gap moderate (0.3–0.55), not closed.
 */
const rule_C = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbIndexPinch > 0.28 && f.thumbIndexPinch < 0.55 &&
      f.indexCurl > 0.55 && f.indexCurl < 0.85 &&
      f.avgTipDist > 0.85 && f.avgTipDist < 1.25) {
    return ok('C', 0.78);
  }
  return null;
};

/**
 * D — Index finger extended up, thumb touches middle-tip, others curled.
 */
const rule_D = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbMidPinch < 0.25) {
    return ok('D', 0.80);
  }
  return null;
};

/**
 * E — All fingers bent/curled at first joint, thumb tucked under fingers.
 * Tips touch thumb or palm area. Very compact hand.
 */
const rule_E = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.avgTipDist < 0.88 &&
      f.thumbIndexPinch < 0.28 && f.thumbMidPinch < 0.28) {
    return ok('E', 0.77);
  }
  return null;
};

/**
 * F — Index+thumb form an O circle (pinch), other 3 fingers extended up.
 */
const rule_F = (f) => {
  if (!f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      f.thumbIndexPinch < 0.22) {
    return ok('F', 0.81);
  }
  return null;
};

/**
 * G — Index finger and thumb pointing horizontally (sideways gun shape),
 * other fingers curled.
 */
const rule_G = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.3 && f.thumbIndexPinch < 0.55) {
    return ok('G', 0.76);
  }
  return null;
};

/**
 * H — Index and middle fingers extended horizontally side by side,
 * pointing sideways (not up), other fingers curled.
 */
const rule_H = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexMidPinch < 0.25 && !f.thumbUp) {
    return ok('H', 0.78);
  }
  return null;
};

/**
 * I — Pinky finger extended, all others curled. Thumb may be extended sideways.
 */
const rule_I = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbIndexPinch > 0.2) {
    return ok('I', 0.83);
  }
  return null;
};

/**
 * J — Same as I but involves motion (pinky extended + wrist rotation).
 * Static approximation: pinky extended + thumb extended (ILY-like).
 */
const rule_J = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.4) {
    return ok('J', 0.70);
  }
  return null;
};

/**
 * K — Index and middle fingers extended in V, thumb between them touching mid.
 */
const rule_K = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbMidPinch < 0.30 && f.indexMidPinch > 0.25) {
    return ok('K', 0.77);
  }
  return null;
};

/**
 * L — Index finger extended up + thumb extended sideways. Others curled.
 * L-shape.
 */
const rule_L = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.4) {
    return ok('L', 0.84);
  }
  return null;
};

/**
 * M — Three fingers (index, middle, ring) tucked over thumb, pinky curled.
 * All finger tips pointing downward, thumb under fingers.
 */
const rule_M = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbBelowWrist && f.avgTipDist > 0.7 && f.avgTipDist < 1.05 &&
      f.thumbIndexPinch < 0.35 && f.thumbMidPinch < 0.35) {
    return ok('M', 0.72);
  }
  return null;
};

/**
 * N — Two fingers (index, middle) tucked over thumb, ring+pinky curled.
 */
const rule_N = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbBelowWrist && f.avgTipDist > 0.65 && f.avgTipDist < 0.95 &&
      f.thumbIndexPinch < 0.3) {
    return ok('N', 0.71);
  }
  return null;
};

/**
 * O — All fingers and thumb form an O shape.
 * All tips pinching toward thumb. Compact round shape.
 */
const rule_O = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbIndexPinch < 0.22 &&
      f.avgTipDist > 0.75 && f.avgTipDist < 1.1) {
    return ok('O', 0.79);
  }
  return null;
};

/**
 * P — Index pointing down, thumb out. Similar to K rotated downward.
 */
const rule_P = (f) => {
  if (f.indexBentAtPIP && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.3) {
    return ok('P', 0.70);
  }
  return null;
};

/**
 * Q — Like G (pointing down). Index + thumb pointing down.
 */
const rule_Q = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbPointsDown && f.thumbIndexPinch < 0.4) {
    return ok('Q', 0.69);
  }
  return null;
};

/**
 * R — Index and middle fingers crossed (index over middle).
 */
const rule_R = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexOverMid && f.indexMidPinch < 0.18) {
    return ok('R', 0.76);
  }
  return null;
};

/**
 * S — Closed fist with thumb over fingers (wrapped fist).
 * All fingers curled, thumb across front.
 */
const rule_S = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbAboveIndex && f.thumbIndexPinch < 0.28 &&
      f.avgTipDist < 0.95) {
    return ok('S', 0.80);
  }
  return null;
};

/**
 * T — Index finger curled, thumb between index and middle (tucked).
 */
const rule_T = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbAboveIndex && f.thumbIndexPinch < 0.22 &&
      f.avgTipDist < 0.9) {
    return ok('T', 0.74);
  }
  return null;
};

/**
 * U — Index and middle fingers extended side by side (together), others curled.
 */
const rule_U = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexMidPinch < 0.20 && !f.thumbUp) {
    return ok('U', 0.80);
  }
  return null;
};

/**
 * V — Index and middle fingers extended and spread apart (Victory/V-sign).
 */
const rule_V = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexMidPinch > 0.25 && !f.thumbUp) {
    return ok('V', 0.83);
  }
  return null;
};

/**
 * W — Index, middle, ring extended and spread. Pinky curled.
 */
const rule_W = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && !f.pinkyUp &&
      f.fingerSpread > 0.6) {
    return ok('W', 0.82);
  }
  return null;
};

/**
 * X — Index finger bent/hooked (crooked), others curled.
 */
const rule_X = (f) => {
  if (f.indexBentAtPIP && !f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.indexExt > 1.0 && f.indexExt < 1.35) {
    return ok('X', 0.72);
  }
  return null;
};

/**
 * Y — Thumb and pinky extended, other fingers curled (Hang loose / ILY base).
 */
const rule_Y = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.45) {
    return ok('Y', 0.82);
  }
  return null;
};

/**
 * Z — Index finger extended, drawing a Z (motion-based).
 * Static approximation: index only, pointing slightly sideways.
 */
const rule_Z = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.thumbIndexPinch > 0.35) {
    return ok('Z', 0.68);
  }
  return null;
};

// ─── Rule Registry ────────────────────────────────────────────────────────────
// Order matters: more specific rules first to prevent early false matches.
const RULES = [
  rule_F,  // F: index pinch + 3 extended (specific — before general checks)
  rule_R,  // R: crossed fingers (specific)
  rule_K,  // K: V + thumb mid touch
  rule_D,  // D: index + thumb-mid pinch
  rule_P,  // P: bent index + thumb
  rule_G,  // G: index + thumb horizontal
  rule_L,  // L: index + thumb up (L-shape)
  rule_Y,  // Y: thumb + pinky
  rule_J,  // J: thumb + pinky (like Y but with motion marker)
  rule_I,  // I: pinky only
  rule_W,  // W: 3 fingers spread
  rule_V,  // V: 2 fingers spread
  rule_U,  // U: 2 fingers together
  rule_H,  // H: 2 fingers horizontal
  rule_B,  // B: 4 fingers together
  rule_X,  // X: hooked index
  rule_Z,  // Z: index pointing sideways
  rule_O,  // O: O-shape pinch (before A/E/S/T)
  rule_C,  // C: curved C-shape
  rule_S,  // S: thumb-over fist
  rule_T,  // T: thumb-between fist
  rule_A,  // A: side-thumb fist
  rule_E,  // E: all tips pinched
  rule_M,  // M: 3 fingers over thumb
  rule_N,  // N: 2 fingers over thumb
  rule_Q,  // Q: pointing down
];
