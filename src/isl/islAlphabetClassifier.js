/**
 * ISL Alphabet Classifier (A–Z)
 * ──────────────────────────────
 * Classifies ISL finger-spelled letters based on geometric landmark rules.
 *
 * Reference: ISLRTC (Indian Sign Language Research and Training Centre)
 * ISL uses ONE-HANDED finger-spelling for most letters.
 *
 * ARCHITECTURE: Scored ranking — all rules are evaluated and the highest-
 * scoring match is returned (no more first-match-wins).
 *
 * Each rule returns { letter, score } or null if no match.
 * Score is computed dynamically based on how well features match.
 */

/**
 * @param {Object} f - Extracted features from featureExtractor.js
 * @returns {{ letter: string, confidence: number } | null}
 */
export const classifyISLAlphabet = (f) => {
  if (!f) return null;

  // Evaluate ALL rules and collect candidates
  const candidates = [];
  for (const rule of RULES) {
    const result = rule(f);
    if (result) candidates.push(result);
  }

  if (candidates.length === 0) return null;

  // Return the highest-scoring candidate
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return { letter: best.letter, confidence: Math.min(best.score, 0.98) };
};

// ─── Score helpers ──────────────────────────────────────────────────────────

/** Base score, optionally adjusted by how close a value is to ideal */
const score = (letter, base, bonuses = 0) => ({ letter, score: Math.max(0.50, base + bonuses) });

/** Returns a bonus (0 to max) based on how close val is to ideal (±range) */
const proximity = (val, ideal, range, maxBonus = 0.08) => {
  const dist = Math.abs(val - ideal);
  if (dist > range) return 0;
  return maxBonus * (1 - dist / range);
};

// ─── ISL Alphabet Rules ───────────────────────────────────────────────────────

/**
 * A — Closed fist, thumb resting on SIDE of index finger (not across front).
 * Key differentiator from S: thumb does NOT cross in front of fingers.
 */
const rule_A = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbExt < 1.35 && !f.thumbCrossesIndex &&
      f.thumbTipToIndexMCP < 0.45 && f.avgTipDist < 1.0) {
    const s = 0.80
      + proximity(f.thumbTipToIndexMCP, 0.25, 0.20, 0.06)
      + (!f.thumbAboveIndex ? 0.03 : 0);
    return score('A', s);
  }
  return null;
};

/**
 * B — Four fingers extended straight up, thumb folded across palm.
 * Palm faces CAMERA (forward-facing). Fingers close together.
 */
const rule_B = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      !f.thumbUp && f.palmFacingCamera &&
      f.fingerSpread < 0.70 && f.thumbIndexPinch > 0.35) {
    const s = 0.82
      + proximity(f.fingerSpread, 0.45, 0.25, 0.06)
      + (f.palmFacingCamera ? 0.04 : 0);
    return score('B', s);
  }
  return null;
};

/**
 * C — Curved hand forming a C-shape. All fingers slightly bent,
 * thumb opposing. Thumb-index gap moderate.
 */
const rule_C = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbIndexPinch > 0.28 && f.thumbIndexPinch < 0.55 &&
      f.indexCurl > 0.55 && f.indexCurl < 0.85 &&
      f.avgTipDist > 0.85 && f.avgTipDist < 1.25) {
    const s = 0.76
      + proximity(f.thumbIndexPinch, 0.40, 0.15, 0.06)
      + proximity(f.indexCurl, 0.70, 0.15, 0.04);
    return score('C', s);
  }
  return null;
};

/**
 * D — Index finger extended up, thumb touches middle-tip, others curled.
 */
const rule_D = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbMidPinch < 0.25 && !f.handIsHorizontal) {
    const s = 0.80
      + proximity(f.thumbMidPinch, 0.12, 0.13, 0.06);
    return score('D', s);
  }
  return null;
};

/**
 * E — All fingers bent/curled at first joint, thumb tucked UNDER fingers.
 * Key differentiator from A/S: thumb is below, all tips bunched down.
 */
