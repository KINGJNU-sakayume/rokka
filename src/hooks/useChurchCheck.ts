import { useLocalStorage } from './useLocalStorage';
import type { ChurchCheckData } from '../types';
import { DEFAULT_CHURCH_CHECK } from '../constants/initialState';
import { toISODateString } from '../utils/dateUtils';

export function useChurchCheck() {
  const [churchCheckData, setChurchCheckData, resetChurchCheckData] = useLocalStorage<ChurchCheckData>(
    'mil_church_check',
    DEFAULT_CHURCH_CHECK
  );

  const updateChurchCheck = (attendedDate?: string) => {
    setChurchCheckData((prev) => {
      const attended = attendedDate
        ? [...prev.attendedDates, attendedDate]
        : prev.attendedDates;
      return {
        lastCheckedDate: toISODateString(new Date()),
        attendedDates: attended,
      };
    });
  };

  return {
    churchCheckData,
    updateChurchCheck,
    resetChurchCheckData: () => resetChurchCheckData(),
  };
}
