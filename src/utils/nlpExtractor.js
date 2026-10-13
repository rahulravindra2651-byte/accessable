/**
 * NLP-based field extractor for voice form filling.
 *
 * Parses natural-language sentences and returns {field, value} pairs.
 * All patterns are regex-based (no external NLP API required) and work
 * entirely in the browser.
 *
 * Supported sentences (case-insensitive):
 *   "My name is Rahul"              → { field: 'name',        value: 'Rahul' }
 *   "My email is rahul@example.com" → { field: 'email',       value: 'rahul@...' }
 *   "My phone is 9876543210"        → { field: 'phone',       value: '9876543210' }
 *   "I am 22 years old"             → { field: 'age',         value: '22' }
 *   "My age is 22"                  → { field: 'age',         value: '22' }
 *   "My address is 12 MG Road"      → { field: 'address',     value: '12 MG Road' }
 *   "I live at 12 MG Road"          → { field: 'address',     value: '12 MG Road' }
 *   "My date of birth is 01/01/2000"→ { field: 'dateOfBirth', value: '01/01/2000' }
 *   "I was born on 1st January"     → { field: 'dateOfBirth', value: '1st January' }
 *   "My gender is male"             → { field: 'gender',      value: 'male' }
 *   "I am male"                     → { field: 'gender',      value: 'male' }
 *   "My occupation is engineer"     → { field: 'occupation',  value: 'engineer' }
 *   "I work as a teacher"           → { field: 'occupation',  value: 'teacher' }
 *   "My city is Bengaluru"          → { field: 'city',        value: 'Bengaluru' }
 *   "My pincode is 560001"          → { field: 'pincode',     value: '560001' }
 *   "My state is Karnataka"         → { field: 'state',       value: 'Karnataka' }
 */

const PATTERNS = [
  // Name
  { field: 'name',        regex: /my (?:full\s+)?name is (.+)/i },
  { field: 'name',        regex: /(?:call me|i am called) (.+)/i },
  { field: 'name',        regex: /^name is (.+)/i },

  // Email
  { field: 'email',       regex: /my email(?: address)? is (.+)/i },
  { field: 'email',       regex: /email (?:address )?is (.+)/i },

  // Phone
  { field: 'phone',       regex: /my (?:phone|mobile|cell|contact)(?: number)? is (.+)/i },
  { field: 'phone',       regex: /(?:phone|mobile) number is (.+)/i },

  // Age
  { field: 'age',         regex: /i am (\d+) years?(?: old)?/i },
  { field: 'age',         regex: /my age is (\d+)/i },

  // Address
  { field: 'address',     regex: /my address is (.+)/i },
  { field: 'address',     regex: /i live (?:at|in) (.+)/i },
  { field: 'address',     regex: /my (?:home|house) address is (.+)/i },

  // Date of birth
  { field: 'dateOfBirth', regex: /my (?:date of birth|dob|birthday) is (.+)/i },
  { field: 'dateOfBirth', regex: /i was born on (.+)/i },

  // Gender
  { field: 'gender',      regex: /my gender is (.+)/i },
  { field: 'gender',      regex: /i am (male|female|non.binary|other)/i },

  // Occupation
  { field: 'occupation',  regex: /my (?:job|occupation|profession|work) is (.+)/i },
  { field: 'occupation',  regex: /i work as(?: a| an)? (.+)/i },
  { field: 'occupation',  regex: /i am (?:a |an )?(\w+ (?:engineer|doctor|teacher|student|developer|lawyer|accountant|nurse|officer))/i },

  // City
  { field: 'city',        regex: /my city is (.+)/i },
  { field: 'city',        regex: /i (?:live|stay|am) in (.+)/i },

  // State
  { field: 'state',       regex: /my state is (.+)/i },

  // Pincode / Zip
  { field: 'pincode',     regex: /my (?:pin|pincode|zip|postal)(?: code)? is (\d+)/i },
];

const SPOKEN_DIGIT_MAP = {
  zero: '0', oh: '0', nil: '0', null: '0',
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15',
  sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
  twenty: '20', thirty: '30', forty: '40', fifty: '50', sixty: '60', seventy: '70', eighty: '80', ninety: '90',
  hundred: '00', thousand: '000',
};