const rule_E = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.avgTipDist < 0.88 && f.allFingersCurled > 0.3 &&
      f.thumbIndexPinch < 0.28 && f.thumbMidPinch < 0.28 &&
      !f.thumbAboveIndex && f.thumbTipToIndexMCP < 0.35) {
    const s = 0.75
      + proximity(f.allFingersCurled, 0.5, 0.20, 0.06)
      + (!f.thumbAboveIndex ? 0.04 : 0);
    return score('E', s);
  }
  return null;
};

/**
 * F — Index+thumb form an O circle (pinch), other 3 fingers extended up.
 */
const rule_F = (f) => {
  if (!f.indexUp && f.midUp && f.ringUp && f.pinkyUp &&
      f.thumbIndexPinch < 0.22) {
    const s = 0.82
      + proximity(f.thumbIndexPinch, 0.10, 0.12, 0.06);
    return score('F', s);
  }
  return null;
};

/**
 * G — Index finger and thumb pointing HORIZONTALLY (sideways gun shape).
 * Key differentiator: hand must be horizontal.
 */
const rule_G = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbUp && f.handIsHorizontal &&
      f.thumbIndexPinch > 0.3 && f.thumbIndexPinch < 0.55) {
    const s = 0.76
      + (f.handIsHorizontal ? 0.06 : 0)
      + proximity(f.thumbIndexPinch, 0.42, 0.12, 0.04);
    return score('G', s);
  }
  return null;
};

/**
 * H — Index and middle fingers extended HORIZONTALLY side by side.
 * Key differentiator from U: hand must be horizontal.
 */
const rule_H = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexMidPinch < 0.25 && !f.thumbUp && f.handIsHorizontal) {
    const s = 0.78
      + (f.handIsHorizontal ? 0.06 : 0)
      + proximity(f.indexMidPinch, 0.12, 0.13, 0.04);
    return score('H', s);
  }
  return null;
};

/**
 * I — Pinky finger extended, all others curled.
 */
const rule_I = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && f.pinkyUp &&
      !f.thumbUp && f.thumbIndexPinch > 0.2) {
    const s = 0.83
      + proximity(f.pinkyExt, 1.5, 0.30, 0.05);
    return score('I', s);
  }
  return null;
};

/**
 * J — Like I (pinky extended) but with motion arc. Static detection unreliable.
 * Requires pinky + thumb extended to differentiate from I.
 * Lower confidence since motion can't be detected.
 */
const rule_J = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.4) {
    // Lower score than Y because J is essentially Y without motion
    const s = 0.65;
    return score('J', s);
  }
  return null;
};

/**
 * K — Index and middle in V, thumb between them touching middle.
 */
const rule_K = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbMidPinch < 0.30 && f.indexMidPinch > 0.25 && !f.handIsHorizontal) {
    const s = 0.77
      + proximity(f.thumbMidPinch, 0.15, 0.15, 0.06)
      + proximity(f.indexMidPinch, 0.35, 0.10, 0.04);
    return score('K', s);
  }
  return null;
};

/**
 * L — Index finger up + thumb extended sideways. L-shape.
 * Key differentiator from G: hand is VERTICAL (not horizontal).
 */
const rule_L = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbUp && !f.handIsHorizontal &&
      f.thumbIndexPinch > 0.4) {
    const s = 0.84
      + (!f.handIsHorizontal ? 0.04 : 0)
      + proximity(f.thumbIndexPinch, 0.55, 0.15, 0.04);
    return score('L', s);
  }
  return null;
};

/**
 * M — Three fingers (index, middle, ring) tucked over thumb, pinky curled.
 * Key differentiator from N: thumbMidPinch AND thumbRingPinch both small.
 */
const rule_M = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.avgTipDist > 0.7 && f.avgTipDist < 1.05 &&
      f.thumbIndexPinch < 0.32 && f.thumbMidPinch < 0.32 &&
      f.thumbRingPinch < 0.40) {
    const s = 0.72
      + proximity(f.thumbRingPinch, 0.25, 0.15, 0.06);
    return score('M', s);
  }
  return null;
};

