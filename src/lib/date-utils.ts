import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export type DateRangeKind = 
  | 'today' 
  | 'yesterday' 
  | 'thisWeek' 
  | 'lastWeek' 
  | 'thisMonth' 
  | 'custom';

export interface DateRange {
  start: string;
  end: string;
  kind: DateRangeKind;
}

export function getDateRange(kind: DateRangeKind, customStart?: string, customEnd?: string): DateRange {
  try {
    // Use Asia/Karachi timezone for consistent local time handling
    const now = dayjs.tz('Asia/Karachi');
    
    // If timezone fails, fallback to UTC
    if (!now.isValid()) {
      throw new Error('Invalid timezone');
    }
  
  switch (kind) {
    case 'today':
      return {
        start: now.format('YYYY-MM-DD'),
        end: now.format('YYYY-MM-DD'),
        kind: 'today'
      };
      
    case 'yesterday':
      const yesterday = now.subtract(1, 'day');
      return {
        start: yesterday.format('YYYY-MM-DD'),
        end: yesterday.format('YYYY-MM-DD'),
        kind: 'yesterday'
      };
      
    case 'thisWeek':
      const startOfWeek = now.startOf('isoWeek'); // Monday
      const endOfWeek = now.endOf('isoWeek'); // Sunday
      return {
        start: startOfWeek.format('YYYY-MM-DD'),
        end: endOfWeek.format('YYYY-MM-DD'),
        kind: 'thisWeek'
      };
      
    case 'lastWeek':
      const lastWeekStart = now.subtract(1, 'week').startOf('isoWeek');
      const lastWeekEnd = now.subtract(1, 'week').endOf('isoWeek');
      return {
        start: lastWeekStart.format('YYYY-MM-DD'),
        end: lastWeekEnd.format('YYYY-MM-DD'),
        kind: 'lastWeek'
      };
      
    case 'thisMonth':
      const startOfMonth = now.startOf('month');
      const endOfMonth = now.endOf('month');
      return {
        start: startOfMonth.format('YYYY-MM-DD'),
        end: endOfMonth.format('YYYY-MM-DD'),
        kind: 'thisMonth'
      };
      
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom date range requires start and end dates');
      }
      return {
        start: customStart,
        end: customEnd,
        kind: 'custom'
      };
      
    default:
      throw new Error(`Unknown date range kind: ${kind}`);
  }
  } catch {
    // Fallback to UTC if timezone fails (e.g., during SSR)
    const nowUTC = dayjs.utc();
    return {
      start: nowUTC.format('YYYY-MM-DD'),
      end: nowUTC.format('YYYY-MM-DD'),
      kind: 'today'
    };
  }
}

export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  try {
    const parsed = dayjs.tz(date, 'Asia/Karachi');
    if (!parsed.isValid()) {
      return date; // Return original string if parsing fails
    }
    return parsed.format('MMM DD, YYYY');
  } catch {
    return date; // Return original string if formatting fails
  }
}

export function formatDateTime(date: string): string {
  try {
    const parsed = dayjs.tz(date, 'Asia/Karachi');
    if (!parsed.isValid()) {
      return date; // Return original string if parsing fails
    }
    return parsed.format('MMM DD, YYYY h:mm A');
  } catch {
    return date; // Return original string if formatting fails
  }
}

export function getTodayInKarachi(): string {
  try {
    return dayjs.tz('Asia/Karachi').format('YYYY-MM-DD');
  } catch {
    // Fallback to UTC if timezone fails (e.g., during SSR)
    return dayjs.utc().format('YYYY-MM-DD');
  }
}
