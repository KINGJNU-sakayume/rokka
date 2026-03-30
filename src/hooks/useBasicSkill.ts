import { useLocalStorage } from './useLocalStorage';
import type { BasicSkillData, BasicSkillSubject, BasicSkillGrade } from '../types/basicSkill';
import { DEFAULT_BASIC_SKILL } from '../constants/initialState';
import { calcExpiresAt } from '../logic/basicSkillLogic';
import { generateId } from '../utils/mileageUtils';

export function useBasicSkill() {
  const [basicSkillData, setBasicSkillData, resetBasicSkillData] =
    useLocalStorage<BasicSkillData>('mil_basic_skill', DEFAULT_BASIC_SKILL);

  const addRecord = (subject: BasicSkillSubject, grade: BasicSkillGrade, acquiredDate: string) => {
    setBasicSkillData(prev => ({
      ...prev,
      records: [...prev.records,
        { id: generateId(), subject, grade, acquiredDate, expiresAt: calcExpiresAt(acquiredDate) },
      ],
    }));
  };

  const removeRecord = (id: string) => {
    setBasicSkillData(prev => ({ ...prev, records: prev.records.filter(r => r.id !== id) }));
  };

  const confirmEliteWarrior = () => {
    setBasicSkillData(prev => ({
      ...prev,
      eliteWarrior: { isActive: true, confirmedDate: new Date().toISOString().slice(0, 10) },
    }));
  };

  const revokeEliteWarrior = () => {
    setBasicSkillData(prev => ({ ...prev, eliteWarrior: { isActive: false } }));
  };

  /** 상병/병장 조기진급 개월 수 설정 */
  const setEarlyPromotion = (toCorporal: number, toSergeant: number) => {
    setBasicSkillData(prev => ({
      ...prev,
      earlyPromotion: { toCorporal, toSergeant },
    }));
  };

  /** 진급 누락 기록 추가 */
  const addMissedPromotion = (targetRank: '상병' | '병장', examMonth: string) => {
    setBasicSkillData(prev => ({
      ...prev,
      missedPromotions: [...prev.missedPromotions,
        { id: generateId(), targetRank, examMonth, isManual: true },
      ],
    }));
  };

  const removeMissedPromotion = (id: string) => {
    setBasicSkillData(prev => ({
      ...prev,
      missedPromotions: prev.missedPromotions.filter(m => m.id !== id),
    }));
  };

  return {
    basicSkillData,
    addRecord, removeRecord,
    confirmEliteWarrior, revokeEliteWarrior,
    setEarlyPromotion,
    addMissedPromotion, removeMissedPromotion,
    resetBasicSkillData: () => resetBasicSkillData(),
  };
}
