import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarDay from './CalendarDay';
import WeekAccordion from './WeekAccordion';
import type { ScheduleEvent } from '../../types';
import { HOLIDAY_NAMES } from '../../constants/holidays';

interface CalendarGridProps {
  events: ScheduleEvent[];
  weekSchedules: Record<string, string>;
  onDeleteEvent: (id: string) => void;
  onDayClick: (date: Date) => void;
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getCalendarWeeks(month: Date): Date[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const weeks: Date[][] = [];
  let current = start;
  while (current <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current);
      current = addDays(current, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function CalendarGrid({ events, weekSchedules, onDeleteEvent, onDayClick }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openWeekIndex, setOpenWeekIndex] = useState<number | null>(null);

  const weeks = getCalendarWeeks(currentMonth);

  const handleDayClick = (date: Date, weekIndex: number) => {
    setSelectedDate(date);
    setOpenWeekIndex((prev) => (prev === weekIndex ? null : weekIndex));
    onDayClick(date);
  };

  const handleWeekToggle = (idx: number) => {
    setOpenWeekIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-50">
        <button
          onClick={() => { setCurrentMonth((m) => subMonths(m, 1)); setOpenWeekIndex(null); }}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <h2 className="text-base font-bold text-gray-900">
          {format(currentMonth, 'yyyy년 MM월')}
        </h2>
        <button
          onClick={() => { setCurrentMonth((m) => addMonths(m, 1)); setOpenWeekIndex(null); }}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="px-2 pb-2">
        <div className="grid grid-cols-7 mb-1">
          {DOW_LABELS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-semibold py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi}>
              <div className="grid grid-cols-7 gap-0.5">
                {week.map((day) => (
                  <CalendarDay
                    key={format(day, 'yyyy-MM-dd')}
                    date={day}
                    currentMonth={currentMonth}
                    events={events}
                    isSelected={selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') : false}
                    onSelect={() => handleDayClick(day, wi)}
                    holidayName={HOLIDAY_NAMES[format(day, 'yyyy-MM-dd')]}
                  />
                ))}
              </div>
              {openWeekIndex === wi && (
                <div className="mt-1">
                  <WeekAccordion
                    weekDates={week}
                    events={events}
                    isOpen={true}
                    onToggle={() => handleWeekToggle(wi)}
                    onDeleteEvent={onDeleteEvent}
                    weekName={weekSchedules[format(week[0], 'yyyy-MM-dd')]}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
