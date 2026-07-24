export const extractFormFields = (text, language = 'eng') => {
  const lines = (text || '').split('\n');

  const keywordSets = {
    eng: [
      'name', 'first name', 'last name', 'full name',
      'phone', 'telephone', 'mobile', 'cell',
      'number', 'phone number', 'contact',
      'date', 'birth', 'birthday', 'dob', 'date of birth',
      'address', 'street', 'city', 'state', 'zip', 'postal',
      'age', 'years old',
      'email', 'e-mail', 'mail',
      'gender', 'sex', 'male', 'female',
      'occupation', 'job', 'profession', 'work',
      'signature', 'sign here', 'signed'
    ],
    kan: [
      'ಹೆಸರು', 'ಮೊದಲ ಹೆಸರು', 'ಕೊನೆಯ ಹೆಸರು', 'ಪೂರ್ಣ ಹೆಸರು',
      'ಫೋನ್', 'ದೂರವಾಣಿ', 'ಮೊಬೈಲ್', 'ಸೆಲ್',
      'ಸಂಖ್ಯೆ', 'ಫೋನ್ ಸಂಖ್ಯೆ', 'ಸಂಪರ್ಕ',
      'ದಿನಾಂಕ', 'ಜನ್ಮ', 'ಜನ್ಮದಿನ', 'ಡಿಒಬಿ', 'ಜನ್ಮ ದಿನಾಂಕ',
      'ವಿಳಾಸ', 'ರಸ್ತೆ', 'ನಗರ', 'ರಾಜ್ಯ', 'ಜಿಪ್', 'ಪೋಸ್ಟಲ್',
      'ವಯಸ್ಸು', 'ವರ್ಷಗಳು',
      'ಇಮೇಲ್', 'ಇ-ಮೇಲ್', 'ಮೇಲ್',
      'ಲಿಂಗ', 'ಸೆಕ್ಸ್', 'ಪುರುಷ', 'ಸ್ತ್ರೀ',
      'ಉದ್ಯೋಗ', 'ಕೆಲಸ', 'ವೃತ್ತಿ', 'ಕೆಲಸ',
      'ಸಹಿ', 'ಇಲ್ಲಿ ಸಹಿ ಮಾಡಿ', 'ಸಹಿ ಮಾಡಲಾಗಿದೆ'
    ],
    tam: [
      'பெயர்', 'முதல் பெயர்', 'கடைசி பெயர்', 'முழு பெயர்',
      'தொலைபேசி', 'மொபைல்', 'செல்',
      'எண்', 'தொலைபேசி எண்', 'தொடர்பு',
      'தேதி', 'பிறப்பு', 'பிறந்தநாள்', 'டிஓபி', 'பிறந்த தேதி',
      'முகவரி', 'தெரு', 'நகரம்', 'மாநிலம்', 'ஜிப்', 'அஞ்சல்',
      'வயது', 'ஆண்டுகள்',
      'மின்னஞ்சல்', 'இ-மெயில்', 'மெயில்',
      'பாலினம்', 'பாலினம்', 'ஆண்', 'பெண்',
      'தொழில்', 'வேலை', 'தொழில்', 'வேலை',
      'கையொப்பம்', 'இங்கே கையொப்பம் செய்யுங்கள்', 'கையொப்பம் செய்யப்பட்டது'
    ],
    hin: [
      'नाम', 'पहला नाम', 'अंतिम नाम', 'पूर्ण नाम',
      'फोन', 'टेलीफोन', 'मोबाइल', 'सेल',
      'संख्या', 'फोन संख्या', 'संपर्क',
      'तारीख', 'जन्म', 'जन्मदिन', 'डीओबी', 'जन्म तारीख',
      'पता', 'सड़क', 'शहर', 'राज्य', 'ज़िप', 'डाक',
      'आयु', 'साल',
      'ईमेल', 'ई-मेल', 'मेल',
      'लिंग', 'सेक्स', 'पुरुष', 'महिला',
      'व्यवसाय', 'नौकरी', 'पेशा', 'काम',
      'हस्ताक्षर', 'यहाँ हस्ताक्षर करें', 'हस्ताक्षरित'
    ],
    tel: [
      'పేరు', 'మొదటి పేరు', 'చివరి పేరు', 'పూర్తి పేరు',
      'ఫోన్', 'టెలిఫోన్', 'మొబైల్', 'సెల్',
      'సంఖ్య', 'ఫోన్ సంఖ్య', 'సంప్రదింపు',
      'తేదీ', 'పుట్టిన', 'పుట్టినరోజు', 'డిఓబి', 'పుట్టిన తేదీ',
      'చిరునామా', 'వీధి', 'నగరం', 'రాష్ట్రం', 'జిప్', 'పోస్టల్',
      'వయస్సు', 'సంవత్సరాలు',
      'ఇమెయిల్', 'ఇ-మెయిల్', 'మెయిల్',
      'లింగం', 'సెక్స్', 'పురుషుడు', 'స్త్రీ',
      'వృత్తి', 'ఉద్యోగం', 'వృత్తి', 'పని',
      'సంతకం', 'ఇక్కడ సంతకం చేయండి', 'సంతకం చేయబడింది'
    ]
  };

  const keywords = keywordSets[language] || keywordSets.eng;

  const found = [];
  const processedLines = [];

  // First pass: collect all potential field lines
  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line || line.length < 2) return;

    if (line.length > 200) return; // Too long, probably content
    if (/^\d+\.?\s*$/.test(line)) return; // Just numbers
    if (/^[A-Za-z]$/.test(line)) return; // Single letters

    processedLines.push(line);
  });

  // Second pass: extract fields
  processedLines.forEach(line => {
    const lowerLine = line.toLowerCase();

    // Check for keywords or separators
    const hasKeyword = keywords.some(k => lowerLine.includes(k));
    const hasSeparator = /[:\-–—=]/.test(line);
    const hasColon = line.includes(':');
    const looksLikeField = hasKeyword || hasSeparator || hasColon;

    if (!looksLikeField) return;

    let candidate = line;

    if (hasSeparator || hasColon) {
      const parts = line.split(/[:\-–—=]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        candidate = parts[0];
      }
    }

    candidate = candidate
      .replace(/^\d+\.?\s*/, '')
      .replace(/[\[\]\(\)]/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (candidate.length < 2 || candidate.length > 50) return;

    const normalizedCandidate = candidate.toLowerCase();
    if (found.some(f => f.toLowerCase() === normalizedCandidate)) return;

    const formatted = /^[\x00-\x7F\s]+$/.test(candidate)
      ? candidate.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : candidate;

    found.push(formatted);
  });

  console.log('Form processing result:', { originalText: text, processedLines, extractedFields: found });
  return found;
};
