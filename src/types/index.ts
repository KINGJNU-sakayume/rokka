export type EventType =
  | 'vacation' | 'duty' | 'after_duty_sleep'
  | 'weekday_outing' | 'weekend_outing' | 'weekend_overnight'
  | 'church' | 'night_watch'
  | 'full_combat_rest' | 'half_combat_rest'
  | 'dining_cleaning'
  | 'guard_duty';

export type MileageTransactionType =
  | 'church_general' | 'church_praise' | 'early_return' | 'officer_grant'
  | 'half_combat_rest' | 'full_combat_rest'
  | 'weekday_outing' | 'weekend_outing' | 'weekend_overnight'
  | 'vacation_reward' | 'manual_deduction' | 'dining_cleaning';

export type VacationType = 'annual' | 'reward' | 'consolation' | 'petition';

export interface ScheduleEvent {
  id: string;
  date: string;
  endDate?: string;
  type: EventType;
  title: string;
  detail?: string;
  nightWatchNumber?: number;
  vacationBreakdown?: { annual: number; reward: number; consolation: number; petition: number; };
  isRewardOrMileage?: boolean;
}

export interface RewardVacationEntry {
  id: string;
  daysEarned: number;
  dateEarned: string;
  expiresAt: string;
  description?: string;
}

export interface MileageEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: MileageTransactionType;
}

export interface UserData {
  enlistmentDate: string;
  hasCompletedOnboarding: boolean;
}

export interface VacationData {
  annualLeave: number;
  rewardVacation: {
    history: RewardVacationEntry[]; // 지급 이력 (절대 삭제하지 않음)
    usedDays: number;               // 사용한 일수 (차감/복구 추적용)
  };
  consolationVacation: number;
  petitionVacation: number;
  /** 복무율 50% 도달 시 취업청원휴가 2일 자동 지급 여부 (중복 방지) */
  employmentLeaveGranted: boolean;
}

export interface MileageData {
  total: number;
  history: MileageEntry[];
}

export interface ScheduleData {
  events: ScheduleEvent[];
}

export interface ChurchCheckData {
  lastCheckedDate: string;
  attendedDates: string[];
}

export type ActiveTab = 'dashboard' | 'calendar' | 'mileage';
