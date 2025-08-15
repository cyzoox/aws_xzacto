/**
 * Formats a number into a currency string (e.g., 1234.5 -> ₱1,234.50).
 * @param {number} amount The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    return '';
  }
  // Using 'en-PH' for Philippine Peso formatting. This can be customized.
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

/**
 * Formats an ISO date string into a more readable format (e.g., "Aug 10, 2025").
 * @param {string} dateString The ISO date string.
 * @returns {string} The formatted date.
 */
export const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};
