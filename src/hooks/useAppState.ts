import { useServiceData } from './useServiceData';
import { useVacation } from './useVacation';
import { useMileage } from './useMileage';
import { useSchedule } from './useSchedule';
import { useChurchCheck } from './useChurchCheck';
import { useBasicSkill } from './useBasicSkill';

export function useAppState() {
  const { userData, completeOnboarding, resetUserData } = useServiceData();
  const {
    vacationData, setVacationData,
    addRewardVacation, addConsolationVacation, useAnnualLeave,
    spendVacationBreakdown, restoreVacationBreakdown, grantEmploymentLeave,
    resetVacationData,
  } = useVacation();
  const { mileageData, addMileageEntry, resetMileageData } = useMileage();
  const { scheduleData, addScheduleEvent, removeScheduleEvent, resetScheduleData } = useSchedule();
  const { churchCheckData, updateChurchCheck, resetChurchCheckData } = useChurchCheck();
  const {
    basicSkillData,
    addRecord, removeRecord,
    confirmEliteWarrior, revokeEliteWarrior,
    setEarlyPromotion,
    addMissedPromotion, removeMissedPromotion,
    resetBasicSkillData,
  } = useBasicSkill();

  const resetAll = () => {
    resetUserData(); resetVacationData(); resetMileageData();
    resetScheduleData(); resetChurchCheckData(); resetBasicSkillData();
  };

  return {
    userData, vacationData, mileageData, scheduleData, churchCheckData, basicSkillData,
    completeOnboarding,
    addScheduleEvent, removeScheduleEvent,
    addMileageEntry, addRewardVacation, addConsolationVacation, useAnnualLeave,
    spendVacationBreakdown, restoreVacationBreakdown, grantEmploymentLeave,
    updateChurchCheck, resetAll, setVacationData,
    addRecord, removeRecord,
    confirmEliteWarrior, revokeEliteWarrior,
    setEarlyPromotion,
    addMissedPromotion, removeMissedPromotion,
  };
}
