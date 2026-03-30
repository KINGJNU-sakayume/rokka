import {
  addMonths,
  subDays,
  differenceInCalendarDays,
  isWeekend,
  format,
  parseISO,
  startOfDay,
  isAfter,
  addDays,
} from 'date-fns';
import { KOREAN_PUBLIC_HOLIDAYS } from '../constants/holidays';
import { WORKING_DAY_DEDUCTION_TYPES } from '../constants/eventConfig';
import type { ScheduleEvent } from '../types';

export function calculateDischargeDate(enlistmentDate: string): Date {
  const enlistment = parseISO(enlistmentDate);
  return subDays(addMonths(enlistment, 18), 1);
}

export function calculateServiceProgress(enlistmentDate: string): number {
  const enlistment = parseISO(enlistmentDate);
  const discharge = calculateDischargeDate(enlistmentDate);
  const today = startOfDay(new Date());

  const totalDays = differenceInCalendarDays(discharge, enlistment) + 1;
  const servedDays = differenceInCalendarDays(today, enlistment);

  if (servedDays <= 0) return 0;
  if (servedDays >= totalDays) return 100;

  return Math.min(100, Math.round((servedDays / totalDays) * 100));
}

export function calculateRemainingDays(enlistmentDate: string): number {
  const discharge = calculateDischargeDate(enlistmentDate);
  const today = startOfDay(new Date());
  return Math.max(0, differenceInCalendarDays(discharge, today));
}

export function isPublicHoliday(date: Date): boolean {
  return KOREAN_PUBLIC_HOLIDAYS.includes(format(date, 'yyyy-MM-dd'));
}

export function calculateRemainingWorkingDays(
  enlistmentDate: string,
  events: ScheduleEvent[] = []
): number {
  if (!Array.isArray(events)) return 0;
  
  const discharge = calculateDischargeDate(enlistmentDate);
  const today = startOfDay(new Date());

  if (isAfter(today, discharge)) return 0;

  const deductionEventDates = new Set<string>();

  events.forEach((event) => {
    if (!WORKING_DAY_DEDUCTION_TYPES.includes(event.type)) return;
    const start = parseISO(event.date);
    const end = event.endDate ? parseISO(event.endDate) : start;
    let current = start;
    while (!isAfter(current, end)) {
      deductionEventDates.add(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
  });

  let workingDays = 0;
  let current = today;

  while (!isAfter(current, discharge)) {
    const dateStr = format(current, 'yyyy-MM-dd');
    if (!isWeekend(current) && !isPublicHoliday(current) && !deductionEventDates.has(dateStr)) {
      workingDays++;
    }
    current = addDays(current, 1);
  }

  return workingDays;
}
