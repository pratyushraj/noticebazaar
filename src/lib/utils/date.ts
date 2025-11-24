/**
 * Date formatting utilities for consistent date display across the app
 */

/**
 * Format a date to "MMM do, yyyy" format (e.g., "Nov 19, 2025")
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date to "MMM do, yyyy" format with time (e.g., "Nov 19, 2025, 2:30 PM")
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  return formatDate(dateObj);
}

/**
 * Sort deals by due date (ascending)
 */
export function sortByDueDate<T extends { payment_expected_date?: string | null }>(
  deals: T[]
): T[] {
  return [...deals].sort((a, b) => {
    if (!a.payment_expected_date && !b.payment_expected_date) return 0;
    if (!a.payment_expected_date) return 1;
    if (!b.payment_expected_date) return -1;
    return new Date(a.payment_expected_date).getTime() - new Date(b.payment_expected_date).getTime();
  });
}

