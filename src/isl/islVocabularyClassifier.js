/**
 * ISL Vocabulary Classifier
 * ──────────────────────────
 * Classifies ISL vocabulary signs (words and phrases) from hand landmark features.
 *
 * Reference: ISLRTC ISL vocabulary documentation + two-hand sign conventions.
 * Each rule returns { wordId, label, confidence } or null.
 *
 * HOW TO ADD A NEW ISL WORD:
 * 1. Add the word to ISL_VOCABULARY in islDictionary.js with its id, label, etc.
 * 2. Add a rule function below following the `rule_WORD` pattern.
 * 3. Add it to the RULES array. The pipeline picks it up automatically.
 */

/**
 * @param {Object} dominant  - Dominant hand features from featureExtractor.js
 * @param {Object} offhand   - Non-dominant hand features (may be null)
 * @returns {{ wordId: string, label: string, confidence: number } | null}
 */
export const classifyISLVocabulary = (dominant, offhand = null) => {
  if (!dominant) return null;

  for (const rule of RULES) {
    const result = rule(dominant, offhand);
    if (result) return result;
  }
  return null;
};

const ok = (wordId, label, conf) => ({ wordId, label, confidence: conf });

// ─── ISL Vocabulary Rules ────────────────────────────────────────────────────

/**
 * HELLO / NAMASTE — Open palm forward (all fingers extended, facing camera).
 * ISL: Both hands brought together in a namaste gesture.
 * Dominant-hand approximation: Open palm, all fingers up, spread moderate.
 */
const rule_HELLO = (d, o) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      d.thumbUp && d.fingerSpread > 0.55 && d.avgTipDist > 1.1) {
    // Bonus confidence if offhand also open (two-hand namaste)
    const twoHand = o && o.indexUp && o.midUp ? 0.05 : 0;
    return ok('HELLO', 'Hello / Namaste', 0.88 + twoHand);
  }
  return null;
};

/**
 * THANK YOU — Flat hand moving from chin forward.
 * Static approximation: flat open palm, fingers together, no spread.
 */
const rule_THANK_YOU = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      d.thumbUp && d.fingerSpread < 0.55 && d.avgTipDist > 1.05) {
    return ok('THANK_YOU', 'Thank You', 0.82);
  }
  return null;
};

/**
 * PLEASE — Open hand rubbing circle over heart.
 * Static: all fingers extended, palm facing self (thumb side visible).
 */
const rule_PLEASE = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && d.fingerSpread < 0.6) {
    return ok('PLEASE', 'Please', 0.78);
  }
  return null;
};

/**
 * SORRY — Fist circular motion over chest.
 * Static approximation: closed fist, thumb alongside.
 */
const rule_SORRY = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbAboveIndex && d.avgTipDist < 0.92) {
    return ok('SORRY', 'Sorry', 0.79);
  }
  return null;
};

/**
 * YES — Fist nodding (fist with thumb up, moving up-down).
 * Static: closed fist, thumb pointing up above index.
 */
const rule_YES = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbAboveIndex && d.thumbExt > 1.3) {
    return ok('YES', 'Yes', 0.87);
  }
  return null;
};

/**
 * NO — Index and middle fingers snapping shut against thumb.
 * Static: index + middle extended, spread, thumb extended.
 */
const rule_NO = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.indexMidPinch > 0.25) {
    return ok('NO', 'No', 0.84);
  }
  return null;
};

/**
 * HELP — Fist on flat palm, moving upward.
 * Two-hand sign: dominant closed fist placed on offhand flat palm.
 * One-hand approximation: closed fist with thumb up (asking for help).
 */
const rule_HELP = (d, o) => {
  // Two-hand: dominant fist + offhand open palm
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && o && o.indexUp && o.midUp && o.ringUp && o.pinkyUp) {
    return ok('HELP', 'Help', 0.90);
  }
  // One-hand fallback: thumb-up closed fist (raised thumb = calling for help)
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbExt > 1.4 && d.avgTipDist < 0.95) {
    return ok('HELP', 'Help', 0.80);
  }
  return null;
};

