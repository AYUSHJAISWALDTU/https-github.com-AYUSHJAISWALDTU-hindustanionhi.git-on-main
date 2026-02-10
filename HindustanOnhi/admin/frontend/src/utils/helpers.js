/**
 * Format price in INR
 */
export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

/**
 * Format date nicely
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format date + time
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate string
 */
export const truncate = (str, len = 40) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
};

/**
 * Status → text color
 */
const statusColors = {
  processing: '#f59e0b',
  confirmed: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
  returned: '#6b7280',
};
export const getStatusColor = (s) => statusColors[s] || '#64748b';

/**
 * Status → background color
 */
const statusBgs = {
  processing: '#fef3c7',
  confirmed: '#dbeafe',
  shipped: '#ede9fe',
  delivered: '#d1fae5',
  cancelled: '#fee2e2',
  returned: '#f3f4f6',
};
export const getStatusBg = (s) => statusBgs[s] || '#f1f5f9';
