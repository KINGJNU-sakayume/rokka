import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { RewardVacationEntry } from '../types';

export const REWARD_VACATION_MAX_DAYS = 16;
export const REWARD_VACATION_EXPIRY_WARNING_DAYS = 30;

export function getDaysUntilExpiry(entry: RewardVacationEntry): number {
  return differenceInCalendarDays(parseISO(entry.expiresAt), new Date());
}

export function isRewardVacationExpiring(entry: RewardVacationEntry): boolean {
  const daysLeft = getDaysUntilExpiry(entry);
  return daysLeft >= 0 && daysLeft <= REWARD_VACATION_EXPIRY_WARNING_DAYS;
}

export function isRewardVacationExpired(entry: RewardVacationEntry): boolean {
  return getDaysUntilExpiry(entry) < 0;
}

export function getExpiringRewardEntries(
  history: RewardVacationEntry[] = []
): RewardVacationEntry[] {
  if (!Array.isArray(history)) return [];

  return history.filter(isRewardVacationExpiring);
}

// [FIX] HIGH: 만료 휴가를 제외한 실제 유효 포상휴가 일수를 계산하는 함수 추가
// 기존 rewardVacation.total은 만료 여부와 무관하게 누적되어 오표시 발생
export function getActiveRewardVacationTotal(history: RewardVacationEntry[]): number {
  if (!Array.isArray(history)) return 0;
  return history
    .filter((entry) => !isRewardVacationExpired(entry))
    .reduce((sum, entry) => sum + entry.daysEarned, 0);
}

export function canAddRewardVacation(currentTotal: number, daysToAdd: number): boolean {
  return currentTotal + daysToAdd <= REWARD_VACATION_MAX_DAYS;
}
