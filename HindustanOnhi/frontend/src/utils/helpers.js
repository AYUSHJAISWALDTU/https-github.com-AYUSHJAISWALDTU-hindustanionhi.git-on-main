/**
 * Format price in INR
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Calculate discount percentage
 */
export const getDiscount = (price, comparePrice) => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};

/**
 * Generate star rating display
 */
export const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push('★');
    else if (i - rating < 1) stars.push('★');
    else stars.push('☆');
  }
  return stars.join('');
};

/**
 * Truncate text
 */
export const truncate = (str, len = 100) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

/**
 * Generate unique session ID for chatbot
 */
export const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * Format date
 */
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