/**
 * Converts natural spoken words ("nine eight seven six...") into digits ("9876...").
 * Handles doubles, triples, and spoken compound numbers like "twenty five".
 */
export const wordsToNumbers = (raw) => {
  if (!raw) return '';
  let str = String(raw).toLowerCase();

  // "double 8" -> "8 8", "triple 9" -> "9 9 9"
  str = str.replace(/\bdouble\s+([a-z0-9]+)\b/gi, '$1 $1');
  str = str.replace(/\btriple\s+([a-z0-9]+)\b/gi, '$1 $1 $1');

  // Compound numbers: "twenty five" -> 25
  const tens = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const ones = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  for (const [tWord, tVal] of Object.entries(tens)) {
    for (const [oWord, oVal] of Object.entries(ones)) {
      const rx = new RegExp(`\\b${tWord}[-\\s]+${oWord}\\b`, 'gi');
      str = str.replace(rx, String(tVal + oVal));
    }
  }

  // Individual digit replacements
  for (const [word, digit] of Object.entries(SPOKEN_DIGIT_MAP)) {
    const rx = new RegExp(`\\b${word}\\b`, 'gi');
    str = str.replace(rx, digit);
  }

  // Collapse spaces between adjacent numeric digits (e.g. "9 8 7" -> "987")
  while (/(\d)\s+(\d)/.test(str)) {
    str = str.replace(/(\d)\s+(\d)/g, '$1$2');
  }

  return str;
};

/**
 * Clean up spoken values based on the field type.
 * e.g., email "rahul at gmail dot com" -> "rahul@gmail.com"
 * e.g., phone "nine eight seven six five four three two one zero" -> "9876543210"
 * e.g., name "My name is Rahul Sharma" -> "Rahul Sharma"
 */
