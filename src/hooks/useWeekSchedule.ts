import { useLocalStorage } from './useLocalStorage';

/** key: 해당 주 일요일 날짜 'yyyy-MM-dd', value: 주 이름 */
export type WeekSchedules = Record<string, string>;

export function useWeekSchedule() {
  const [weekSchedules, setWeekSchedules] = useLocalStorage<WeekSchedules>(
    'mil_week_schedules',
    {}
  );

  const setWeekName = (sundayKey: string, name: string) => {
    setWeekSchedules(prev => ({ ...prev, [sundayKey]: name }));
  };

  const removeWeekName = (sundayKey: string) => {
    setWeekSchedules(prev => {
      const next = { ...prev };
      delete next[sundayKey];
      return next;
    });
  };

  return { weekSchedules, setWeekName, removeWeekName };
}
