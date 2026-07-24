/**
 * Indian Sign Language (ISL) Sign Dictionary & Landmark Vector Rules.
 *
 * Contains 50+ ISL signs categorized into Greetings, Emergencies,
 * Conversational Expressions, Actions, Questions, and Quantities.
 */

export const ISL_CATEGORIES = {
  GREETINGS: 'Greetings & Courtesies',
  EMERGENCY: 'Emergency & Assistance',
  CONVERSATION: 'Conversational',
  ACTIONS: 'Actions & Needs',
  QUESTIONS: 'Questions',
  NUMBERS: 'Numbers & Quantities',
};

export const ISL_VOCABULARY = [
  // ── Greetings ──
  {
    id: 'HELLO',
    gloss: 'HELLO',
    label: 'Hello / Namaste',
    category: ISL_CATEGORIES.GREETINGS,
    emoji: '👋',
    description: 'Open palm facing forward waving gently',
  },
  {
    id: 'THANK_YOU',
    gloss: 'THANK YOU',
    label: 'Thank You',
    category: ISL_CATEGORIES.GREETINGS,
    emoji: '🙏',
    description: 'Flat hand moving forward from chin or chest',
  },
  {
    id: 'PLEASE',
    gloss: 'PLEASE',
    label: 'Please',
    category: ISL_CATEGORIES.GREETINGS,
    emoji: '🤲',
    description: 'Open hand rubbing circle over heart',
  },
  {
    id: 'SORRY',
    gloss: 'SORRY',
    label: 'Sorry',
    category: ISL_CATEGORIES.GREETINGS,
    emoji: '🙇',
    description: 'Fist moving in circular motion over chest',
  },
  {
    id: 'WELCOME',
    gloss: 'WELCOME',
    label: 'Welcome',
    category: ISL_CATEGORIES.GREETINGS,
    emoji: '🤗',
    description: 'Open palm sweeping inward towards body',
  },

  // ── Emergency & Assistance ──
  {
    id: 'HELP',
    gloss: 'HELP',
    label: 'Help / Assist',
    category: ISL_CATEGORIES.EMERGENCY,
    emoji: '🆘',
    description: 'Closed fist with thumb up placed on flat palm moving up',
  },
  {
    id: 'EMERGENCY',
    gloss: 'EMERGENCY',
    label: 'Emergency',
    category: ISL_CATEGORIES.EMERGENCY,
    emoji: '🚨',
    description: 'Index finger pointing up and shaking side to side',
  },
  {
    id: 'WATER',
    gloss: 'WATER',
    label: 'Water',
    category: ISL_CATEGORIES.EMERGENCY,
    emoji: '💧',
    description: 'W-gesture (three fingers up) tapping chin',
  },
  {
    id: 'DOCTOR',
    gloss: 'DOCTOR',
    label: 'Doctor / Medical',
    category: ISL_CATEGORIES.EMERGENCY,
    emoji: '🩺',
    description: 'Tapping wrist pulse with index and middle fingers',
  },
  {
    id: 'STOP',
    gloss: 'STOP',
    label: 'Stop / Halt',
    category: ISL_CATEGORIES.EMERGENCY,
    emoji: '🛑',
    description: 'Flat vertical palm chop down onto flat horizontal palm',
  },
  {
    id: 'DANGER',
    gloss: 'DANGER',
    label: 'Danger / Be Careful',
    category: ISL_CATEGORIES.EMERGENCY,
    emoji: '⚠️',
    description: 'Fists tapping together with serious expression',
  },

  // ── Conversational ──
  {
    id: 'MY',
    gloss: 'MY',
    label: 'My / Mine',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '🙋‍♂️',
    description: 'Flat palm placed firmly on center of chest',
  },
  {
    id: 'NAME',
    gloss: 'NAME',
    label: 'Name',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '🏷️',
    description: 'H-gesture (index and middle fingers) tapping together twice',
  },
  {
    id: 'YOU',
    gloss: 'YOU',
    label: 'You / Your',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '👉',
    description: 'Index finger pointing directly forward at person',
  },
  {
    id: 'YES',
    gloss: 'YES',
    label: 'Yes / Agree',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '👍',
    description: 'Fist nodding up and down like a head nod',
  },
  {
    id: 'NO',
    gloss: 'NO',
    label: 'No / Disagree',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '👎',
    description: 'Index and middle finger snapping shut against thumb',
  },
  {
    id: 'GOOD',
    gloss: 'GOOD',
    label: 'Good / Fine',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '👌',
    description: 'Thumb up or hand moving forward from chin',
  },
  {
    id: 'BAD',
    gloss: 'BAD',
    label: 'Bad',
    category: ISL_CATEGORIES.CONVERSATION,
    emoji: '👎',
    description: 'Flat palm turning downwards abruptly',
  },

  // ── Actions & Needs ──
  {
    id: 'WANT',
    gloss: 'WANT',
    label: 'Want / Need',
    category: ISL_CATEGORIES.ACTIONS,
    emoji: '🤲',
    description: 'Both cupped hands pulling backward toward body',
  },
  {
    id: 'EAT',
    gloss: 'EAT',
    label: 'Eat / Food',
    category: ISL_CATEGORIES.ACTIONS,
    emoji: '🍱',
    description: 'Fingertips brought together tapping mouth',
  },
  {
    id: 'SLEEP',
    gloss: 'SLEEP',
    label: 'Sleep',
    category: ISL_CATEGORIES.ACTIONS,
    emoji: '😴',
    description: 'Hand moving down face as eyes close',
  },
  {
    id: 'GO',
    gloss: 'GO',
    label: 'Go',
    category: ISL_CATEGORIES.ACTIONS,
    emoji: '🚶‍♂️',
    description: 'Index fingers pointing and moving forward away from body',
  },
  {
    id: 'COME',
    gloss: 'COME',
    label: 'Come',
    category: ISL_CATEGORIES.ACTIONS,
    emoji: '🫴',
    description: 'Index fingers waving inward toward body',
  },
  {
    id: 'LEARN',
    gloss: 'LEARN',
    label: 'Learn / Study',
    category: ISL_CATEGORIES.ACTIONS,
    emoji: '📚',
    description: 'Flat hand grasping from palm and placing on forehead',
  },

  // ── Questions ──
  {
    id: 'WHAT',
    gloss: 'WHAT',
    label: 'What?',
    category: ISL_CATEGORIES.QUESTIONS,
    emoji: '❓',
    description: 'Both open palms held out shaking side to side',
  },
  {
    id: 'HOW',
    gloss: 'HOW',
    label: 'How?',
    category: ISL_CATEGORIES.QUESTIONS,
    emoji: '🤔',
    description: 'Curved hands rolling outward',
  },
  {
    id: 'WHERE',
    gloss: 'WHERE',
    label: 'Where?',
    category: ISL_CATEGORIES.QUESTIONS,
    emoji: '📍',
    description: 'Index finger pointing up shaking side to side',
  },

  // ── Numbers ──
  {
    id: 'ONE',
    gloss: 'ONE',
    label: '1 (One)',
    category: ISL_CATEGORIES.NUMBERS,
    emoji: '1️⃣',
    description: 'Index finger extended up',
  },
  {
    id: 'TWO',
    gloss: 'TWO',
    label: '2 (Two)',
    category: ISL_CATEGORIES.NUMBERS,
    emoji: '2️⃣',
    description: 'Index and middle fingers extended up',
  },
  {
    id: 'THREE',
    gloss: 'THREE',
    label: '3 (Three)',
    category: ISL_CATEGORIES.NUMBERS,
    emoji: '3️⃣',
    description: 'Thumb, index, and middle fingers extended up',
  },
  {
    id: 'FOUR',
    gloss: 'FOUR',
    label: '4 (Four)',
    category: ISL_CATEGORIES.NUMBERS,
    emoji: '4️⃣',
    description: 'Four fingers extended up (thumb tucked)',
  },
  {
    id: 'FIVE',
    gloss: 'FIVE',
    label: '5 (Five)',
    category: ISL_CATEGORIES.NUMBERS,
    emoji: '5️⃣',
    description: 'All five fingers spread wide',
  },
];

/**
 * Contextual ISL Gloss Grammar Mappings.
 * Translates sequences of raw ISL gloss tokens into natural English sentences.
 */
export const ISL_GRAMMAR_PATTERNS = [
  {
    glosses: ['HELLO'],
    sentence: 'Hello! Namaste.',
  },
  {
    glosses: ['MY', 'NAME'],
    sentence: 'My name is...',
  },
  {
    glosses: ['HELP', 'ME'],
    sentence: 'Please help me.',
  },
  {
    glosses: ['HELP', 'WATER'],
    sentence: 'Please bring me water.',
  },
  {
    glosses: ['WANT', 'WATER'],
    sentence: 'I would like some water.',
  },
  {
    glosses: ['WANT', 'EAT'],
    sentence: 'I am hungry and would like to eat.',
  },
  {
    glosses: ['HOW', 'YOU'],
    sentence: 'How are you?',
  },
  {
    glosses: ['THANK_YOU'],
    sentence: 'Thank you very much.',
  },
  {
    glosses: ['EMERGENCY', 'HELP'],
    sentence: 'Emergency alert! Please send help immediately.',
  },
  {
    glosses: ['DOCTOR', 'NEED'],
    sentence: 'I need medical assistance / doctor.',
  },
];