/**
 * WATER — W gesture (3 fingers: index, middle, ring) tapping chin.
 * Static: index + middle + ring extended, pinky and thumb curled.
 */
const rule_WATER = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.fingerSpread < 0.75) {
    return ok('WATER', 'Water', 0.85);
  }
  return null;
};

/**
 * FOOD / EAT — Fingertips bunched together tapping mouth.
 * Static: all fingertips pinched together (flat O), palm facing face.
 */
const rule_FOOD = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbIndexPinch < 0.22 && d.thumbMidPinch < 0.28 &&
      d.avgTipDist > 0.75 && d.avgTipDist < 1.1) {
    return ok('EAT', 'Food / Eat', 0.82);
  }
  return null;
};

/**
 * STOP / HALT — Flat vertical palm sliced down.
 * Static: all fingers together, extended, palm vertical (like a stop sign).
 */
const rule_STOP = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && d.fingerSpread < 0.45 && d.thumbIndexPinch > 0.5) {
    return ok('STOP', 'Stop', 0.83);
  }
  return null;
};

/**
 * EMERGENCY — Index finger pointing up + shaking (static: pointing up only).
 */
const rule_EMERGENCY = (d) => {
  if (d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexExt > 1.5) {
    return ok('EMERGENCY', 'Emergency', 0.80);
  }
  return null;
};

/**
 * DOCTOR — Tapping wrist with index + middle fingers.
 * Static: index and middle extended together, bent toward palm.
 */
const rule_DOCTOR = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexMidPinch < 0.18 && d.indexBentAtPIP) {
    return ok('DOCTOR', 'Doctor', 0.78);
  }
  return null;
};

/**
 * MEDICINE — Rocking gesture: middle finger on thumb, others extended.
 * Static: middle finger pinching thumb, index+ring+pinky up.
 */
const rule_MEDICINE = (d) => {
  if (d.indexUp && !d.midUp && d.ringUp && d.pinkyUp &&
      d.thumbMidPinch < 0.22) {
    return ok('MEDICINE', 'Medicine', 0.77);
  }
  return null;
};

/**
 * HOSPITAL — H handshape (index+middle) moved across.
 * Static: index + middle extended together, horizontal.
 */
const rule_HOSPITAL = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexMidPinch < 0.22 && !d.indexBentAtPIP) {
    return ok('HOSPITAL', 'Hospital', 0.75);
  }
  return null;
};

/**
 * POLICE — P handshape: index pointing forward with thumb.
 */
const rule_POLICE = (d) => {
  if (d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbIndexPinch < 0.38) {
    return ok('POLICE', 'Police', 0.74);
  }
  return null;
};

/**
 * HOME — Fingertips together, touching cheek (flat O moving to cheek).
 * Static: all fingers pinched together (flat O shape, compact).
 */
const rule_HOME = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbIndexPinch < 0.25 && d.avgTipDist > 0.80 && d.avgTipDist < 1.05) {
    return ok('HOME', 'Home', 0.76);
  }
  return null;
};

/**
 * MOTHER — M handshape: three fingers on thumb touching chin.
 * Static: 3 fingers bent over thumb region.
 */
const rule_MOTHER = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.avgTipDist > 0.65 && d.avgTipDist < 1.0 &&
      d.thumbBelowWrist) {
    return ok('MOTHER', 'Mother', 0.74);
  }
  return null;
};

/**
 * FATHER — F handshape: index+middle pinch + 3 fingers extended, touching forehead.
 */
const rule_FATHER = (d) => {
  if (!d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      d.thumbIndexPinch < 0.22) {
    return ok('FATHER', 'Father', 0.74);
  }
  return null;
};

/**
 * SCHOOL — Clapping motion (two flat palms).
 * Two-hand: both hands open, palms facing.
 * Static dominant: open palm, 4+ fingers up.
 */
const rule_SCHOOL = (d, o) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      o && o.indexUp && o.midUp && o.ringUp && o.pinkyUp &&
      d.fingerSpread < 0.6 && o.fingerSpread < 0.6) {
    return ok('SCHOOL', 'School', 0.78);
  }
  return null;
};

