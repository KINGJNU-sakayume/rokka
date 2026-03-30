import {
  format,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  isSameDay,
  addDays,
  subDays,
  addMonths,
} from 'date-fns';
import type { ScheduleEvent } from '../types';

export function formatDate(date: Date, fmt = 'yyyy년 MM월 dd일'): string {
  return format(date, fmt);
}

export function formatDateStr(dateStr: string, fmt = 'yyyy년 MM월 dd일'): string {
  if (!dateStr) return '';
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return '';
  return format(parsed, fmt);
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return !isBefore(date, start) && !isAfter(date, end);
}

export function getEventsForDate(date: Date, events: ScheduleEvent[]): ScheduleEvent[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  return events.filter((event) => {
    if (event.endDate) {
      const start = parseISO(event.date);
      const end = parseISO(event.endDate);
      const target = parseISO(dateStr);
      return isDateInRange(target, start, end);
    }
    return event.date === dateStr;
  });
}

export {
  parseISO,
  isValid,
  isSameDay,
  isBefore,
  isAfter,
  format,
  addDays,
  subDays,
  addMonths,
};

export {
  calculateDischargeDate,
  calculateServiceProgress,
  calculateRemainingDays,
  calculateRemainingWorkingDays,
  isPublicHoliday,
} from '../logic/serviceCalculator';

export { getMostRecentChurchDay } from '../logic/churchLogic';
