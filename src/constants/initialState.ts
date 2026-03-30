import type { UserData, VacationData, MileageData, ScheduleData, ChurchCheckData } from '../types';
import type { BasicSkillData } from '../types/basicSkill';

export const DEFAULT_USER: UserData = {
  enlistmentDate: '',
  hasCompletedOnboarding: false,
};

export const DEFAULT_VACATION: VacationData = {
  annualLeave: 28,
  rewardVacation: {
    history: [],
    usedDays: 0,
  },
  consolationVacation: 0,
  petitionVacation: 0,
  employmentLeaveGranted: false,
};

export const DEFAULT_MILEAGE: MileageData = { total: 0, history: [] };
export const DEFAULT_SCHEDULE: ScheduleData = { events: [] };
export const DEFAULT_CHURCH_CHECK: ChurchCheckData = { lastCheckedDate: '', attendedDates: [] };

export const DEFAULT_BASIC_SKILL: BasicSkillData = {
  records: [],
  eliteWarrior: { isActive: false },
  earlyPromotion: { toCorporal: 0, toSergeant: 0 },
  missedPromotions: [],
};
