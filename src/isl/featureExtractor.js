/**
 * ISL Feature Extractor
 * ─────────────────────
 * Extracts normalized, scale-invariant geometric features from MediaPipe's
 * 21-point 3D hand landmark output. These features are consumed by all three
 * ISL classifiers (Alphabet, Number, Vocabulary).
 *
 * MediaPipe Landmark Indices:
 *   0 = Wrist
 *   1-4  = Thumb  (CMC, MCP, IP, TIP)
 *   5-8  = Index  (MCP, PIP, DIP, TIP)
 *   9-12 = Middle (MCP, PIP, DIP, TIP)
 *  13-16 = Ring   (MCP, PIP, DIP, TIP)
 *  17-20 = Pinky  (MCP, PIP, DIP, TIP)
 */

/** Euclidean distance between two 3D points. */
const dist3D = (a, b) => {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/** Euclidean distance between two 2D points (x,y only). */
const dist2D = (a, b) => {
  if (!a || !b) return 0;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

/**
 * Extract all ISL-relevant features from one hand's 21 landmarks.
 *
 * @param {Array} lm - 21 MediaPipe landmark objects [{x,y,z}...]
 * @returns {Object} features
 */
export const extractFeatures = (lm) => {
  if (!lm || lm.length < 21) return null;

  // Key landmarks
  const wrist    = lm[0];
  const thumbCMC = lm[1];
  const thumbMCP = lm[2];
  const thumbIP  = lm[3];
  const thumbTip = lm[4];

  const indexMCP = lm[5];
  const indexPIP = lm[6];
  const indexDIP = lm[7];
  const indexTip = lm[8];

  const midMCP   = lm[9];
  const midPIP   = lm[10];
  const midDIP   = lm[11];
  const midTip   = lm[12];

  const ringMCP  = lm[13];
  const ringPIP  = lm[14];
  const ringDIP  = lm[15];
  const ringTip  = lm[16];

  const pinkyMCP = lm[17];
  const pinkyPIP = lm[18];
  const pinkyDIP = lm[19];
  const pinkyTip = lm[20];

  // Scale reference: wrist to middle MCP (palm size)
  const palmSize = dist3D(wrist, midMCP) || 1;

  // ── Finger Extension Ratios (tip distance from wrist / MCP distance from wrist) ──
  // > 1.0 means the finger is extended beyond its MCP joint
  const thumbExt  = dist3D(thumbTip,  wrist) / (dist3D(thumbMCP,  wrist) || 1);
  const indexExt  = dist3D(indexTip,  wrist) / (dist3D(indexMCP,  wrist) || 1);
  const midExt    = dist3D(midTip,    wrist) / (dist3D(midMCP,    wrist) || 1);
  const ringExt   = dist3D(ringTip,   wrist) / (dist3D(ringMCP,   wrist) || 1);
  const pinkyExt  = dist3D(pinkyTip,  wrist) / (dist3D(pinkyMCP,  wrist) || 1);

  // Extension booleans (threshold 1.20 = comfortably extended)
  const THRESH = 1.20;
  const thumbUp  = thumbExt  > THRESH;
  const indexUp  = indexExt  > THRESH;
  const midUp    = midExt    > THRESH;
  const ringUp   = ringExt   > THRESH;
  const pinkyUp  = pinkyExt  > THRESH;

  // Count extended fingers (excluding thumb)
  const extCount = [indexUp, midUp, ringUp, pinkyUp].filter(Boolean).length;

  // ── Curl Ratios (tip to PIP distance vs. tip to MCP; lower = more curled) ──
  const indexCurl  = dist3D(indexTip,  indexPIP)  / (dist3D(indexTip,  indexMCP)  || 1);
  const midCurl    = dist3D(midTip,    midPIP)    / (dist3D(midTip,    midMCP)    || 1);
  const ringCurl   = dist3D(ringTip,   ringPIP)   / (dist3D(ringTip,   ringMCP)   || 1);
  const pinkyCurl  = dist3D(pinkyTip,  pinkyPIP)  / (dist3D(pinkyTip,  pinkyMCP)  || 1);

  // ── Pinch Distances (normalized by palm size) ──
  const thumbIndexPinch  = dist3D(thumbTip, indexTip)  / palmSize;
  const thumbMidPinch    = dist3D(thumbTip, midTip)    / palmSize;
  const thumbRingPinch   = dist3D(thumbTip, ringTip)   / palmSize;
  const thumbPinkyPinch  = dist3D(thumbTip, pinkyTip)  / palmSize;
  const indexMidPinch    = dist3D(indexTip, midTip)    / palmSize;
  const midRingPinch     = dist3D(midTip,   ringTip)   / palmSize;
  const ringPinkyPinch   = dist3D(ringTip,  pinkyTip)  / palmSize;

  // ── Spread (distance between index and pinky tips, normalized) ──
  const fingerSpread = dist3D(indexTip, pinkyTip) / palmSize;

  // ── Thumb Position Relative to Index ──
  // thumbAboveIndex: thumb tip is above (lower y = higher on screen) index MCP
  const thumbAboveIndex = thumbTip.y < indexMCP.y;
  const thumbBelowWrist = thumbTip.y > wrist.y;

  // ── Finger Crossing: Index over Middle ──
  const indexOverMid = indexTip.x < midTip.x; // approximate crossing (mirrored cam)

  // ── Bent (PIP higher than TIP = finger bent at PIP) ──
  const indexBentAtPIP = indexPIP.y < indexTip.y;
  const midBentAtPIP   = midPIP.y   < midTip.y;

  // ── Thumb Direction ──
  const thumbPointsDown  = thumbTip.y > thumbMCP.y + 0.02;
  const thumbPointsLeft  = thumbTip.x < thumbMCP.x - 0.02;
  const thumbPointsRight = thumbTip.x > thumbMCP.x + 0.02;
  const thumbPointsUp    = thumbTip.y < thumbMCP.y - 0.02;

  // ── Global Compactness (how tightly curled the overall hand is) ──
  // All tips vs. wrist average distance
  const avgTipDist = (
    dist3D(thumbTip, wrist) +
    dist3D(indexTip, wrist) +
    dist3D(midTip,   wrist) +
    dist3D(ringTip,  wrist) +
    dist3D(pinkyTip, wrist)
  ) / 5 / palmSize;

  // ── NEW: Palm Orientation (facing camera or away) ──────────────────────────
  // Cross product of (indexMCP - wrist) × (pinkyMCP - wrist) gives palm normal
  // If normal.z is negative, palm faces camera; if positive, palm faces away
  const v1 = { x: indexMCP.x - wrist.x, y: indexMCP.y - wrist.y, z: (indexMCP.z || 0) - (wrist.z || 0) };
  const v2 = { x: pinkyMCP.x - wrist.x, y: pinkyMCP.y - wrist.y, z: (pinkyMCP.z || 0) - (wrist.z || 0) };
  const palmNormalZ = v1.x * v2.y - v1.y * v2.x;
  const palmFacingCamera = palmNormalZ < 0;

  // ── NEW: Hand Orientation (horizontal vs vertical) ────────────────────────
  // Angle of wrist→midMCP vector relative to vertical (Y axis)
  const handVecX = midMCP.x - wrist.x;
  const handVecY = midMCP.y - wrist.y;
  const wristAngle = Math.atan2(Math.abs(handVecX), -handVecY); // 0 = vertical, π/2 = horizontal
  const handIsHorizontal = wristAngle > (Math.PI / 4); // > 45° from vertical

  // ── NEW: Hand Height in Frame ─────────────────────────────────────────────
  // 0 = top of frame, 1 = bottom of frame (using wrist y coordinate)
  const handHeightRatio = wrist.y; // MediaPipe normalizes to 0–1

  // ── NEW: Thumb Position Relative to Index MCP ─────────────────────────────
  // Distinguishes A (thumb alongside) vs S (thumb across front) vs T (thumb between)
  const thumbTipToIndexMCP = dist3D(thumbTip, indexMCP) / palmSize;
  // Does thumb tip cross in front of index MCP (x-axis check)?
  // In mirrored camera view, "crossing" means thumb moves toward the other fingers
  const thumbCrossesIndex = Math.abs(thumbTip.x - indexMCP.x) < 0.03 ||
    (thumbTip.x > indexMCP.x && thumbTip.x < midMCP.x) ||
    (thumbTip.x < indexMCP.x && thumbTip.x > midMCP.x);

  // ── NEW: Finger Tightness (how close the 4 finger tips are to each other) ─
  // Low value = tips bunched together (FOOD), higher = tips spread (O shape)
  const fingerTightness = (
    dist3D(indexTip, midTip) +
    dist3D(midTip,   ringTip) +
    dist3D(ringTip,  pinkyTip)
  ) / 3 / palmSize;

  // ── NEW: Combined Curl Score (0 = all extended, 1 = all fully curled) ──────
  const allFingersCurled = (
    (1 - Math.min(indexCurl, 1)) +
    (1 - Math.min(midCurl, 1)) +
    (1 - Math.min(ringCurl, 1)) +
    (1 - Math.min(pinkyCurl, 1))
  ) / 4;

  return {
    // Raw landmark refs
    lm,
    wrist, thumbTip, indexTip, midTip, ringTip, pinkyTip,
    thumbMCP, indexMCP, midMCP, ringMCP, pinkyMCP,
    thumbIP, indexPIP, midPIP, ringPIP, pinkyPIP,

    // Scale
    palmSize,

    // Extension ratios (continuous)
    thumbExt, indexExt, midExt, ringExt, pinkyExt,

    // Extension booleans
    thumbUp, indexUp, midUp, ringUp, pinkyUp,
    extCount,

    // Curl ratios
    indexCurl, midCurl, ringCurl, pinkyCurl,

    // Pinch distances (normalized)
    thumbIndexPinch, thumbMidPinch, thumbRingPinch, thumbPinkyPinch,
    indexMidPinch, midRingPinch, ringPinkyPinch,

    // Spread
    fingerSpread,

    // Thumb position
    thumbAboveIndex, thumbBelowWrist,
    thumbPointsLeft, thumbPointsRight, thumbPointsUp, thumbPointsDown,

    // Finger crossing
    indexOverMid,

    // Bending
    indexBentAtPIP, midBentAtPIP,

    // Compactness
    avgTipDist,

    // NEW — Orientation & differentiation features
    palmFacingCamera,     // true if palm faces camera
    palmNormalZ,          // raw normal Z (continuous value)
    handIsHorizontal,     // true if hand is rotated > 45° from vertical
    wristAngle,           // radians from vertical (0 = up, π/2 = horizontal)
    handHeightRatio,      // 0 = top, 1 = bottom of frame
    thumbCrossesIndex,    // true if thumb crosses in front of index
    thumbTipToIndexMCP,   // normalized distance thumb tip to index MCP
    fingerTightness,      // how close 4 finger tips are (low = bunched)
    allFingersCurled,     // combined curl score (high = all curled)
  };
};

/**
 * Extract features from two hands.
 * @param {Array} landmarks - Array of hand landmark arrays (up to 2)
 * @returns {{ dominant: Object|null, offhand: Object|null }}
 */
export const extractTwoHandFeatures = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return { dominant: null, offhand: null };
  const dominant = extractFeatures(landmarks[0]);
  const offhand  = landmarks.length > 1 ? extractFeatures(landmarks[1]) : null;
  return { dominant, offhand };
};
