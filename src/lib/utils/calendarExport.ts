/**
 * Calendar Export Utilities
 * 
 * Export calendar events to iCal format and Google Calendar
 */

import { CalendarEvent } from '@/components/calendar/CalendarView';

/**
 * Generate iCal file content
 */
export function generateICalContent(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CreatorArmour//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event) => {
    const startDate = formatICalDate(event.date);
    const endDate = formatICalDate(new Date(event.date.getTime() + 60 * 60 * 1000)); // 1 hour default

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@creatorarmour.com`);
    lines.push(`DTSTART:${startDate}`);
    lines.push(`DTEND:${endDate}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    lines.push(`LOCATION:CreatorArmour`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for iCal format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Download iCal file
 */
export function downloadICalFile(events: CalendarEvent[], filename: string = 'creatorarmour-calendar.ics'): void {
  const content = generateICalContent(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = event.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(event.date.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
    location: 'CreatorArmour',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open Google Calendar for event
 */
export function openGoogleCalendar(event: CalendarEvent): void {
  const url = generateGoogleCalendarUrl(event);
  window.open(url, '_blank');
}

