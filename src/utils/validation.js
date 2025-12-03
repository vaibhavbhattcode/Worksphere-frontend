// Shared validation utilities for company auth flows
import * as Yup from 'yup';

// Regex patterns
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const phoneRegex = /^[\d\s()+\-]{7,20}$/; // relaxed for formatting
export const strictPhoneRegex = /^\+?[1-9]\d{9,14}$/; // digits only international
export const websiteRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
export const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

// Trimming transform
export const trimTransform = (schema) =>
  schema.transform((val) => (typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : val));

export const emailSchema = trimTransform(
  Yup.string()
    .matches(emailRegex, 'Please use a valid business email format (e.g., company@domain.com)')
    .max(255, 'Email cannot exceed 255 characters')
    .email('Please enter a valid business email address')
    .required('Business email is required')
);

export const passwordSchema = Yup.string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .matches(
    passwordComplexityRegex,
    'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .required('Password is required');

export const confirmPasswordSchema = Yup.string()
  .oneOf([Yup.ref('password'), null], 'Passwords must match')
  .required('Please confirm your password');

export const websiteSchema = trimTransform(
  Yup.string()
    .matches(websiteRegex, 'Website must be a valid URL starting with http:// or https://')
    .url('Please enter a valid URL (e.g., https://www.example.com)')
    .nullable()
    .optional()
);

export const phoneSchema = trimTransform(
  Yup.string()
    .matches(strictPhoneRegex, 'Please enter a valid phone number (e.g., +1234567890)')
    .required('Phone number is required')
);

export const genericString = (min, max, field) =>
  trimTransform(
    Yup.string()
      .min(min, `${field} must be at least ${min} characters long`)
      .max(max, `${field} cannot exceed ${max} characters`)
  );

export const sanitizeValues = (values) => {
  const cleaned = {};
  Object.entries(values).forEach(([k, v]) => {
    if (typeof v === 'string') {
      let t = v.trim();
      if (['companyAddress', 'password', 'confirmPassword'].includes(k) === false) {
        t = t.replace(/\s+/g, ' ');
      }
      cleaned[k] = t;
    } else {
      cleaned[k] = v;
    }
  });
  return cleaned;
};

export const calcPasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;
  return strength; // 0-5
};
