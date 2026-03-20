/**
 * Format Indian currency with proper comma placement
 * ₹28,85,700 or ₹28.86 Lakh for large amounts
 */
export function formatIndianCurrency(amount: number, useLakh: boolean = false): string {
  if (amount === 0) return '₹0';
  
  // For amounts >= 1 Lakh, optionally show in Lakh format
  if (useLakh && amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} Lakh`;
  }
  
  // Standard Indian number format with commas
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format currency with Indian comma format (always use standard format)
 */
export function formatCurrency(amount: number): string {
  return formatIndianCurrency(amount, false);
}

