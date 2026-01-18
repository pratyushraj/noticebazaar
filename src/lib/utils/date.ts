/**
 * Date Utility Functions
 * 
 * Simple date formatting utilities (alternative to date-fns)
 */

/**
 * Format a date as "X time ago" (e.g., "2 hours ago", "3 days ago")
 * Compatible with date-fns formatDistanceToNow API
 */
export function formatDistanceToNow(date: Date | string, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let result: string;

  if (diffSeconds < 60) {
    result = 'just now';
  } else if (diffMinutes < 60) {
    result = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    result = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    result = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    result = `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  } else if (diffMonths < 12) {
    result = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } else {
    result = `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  }

  return options?.addSuffix !== false ? result : result.replace(' ago', '');
}

/**
 * Format a date as a readable string
 */
export function format(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return formatStr
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Format a date to a simple date string (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a date to a date-time string (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(date: Date | string): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(date, { addSuffix: true });
}