/**
 * N — Two fingers (index, middle) tucked over thumb. Ring+pinky curled.
 * Key differentiator from M: thumbRingPinch is LARGER (ring not over thumb).
 */
const rule_N = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.avgTipDist > 0.65 && f.avgTipDist < 0.95 &&
      f.thumbIndexPinch < 0.3 && f.thumbMidPinch < 0.35 &&
      f.thumbRingPinch > 0.35) {
    const s = 0.71
      + proximity(f.thumbRingPinch, 0.50, 0.15, 0.06);
    return score('N', s);
  }
  return null;
};

/**
 * O — All fingers and thumb form an O circle shape.
 * Key differentiator from E: fingers form a ROUND shape, not bent down.
 * fingerTightness is moderate (not super tight like FOOD).
 */
const rule_O = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbIndexPinch < 0.25 &&
      f.fingerTightness > 0.10 && f.fingerTightness < 0.35 &&
      f.avgTipDist > 0.75 && f.avgTipDist < 1.1) {
    const s = 0.77
      + proximity(f.fingerTightness, 0.20, 0.10, 0.06)
      + proximity(f.thumbIndexPinch, 0.15, 0.10, 0.04);
    return score('O', s);
  }
  return null;
};

/**
 * P — Index pointing down/bent, thumb out. Similar to K rotated downward.
 */
const rule_P = (f) => {
  if (f.indexBentAtPIP && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.3) {
    const s = 0.70
      + (f.handIsHorizontal ? 0.04 : 0);
    return score('P', s);
  }
  return null;
};

/**
 * Q — Index + thumb pointing downward.
 */
const rule_Q = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbPointsDown && f.thumbIndexPinch < 0.4) {
    const s = 0.68
      + (f.thumbPointsDown ? 0.04 : 0);
    return score('Q', s);
  }
  return null;
};

/**
 * R — Index and middle fingers crossed (index over middle).
 */
const rule_R = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexOverMid && f.indexMidPinch < 0.18) {
    const s = 0.76
      + (f.indexOverMid ? 0.06 : 0)
      + proximity(f.indexMidPinch, 0.08, 0.10, 0.04);
    return score('R', s);
  }
  return null;
};

/**
 * S — Closed fist with thumb ACROSS FRONT of fingers (wrapped fist).
 * Key differentiator from A: thumbCrossesIndex is TRUE + thumbAboveIndex.
 */
const rule_S = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbCrossesIndex && f.thumbAboveIndex &&
      f.thumbIndexPinch < 0.30 && f.avgTipDist < 0.95) {
    const s = 0.78
      + (f.thumbCrossesIndex ? 0.05 : 0)
      + (f.thumbAboveIndex ? 0.03 : 0);
    return score('S', s);
  }
  return null;
};

/**
 * T — Thumb BETWEEN index and middle fingers in a fist.
 * Key differentiator: thumb crosses AND thumbTipToIndexMCP very small.
 */
const rule_T = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      f.thumbCrossesIndex && f.thumbAboveIndex &&
      f.thumbTipToIndexMCP < 0.30 && f.thumbIndexPinch < 0.22 &&
      f.avgTipDist < 0.9) {
    const s = 0.73
      + proximity(f.thumbTipToIndexMCP, 0.15, 0.15, 0.06)
      + (f.thumbCrossesIndex ? 0.04 : 0);
    return score('T', s);
  }
  return null;
};

/**
 * U — Index and middle fingers TOGETHER, pointing VERTICALLY UP.
 * Key differentiator from H: hand is vertical.
 */
const rule_U = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexMidPinch < 0.20 && !f.thumbUp && !f.handIsHorizontal) {
    const s = 0.80
      + (!f.handIsHorizontal ? 0.04 : 0)
      + proximity(f.indexMidPinch, 0.10, 0.10, 0.04);
    return score('U', s);
  }
  return null;
};

