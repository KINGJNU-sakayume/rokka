import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { VacationData, RewardVacationEntry } from '../types';
import { DEFAULT_VACATION } from '../constants/initialState';
import { generateId } from '../utils/mileageUtils';
import { toISODateString, addMonths, parseISO } from '../utils/dateUtils';
import { format, startOfDay } from 'date-fns';

/** 유효한 포상휴가 잔여 일수 (만료 항목 제외, usedDays 차감) */
export function getRewardVacationTotal(vacation: VacationData): number {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const earned = (vacation.rewardVacation.history ?? [])
    .filter(e => e.expiresAt >= today)
    .reduce((sum, e) => sum + e.daysEarned, 0);
  return Math.max(0, earned - (vacation.rewardVacation.usedDays ?? 0));
}

export function useVacation() {
  const [vacationData, setVacationData, resetVacationData] =
    useLocalStorage<VacationData>('mil_vacation', DEFAULT_VACATION);

  // 구 포맷(rewardVacation.total) → 신 포맷(rewardVacation.usedDays) 1회 마이그레이션
  useEffect(() => {
    const rv = vacationData.rewardVacation as VacationData['rewardVacation'] & { total?: number };
    if (typeof rv.total === 'number' && typeof rv.usedDays === 'undefined') {
      const histSum = (rv.history ?? []).reduce((s: number, e: RewardVacationEntry) => s + (e.daysEarned ?? 0), 0);
      setVacationData(prev => ({
        ...prev,
        rewardVacation: {
          history: rv.history ?? [],
          usedDays: Math.max(0, histSum - (rv.total ?? 0)),
        },
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 포상휴가 지급 — history 항목 추가 (절대 삭제 안 함) */
  const addRewardVacation = (daysEarned: number, dateEarned: string, description?: string) => {
    const entry: RewardVacationEntry = {
      id: generateId(),
      daysEarned,
      dateEarned,
      expiresAt: toISODateString(addMonths(parseISO(dateEarned), 6)),
      description,
    };
    setVacationData(prev => ({
      ...prev,
      rewardVacation: {
        ...prev.rewardVacation,
        history: [...(prev.rewardVacation.history ?? []), entry],
      },
    }));
  };

  const addConsolationVacation = (days: number) => {
    setVacationData(prev => ({ ...prev, consolationVacation: prev.consolationVacation + days }));
  };

  const useAnnualLeave = (days: number) => {
    setVacationData(prev => ({ ...prev, annualLeave: Math.max(0, prev.annualLeave - days) }));
  };

  /** 휴가 이벤트 추가 시 차감 */
  const spendVacationBreakdown = (bd: { annual: number; reward: number; consolation: number; petition: number }) => {
    setVacationData(prev => ({
      ...prev,
      annualLeave:         Math.max(0, prev.annualLeave - bd.annual),
      consolationVacation: Math.max(0, prev.consolationVacation - bd.consolation),
      petitionVacation:    Math.max(0, prev.petitionVacation - bd.petition),
      rewardVacation: {
        ...prev.rewardVacation,
        usedDays: (prev.rewardVacation.usedDays ?? 0) + bd.reward,
      },
    }));
  };

  /** 휴가 이벤트 삭제 시 복구 (spend의 역연산) */
  const restoreVacationBreakdown = (bd: { annual: number; reward: number; consolation: number; petition: number }) => {
    setVacationData(prev => ({
      ...prev,
      annualLeave:         prev.annualLeave + bd.annual,
      consolationVacation: prev.consolationVacation + bd.consolation,
      petitionVacation:    prev.petitionVacation + bd.petition,
      rewardVacation: {
        ...prev.rewardVacation,
        usedDays: Math.max(0, (prev.rewardVacation.usedDays ?? 0) - bd.reward),
      },
    }));
  };

  /** 복무율 50% 달성 시 취업청원휴가 +2일 (1회만) */
  const grantEmploymentLeave = () => {
    setVacationData(prev => {
      if (prev.employmentLeaveGranted) return prev;
      return { ...prev, petitionVacation: prev.petitionVacation + 2, employmentLeaveGranted: true };
    });
  };

  return {
    vacationData,
    setVacationData,
    addRewardVacation,
    addConsolationVacation,
    useAnnualLeave,
    spendVacationBreakdown,
    restoreVacationBreakdown,
    grantEmploymentLeave,
    resetVacationData: () => resetVacationData(),
  };
}
