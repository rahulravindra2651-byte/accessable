/**
 * Indian Sign Language (ISL) Master Dictionary
 * ─────────────────────────────────────────────
 * Single source of truth for all ISL signs used by the recognition pipeline.
 *
 * HOW TO ADD A NEW ISL SIGN:
 * 1. Add an entry to ISL_VOCABULARY below.
 * 2. Add a corresponding rule in islVocabularyClassifier.js (for words)
 *    or update islAlphabetClassifier.js (for letters).
 * 3. Optionally add grammar patterns to ISL_GRAMMAR_PATTERNS.
 * The pipeline picks up new entries automatically.
 *
 * Reference: ISLRTC (Indian Sign Language Research and Training Centre, Govt. of India)
 */

// ─── Categories ──────────────────────────────────────────────────────────────

export const ISL_CATEGORIES = {
  ALPHABETS:  'ISL Alphabets (A–Z)',
  NUMBERS:    'ISL Numbers (0–9)',
  GREETINGS:  'Greetings & Courtesies',
  EMERGENCY:  'Emergency & Assistance',
  FAMILY:     'Family & People',
  PLACES:     'Places & Locations',
  CONVERSATION: 'Conversational',
  ACTIONS:    'Actions & Needs',
  QUESTIONS:  'Questions',
};

