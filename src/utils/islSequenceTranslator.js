import { ISL_VOCABULARY, ISL_GRAMMAR_PATTERNS } from './islDictionary';

/**
 * Euclidean distance between two 3D points.
 */
const distance3D = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Map MediaPipe pre-trained gesture category names to ISL vocabulary IDs
const MEDIAPIPE_GESTURE_MAP = {
  Open_Palm: 'HELLO',
  Closed_Fist: 'STOP',
  Thumb_Up: 'YES',
  Thumb_Down: 'NO',
  Victory: 'GOOD',
  ILoveYou: 'WELCOME',
  Pointing_Up: 'ONE',
};

/**
 * Robust 3D Orientation-Invariant Landmark & Gesture Classifier.
 * Evaluates MediaPipe 3D hand landmarks and gesture recognizer categories.
 *
 * @param {Array} landmarks - 21 MediaPipe 3D landmark points for a hand.
 * @param {Array} gestures - MediaPipe top gesture categories (optional).
 * @returns {{ sign: object, confidence: number } | null}
 */
export const classifySingleFrameHand = (landmarks, gestures = null) => {
  if (!landmarks || landmarks.length < 21) return null;

  const getItem = (id) => ISL_VOCABULARY.find((v) => v.id === id);

  // 1. Check MediaPipe pre-trained gesture model (Threshold: 0.50)
  if (gestures && gestures.length > 0 && gestures[0].length > 0) {
    const topCategory = gestures[0][0].categoryName;
    const topScore = gestures[0][0].score;

    if (topScore >= 0.50 && MEDIAPIPE_GESTURE_MAP[topCategory]) {
      const vocabId = MEDIAPIPE_GESTURE_MAP[topCategory];
      const found = getItem(vocabId);
      if (found) return { sign: found, confidence: Math.min(topScore + 0.1, 0.98) };
    }
  }

  // 2. Orientation-Invariant 3D Distance Landmark Classifier
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const mcp = (idx) => landmarks[idx - 3]; // Metacarpophalangeal joint

  // Extension status based on distance from wrist
  const distFromWrist = (point) => distance3D(point, wrist);

  const indexExt = distFromWrist(indexTip) > distFromWrist(mcp(8)) * 1.15;
  const middleExt = distFromWrist(middleTip) > distFromWrist(mcp(12)) * 1.15;
  const ringExt = distFromWrist(ringTip) > distFromWrist(mcp(16)) * 1.15;
  const pinkyExt = distFromWrist(pinkyTip) > distFromWrist(mcp(20)) * 1.15;

  const allFingersExt = indexExt && middleExt && ringExt && pinkyExt;
  const allFingersCurled = !indexExt && !middleExt && !ringExt && !pinkyExt;

  // ── Open Palm / Wave -> HELLO ──
  if (allFingersExt) {
    return { sign: getItem('HELLO'), confidence: 0.92 };
  }

  // ── Closed Fist / Halt -> STOP ──
  if (allFingersCurled && thumbTip.y > indexTip.y) {
    return { sign: getItem('STOP'), confidence: 0.91 };
  }

  // ── Thumb Up -> YES ──
  if (allFingersCurled && thumbTip.y < indexTip.y) {
    return { sign: getItem('YES'), confidence: 0.93 };
  }

  // ── Index & Middle Extended -> NO / GOOD ──
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return { sign: getItem('NO'), confidence: 0.89 };
  }

  // ── W-Gesture (3 Fingers) -> WATER ──
  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return { sign: getItem('WATER'), confidence: 0.90 };
  }

  // ── Index Only -> ONE / YOU ──
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { sign: getItem('ONE'), confidence: 0.94 };
  }

  // ── Thumb + Index + Middle -> THREE ──
  if (indexExt && middleExt && distFromWrist(thumbTip) > distFromWrist(wrist) * 0.4) {
    return { sign: getItem('THREE'), confidence: 0.88 };
  }

  // ── Four Fingers -> FOUR ──
  if (indexExt && middleExt && ringExt && pinkyExt) {
    return { sign: getItem('FOUR'), confidence: 0.90 };
  }

  // ── Five Spread -> FIVE ──
  if (allFingersExt && distance3D(indexTip, pinkyTip) > 0.3) {
    return { sign: getItem('FIVE'), confidence: 0.93 };
  }

  // ── Default fallback for active hand ──
  return { sign: getItem('HELLO'), confidence: 0.75 };
};

/**
 * Continuous Sequence Translator & Grammar Formatter.
 */
export const formatISLSequenceToSentence = (glosses) => {
  if (!glosses || !glosses.length) return '';

  const cleanGlosses = glosses.map((g) => g.toUpperCase().trim());

  // Check exact or partial grammar patterns
  for (const pattern of ISL_GRAMMAR_PATTERNS) {
    if (
      pattern.glosses.length === cleanGlosses.length &&
      pattern.glosses.every((val, idx) => val === cleanGlosses[idx])
    ) {
      return pattern.sentence;
    }
  }

  // Default fallback: concatenate labels intelligently
  const words = cleanGlosses.map((id) => {
    const item = ISL_VOCABULARY.find((v) => v.id === id);
    return item ? item.label.split('/')[0].trim() : id;
  });

  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
};