/**
 * V — Index and middle spread apart (Victory), pointing UP.
 * Key differentiator from 2: higher indexMidPinch threshold.
 */
const rule_V = (f) => {
  if (f.indexUp && f.midUp && !f.ringUp && !f.pinkyUp &&
      f.indexMidPinch > 0.28 && !f.thumbUp && !f.handIsHorizontal) {
    const s = 0.82
      + proximity(f.indexMidPinch, 0.40, 0.12, 0.06);
    return score('V', s);
  }
  return null;
};

/**
 * W — Index, middle and ring extended and spread. Pinky curled.
 */
const rule_W = (f) => {
  if (f.indexUp && f.midUp && f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.fingerSpread > 0.6) {
    const s = 0.82
      + proximity(f.fingerSpread, 0.80, 0.20, 0.06);
    return score('W', s);
  }
  return null;
};

/**
 * X — Index finger bent/hooked (crooked), others curled.
 */
const rule_X = (f) => {
  if (f.indexBentAtPIP && !f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.indexExt > 1.0 && f.indexExt < 1.35) {
    const s = 0.72
      + proximity(f.indexExt, 1.15, 0.15, 0.05);
    return score('X', s);
  }
  return null;
};

/**
 * Y — Thumb and pinky extended, other fingers curled (Hang loose).
 * Higher score than J to ensure Y wins in static detection.
 */
const rule_Y = (f) => {
  if (!f.indexUp && !f.midUp && !f.ringUp && f.pinkyUp &&
      f.thumbUp && f.thumbIndexPinch > 0.45) {
    const s = 0.82
      + proximity(f.thumbIndexPinch, 0.60, 0.15, 0.05);
    return score('Y', s);
  }
  return null;
};

/**
 * Z — Index finger extended, drawing a Z (motion-based).
 * Static approximation: index only, pointing slightly sideways, no thumb.
 * Lower confidence — true Z requires motion tracking.
 */
const rule_Z = (f) => {
  if (f.indexUp && !f.midUp && !f.ringUp && !f.pinkyUp &&
      !f.thumbUp && f.thumbIndexPinch > 0.35 && !f.handIsHorizontal) {
    const s = 0.66
      + proximity(f.indexExt, 1.50, 0.20, 0.04);
    return score('Z', s);
  }
  return null;
};

// ─── Rule Registry ────────────────────────────────────────────────────────────
// With scored ranking, order matters less — but we still run specific rules
// first for efficiency (they can short-circuit more quickly).
const RULES = [
  rule_F,  // F: index pinch + 3 extended (very specific)
  rule_R,  // R: crossed fingers (very specific)
  rule_K,  // K: V + thumb mid touch
  rule_D,  // D: index + thumb-mid pinch
  rule_P,  // P: bent index + thumb
  rule_G,  // G: index + thumb horizontal
  rule_L,  // L: index + thumb up vertical
  rule_Y,  // Y: thumb + pinky (higher score than J)
  rule_J,  // J: thumb + pinky (lower score — motion needed)
  rule_I,  // I: pinky only
  rule_W,  // W: 3 fingers spread
  rule_V,  // V: 2 fingers spread vertical
  rule_U,  // U: 2 fingers together vertical
  rule_H,  // H: 2 fingers horizontal
  rule_B,  // B: 4 fingers + palm facing camera
  rule_X,  // X: hooked index
  rule_Z,  // Z: index pointing (low confidence)
  rule_O,  // O: O-shape (using fingerTightness)
  rule_C,  // C: curved C-shape
  rule_T,  // T: thumb between index+mid (before S — more specific)
  rule_S,  // S: thumb-across fist (thumbCrossesIndex)
  rule_A,  // A: thumb-side fist (!thumbCrossesIndex)
  rule_E,  // E: all tips pinched, thumb below
  rule_M,  // M: 3 fingers over thumb (thumbRingPinch small)
  rule_N,  // N: 2 fingers over thumb (thumbRingPinch large)
  rule_Q,  // Q: pointing down
];