/**
 * STUDENT — Learn sign: flat hand from palm to forehead.
 * Static: flat open hand (4 fingers up, thumb alongside).
 */
const rule_STUDENT = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && d.fingerSpread < 0.5 && d.avgTipDist > 1.0) {
    return ok('STUDENT', 'Student', 0.73);
  }
  return null;
};

/**
 * NAME — H handshape: index + middle tapping together (H = 2 fingers).
 * Already covered by HOSPITAL — use confidence distinction.
 * NAME: index + middle with thumbIndexPinch more open.
 */
const rule_NAME = (d) => {
  if (d.indexUp && d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexMidPinch > 0.18 && d.indexMidPinch < 0.30) {
    return ok('NAME', 'Name', 0.76);
  }
  return null;
};

/**
 * GOOD — Thumb up (closed fist + thumb pointing up high).
 * Different from YES: thumb is more extended and index is not touching.
 */
const rule_GOOD = (d) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      d.thumbUp && d.thumbExt > 1.5 && d.thumbAboveIndex &&
      d.thumbIndexPinch > 0.30) {
    return ok('GOOD', 'Good', 0.85);
  }
  return null;
};

/**
 * DANGER — Both fists tapping together.
 * Static dominant: closed fist facing in.
 */
const rule_DANGER = (d, o) => {
  if (!d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      o && !o.indexUp && !o.midUp && !o.ringUp && !o.pinkyUp) {
    return ok('DANGER', 'Danger', 0.79);
  }
  return null;
};

/**
 * MY / MINE — Flat palm placed on chest.
 * Static: open palm (or slightly closed), pointing inward.
 */
const rule_MY = (d) => {
  if (d.indexUp && d.midUp && d.ringUp && d.pinkyUp &&
      !d.thumbUp && d.fingerSpread < 0.45) {
    return ok('MY', 'My / Mine', 0.74);
  }
  return null;
};

/**
 * YOU — Index finger pointing forward.
 */
const rule_YOU = (d) => {
  if (d.indexUp && !d.midUp && !d.ringUp && !d.pinkyUp &&
      !d.thumbUp && d.indexExt > 1.45 && d.thumbIndexPinch > 0.38) {
    return ok('YOU', 'You / Your', 0.82);
  }
  return null;
};

// ─── Rule Registry ────────────────────────────────────────────────────────────
// Priority: two-hand signs first, then specific one-hand signs.
const RULES = [
  // Two-hand signs (most specific)
  rule_HELP,       // dominant fist + offhand open palm
  rule_DANGER,     // two fists
  rule_SCHOOL,     // two open palms clapping

  // Specific one-hand vocabulary
  rule_MEDICINE,   // thumb-mid pinch + 3 up
  rule_FATHER,     // index pinch + 3 up (F-shape)
  rule_FOOD,       // all tips pinched
  rule_HOME,       // compact O + specific avg dist range
  rule_MOTHER,     // 3 fingers bent, thumb below wrist
  rule_GOOD,       // thumb extended high + large gap
  rule_YES,        // thumb up + above index + high ext
  rule_WATER,      // W shape: index+mid+ring
  rule_NO,         // index+mid+thumb up
  rule_DOCTOR,     // index+mid bent at PIP
  rule_HOSPITAL,   // index+mid straight, close together
  rule_NAME,       // index+mid spread medium
  rule_STUDENT,    // 4 fingers together, no thumb
  rule_STOP,       // 4 fingers together, thumb far
  rule_EMERGENCY,  // index only, very extended
  rule_POLICE,     // index + thumb pinch
  rule_SORRY,      // fist, thumb alongside (not above)
  rule_PLEASE,     // 4 fingers, no thumb
  rule_MY,         // 4 fingers together very close
  rule_YOU,        // index only, thumb far
  rule_THANK_YOU,  // all 5 together, wide spread
  rule_HELLO,      // all 5, max spread (checked last as most general)
];
