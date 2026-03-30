import { useState } from 'react';
import { Star, Umbrella, Shield } from 'lucide-react';
import MileageCard from './MileageCard';
import MileageHistory from './MileageHistory';
import VacationCard from './VacationCard';
import BasicSkillSection from '../basicSkill/BasicSkillSection';
import type { MileageData, VacationData, MileageTransactionType } from '../../types';
import type { BasicSkillData, BasicSkillSubject, BasicSkillGrade } from '../../types/basicSkill';

type SubTab = 'mileage' | 'vacation' | 'basicSkill';

interface MileageTabProps {
  mileage: MileageData;
  vacation: VacationData;
  basicSkillData: BasicSkillData;
  enlistmentDate: string;
  onEarnMileage: (type: MileageTransactionType, amount: number, description?: string) => void;
  onSpendMileage: (type: MileageTransactionType, amount: number) => void;
  onAddRewardVacation: (days: number, dateEarned: string, description?: string) => void;
  onAddConsolationVacation: (days: number) => void;
  onAddRecord: (subject: BasicSkillSubject, grade: BasicSkillGrade, acquiredDate: string) => void;
  onRemoveRecord: (id: string) => void;
  onConfirmElite: () => void;
  onRevokeElite: () => void;
  onSetEarlyPromotion: (toCorporal: number, toSergeant: number) => void;
  onAddMissed: (targetRank: '상병' | '병장', examMonth: string) => void;
  onRemoveMissed: (id: string) => void;
}

export default function MileageTab({
  mileage, vacation, basicSkillData, enlistmentDate,
  onEarnMileage, onSpendMileage, onAddRewardVacation, onAddConsolationVacation,
  onAddRecord, onRemoveRecord, onConfirmElite, onRevokeElite,
  onSetEarlyPromotion, onAddMissed, onRemoveMissed,
}: MileageTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('mileage');

  const TABS: { id: SubTab; label: string; Icon: any }[] = [
    { id: 'mileage',    label: '마일리지', Icon: Star    },
    { id: 'vacation',   label: '휴가',     Icon: Umbrella },
    { id: 'basicSkill', label: '병기본',   Icon: Shield  },
  ];

  return (
    <div className="space-y-4">
      {/* 서브탭 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1 flex shadow-sm">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === id ? 'bg-army-dark text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>

      {subTab === 'mileage' && (
        <>
          <MileageCard mileage={mileage} onEarn={onEarnMileage} onSpend={onSpendMileage}/>
          <MileageHistory mileage={mileage}/>
        </>
      )}

      {subTab === 'vacation' && (
        <VacationCard
          vacation={vacation}
          onAddReward={onAddRewardVacation}
          onAddConsolation={onAddConsolationVacation}
        />
      )}

      {subTab === 'basicSkill' && (
        <BasicSkillSection
          data={basicSkillData}
          enlistmentDate={enlistmentDate}
          onAddRecord={onAddRecord}
          onRemoveRecord={onRemoveRecord}
          onConfirmElite={onConfirmElite}
          onRevokeElite={onRevokeElite}
          onSetEarlyPromotion={onSetEarlyPromotion}
          onAddMissed={onAddMissed}
          onRemoveMissed={onRemoveMissed}
        />
      )}
    </div>
  );
}
