import { ChevronDown, Trash2, Moon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { EVENT_CONFIG } from '../../constants/eventConfig';
import type { ScheduleEvent } from '../../types';

interface WeekAccordionProps {
  weekDates: Date[];
  events: ScheduleEvent[];
  isOpen: boolean;
  onToggle: () => void;
  onDeleteEvent: (id: string) => void;
  weekName?: string;
}

export default function WeekAccordion({
  weekDates,
  events,
  isOpen,
  onToggle,
  onDeleteEvent,
  weekName,
}: WeekAccordionProps) {

  const start = weekDates[0];
  const end = weekDates[weekDates.length - 1];

  const weekEvents = events
    .filter((event) => {
      const evStart = parseISO(event.date);
      const evEnd = event.endDate ? parseISO(event.endDate) : evStart;

      return evStart <= end && evEnd >= start;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const label = `${format(start, 'MM/dd')} ~ ${format(end, 'MM/dd')}`;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">

      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >

        <span className="text-xs font-semibold text-gray-600">
          {label}
          {weekName && (
            <span className="ml-2 text-[10px] font-bold text-army-green-700 bg-army-green-50 border border-army-green-200 px-1.5 py-0.5 rounded-md">
              {weekName}
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">

          {weekEvents.length > 0 && (
            <span className="text-xs bg-army-green-100 text-army-green-700 rounded-full px-2 py-0.5 font-medium">
              {weekEvents.length}건
            </span>
          )}

          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />

        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >

        <div className="px-4 py-3 space-y-2 bg-white">

          {weekEvents.length === 0 ? (

            <p className="text-xs text-gray-400 text-center py-2">
              일정 없음
            </p>

          ) : (

            weekEvents.map((event) => {

              const cfg = EVENT_CONFIG[event.type] ?? {
                label: '기타',
                dotColor: 'bg-gray-400'
              };

              const isNightWatch = event.type === 'night_watch';

              return (

                <div
                  key={event.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >

                  <div className="flex items-center gap-2 min-w-0">

                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotColor}`}
                    />

                    <div className="min-w-0">

                      <div className="flex items-center gap-1">

                        {isNightWatch && (
                          <Moon
                            size={10}
                            className="text-blue-600 shrink-0"
                          />
                        )}

                        <span className="text-xs font-medium text-gray-800 truncate">
                          {event.title}
                        </span>

                        {event.nightWatchNumber && (
                          <span className="text-xs text-blue-600 font-bold">
                            ({event.nightWatchNumber}번초)
                          </span>
                        )}

                      </div>

                      <p className="text-[10px] text-gray-400">
                        {format(parseISO(event.date), 'MM월 dd일')}

                        {event.endDate &&
                          event.endDate !== event.date &&
                          ` ~ ${format(parseISO(event.endDate), 'MM월 dd일')}`}

                        {' · '}
                        {cfg.label}
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event.id);
                    }}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>

                </div>

              );

            })

          )}

        </div>

      </div>

    </div>
  );
}