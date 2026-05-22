// src/renderer/utils/formatter.js

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format number sebagai currency (IDR)
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date dengan locale Indonesia
 * @param {string|Date} date - Date to format
 * @param {string} dateFormat - Format pattern (default: 'dd MMM yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, dateFormat = 'dd MMM yyyy') => {
  if (!date) return '-';
  try {
    return format(new Date(date), dateFormat, { locale: id });
  } catch (error) {
    return '-';
  }
};

/**
 * Format date dan time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd MMM yyyy HH:mm');
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Shorten text with ellipsis
 * @param {string} text - Text to shorten
 * @param {number} length - Max length
 * @returns {string} Shortened text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Parse currency string to number
 * @param {string} value - Currency string
 * @returns {number} Parsed number
 */
export const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(value.toString().replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
};

/**
 * Get month name
 * @param {number} month - Month number (0-11)
 * @returns {string} Month name in Indonesian
 */
export const getMonthName = (month) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month] || '';
};

/**
 * Get day name
 * @param {number} day - Day number (0-6)
 * @returns {string} Day name in Indonesian
 */
export const getDayName = (day) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[day] || '';
};

// src/renderer/utils/calculations.js

/**
 * Calculate total dari array of objects
 * @param {Array} items - Array of items
 * @param {string} field - Field name to sum
 * @returns {number} Total
 */
export const calculateTotal = (items, field) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} whole - Whole value
 * @returns {number} Percentage
 */
export const calculatePercentage = (part, whole) => {
  if (whole === 0) return 0;
  return (part / whole) * 100;
};

/**
 * Calculate budget variance
 * @param {number} allocated - Allocated amount
 * @param {number} spent - Spent amount
 * @returns {object} Variance data
 */
export const calculateBudgetVariance = (allocated, spent) => {
  const variance = allocated - spent;
  const variancePercentage = calculatePercentage(variance, allocated);
  const isOverBudget = variance < 0;

  return {
    variance: Math.abs(variance),
    variancePercentage: Math.abs(variancePercentage),
    isOverBudget,
    remaining: Math.max(0, variance),
  };
};

/**
 * Group transactions by category
 * @param {Array} transactions - Array of transactions
 * @returns {object} Grouped transactions
 */
export const groupByCategory = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Lainnya';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(transaction);
    return acc;
  }, {});
};

/**
 * Group transactions by date
 * @param {Array} transactions - Array of transactions
 * @returns {object} Grouped transactions
 */
export const groupByDate = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const date = formatDate(transaction.date, 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {});
};

/**
 * Group transactions by type
 * @param {Array} transactions - Array of transactions
 * @returns {object} Grouped transactions
 */
export const groupByType = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const type = transaction.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(transaction);
    return acc;
  }, {});
};

/**
 * Calculate budget health (0-100)
 * @param {number} spent - Spent amount
 * @param {number} allocated - Allocated amount
 * @returns {object} Health data
 */
export const calculateBudgetHealth = (spent, allocated) => {
  if (allocated === 0) return { health: 0, status: 'unknown' };

  const percentage = (spent / allocated) * 100;

  let status = 'good';
  if (percentage > 100) status = 'critical';
  else if (percentage > 90) status = 'warning';
  else if (percentage > 70) status = 'caution';

  return {
    percentage: Math.min(percentage, 100),
    status,
    remaining: Math.max(0, allocated - spent),
  };
};

/**
 * Generate summary statistics
 * @param {Array} transactions - Array of transactions
 * @returns {object} Summary statistics
 */
export const generateSummary = (transactions) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type !== 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: income,
    totalExpense: expense,
    netBalance: income - expense,
    transactionCount: transactions.length,
    byType: groupByType(transactions),
    byCategory: groupByCategory(transactions),
  };
};