export const cleanSpokenValue = (field, rawText) => {
  if (!rawText) return '';
  let text = String(rawText).trim();
  const lowerField = (field || '').toLowerCase();

  // Strip common voice lead-ins when speaking field answers
  if (lowerField.includes('name')) {
    text = text.replace(/^(?:my\s+(?:full\s+)?name\s+is|i\s+am\s+called|call\s+me|i\s+am|this\s+is|it\s+is|it's)\s+/i, '');
    text = text.replace(/[.,;!]+$/, '').trim();
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  if (lowerField.includes('email') || lowerField.includes('mail')) {
    text = text.replace(/^(?:my\s+email(?:\s+address)?\s+is|email(?:\s+address)?\s+is|it\s+is|it's)\s+/i, '');
    return text
      .toLowerCase()
      .replace(/\s+at\s+the\s+rate\s+/g, '@')
      .replace(/\s+at\s+/g, '@')
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '')
      .replace(/[.,;!]+$/, '');
  }

  if (lowerField.includes('phone') || lowerField.includes('mobile') || lowerField.includes('contact') || lowerField.includes('tel')) {
    text = text.replace(/^(?:my\s+(?:phone|mobile|contact)(?:\s+number)?\s+is|phone(?:\s+number)?\s+is|number\s+is|it\s+is|it's)\s+/i, '');
    const converted = wordsToNumbers(text);
    const digits = converted.replace(/\D/g, '');
    return digits || text;
  }

  if (lowerField.includes('age')) {
    text = text.replace(/^(?:my\s+age\s+is|i\s+am|it\s+is|it's)\s+/i, '');
    text = text.replace(/\s+years?(?:\s+old)?$/i, '');
    const converted = wordsToNumbers(text);
    const digits = converted.match(/\d+/);
    if (digits) return digits[0];
    return text;
  }

  if (lowerField.includes('pincode') || lowerField.includes('zip') || lowerField.includes('pin') || lowerField.includes('postal')) {
    text = text.replace(/^(?:my\s+(?:pin|pincode|zip|postal)(?:\s+code)?\s+is|it\s+is|it's)\s+/i, '');
    const converted = wordsToNumbers(text);
    const digits = converted.replace(/\D/g, '');
    if (digits) return digits;
    return text;
  }

  if (lowerField.includes('date') || lowerField.includes('dob') || lowerField.includes('birth')) {
    text = text.replace(/^(?:my\s+(?:date\s+of\s+birth|dob|birthday)\s+is|i\s+was\s+born\s+on|it\s+is|it's)\s+/i, '');
    text = text.replace(/[.,;!]+$/, '').trim();
    return text;
  }

  if (lowerField.includes('gender')) {
    if (/\b(male|man|boy)\b/i.test(text)) return 'Male';
    if (/\b(female|woman|girl)\b/i.test(text)) return 'Female';
    if (/\b(other|non.binary|transgender)\b/i.test(text)) return 'Other';
  }

  // Capitalize title case for general text (address, occupation, city, etc.)
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Attempt to extract a field-value pair from a spoken sentence.
 * @param {string} transcript — raw speech recognition result
 * @returns {{ field: string, value: string } | null}
 */
export const extractFieldFromSpeech = (transcript) => {
  if (!transcript) return null;
  const text = transcript.trim();

  for (const { field, regex } of PATTERNS) {
    const match = text.match(regex);
    if (match && match[1]) {
      const rawValue = match[1].trim().replace(/\s+/g, ' ');
      if (rawValue.length > 0) {
        return { field, value: cleanSpokenValue(field, rawValue) };
      }
    }
  }

  return null;
};

/**
 * Humanise a camelCase field name for display or TTS.
 * e.g. 'dateOfBirth' → 'Date Of Birth'
 */
export const humaniseField = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const AFFIRMATIVE_REGEX = /\b(yes|yeah|yep|yup|sure|ok|okay|continue|proceed|start|confirm|affirmative|haan|ha|go ahead|do it|positive|right|correct)\b/i;
const NEGATIVE_REGEX = /\b(no|nope|not|wrong|incorrect|cancel|stop|dont|don't|negative|exit|abort)\b/i;

/**
 * Classifies speech transcript into 'AFFIRMATIVE', 'NEGATIVE', or 'UNRECOGNIZED'.
 * Uses precise word boundaries to prevent substring collisions (e.g. 'what' containing 'ha').
 * @param {string} transcript — raw speech recognition output
 * @returns {'AFFIRMATIVE' | 'NEGATIVE' | 'UNRECOGNIZED'}
 */
export const detectConfirmationIntent = (transcript) => {
  const raw = transcript || '';
  const processed = raw.trim().toLowerCase();

  if (!processed) {
    return 'UNRECOGNIZED';
  }

  const affMatch = AFFIRMATIVE_REGEX.exec(processed);
  const negMatch = NEGATIVE_REGEX.exec(processed);

  const isAffirmative = Boolean(affMatch);
  const isNegative = Boolean(negMatch);

  let intent = 'UNRECOGNIZED';
  if (isAffirmative && !isNegative) {
    intent = 'AFFIRMATIVE';
  } else if (isNegative && !isAffirmative) {
    intent = 'NEGATIVE';
  } else if (isAffirmative && isNegative) {
    // Whichever appears first in speech takes precedence
    intent = affMatch.index <= negMatch.index ? 'AFFIRMATIVE' : 'NEGATIVE';
  }

  return intent;
};

/**
 * Map a field name to the most likely spoken prompt.
 */
export const getFieldPrompt = (fieldName) => {
  const prompts = {
    name:        'Please say your full name. For example: My name is Rahul.',
    email:       'Please say your email address. For example: My email is rahul at gmail dot com.',
    phone:       'Please say your phone number. For example: My phone is 9876543210.',
    age:         'Please say your age. For example: I am 22 years old.',
    address:     'Please say your address. For example: My address is 12 MG Road Bengaluru.',
    dateOfBirth: 'Please say your date of birth. For example: My date of birth is 1st January 2000.',
    gender:      'Please say your gender. For example: My gender is male.',
    occupation:  'Please say your occupation. For example: I work as a software engineer.',
    city:        'Please say your city. For example: My city is Bengaluru.',
    state:       'Please say your state. For example: My state is Karnataka.',
    pincode:     'Please say your pincode. For example: My pincode is 560001.',
  };
  return prompts[fieldName] || `Please provide your ${humaniseField(fieldName)}.`;
};
