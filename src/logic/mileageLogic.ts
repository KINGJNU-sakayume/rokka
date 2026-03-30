import type { MileageEntry, MileageTransactionType } from '../types';
import { toISODateString } from '../utils/dateUtils';
import { generateId } from '../utils/mileageUtils';

export const MILEAGE_AMOUNTS: Record<MileageTransactionType, number> = {
  church_general: 1,
  church_praise: 2,
  early_return: 2,
  officer_grant: 0,
  half_combat_rest: -4,
  weekday_outing: -4,
  full_combat_rest: -8,
  weekend_outing: -12,
  weekend_overnight: -24,
  vacation_reward: -24,
  manual_deduction: 0,
  dining_cleaning: 2, // [FIX C-1] CRITICAL: Record<MileageTransactionType> 누락 키 추가
};

export const MILEAGE_LABELS: Record<MileageTransactionType, string> = {
  church_general: '교회 참석 (일반)',
  church_praise: '교회 참석 (찬양단)',
  early_return: '조기 복귀',
  officer_grant: '간부 지급',
  half_combat_rest: '반투휴무 사용',
  weekday_outing: '평일외출 사용',
  full_combat_rest: '전투휴무 사용',
  weekend_outing: '주말외출 사용',
  weekend_overnight: '주말외박 사용',
  vacation_reward: '포상휴가 사용',
  manual_deduction: '수동 차감',
  dining_cleaning: '주말 식당청소', // [FIX C-1] CRITICAL: 누락 레이블 추가
};

export function createMileageEntry(
  type: MileageTransactionType,
  amount: number,
  description?: string,
  date?: Date
): MileageEntry {
  return {
    id: generateId(),
    date: toISODateString(date ?? new Date()),
    amount,
    description: description ?? MILEAGE_LABELS[type],
    type,
  };
}
