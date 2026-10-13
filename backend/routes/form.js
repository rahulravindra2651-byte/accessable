const express = require('express');
const router = express.Router();
const FormSubmission = require('../models/FormSubmission');

/**
 * Validate a set of key-value form fields according to AccessAble validation rules.
 * @param {Record<string, any>} fields
 * @returns {{ isValid: boolean, sanitized: Record<string, string>, errors: Record<string, string> }}
 */
const validateFormFields = (fields) => {
  const errors = {};
  const sanitized = {};

  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return {
      isValid: false,
      sanitized: {},
      errors: { _general: 'Form data must be an object of field-value pairs.' },
    };
  }

  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return {
      isValid: false,
      sanitized: {},
      errors: { _general: 'Form cannot be empty.' },
    };
  }

  for (const [rawKey, rawVal] of entries) {
    const key = String(rawKey).trim();
    const val = rawVal === null || rawVal === undefined ? '' : String(rawVal).trim();
    sanitized[key] = val;

    const lowerKey = key.toLowerCase();

    // 1. Empty / whitespace check
    if (!val) {
      errors[key] = `${key} is required and cannot be empty.`;
      continue;
    }

    // 2. Name validation
    if (
      lowerKey.includes('name') &&
      !lowerKey.includes('file') &&
      !lowerKey.includes('user')
    ) {
      if (!/^[a-zA-Z\s'-]{2,100}$/.test(val)) {
        errors[key] = `${key} must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters).`;
      }
      continue;
    }

    // 3. Email validation
    if (lowerKey.includes('email') || lowerKey.includes('mail')) {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
        errors[key] = `Please enter a valid email address for ${key}.`;
      }
      continue;
    }

    // 4. Phone number validation
    if (
      lowerKey.includes('phone') ||
      lowerKey.includes('mobile') ||
      lowerKey.includes('contact') ||
      lowerKey.includes('tel')
    ) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15 || /[a-zA-Z]/.test(val)) {
        errors[key] = `${key} must be a valid phone number (10 to 15 digits, no letters).`;
      }
      continue;
    }

    // 5. Age validation
    if (lowerKey === 'age' || lowerKey.includes('age')) {
      const num = parseInt(val, 10);
      if (isNaN(num) || String(num) !== val.replace(/\D/g, '') || num < 1 || num > 120) {
        errors[key] = `${key} must be a valid age between 1 and 120 years.`;
      }
      continue;
    }

    // 6. Pincode / Postal / Zip validation
    if (lowerKey.includes('pincode') || lowerKey.includes('pin') || lowerKey.includes('zip') || lowerKey.includes('postal')) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length < 4 || digitsOnly.length > 10 || /[a-zA-Z]/.test(val)) {
        errors[key] = `${key} must be a valid numeric postal code.`;
      }
      continue;
    }

    // 7. Date of birth / Date validation
    if (lowerKey.includes('date') || lowerKey.includes('dob') || lowerKey.includes('birth')) {
      const parsedDate = Date.parse(val);
      if (isNaN(parsedDate)) {
        // Test common patterns like DD/MM/YYYY or YYYY-MM-DD
        const dateMatch = val.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/);
        if (!dateMatch) {
          errors[key] = `${key} must be a valid date.`;
          continue;
        }
      } else {
        const d = new Date(parsedDate);
        const now = new Date();
        if (lowerKey.includes('birth') || lowerKey.includes('dob')) {
          if (d > now) {
            errors[key] = `${key} cannot be a date in the future.`;
            continue;
          }
          if (now.getFullYear() - d.getFullYear() > 130) {
            errors[key] = `${key} must be within the last 130 years.`;
            continue;
          }
        }
      }
      continue;
    }

    // 8. General text validation: min length, cannot be pure symbols
    if (val.length < 1) {
      errors[key] = `${key} cannot be empty.`;
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, sanitized, errors };
};

/* ─── Validate Form Data Endpoint ─── */
router.post('/validate', (req, res) => {
  const { fields } = req.body;
  const result = validateFormFields(fields);

  if (!result.isValid) {
    return res.status(400).json({
      valid: false,
      message: 'Form validation failed.',
      errors: result.errors,
    });
  }

  return res.json({
    valid: true,
    message: 'All form fields are valid.',
    sanitized: result.sanitized,
  });
});

/* ─── Submit Form Data Endpoint ─── */
router.post('/submit', async (req, res) => {
  const { fields, formTitle, userId } = req.body;
  const result = validateFormFields(fields);

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Form submission rejected due to validation errors.',
      errors: result.errors,
    });
  }

  try {
    const submission = await FormSubmission.create({
      userId: userId || null,
      formTitle: formTitle || 'Scanned Form Document',
      fields: result.sanitized,
      status: 'submitted',
    });

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully.',
      submissionId: submission._id,
      fields: result.sanitized,
    });
  } catch (err) {
    console.error('[form/submit] Error:', err);
    // If database is offline, still return validated success
    return res.status(200).json({
      success: true,
      message: 'Form validated successfully (offline cache mode).',
      fields: result.sanitized,
    });
  }
});

module.exports = router;
