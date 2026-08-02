export const extractFormFields = (text, language = 'eng') => {
  const lines = (text || '').split('\n');

  const keywordSets = {
    eng: [
      'name', 'first name', 'last name', 'full name',
      'phone', 'telephone', 'mobile', 'cell', 'contact',
      'date', 'birth', 'birthday', 'dob', 'date of birth',
      'address', 'street', 'city', 'state', 'zip', 'pincode', 'postal',
      'age', 'years old', 'email', 'e-mail', 'mail',
      'gender', 'sex', 'male', 'female',
      'occupation', 'job', 'profession', 'work', 'signature'
    ],
    hin: [
      'नाम', 'पहला नाम', 'अंतिम नाम', 'पूरा नाम',
      'फोन', 'मोबाइल', 'संपर्क', 'तारीख', 'जन्म तारीख', 'जन्मदिन',
      'पता', 'सड़क', 'शहर', 'राज्य', 'पिनकोड', 'डाक',
      'आयु', 'उम्र', 'ईमेल', 'लिंग', 'पुरुष', 'महिला',
      'व्यवसाय', 'नौकरी', 'पेशा', 'काम', 'हस्ताक्षर'
    ],
    kan: [
      'ಹೆಸರು', 'ಮೊದಲ ಹೆಸರು', 'ಕೊನೆಯ ಹೆಸರು', 'ಪೂರ್ಣ ಹೆಸರು',
      'ಫೋನ್', 'ದೂರವಾಣಿ', 'ಮೊಬೈಲ್', 'ಸಂಪರ್ಕ', 'ದಿನಾಂಕ', 'ಜನ್ಮ ದಿನಾಂಕ',
      'ವಿಳಾಸ', 'ರಸ್ತೆ', 'ನಗರ', 'ರಾಜ್ಯ', 'ಪೋಸ್ಟಲ್', 'ವಯಸ್ಸು',
      'ಇಮೇಲ್', 'ಲಿಂಗ', 'ಪುರುಷ', 'ಸ್ತ್ರೀ', 'ಉದ್ಯೋಗ', 'ಕೆಲಸ', 'ಸಹಿ'
    ],
    tam: [
      'பெயர்', 'முதல் பெயர்', 'கடைசி பெயர்', 'முழு பெயர்',
      'தொலைபேசி', 'மொபைல்', 'தொடர்பு', 'தேதி', 'பிறந்த தேதி',
      'முகவரி', 'தெரு', 'நகரம்', 'மாநிலம்', 'அஞ்சல்', 'வயது',
      'மின்னஞ்சல்', 'பாலினம்', 'ஆண்', 'பெண்', 'தொழில்', 'வேலை', 'கையொப்பம்'
    ],
    tel: [
      'పేరు', 'మొదటి పేరు', 'చివరి పేరు', 'పూర్తి పేరు',
      'ఫోన్', 'మొబైల్', 'సంప్రదింపు', 'తేదీ', 'పుట్టిన తేదీ',
      'చిరునామా', 'వీధి', 'నగరం', 'రాష్ట్రం', 'పిన్‌కోడ్', 'వయస్సు',
      'ఇమెయిల్', 'లింగం', 'పురుషుడు', 'స్త్రీ', 'వృత్తి', 'ఉద్యోగం', 'సంతకం'
    ],
    mal: [
      'പേര്', 'ആദ്യ പേര്', 'അവസാന പേര്', 'മുഴുവൻ പേര്',
      'ഫോൺ', 'മൊബൈൽ', 'ബന്ധപ്പെടുക', 'തീയതി', 'ജനന തീയതി',
      'വിലാസം', 'തെരുവ്', 'നഗരം', 'സംസ്ഥാനം', 'പിൻകോഡ്', 'പ്രായം',
      'ഇമെയിൽ', 'ലിംഗം', 'ആൺ', 'പെൺ', 'തൊഴിൽ', 'ഒപ്പ്'
    ],
    mar: [
      'नाव', 'पहिले नाव', 'आडनाव', 'पूर्ण नाव',
      'फोन', 'मोबाइल', 'संपर्क', 'तारीख', 'जन्म तारीख',
      'पत्ता', 'रस्ता', 'शहर', 'राज्य', 'पिनकोड', 'वय',
      'ईमेल', 'लिंग', 'पुरुष', 'स्त्री', 'व्यवसाय', 'स्वाक्षरी'
    ],
    ben: [
      'নাম', 'প্রথম নাম', 'শেষ নাম', 'সম্পূর্ণ নাম',
      'ফোন', 'মোবাইল', 'যোগাযোগ', 'তারিখ', 'জন্ম তারিখ',
      'ঠিকানা', 'রাস্তা', 'শহর', 'রাজ্য', 'পিনকোড', 'বয়স',
      'ইমেল', 'লিঙ্গ', 'পুরুষ', 'মহিলা', 'পেশা', 'স্বাক্ষর'
    ],
    guj: [
      'નામ', 'પ્રથમ નામ', 'અંતિમ નામ', 'પૂરું નામ',
      'ફોન', 'મોબાઇલ', 'સંપર્ક', 'તારીખ', 'જન્મ તારીખ',
      'સરનામું', 'શેરી', 'શહેર', 'રાજ્ય', 'પિનકોડ', 'ઉંમર',
      'ઈમેલ', 'જાતિ', 'પુરુષ', 'સ્ત્રી', 'વ્યવસાય', 'સહી'
    ],
    pan: [
      'ਨਾਮ', 'ਪਹਿਲਾ ਨਾਮ', 'ਆਖਰੀ ਨਾਮ', 'ਪੂਰਾ ਨਾਮ',
      'ਫੋਨ', 'ਮੋਬਾਈਲ', 'ਸੰਪਰਕ', 'ਮਿਤੀ', 'ਜਨਮ ਮਿਤੀ',
      'ਪਤਾ', 'ਸ਼ਹਿਰ', 'ਰਾਜ', 'ਪਿਨਕੋਡ', 'ਉਮਰ',
      'ਈਮੇਲ', 'ਲਿੰਗ', 'ਮਰਦ', 'ਔਰਤ', 'ਕਿਰਤ', 'ਦਸਤਖਤ'
    ],
    ori: [
      'ନାମ', 'ପ୍ରଥମ ନାମ', 'ଶେଷ ନାମ', 'ପୂରା ନାମ',
      'ଫୋନ୍', 'ମୋବାଇଲ୍', 'ଯୋଗାଯୋଗ', 'ତାରିଖ', 'ଜନ୍ମ ତାରିଖ',
      'ଠିକଣା', 'ସହର', 'ରାଜ୍ୟ', 'ପିନ୍‌କୋଡ୍', 'ବୟସ',
      'ଇମେଲ୍', 'ଲିଙ୍ଗ', 'ପୁରୁଷ', 'ମହିଳା', 'ବୃତ୍ତି', 'ଦସ୍ତଖତ'
    ],
    asm: [
      'নাম', 'প্ৰথম নাম', 'শেষ নাম', 'সম্পূৰ্ণ নাম',
      'ফোন', 'মোবাইল', 'যোগাযোগ', 'তাৰিখ', 'জন্মৰ তাৰিখ',
      'ঠিকনা', 'নগৰ', 'ৰাজ্য', 'পিনকোড', 'বয়স',
      'ইমেইল', 'লিংগ', 'পুৰুষ', 'মহিলা', 'বৃত্তি', 'স্বাক্ষৰ'
    ],
    urd: [
      'نام', 'پہلا نام', 'آخری نام', 'پورا نام',
      'فون', 'موبائل', 'رابطہ', 'تاریخ', 'تاریخ پیدائش',
      'پتہ', 'شہر', 'ریاست', 'پن کوڈ', 'عمر',
      'ای میل', 'جنس', 'مرد', 'عورت', 'پیشہ', 'دستخط'
    ]
  };

  const targetLangCode = (language || 'eng').split('+')[0];
  const targetKeywords = keywordSets[targetLangCode] || [];
  const keywords = Array.from(new Set([...targetKeywords, ...keywordSets.eng]));

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

    // Check for keywords or separators or Indic script characters
    const hasKeyword = keywords.some(k => lowerLine.includes(k));
    const hasSeparator = /[:\-–—=]/.test(line);
    const hasColon = line.includes(':');
    const hasIndicChar = /[\u0600-\u0DFF]/.test(line); // Devanagari, Dravidian, Bengali, Gurmukhi, Odia, Arabic
    const looksLikeField = hasKeyword || hasSeparator || hasColon || (hasIndicChar && line.length < 50);

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
      .replace(/[^ \p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (candidate.length < 2 || candidate.length > 60) return;

    const normalizedCandidate = candidate.toLowerCase();
    if (found.some(f => f.toLowerCase() === normalizedCandidate)) return;

    const formatted = /^[\x00-\x7F\s]+$/.test(candidate)
      ? candidate.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : candidate;

    found.push(formatted);
  });

  console.log('📋 [Form Processor Result]:', { originalText: text, processedLines, extractedFields: found, languageUsed: targetLangCode });
  return found;
};
