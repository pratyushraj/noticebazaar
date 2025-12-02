import { CalendarEvent } from '@/components/calendar/CalendarView';
import { downloadICalFile, generateGoogleCalendarUrl, openGoogleCalendar } from './calendarExport';

/**
 * Create a calendar event for a deliverable or payment
 */
export interface CreateCalendarEventOptions {
  title: string;
  date: Date;
  description?: string;
  location?: string;
  duration?: number; // in minutes, default 60
}

/**
 * Create a calendar event and return the event object
 */
export function createCalendarEvent(options: CreateCalendarEventOptions): CalendarEvent {
  const {
    title,
    date,
    description = '',
    location = 'NoticeBazaar',
    duration = 60,
  } = options;

  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    title,
    date,
    description,
    type: 'other',
    color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    metadata: {
      location,
      duration,
    },
  };
}

/**
 * Download a single event as iCal file
 */
export function downloadEventAsICal(event: CalendarEvent): void {
  downloadICalFile([event], `${event.title.replace(/[^a-z0-9]/gi, '-')}.ics`);
}

/**
 * Open Google Calendar for a single event
 */
export function openEventInGoogleCalendar(event: CalendarEvent): void {
  openGoogleCalendar(event);
}

/**
 * Generate a polite payment reminder message
 */
export function generatePaymentReminderMessage(
  brandName: string,
  amount: number,
  dueDate: string,
  daysOverdue?: number
): string {
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (daysOverdue && daysOverdue > 0) {
    return `Hi ${brandName} team,

I hope this message finds you well. I wanted to follow up regarding the payment for our recent collaboration.

Payment Details:
- Amount: ${formattedAmount}
- Due Date: ${formattedDate}
- Status: Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}

Could you please provide an update on the payment status? If there are any issues or delays, please let me know so we can resolve this together.

Thank you for your attention to this matter.

Best regards`;
  }

  return `Hi ${brandName} team,

I hope this message finds you well. I wanted to remind you about the upcoming payment for our collaboration.

Payment Details:
- Amount: ${formattedAmount}
- Due Date: ${formattedDate}

Please let me know if you need any additional information or if there are any concerns.

Thank you!

Best regards`;
}

