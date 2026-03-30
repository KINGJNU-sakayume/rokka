import { useLocalStorage } from './useLocalStorage';
import type { UserData } from '../types';
import { DEFAULT_USER } from '../constants/initialState';

export function useServiceData() {
  const [userData, setUserData, resetUserData] = useLocalStorage<UserData>('mil_user', DEFAULT_USER);

  const completeOnboarding = (enlistmentDate: string) => {
    setUserData(prev => ({ ...prev, enlistmentDate, hasCompletedOnboarding: true }));
  };

  return {
    userData,
    completeOnboarding,
    resetUserData: () => resetUserData(),
  };
}
