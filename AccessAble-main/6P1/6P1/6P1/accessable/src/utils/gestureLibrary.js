import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

const standardSignLookup = {
  HELLO: 'Hello / Hi',
  THANKS: 'Thank you',
  YES: 'Yes',
  NO: 'No',
  PLEASE: 'Please',
  STOP: 'Stop',
  HELP: 'Help',
  VICTORY: 'Victory / Peace',
  'I LOVE YOU': 'I Love You',
  'POINTING UP': 'Pointing Up'
};

export const getStandardSignMeaning = (gesture) => {
  if (!gesture) return 'Unknown';
  const key = gesture.split('/')[0].trim().toUpperCase();
  return standardSignLookup[key] || 'Standard sign not recognized';
};

export const getSignFromText = (text) => {
  if (!text) return 'No sign associated';
  const key = text.trim().toUpperCase();
  return standardSignLookup[key] || 'Sign for this text not embedded';
};

// Map MediaPipe gestures to our signs
const gestureMapping = {
  'Open_Palm': 'HELLO',
  'Closed_Fist': 'STOP',
  'Thumb_Up': 'YES',
  'Thumb_Down': 'NO',
  'Victory': 'VICTORY',
  'ILoveYou': 'I LOVE YOU',
  'Pointing_Up': 'POINTING UP'
};

let gestureRecognizer = null;

export const initializeGestureRecognizer = async () => {
  if (gestureRecognizer) return gestureRecognizer;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU'
    },
    runningMode: 'IMAGE'
  });

  return gestureRecognizer;
};

export const detectGestureFromImage = async (image) => {
  if (!gestureRecognizer) {
    await initializeGestureRecognizer();
  }

  const result = await gestureRecognizer.recognize(image);
  if (result.gestures && result.gestures.length > 0) {
    const gesture = result.gestures[0][0].categoryName;
    return gestureMapping[gesture] || gesture;
  }
  return 'IDLE (NO SIGN)';
};

// Fallback function for landmarks (old method)
const isFingerExtended = (tip, pip) => tip.y < pip.y;
const isFingerCurled = (tip, pip) => tip.y > pip.y;

export const detectGesture = (landmarks) => {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 21) {
    return 'IDLE (NO SIGN)';
  }

  try {
    const tip = (index) => landmarks[index];
    const pip = (index) => landmarks[index - 2];

    // Open palm (HELLO): all fingers extend and separation large
    const extended = [8, 12, 16, 20].every((i) => isFingerExtended(tip(i), pip(i)));
    if (extended) {
      return 'HELLO';
    }

    // Fist (STOP)
    const curled = [8, 12, 16, 20].every((i) => isFingerCurled(tip(i), pip(i)));
    if (curled) {
      return 'STOP';
    }

    // Thumb up (YES, roughly)
    const thumbUp = isFingerExtended(landmarks[4], landmarks[3]) && [8, 12, 16, 20].every((i) => isFingerCurled(tip(i), pip(i)));
    if (thumbUp) {
      return 'YES';
    }

    // NO: index and middle extended, ring and pinky curled
    if (isFingerExtended(tip(8), pip(8)) && isFingerExtended(tip(12), pip(12))
      && isFingerCurled(tip(16), pip(16)) && isFingerCurled(tip(20), pip(20))) {
      return 'NO';
    }

    // HELP: index extended only
    if (isFingerExtended(tip(8), pip(8)) && [12, 16, 20].every((i) => isFingerCurled(tip(i), pip(i)))) {
      return 'HELP';
    }

    // Fallback patterns
    if (landmarks[8].y < landmarks[12].y && landmarks[8].y < landmarks[6].y) {
      return 'HELLO';
    }

    if (landmarks[8].y < landmarks[5].y && landmarks[12].y < landmarks[9].y) {
      return 'I AM LISTENING';
    }
  } catch (err) {
    console.error('Error detecting gesture:', err);
  }

  return 'IDLE (NO SIGN)';
};
