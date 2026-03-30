import { useLocalStorage } from './useLocalStorage';
import type { ScheduleData, ScheduleEvent } from '../types';
import { DEFAULT_SCHEDULE } from '../constants/initialState';
import { generateId } from '../utils/mileageUtils';
import { KOREAN_PUBLIC_HOLIDAYS } from '../constants/holidays';
import { parseISO, addDays, format, getDay } from 'date-fns';

export function useSchedule() {

  const [scheduleData, setScheduleData, resetScheduleData] =
    useLocalStorage<ScheduleData>('mil_schedule', DEFAULT_SCHEDULE);

  const addScheduleEvent = (event: Omit<ScheduleEvent, 'id'>): ScheduleEvent => {

    const newEvent: ScheduleEvent = {
      ...event,
      id: generateId(),
    };

    // 날짜-fns 기반 안전한 다음 유효 평일 계산 (timezone-safe)
    const getNextValidWeekday = (
      startDate: string,
      existingEvents: ScheduleEvent[]
    ): string => {
      let current = addDays(parseISO(startDate), 1);

      while (true) {
        const dateStr = format(current, 'yyyy-MM-dd');
        const dow = getDay(current);

        const isRestDay =
          dow === 0 ||
          dow === 6 ||
          KOREAN_PUBLIC_HOLIDAYS.includes(dateStr);

        if (!isRestDay) {
          const hasBlockingEvent = existingEvents.some(
            (e) =>
              e.date === dateStr &&
              ['duty', 'vacation', 'full_combat_rest', 'after_duty_sleep'].includes(e.type)
          );
          if (!hasBlockingEvent) return dateStr;
        }

        current = addDays(current, 1);
      }
    };

    // functional update로 stale closure 방지
    setScheduleData((prev) => {
      let currentEvents = [...prev.events, newEvent];

      let pendingSleeps: { fromDate: string }[] = [];

      if (event.type === 'duty') {
        pendingSleeps.push({ fromDate: event.date });
      }

      const isBlocking = ['duty', 'vacation', 'full_combat_rest'].includes(event.type);

      if (isBlocking) {
        const overlappedSleeps = currentEvents.filter(
          (e) => e.type === 'after_duty_sleep' && e.date === event.date
        );

        if (overlappedSleeps.length > 0) {
          currentEvents = currentEvents.filter(
            (e) => !(e.type === 'after_duty_sleep' && e.date === event.date)
          );
          overlappedSleeps.forEach(() =>
            pendingSleeps.push({ fromDate: event.date })
          );
        }
      }

      for (const sleep of pendingSleeps) {
        const sleepDate = getNextValidWeekday(sleep.fromDate, currentEvents);
        currentEvents.push({
          id: generateId(),
          date: sleepDate,
          type: 'after_duty_sleep',
          title: '근무취침',
        });
      }

      return { ...prev, events: currentEvents };
    });

    return newEvent;
  };

  const removeScheduleEvent = (id: string) => {

    setScheduleData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));

  };

  return {
    scheduleData,
    addScheduleEvent,
    removeScheduleEvent,
    resetScheduleData: () => resetScheduleData(),
  };
}