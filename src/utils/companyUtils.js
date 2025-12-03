/**
 * Utility functions for company-related operations
 */

// Default company logo path - update this if you move the demo.png file
const DEFAULT_COMPANY_LOGO = '/demo.png';

/**
 * Gets the company logo URL, falling back to the default logo if not provided
 * @param {string} logoUrl - The company's logo URL (can be null/undefined)
 * @returns {string} The logo URL to use
 */
export const getCompanyLogo = (logoUrl) => {
  return logoUrl || DEFAULT_COMPANY_LOGO;
};

/**
 * Gets the company name to display, with a fallback
 * @param {Object} company - The company object
 * @param {string} [defaultName='Company'] - Default name to use if none found
 * @returns {string} The company name to display
 */
export const getCompanyName = (company, defaultName = 'Company') => {
  return company?.companyName || company?.company || defaultName;
};
