/**
 * ISL Vocabulary Classifier
 * ──────────────────────────
 * Classifies ISL vocabulary signs (words and phrases) from hand landmark features.
 *
 * Reference: ISLRTC ISL vocabulary documentation + two-hand sign conventions.
 * ARCHITECTURE: Scored ranking — evaluates all candidate vocabulary rules
 * and returns the best scoring match with dynamic confidence.
 */

/**
 * @param {Object} dominant  - Dominant hand features from featureExtractor.js
 * @param {Object} offhand   - Non-dominant hand features (may be null)
 * @returns {{ wordId: string, label: string, confidence: number } | null}
 */
export const classifyISLVocabulary = (dominant, offhand = null) => {
  if (!dominant) return null;

  const candidates = [];
  for (const rule of RULES) {
    const result = rule(dominant, offhand);
    if (result) candidates.push(result);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    wordId: best.wordId,
    label: best.label,
    confidence: Math.min(best.score, 0.98),
  };
};

const score = (wordId, label, base, bonuses = 0) => ({
  wordId,
  label,
  score: Math.max(0.50, base + bonuses),
});

const proximity = (val, ideal, range, maxBonus = 0.08) => {
  const dist = Math.abs(val - ideal);
  if (dist > range) return 0;
  return maxBonus * (1 - dist / range);
};

// ─── ISL Vocabulary Rules ────────────────────────────────────────────────────

/**
 * HELLO / NAMASTE — Open palm forward (all 5 fingers spread wide, facing camera)
 * or two hands brought together.
 */
const rule_HELLO = (d, o) => {
  const twoHandOpen = o && o.indexUp && o.midUp && o.ringUp && o.pinkyUp;
  if (twoHandOpen) {
    return score('HELLO', 'Hello / Namaste', 0.92);
  }

  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp && d.thumbUp &&
      d.fingerSpread > 0.58 && d.palmFacingCamera) {
    const s = 0.86
      + proximity(d.fingerSpread, 0.80, 0.20, 0.06)
      + (d.palmFacingCamera ? 0.04 : 0);
    return score('HELLO', 'Hello / Namaste', s);
  }
  return null;
};

/**
 * THANK YOU — Flat open palm moving from chin forward. Fingers together.
 */
const rule_THANK_YOU = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp && d.thumbUp &&
      d.fingerSpread < 0.52 && d.palmFacingCamera) {
    const s = 0.83
      + proximity(d.fingerSpread, 0.35, 0.15, 0.05)
      + (d.handHeightRatio < 0.65 ? 0.04 : 0);
    return score('THANK_YOU', 'Thank You', s);
  }
  return null;
};

/**
 * PLEASE — Open hand flat against chest (palm facing SELF / inward).
 */
const rule_PLEASE = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.palmFacingCamera && d.fingerSpread < 0.60) {
    const s = 0.82
      + (!d.palmFacingCamera ? 0.06 : 0)
      + proximity(d.fingerSpread, 0.40, 0.15, 0.04);
    return score('PLEASE', 'Please', s);
  }
  return null;
};

/**
 * STOP / HALT — Flat vertical palm facing out to the viewer (stop sign).
 */
const rule_STOP = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && d.palmFacingCamera &&
      d.fingerSpread < 0.48 && d.thumbIndexPinch > 0.42) {
    const s = 0.84
      + (d.palmFacingCamera ? 0.05 : 0)
      + proximity(d.fingerSpread, 0.30, 0.15, 0.04);
    return score('STOP', 'Stop', s);
  }
  return null;
};

/**
 * MY / MINE — Flat palm placed close over chest, fingers close together.
 */
const rule_MY = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && !d.palmFacingCamera && d.fingerTightness < 0.22) {
    const s = 0.79
      + (!d.palmFacingCamera ? 0.05 : 0)
      + proximity(d.fingerTightness, 0.12, 0.10, 0.05);
    return score('MY', 'My / Mine', s);
  }
  return null;
};

/**
 * STUDENT — Open flat hand near head / forehead (learning sign).
 */
const rule_STUDENT = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && d.palmFacingCamera && d.handHeightRatio < 0.42) {
    const s = 0.77
      + (d.handHeightRatio < 0.35 ? 0.06 : 0);
    return score('STUDENT', 'Student', s);
  }
  return null;
};

