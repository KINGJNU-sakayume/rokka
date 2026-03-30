import { format, isToday, isSameMonth } from 'date-fns';
import { EVENT_CONFIG } from '../../constants/eventConfig';
import type { ScheduleEvent } from '../../types';
import { getEventsForDate } from '../../utils/dateUtils';

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  events: ScheduleEvent[];
  isSelected: boolean;
  onSelect: (date: Date) => void;
  holidayName?: string;
}

export default function CalendarDay({
  date,
  currentMonth,
  events,
  isSelected,
  onSelect,
  holidayName,
}: CalendarDayProps) {

  const dayEvents = getEventsForDate(date, events);
  const dayNum = format(date, 'd');
  const dow = date.getDay();
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);

  const isHoliday = !!holidayName;

  const textColor = !inMonth
    ? 'text-gray-300'
    : (dow === 0 || isHoliday)
    ? 'text-red-500'
    : dow === 6
    ? 'text-blue-500'
    : 'text-gray-800';

  const nightWatchEvents = dayEvents.filter(
    (e) => e.type === 'night_watch'
  );

  const otherEvents = dayEvents.filter(
    (e) => e.type !== 'night_watch'
  );

  return (
    <button
      onClick={() => onSelect(date)}
      className={`relative min-h-[52px] p-1 flex flex-col items-center transition-all rounded-lg ${
        isSelected
          ? 'bg-army-green-50 ring-1 ring-army-green-400'
          : 'hover:bg-gray-50'
      }`}
    >

      <span
        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mb-0.5 transition-colors ${
          today ? 'bg-army-dark text-white' : textColor
        }`}
      >
        {dayNum}
      </span>

      <div className="w-full flex flex-col gap-px items-center">

        {isHoliday && inMonth && (
          <span className="w-full text-center text-[7px] font-semibold text-red-500 truncate leading-tight">
            {holidayName}
          </span>
        )}

        {nightWatchEvents.map((e) => (
          <span
            key={e.id}
            className="text-[8px] text-blue-900 font-bold leading-none"
          >
            🌙{e.nightWatchNumber}번초
          </span>
        ))}

        {otherEvents.slice(0, 2).map((e) => {

          const cfg =
            EVENT_CONFIG[e.type] ??
            {
              label: '기타',
              bgColor: 'bg-gray-200',
              textColor: 'text-gray-700'
            };

          return (
            <span
              key={e.id}
              className={`w-full text-center text-[8px] font-medium rounded px-0.5 truncate ${cfg.bgColor} ${cfg.textColor} bg-opacity-20`}
            >
              {e.title || cfg.label}
            </span>
          );
        })}

        {otherEvents.length > 2 && (
          <span className="text-[8px] text-gray-500 font-medium">
            +{otherEvents.length - 2}
          </span>
        )}

      </div>

    </button>
  );
}
