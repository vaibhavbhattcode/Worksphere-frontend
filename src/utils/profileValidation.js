// Professional validation utilities for user profile
// Handles trimming, whitespace normalization, format validation, and comprehensive error messages

// Regular expressions for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/; // E.164 international format
const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const YEAR_REGEX = /^\d{4}$/;
const DATE_REGEX = /^\d{4}-\d{2}$/; // YYYY-MM format for experience dates

/**
 * Sanitizes a string by trimming and collapsing multiple spaces
 * @param {string} value - The string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitizes a URL by trimming and ensuring proper format
 * @param {string} value - The URL to sanitize
 * @returns {string} - Sanitized URL
 */
export const sanitizeUrl = (value) => {
  if (typeof value !== 'string') return '';
  let url = value.trim().replace(/\s+/g, '');
  // Add https:// if no protocol specified
  if (url && !url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  return url;
};

/**
 * Validates name field
 * @param {string} name - Name to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateName = (name) => {
  const sanitized = sanitizeString(name);
  if (!sanitized) return 'Name is required';
  if (sanitized.length < 2) return 'Name must be at least 2 characters';
  if (sanitized.length > 100) return 'Name cannot exceed 100 characters';
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
};

/**
 * Validates job title
 * @param {string} title - Job title to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateTitle = (title) => {
  const sanitized = sanitizeString(title);
  if (!sanitized) return 'Job title is required';
  if (sanitized.length < 2) return 'Job title must be at least 2 characters';
  if (sanitized.length > 100) return 'Job title cannot exceed 100 characters';
  return null;
};

/**
 * Validates location
 * @param {string} location - Location to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateLocation = (location) => {
  const sanitized = sanitizeString(location);
  if (!sanitized) return 'Location is required';
  if (sanitized.length < 2) return 'Location must be at least 2 characters';
  if (sanitized.length > 100) return 'Location cannot exceed 100 characters';
  return null;
};

/**
 * Validates email address
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email) => {
  const sanitized = sanitizeString(email);
  if (!sanitized) return 'Email is required';
  if (!EMAIL_REGEX.test(sanitized)) return 'Please enter a valid email address';
  if (sanitized.length > 255) return 'Email cannot exceed 255 characters';
  return null;
};

/**
 * Validates phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhone = (phone) => {
  const sanitized = phone.trim().replace(/\s+/g, '');
  if (!sanitized) return 'Phone number is required';
  if (!PHONE_REGEX.test(sanitized)) {
    return 'Phone must be in international format (e.g., +1234567890)';
  }
  return null;
};

/**
 * Validates about/bio section
 * @param {string} about - About text to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateAbout = (about) => {
  const sanitized = sanitizeString(about);
  if (!sanitized) return null; // About is optional
  if (sanitized.length < 50) return 'About section should be at least 50 characters for a professional profile';
  if (sanitized.length > 2000) return 'About section cannot exceed 2000 characters';
  return null;
};

/**
 * Validates URL (social links, portfolio, etc.)
 * @param {string} url - URL to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateUrl = (url, fieldName = 'URL') => {
  const sanitized = url.trim().replace(/\s+/g, '');
  if (!sanitized) return null; // URLs are optional
  if (!URL_REGEX.test(sanitized) && !URL_REGEX.test('https://' + sanitized)) {
    return `Please enter a valid ${fieldName}`;
  }
  if (sanitized.length > 500) return `${fieldName} cannot exceed 500 characters`;
  return null;
};

/**
 * Validates a single experience entry
 * @param {Object} experience - Experience object with company, position, start, end, description
 * @param {number} index - Index of the experience entry (for error messages)
 * @returns {Object} - Object with field-specific errors or empty if valid
 */
export const validateExperience = (experience, index) => {
  const errors = {};
  
  // Company validation
  const company = sanitizeString(experience.company || '');
  if (!company) {
    errors.company = `Company name is required`;
  } else if (company.length < 2) {
    errors.company = `Company name must be at least 2 characters`;
  } else if (company.length > 200) {
    errors.company = `Company name cannot exceed 200 characters`;
  }
  
  // Position validation
  const position = sanitizeString(experience.position || '');
  if (!position) {
    errors.position = `Position / title is required`;
  } else if (position.length < 2) {
    errors.position = `Position must be at least 2 characters`;
  } else if (position.length > 200) {
    errors.position = `Position cannot exceed 200 characters`;
  }
  
  // Start date validation
  const start = (experience.start || '').trim();
  if (!start) {
    errors.start = `Start date is required`;
  } else if (!DATE_REGEX.test(start)) {
    errors.start = `Start date must be in YYYY-MM format`;
  } else {
    const [year, month] = start.split('-').map(Number);
    if (year < 1950 || year > new Date().getFullYear()) {
      errors.start = `Start year must be between 1950 and current year`;
    }
    if (month < 1 || month > 12) {
      errors.start = `Start month must be between 01 and 12`;
    }
  }
  
  // End date validation (optional, but if provided must be valid)
  const end = (experience.end || '').trim();
  if (end && end.toLowerCase() !== 'present') {
    if (!DATE_REGEX.test(end)) {
      errors.end = `End date must be in YYYY-MM format or "Present"`;
    } else {
      const [year, month] = end.split('-').map(Number);
      if (year < 1950 || year > new Date().getFullYear() + 1) {
        errors.end = `End year must be between 1950 and next year`;
      }
      if (month < 1 || month > 12) {
        errors.end = `End month must be between 01 and 12`;
      }
      
      // Check that end date is after start date
      if (start && DATE_REGEX.test(start)) {
        const startDate = new Date(start + '-01');
        const endDate = new Date(end + '-01');
        if (endDate < startDate) {
          errors.end = `End date must be after start date`;
        }
      }
    }
  }
  
  // Description validation (optional but recommended)
  const description = sanitizeString(experience.description || '');
  if (description && description.length < 20) {
    errors.description = `Description should be at least 20 characters for better detail`;
  } else if (description.length > 2000) {
    errors.description = `Description cannot exceed 2000 characters`;
  }
  
  return errors;
};

/**
 * Validates a single education entry
 * @param {Object} education - Education object with institution, degree, year
 * @param {number} index - Index of the education entry (for error messages)
 * @returns {Object} - Object with field-specific errors or empty if valid
 */
export const validateEducation = (education, index) => {
  const errors = {};
  
  // Institution validation
  const institution = sanitizeString(education.institution || '');
    if (!institution) {
      errors.institution = `Institution name is required`;
  } else if (institution.length < 2) {
      errors.institution = `Institution name must be at least 2 characters`;
  } else if (institution.length > 200) {
      errors.institution = `Institution name cannot exceed 200 characters`;
  }
  
  // Degree validation
  const degree = sanitizeString(education.degree || '');
    if (!degree) {
      errors.degree = `Degree / qualification is required`;
  } else if (degree.length < 2) {
      errors.degree = `Degree must be at least 2 characters`;
  } else if (degree.length > 200) {
      errors.degree = `Degree cannot exceed 200 characters`;
  }
  
  // Year validation
  const year = (education.year || '').trim();
    if (!year) {
      errors.year = `Graduation year is required`;
  } else if (!YEAR_REGEX.test(year)) {
      errors.year = `Year must be a 4-digit number`;
  } else {
    const yearNum = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    if (yearNum < 1950 || yearNum > currentYear + 10) {
        errors.year = `Year must be between 1950 and ${currentYear + 10}`;
    }
  }
  
  return errors;
};

/**
 * Validates all experience entries
 * @param {Array} experiences - Array of experience objects
 * @returns {Array} - Array of error objects (one per experience)
 */
export const validateAllExperiences = (experiences) => {
  if (!Array.isArray(experiences)) return [];
  return experiences.map((exp, index) => validateExperience(exp, index));
};

/**
 * Validates all education entries
 * @param {Array} educations - Array of education objects
 * @returns {Array} - Array of error objects (one per education)
 */
export const validateAllEducations = (educations) => {
  if (!Array.isArray(educations)) return [];
  return educations.map((edu, index) => validateEducation(edu, index));
};

/**
 * Validates social links
 * @param {Object} socialLinks - Object with linkedin, github, twitter, portfolio
 * @returns {Object} - Object with field-specific errors or empty if valid
 */
export const validateSocialLinks = (socialLinks) => {
  const errors = {};
  
  if (socialLinks.linkedin) {
    const error = validateUrl(socialLinks.linkedin, 'LinkedIn URL');
    if (error) errors.linkedin = error;
  }
  
  if (socialLinks.github) {
    const error = validateUrl(socialLinks.github, 'GitHub URL');
    if (error) errors.github = error;
  }
  
  if (socialLinks.twitter) {
    const error = validateUrl(socialLinks.twitter, 'Twitter URL');
    if (error) errors.twitter = error;
  }
  
  if (socialLinks.portfolio) {
    const error = validateUrl(socialLinks.portfolio, 'Portfolio URL');
    if (error) errors.portfolio = error;
  }
  
  return errors;
};

/**
 * Sanitizes entire profile data object before submission
 * @param {Object} profileData - Raw profile data
 * @returns {Object} - Sanitized profile data
 */
export const sanitizeProfileData = (profileData) => {
  const sanitized = {};
  
  // Basic fields
  if (profileData.name !== undefined) sanitized.name = sanitizeString(profileData.name);
  if (profileData.title !== undefined) sanitized.title = sanitizeString(profileData.title);
  if (profileData.location !== undefined) sanitized.location = sanitizeString(profileData.location);
  if (profileData.email !== undefined) sanitized.email = sanitizeString(profileData.email).toLowerCase();
  if (profileData.phone !== undefined) sanitized.phone = profileData.phone.trim().replace(/\s+/g, '');
  if (profileData.about !== undefined) sanitized.about = sanitizeString(profileData.about);
  
  // Skills (array)
  if (Array.isArray(profileData.skills)) {
    sanitized.skills = profileData.skills
      .map(skill => sanitizeString(skill))
      .filter(skill => skill.length > 0);
  }
  
  // Experience (array of objects)
  if (Array.isArray(profileData.experience)) {
    sanitized.experience = profileData.experience.map(exp => ({
      company: sanitizeString(exp.company || ''),
      position: sanitizeString(exp.position || ''),
      start: (exp.start || '').trim(),
      end: (exp.end || '').trim(),
      description: sanitizeString(exp.description || ''),
    })).filter(exp => 
      exp.company || exp.position || exp.start || exp.end || exp.description
    );
  }
  
  // Education (array of objects)
  if (Array.isArray(profileData.education)) {
    sanitized.education = profileData.education.map(edu => ({
      institution: sanitizeString(edu.institution || ''),
      degree: sanitizeString(edu.degree || ''),
      year: (edu.year || '').trim(),
    })).filter(edu => 
      edu.institution || edu.degree || edu.year
    );
  }
  
  // Social links
  if (profileData.linkedin !== undefined) sanitized.linkedin = sanitizeUrl(profileData.linkedin);
  if (profileData.github !== undefined) sanitized.github = sanitizeUrl(profileData.github);
  if (profileData.twitter !== undefined) sanitized.twitter = sanitizeUrl(profileData.twitter);
  if (profileData.portfolio !== undefined) sanitized.portfolio = sanitizeUrl(profileData.portfolio);
  
  return sanitized;
};

/**
 * Comprehensive validation of entire profile
 * @param {Object} profileData - Profile data to validate
 * @returns {Object} - Object with all validation errors grouped by field
 */
export const validateCompleteProfile = (profileData) => {
  const errors = {};
  
  // Basic field validations
  const nameError = validateName(profileData.name);
  if (nameError) errors.name = nameError;
  
  const titleError = validateTitle(profileData.title);
  if (titleError) errors.title = titleError;
  
  const locationError = validateLocation(profileData.location);
  if (locationError) errors.location = locationError;
  
  const emailError = validateEmail(profileData.email);
  if (emailError) errors.email = emailError;
  
  const phoneError = validatePhone(profileData.phone);
  if (phoneError) errors.phone = phoneError;
  
  const aboutError = validateAbout(profileData.about);
  if (aboutError) errors.about = aboutError;
  
  // Skills validation
  if (!Array.isArray(profileData.skills) || profileData.skills.length === 0) {
    errors.skills = 'At least one skill is required for a complete profile';
  }
  
  // Experience validations
  const experienceErrors = validateAllExperiences(profileData.experience);
  const hasExperienceErrors = experienceErrors.some(err => Object.keys(err).length > 0);
  if (hasExperienceErrors) {
    errors.experience = experienceErrors;
  }
  
  // Education validations
  const educationErrors = validateAllEducations(profileData.education);
  const hasEducationErrors = educationErrors.some(err => Object.keys(err).length > 0);
  if (hasEducationErrors) {
    errors.education = educationErrors;
  }
  
  // Social links validation
  const socialLinksErrors = validateSocialLinks({
    linkedin: profileData.linkedin,
    github: profileData.github,
    twitter: profileData.twitter,
    portfolio: profileData.portfolio,
  });
  if (Object.keys(socialLinksErrors).length > 0) {
    errors.socialLinks = socialLinksErrors;
  }
  
  return errors;
};

export default {
  // Validation functions
  validateName,
  validateTitle,
  validateLocation,
  validateEmail,
  validatePhone,
  validateAbout,
  validateUrl,
  validateExperience,
  validateEducation,
  validateAllExperiences,
  validateAllEducations,
  validateSocialLinks,
  validateCompleteProfile,
  
  // Sanitization functions
  sanitizeString,
  sanitizeUrl,
  sanitizeProfileData,
  
  // Regex patterns (exported for custom validations)
  EMAIL_REGEX,
  PHONE_REGEX,
  URL_REGEX,
  YEAR_REGEX,
  DATE_REGEX,
};
