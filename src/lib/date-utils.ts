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
  const now = dayjs.tz('Asia/Karachi');
  
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
  return dayjs.tz(date, 'Asia/Karachi').format('MMM DD, YYYY');
}

export function formatDateTime(date: string): string {
  return dayjs.tz(date, 'Asia/Karachi').format('MMM DD, YYYY h:mm A');
}
