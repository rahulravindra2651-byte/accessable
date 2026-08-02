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

/**
 * Clean up spoken values based on the field type.
 * e.g., email "rahul at gmail dot com" -> "rahul@gmail.com"
 * e.g., phone "9 8 7 6 5 4 3 2 1 0" -> "9876543210"
 */
export const cleanSpokenValue = (field, rawText) => {
  if (!rawText) return '';
  let text = rawText.trim();
  const lowerField = (field || '').toLowerCase();

  if (lowerField.includes('email')) {
    return text
      .toLowerCase()
      .replace(/\s+at\s+/g, '@')
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '');
  }

  if (lowerField.includes('phone') || lowerField.includes('mobile') || lowerField.includes('contact')) {
    const digits = text.replace(/\D/g, '');
    return digits || text;
  }

  if (lowerField.includes('age') || lowerField.includes('pincode') || lowerField.includes('zip') || lowerField.includes('pin')) {
    const digits = text.match(/\d+/g);
    if (digits) return digits.join('');
  }

  if (lowerField.includes('gender')) {
    if (/\b(male|man|boy)\b/i.test(text)) return 'Male';
    if (/\b(female|woman|girl)\b/i.test(text)) return 'Female';
    if (/\b(other|non.binary|transgender)\b/i.test(text)) return 'Other';
  }

  // Capitalize title case for names, cities, states, addresses
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