/**
 * SORRY — Fist rubbing circle over chest.
 */
const rule_SORRY = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbAboveIndex && !d.thumbCrossesIndex && d.avgTipDist < 0.92) {
    const s = 0.76
      + proximity(d.avgTipDist, 0.80, 0.15, 0.04);
    return score('SORRY', 'Sorry', s);
  }
  return null;
};

/**
 * YES — Fist with thumb up, moderate extension.
 */
const rule_YES = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbAboveIndex && d.thumbExt >= 1.25 && d.thumbExt <= 1.55) {
    const s = 0.85
      + proximity(d.thumbExt, 1.40, 0.15, 0.05);
    return score('YES', 'Yes', s);
  }
  return null;
};

/**
 * GOOD — Closed fist + thumb pointing high up (strong thumbs-up).
 */
const rule_GOOD = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbExt > 1.50 && d.thumbIndexPinch > 0.35) {
    const s = 0.88
      + proximity(d.thumbExt, 1.70, 0.20, 0.06);
    return score('GOOD', 'Good', s);
  }
  return null;
};

/**
 * NO — Index and middle fingers extended, thumb extended (pinching/snapping shape).
 */
const rule_NO = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.indexMidPinch > 0.22) {
    const s = 0.84
      + proximity(d.indexMidPinch, 0.35, 0.12, 0.05);
    return score('NO', 'No', s);
  }
  return null;
};

/**
 * HELP — Dominant closed fist placed on offhand flat palm.
 */
const rule_HELP = (d, o) => {
  // Two-hand: dominant fist + offhand open palm (Primary ISL standard)
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp && d.thumbUp &&
      o && o.indexUp && o.midUp && o.ringUp && o.pinkyUp) {
    return score('HELP', 'Help', 0.93);
  }
  return null;
};

/**
 * WATER — W handshape (index, middle, ring extended).
 */
const rule_WATER = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.fingerSpread < 0.75) {
    const s = 0.85
      + proximity(d.fingerSpread, 0.50, 0.20, 0.05);
    return score('WATER', 'Water', s);
  }
  return null;
};

/**
 * FOOD / EAT — Fingertips bunched tightly together pointing to mouth.
 */
const rule_FOOD = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.fingerTightness < 0.18 &&
      d.thumbIndexPinch < 0.22 && d.thumbMidPinch < 0.26 &&
      d.avgTipDist > 0.70 && d.avgTipDist < 1.10) {
    const s = 0.84
      + proximity(d.fingerTightness, 0.10, 0.08, 0.06);
    return score('EAT', 'Food / Eat', s);
  }
  return null;
};

/**
 * HOME — Fingertips together, hand near cheek/face area.
 */
const rule_HOME = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.fingerTightness >= 0.18 && d.fingerTightness < 0.35 &&
      d.thumbIndexPinch < 0.26 && d.handHeightRatio < 0.50) {
    const s = 0.78
      + (d.handHeightRatio < 0.40 ? 0.05 : 0);
    return score('HOME', 'Home', s);
  }
  return null;
};

/**
 * EMERGENCY — Index finger pointing up only (high extension).
 */
const rule_EMERGENCY = (d) => {
  if (d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexExt > 1.55 && !d.handIsHorizontal) {
    const s = 0.82
      + proximity(d.indexExt, 1.70, 0.15, 0.05);
    return score('EMERGENCY', 'Emergency', s);
  }
  return null;
};

/**
 * DOCTOR — Index and middle extended, tapping pulse/wrist or bent.
 */
const rule_DOCTOR = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexMidPinch < 0.20 && (d.indexBentAtPIP || d.handIsHorizontal)) {
    const s = 0.78
      + (d.indexBentAtPIP ? 0.04 : 0);
    return score('DOCTOR', 'Doctor', s);
  }
  return null;
};

/**
 * MEDICINE — Middle finger touching thumb (rocking gesture), others up.
 */
const rule_MEDICINE = (d) => {
  if (d.indexUp && !d.midUp && d.ringUp && d.pinkyUp &&
      d.thumbMidPinch < 0.22) {
    const s = 0.79
      + proximity(d.thumbMidPinch, 0.10, 0.12, 0.05);
    return score('MEDICINE', 'Medicine', s);
  }
  return null;
};

