import { useLocalStorage } from './useLocalStorage';
import type { MileageData, MileageEntry } from '../types';
import { DEFAULT_MILEAGE } from '../constants/initialState';

export function useMileage() {
  const [mileageData, setMileageData, resetMileageData] = useLocalStorage<MileageData>(
    'mil_mileage',
    DEFAULT_MILEAGE
  );

  // createMileageEntry에서 이미 id가 부여된 채로 넘어오므로 재생성하지 않음
  const addMileageEntry = (entry: MileageEntry) => {
    setMileageData((prev) => ({
      total: prev.total + entry.amount,
      history: [entry, ...prev.history],
    }));
  };

  return {
    mileageData,
    addMileageEntry,
    resetMileageData: () => resetMileageData(),
  };
}
