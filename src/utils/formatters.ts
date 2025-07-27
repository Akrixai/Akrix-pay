/**
 * Utility functions for formatting various data types
 */

/**
 * Format a number as currency (INR)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string): string {
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN or invalid values
  if (isNaN(numericAmount)) {
    return '₹0.00';
  }
  
  // Format as INR currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date string to include time
 * @param dateString - ISO date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a phone number to a readable format
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length (assuming Indian phone numbers)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length > 10) {
    // Handle international numbers
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -5)} ${cleaned.slice(-5)}`;
  }
  
  // Return as is if we can't format it
  return phone;
}