/**
 * HOSPITAL — H handshape (index+middle extended horizontally).
 */
const rule_HOSPITAL = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexMidPinch < 0.22 && d.handIsHorizontal) {
    const s = 0.78
      + (d.handIsHorizontal ? 0.06 : 0);
    return score('HOSPITAL', 'Hospital', s);
  }
  return null;
};

/**
 * POLICE — Index pointing forward with thumb extended (P shape).
 */
const rule_POLICE = (d) => {
  if (d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbIndexPinch < 0.38) {
    const s = 0.76
      + proximity(d.thumbIndexPinch, 0.25, 0.12, 0.04);
    return score('POLICE', 'Police', s);
  }
  return null;
};

/**
 * MOTHER — 3 fingers curled over thumb area near chin.
 */
const rule_MOTHER = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.avgTipDist > 0.65 && d.avgTipDist < 1.0 &&
      d.thumbBelowWrist) {
    const s = 0.75
      + (d.handHeightRatio < 0.50 ? 0.04 : 0);
    return score('MOTHER', 'Mother', s);
  }
  return null;
};

/**
 * FATHER — F handshape (index-thumb pinch + 3 up) near forehead.
 */
const rule_FATHER = (d) => {
  if (!d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      d.thumbIndexPinch < 0.22) {
    const s = 0.76
      + (d.handHeightRatio < 0.45 ? 0.04 : 0);
    return score('FATHER', 'Father', s);
  }
  return null;
};

/**
 * SCHOOL — Two open hands clapping together.
 */
const rule_SCHOOL = (d, o) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      o && o.indexUp && o.midUp && o.ringUp && o.pinkyUp) {
    return score('SCHOOL', 'School', 0.88);
  }
  return null;
};

/**
 * NAME — Index + middle tapping together.
 */
const rule_NAME = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexMidPinch > 0.18 && d.indexMidPinch < 0.30 && !d.handIsHorizontal) {
    const s = 0.77
      + proximity(d.indexMidPinch, 0.24, 0.06, 0.04);
    return score('NAME', 'Name', s);
  }
  return null;
};

/**
 * DANGER — Both fists.
 */
const rule_DANGER = (d, o) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      o && !o.indexUp && !o.midUp && !o.ringUp && !o.pinkyUp) {
    return score('DANGER', 'Danger', 0.86);
  }
  return null;
};

/**
 * YOU — Index finger pointing forward to user/camera.
 */
const rule_YOU = (d) => {
  if (d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexExt > 1.40 && d.thumbIndexPinch > 0.38) {
    const s = 0.82
      + proximity(d.indexExt, 1.60, 0.20, 0.04);
    return score('YOU', 'You / Your', s);
  }
  return null;
};

// ─── Rule Registry ────────────────────────────────────────────────────────────
const RULES = [
  rule_HELP,       // Two-hand fist + palm (highest priority)
  rule_SCHOOL,     // Two-hand open palms
  rule_DANGER,     // Two-hand fists
  rule_HELLO,      // HELLO (two-hand namaste or wide open forward palm)
  rule_THANK_YOU,  // Flat forward palm (fingers together)
  rule_PLEASE,     // Inward flat palm on chest
  rule_STOP,       // Vertical outward stop palm
  rule_MY,         // Tight flat palm on chest
  rule_STUDENT,    // Head-height learning hand
  rule_GOOD,       // Strong thumbs up
  rule_YES,        // Moderate thumbs up / nodding
  rule_NO,         // Index+mid+thumb snap shape
  rule_WATER,      // W shape
  rule_FOOD,       // Tight bunched fingertips
  rule_HOME,       // Cheek gathered fingers
  rule_EMERGENCY,  // Single index straight up
  rule_MEDICINE,   // Thumb-mid pinch
  rule_FATHER,     // F-shape
  rule_MOTHER,     // M-shape
  rule_DOCTOR,     // Wrist tap / bent fingers
  rule_HOSPITAL,   // Horizontal H
  rule_NAME,       // Vertical H
  rule_POLICE,     // P-shape
  rule_SORRY,      // Chest fist
  rule_YOU,        // Index point forward
];

