import { useState } from 'react';
import { Plus, X, CalendarDays } from 'lucide-react';
import CalendarGrid from './CalendarGrid';
import AddEventModal from './AddEventModal';
import WeekScheduleModal from './WeekScheduleModal';
import { useWeekSchedule } from '../../hooks/useWeekSchedule';
import type { ScheduleEvent, UserData, ScheduleData, VacationData } from '../../types';
import { toISODateString } from '../../utils/dateUtils';

interface CalendarTabProps {
  events: ScheduleEvent[];
  scheduleData: ScheduleData;
  userData: UserData;
  vacationData: VacationData;
  weekendLeaveBlocked: boolean;
  onAddEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

export default function CalendarTab({
  events, scheduleData, userData, vacationData, weekendLeaveBlocked, onAddEvent, onDeleteEvent,
}: CalendarTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isWeekScheduleOpen, setIsWeekScheduleOpen] = useState(false);
  const [isDateSelectionMode, setIsDateSelectionMode] = useState(false);

  const { weekSchedules, setWeekName, removeWeekName } = useWeekSchedule();

  const handleDayClick = (date: Date) => {
    setSelectedDate(toISODateString(date));
    if (isDateSelectionMode) {
      setIsDateSelectionMode(false);
      setIsModalOpen(true);
    }
    // else: just shows the week accordion (no modal)
  };

  return (
    <div className="space-y-4">
      {isDateSelectionMode && (
        <div className="mx-1 px-4 py-2.5 bg-army-dark text-white text-sm font-semibold rounded-xl text-center">
          날짜를 선택하세요
        </div>
      )}
      <CalendarGrid
        events={events}
        weekSchedules={weekSchedules}
        onDeleteEvent={onDeleteEvent}
        onDayClick={handleDayClick}
      />
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDate={selectedDate}
        onAdd={onAddEvent}
        scheduleData={scheduleData}
        vacationData={vacationData}
        weekendLeaveBlocked={weekendLeaveBlocked}
      />
      <WeekScheduleModal
        isOpen={isWeekScheduleOpen}
        onClose={() => setIsWeekScheduleOpen(false)}
        enlistmentDate={userData.enlistmentDate}
        weekSchedules={weekSchedules}
        onSetWeekName={setWeekName}
        onRemoveWeekName={removeWeekName}
      />
      {/* 주간일정 버튼 */}
      <button
        onClick={() => setIsWeekScheduleOpen(true)}
        className="fixed bottom-36 right-4 w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-2xl shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all z-30"
        title="주간일정 관리"
      >
        <CalendarDays size={18} />
      </button>
      {/* 일정 추가 버튼 */}
      <button
        onClick={() => setIsDateSelectionMode(v => !v)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-army-dark text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-army-dark/90 active:scale-95 transition-all z-30"
      >
        {isDateSelectionMode ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
