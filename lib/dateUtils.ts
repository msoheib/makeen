/**
 * Date formatting utilities for consistent Gregorian calendar display
 */

/**
 * Format a date as DD/MM/YYYY using Gregorian calendar
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

/**
 * Format a date with time as DD/MM/YYYY HH:MM
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const dateStr = formatDate(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format a date in a human-readable format (e.g., "15 January 2024")
 */
export function formatDateLong(date: string | Date | null | undefined, locale: string = 'en'): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  // Force Gregorian calendar
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });
}

/**
 * Format a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined, locale: string = 'en'): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === 'ar' ? 'الآن' : 'just now';
  if (diffMins < 60) return locale === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
  if (diffHours < 24) return locale === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return locale === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(d);
}
