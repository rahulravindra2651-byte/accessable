export const SCAM_KEYWORDS = ['password', 'otp', 'cvv', 'card number', 'pin', 'ssn', 'urgent', 'verify account'];

export const detectFraud = (text) => {
  const lowercase = text.toLowerCase();
  return SCAM_KEYWORDS.filter(word => lowercase.includes(word));
};