// ─── ISL Alphabets (A–Z) ─────────────────────────────────────────────────────
export const ISL_ALPHABETS = [
  { id: 'A', gloss: 'A', label: 'A', category: ISL_CATEGORIES.ALPHABETS, emoji: '🅰️',  description: 'Closed fist, thumb resting against the side of the index finger' },
  { id: 'B', gloss: 'B', label: 'B', category: ISL_CATEGORIES.ALPHABETS, emoji: '🅱️',  description: 'Four fingers extended straight up, thumb folded across palm' },
  { id: 'C', gloss: 'C', label: 'C', category: ISL_CATEGORIES.ALPHABETS, emoji: '©️',   description: 'Hand curved into a C shape, all fingers slightly bent' },
  { id: 'D', gloss: 'D', label: 'D', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔵',  description: 'Index finger extended up, thumb touching middle fingertip, others curled' },
  { id: 'E', gloss: 'E', label: 'E', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'All fingers bent at first joint, thumb tucked under, compact shape' },
  { id: 'F', gloss: 'F', label: 'F', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index-thumb circle (OK), middle+ring+pinky extended up' },
  { id: 'G', gloss: 'G', label: 'G', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index finger and thumb pointing horizontally like a gun' },
  { id: 'H', gloss: 'H', label: 'H', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index and middle fingers extended side by side horizontally' },
  { id: 'I', gloss: 'I', label: 'I', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Pinky finger extended straight up, others curled' },
  { id: 'J', gloss: 'J', label: 'J', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Pinky extended + thumb up (I + motion arc)' },
  { id: 'K', gloss: 'K', label: 'K', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index and middle in V, thumb between them touching middle tip' },
  { id: 'L', gloss: 'L', label: 'L', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index finger up + thumb extended sideways forming L shape' },
  { id: 'M', gloss: 'M', label: 'M', category: ISL_CATEGORIES.ALPHABETS, emoji: '〽️',  description: 'Three fingers tucked over thumb, pinky curled' },
  { id: 'N', gloss: 'N', label: 'N', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Two fingers (index + middle) tucked over thumb' },
  { id: 'O', gloss: 'O', label: 'O', category: ISL_CATEGORIES.ALPHABETS, emoji: '⭕',   description: 'All fingers and thumb form an O circle shape' },
  { id: 'P', gloss: 'P', label: 'P', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index bent downward, middle extended, thumb out' },
  { id: 'Q', gloss: 'Q', label: 'Q', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index and thumb pointing downward' },
  { id: 'R', gloss: 'R', label: 'R', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index and middle fingers crossed (index over middle)' },
  { id: 'S', gloss: 'S', label: 'S', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Closed fist with thumb across front of fingers' },
  { id: 'T', gloss: 'T', label: 'T', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Thumb between index and middle fingers in a fist' },
  { id: 'U', gloss: 'U', label: 'U', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index and middle fingers together, extended up' },
  { id: 'V', gloss: 'V', label: 'V', category: ISL_CATEGORIES.ALPHABETS, emoji: '✌️',   description: 'Index and middle fingers spread in a V (Victory/Peace)' },
  { id: 'W', gloss: 'W', label: 'W', category: ISL_CATEGORIES.ALPHABETS, emoji: '🔤',  description: 'Index, middle and ring fingers spread wide, pinky curled' },
  { id: 'X', gloss: 'X', label: 'X', category: ISL_CATEGORIES.ALPHABETS, emoji: '❌',   description: 'Index finger bent/hooked, all others curled' },
  { id: 'Y', gloss: 'Y', label: 'Y', category: ISL_CATEGORIES.ALPHABETS, emoji: '🤙',   description: 'Thumb and pinky extended, other fingers curled (hang loose)' },
  { id: 'Z', gloss: 'Z', label: 'Z', category: ISL_CATEGORIES.ALPHABETS, emoji: '💤',   description: 'Index finger extended, tracing a Z shape in the air' },
];

// ─── ISL Numbers (0–9) ───────────────────────────────────────────────────────
export const ISL_NUMBERS = [
  { id: 'ZERO',  gloss: 'ZERO',  label: '0 (Zero)',  category: ISL_CATEGORIES.NUMBERS, emoji: '0️⃣', description: 'All fingers and thumb forming a tight O circle' },
  { id: 'ONE',   gloss: 'ONE',   label: '1 (One)',   category: ISL_CATEGORIES.NUMBERS, emoji: '1️⃣', description: 'Index finger pointing straight up, others curled' },
  { id: 'TWO',   gloss: 'TWO',   label: '2 (Two)',   category: ISL_CATEGORIES.NUMBERS, emoji: '2️⃣', description: 'Index and middle fingers extended in a V or together' },
  { id: 'THREE', gloss: 'THREE', label: '3 (Three)', category: ISL_CATEGORIES.NUMBERS, emoji: '3️⃣', description: 'Thumb, index and middle fingers extended' },
  { id: 'FOUR',  gloss: 'FOUR',  label: '4 (Four)',  category: ISL_CATEGORIES.NUMBERS, emoji: '4️⃣', description: 'Four fingers extended, thumb tucked across palm' },
  { id: 'FIVE',  gloss: 'FIVE',  label: '5 (Five)',  category: ISL_CATEGORIES.NUMBERS, emoji: '5️⃣', description: 'All five fingers fully spread (open palm / starfish)' },
  { id: 'SIX',   gloss: 'SIX',   label: '6 (Six)',   category: ISL_CATEGORIES.NUMBERS, emoji: '6️⃣', description: 'Thumb touches pinky tip, other 3 fingers extended (ISL-specific)' },
  { id: 'SEVEN', gloss: 'SEVEN', label: '7 (Seven)', category: ISL_CATEGORIES.NUMBERS, emoji: '7️⃣', description: 'Thumb touches ring finger tip, index+middle+pinky extended' },
  { id: 'EIGHT', gloss: 'EIGHT', label: '8 (Eight)', category: ISL_CATEGORIES.NUMBERS, emoji: '8️⃣', description: 'Thumb touches middle finger tip, index+ring+pinky extended' },
  { id: 'NINE',  gloss: 'NINE',  label: '9 (Nine)',  category: ISL_CATEGORIES.NUMBERS, emoji: '9️⃣', description: 'Thumb touches index tip, middle+ring+pinky extended' },
];

// ─── ISL Vocabulary (Words & Phrases) ────────────────────────────────────────
export const ISL_VOCABULARY = [
  // ── Greetings ──
  { id: 'HELLO',      gloss: 'HELLO',      label: 'Hello / Namaste',   category: ISL_CATEGORIES.GREETINGS, emoji: '🙏',  description: 'Both palms pressed together (Namaste) or open palm wave' },
  { id: 'THANK_YOU',  gloss: 'THANK YOU',  label: 'Thank You',         category: ISL_CATEGORIES.GREETINGS, emoji: '🙏',  description: 'Flat hand moving forward from chin or chest' },
  { id: 'PLEASE',     gloss: 'PLEASE',     label: 'Please',            category: ISL_CATEGORIES.GREETINGS, emoji: '🤲',  description: 'Open hand rubbing a circle over the heart/chest' },
  { id: 'SORRY',      gloss: 'SORRY',      label: 'Sorry',             category: ISL_CATEGORIES.GREETINGS, emoji: '🙇',  description: 'Closed fist moving in circular motion over chest' },
  { id: 'WELCOME',    gloss: 'WELCOME',    label: 'Welcome',           category: ISL_CATEGORIES.GREETINGS, emoji: '🤗',  description: 'Open palm sweeping inward toward body' },
  { id: 'GOOD',       gloss: 'GOOD',       label: 'Good / Fine',       category: ISL_CATEGORIES.GREETINGS, emoji: '👍',  description: 'Thumb up, fist closed (thumbs up gesture)' },
  { id: 'GOOD_MORNING', gloss: 'GOOD MORNING', label: 'Good Morning', category: ISL_CATEGORIES.GREETINGS, emoji: '🌅',  description: 'Open flat hand from chin moving forward + rising arc' },
  { id: 'GOOD_NIGHT', gloss: 'GOOD NIGHT', label: 'Good Night',       category: ISL_CATEGORIES.GREETINGS, emoji: '🌙',  description: 'Hand moving down from chin + sleep gesture (eyes closed)' },

  // ── Emergency & Assistance ──
  { id: 'HELP',       gloss: 'HELP',       label: 'Help / Assist',     category: ISL_CATEGORIES.EMERGENCY, emoji: '🆘',  description: 'Closed fist on flat palm of other hand, moving upward' },
  { id: 'EMERGENCY',  gloss: 'EMERGENCY',  label: 'Emergency',         category: ISL_CATEGORIES.EMERGENCY, emoji: '🚨',  description: 'Index finger pointing up and shaking side to side' },
  { id: 'WATER',      gloss: 'WATER',      label: 'Water',             category: ISL_CATEGORIES.EMERGENCY, emoji: '💧',  description: 'W-gesture (index+middle+ring) tapping chin twice' },
  { id: 'DOCTOR',     gloss: 'DOCTOR',     label: 'Doctor / Medical',  category: ISL_CATEGORIES.EMERGENCY, emoji: '🩺',  description: 'Tapping wrist pulse with index and middle fingers' },
  { id: 'MEDICINE',   gloss: 'MEDICINE',   label: 'Medicine',          category: ISL_CATEGORIES.EMERGENCY, emoji: '💊',  description: 'Middle finger rocking on thumb, other fingers extended' },
  { id: 'HOSPITAL',   gloss: 'HOSPITAL',   label: 'Hospital',          category: ISL_CATEGORIES.EMERGENCY, emoji: '🏥',  description: 'H handshape (index+middle) tracing a cross on upper arm' },
  { id: 'POLICE',     gloss: 'POLICE',     label: 'Police',            category: ISL_CATEGORIES.EMERGENCY, emoji: '👮',  description: 'C handshape on shoulder/chest (like a badge)' },
  { id: 'STOP',       gloss: 'STOP',       label: 'Stop / Halt',       category: ISL_CATEGORIES.EMERGENCY, emoji: '🛑',  description: 'Flat vertical palm chop down onto flat horizontal palm' },
  { id: 'DANGER',     gloss: 'DANGER',     label: 'Danger / Be Careful', category: ISL_CATEGORIES.EMERGENCY, emoji: '⚠️', description: 'Fists tapping together twice with alert expression' },

  // ── Family & People ──
  { id: 'MOTHER',     gloss: 'MOTHER',     label: 'Mother / Amma',     category: ISL_CATEGORIES.FAMILY, emoji: '👩',  description: 'M handshape tapping chin' },
  { id: 'FATHER',     gloss: 'FATHER',     label: 'Father / Appa',     category: ISL_CATEGORIES.FAMILY, emoji: '👨',  description: 'F/5 handshape tapping forehead' },
  { id: 'BROTHER',    gloss: 'BROTHER',    label: 'Brother',           category: ISL_CATEGORIES.FAMILY, emoji: '👦',  description: 'L-shape at temple + hands coming together' },
  { id: 'SISTER',     gloss: 'SISTER',     label: 'Sister',            category: ISL_CATEGORIES.FAMILY, emoji: '👧',  description: 'A-shape at chin + hands moving apart' },

  // ── Places & Locations ──
  { id: 'HOME',       gloss: 'HOME',       label: 'Home',              category: ISL_CATEGORIES.PLACES, emoji: '🏠',  description: 'Fingertips together tapping cheek twice' },
  { id: 'SCHOOL',     gloss: 'SCHOOL',     label: 'School',            category: ISL_CATEGORIES.PLACES, emoji: '🏫',  description: 'Both flat palms clapping together twice' },
  { id: 'COLLEGE',    gloss: 'COLLEGE',    label: 'College',           category: ISL_CATEGORIES.PLACES, emoji: '🎓',  description: 'C handshape on flat palm, moving in a circle' },

  // ── Conversational ──
  { id: 'MY',         gloss: 'MY',         label: 'My / Mine',         category: ISL_CATEGORIES.CONVERSATION, emoji: '🙋', description: 'Flat palm placed firmly on center of chest' },
  { id: 'YOU',        gloss: 'YOU',        label: 'You / Your',        category: ISL_CATEGORIES.CONVERSATION, emoji: '👉', description: 'Index finger pointing directly forward' },
  { id: 'NAME',       gloss: 'NAME',       label: 'Name',              category: ISL_CATEGORIES.CONVERSATION, emoji: '🏷️', description: 'H handshape (index+middle) fingers tapping together twice' },
  { id: 'YES',        gloss: 'YES',        label: 'Yes / Agree',       category: ISL_CATEGORIES.CONVERSATION, emoji: '✅', description: 'Closed fist nodding up and down like a head nod' },
  { id: 'NO',         gloss: 'NO',         label: 'No / Disagree',     category: ISL_CATEGORIES.CONVERSATION, emoji: '❌', description: 'Index and middle finger snapping shut against thumb' },
  { id: 'GOOD_AFTERNOON', gloss: 'GOOD AFTERNOON', label: 'Good Afternoon', category: ISL_CATEGORIES.CONVERSATION, emoji: '☀️', description: 'Flat hand from chin moving forward, slightly downward arc' },

  // ── Actions & Needs ──
  { id: 'EAT',        gloss: 'EAT',        label: 'Food / Eat',        category: ISL_CATEGORIES.ACTIONS, emoji: '🍱',  description: 'Fingertips bunched together tapping mouth' },
  { id: 'SLEEP',      gloss: 'SLEEP',      label: 'Sleep',             category: ISL_CATEGORIES.ACTIONS, emoji: '😴',  description: 'Hand moving down face as if closing eyes' },
  { id: 'WANT',       gloss: 'WANT',       label: 'Want / Need',       category: ISL_CATEGORIES.ACTIONS, emoji: '🤲',  description: 'Both cupped hands pulling backward toward body' },
  { id: 'GO',         gloss: 'GO',         label: 'Go',                category: ISL_CATEGORIES.ACTIONS, emoji: '🚶',  description: 'Index fingers pointing and moving forward away from body' },
  { id: 'COME',       gloss: 'COME',       label: 'Come',              category: ISL_CATEGORIES.ACTIONS, emoji: '🫴',  description: 'Index fingers waving inward toward body' },
  { id: 'LEARN',      gloss: 'LEARN',      label: 'Learn / Study',     category: ISL_CATEGORIES.ACTIONS, emoji: '📚',  description: 'Flat hand grasping from open palm and placing on forehead' },

  // ── Questions ──
  { id: 'WHAT',       gloss: 'WHAT',       label: 'What?',             category: ISL_CATEGORIES.QUESTIONS, emoji: '❓', description: 'Both open palms held out, shaking side to side' },
  { id: 'HOW',        gloss: 'HOW',        label: 'How?',              category: ISL_CATEGORIES.QUESTIONS, emoji: '🤔', description: 'Curved hands rolling outward from chest' },
  { id: 'WHERE',      gloss: 'WHERE',      label: 'Where?',            category: ISL_CATEGORIES.QUESTIONS, emoji: '📍', description: 'Index finger pointing up, shaking side to side' },
  { id: 'HOW_ARE_YOU', gloss: 'HOW ARE YOU', label: 'How are you?',   category: ISL_CATEGORIES.QUESTIONS, emoji: '😊', description: 'HOW sign followed by YOU sign' },

  // ── People/Roles ──
  { id: 'STUDENT',    gloss: 'STUDENT',    label: 'Student',           category: ISL_CATEGORIES.FAMILY, emoji: '📖', description: 'Learn sign: flat hand grasping from palm to forehead' },
  { id: 'TEACHER',    gloss: 'TEACHER',    label: 'Teacher',           category: ISL_CATEGORIES.FAMILY, emoji: '👩‍🏫', description: 'Both hands with bent fingers moving forward from temples' },
  { id: 'BAD',        gloss: 'BAD',        label: 'Bad',               category: ISL_CATEGORIES.CONVERSATION, emoji: '👎', description: 'Flat palm turning sharply downward' },
];

// ─── Combined dictionary (alphabets + numbers + vocabulary) ──────────────────
// Used by the Vocabulary Explorer UI
export const ISL_ALL_SIGNS = [
  ...ISL_VOCABULARY,
  ...ISL_ALPHABETS,
  ...ISL_NUMBERS,
];

// ─── Grammar Patterns ────────────────────────────────────────────────────────
export const ISL_GRAMMAR_PATTERNS = [
  { glosses: ['HELLO'],               sentence: 'Hello! Namaste.' },
  { glosses: ['THANK_YOU'],           sentence: 'Thank you very much.' },
  { glosses: ['MY', 'NAME'],          sentence: 'My name is…' },
  { glosses: ['HELP', 'ME'],          sentence: 'Please help me.' },
  { glosses: ['HELP', 'WATER'],       sentence: 'Please bring me water.' },
  { glosses: ['WANT', 'WATER'],       sentence: 'I would like some water.' },
  { glosses: ['WANT', 'EAT'],         sentence: 'I am hungry and would like to eat.' },
  { glosses: ['HOW', 'YOU'],          sentence: 'How are you?' },
  { glosses: ['HOW_ARE_YOU'],         sentence: 'How are you?' },
  { glosses: ['EMERGENCY', 'HELP'],   sentence: 'Emergency! Please send help immediately.' },
  { glosses: ['DOCTOR', 'NEED'],      sentence: 'I need medical assistance.' },
  { glosses: ['HELP', 'HOSPITAL'],    sentence: 'Please take me to a hospital.' },
  { glosses: ['WANT', 'MEDICINE'],    sentence: 'I need medicine.' },
  { glosses: ['GOOD_MORNING'],        sentence: 'Good Morning!' },
  { glosses: ['GOOD_NIGHT'],          sentence: 'Good Night!' },
  { glosses: ['MY', 'HOME'],          sentence: 'My home.' },
  { glosses: ['GO', 'HOME'],          sentence: 'I want to go home.' },
  { glosses: ['GO', 'SCHOOL'],        sentence: 'I am going to school.' },
  { glosses: ['WANT', 'HELP'],        sentence: 'I need help.' },
  { glosses: ['NO', 'STOP'],          sentence: 'No! Stop!' },
  { glosses: ['SORRY', 'PLEASE'],     sentence: 'I am sorry, please.' },
  { glosses: ['YES', 'PLEASE'],       sentence: 'Yes, please.' },
  { glosses: ['HELLO', 'MY', 'NAME'], sentence: 'Hello! My name is…' },
];
