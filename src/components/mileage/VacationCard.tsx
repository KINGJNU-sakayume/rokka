import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { VacationData } from '../../types';
import AddVacationModal from './AddVacationModal';
import { getDaysUntilExpiry, isRewardVacationExpiring, isRewardVacationExpired, getExpiringRewardEntries } from '../../logic/vacationLogic';
import { getRewardVacationTotal } from '../../hooks/useVacation';

interface VacationCardProps {
  vacation: VacationData;
  onAddReward: (days: number, dateEarned: string, description?: string) => void;
  onAddConsolation: (days: number) => void;
}

export default function VacationCard({ vacation, onAddReward, onAddConsolation }: VacationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rewardTotal   = getRewardVacationTotal(vacation);
  const rewardHistory = vacation.rewardVacation.history ?? [];
  const expiringRewards = getExpiringRewardEntries(rewardHistory);

  const items = [
    { label: '연가',     value: vacation.annualLeave,         max: 28, color: 'bg-blue-500',    text: 'text-blue-600' },
    { label: '포상휴가', value: rewardTotal,                   max: 16, color: 'bg-amber-500',   text: 'text-amber-600' },
    { label: '위로휴가', value: vacation.consolationVacation,  max: null, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: '청원휴가', value: vacation.petitionVacation,     max: null, color: 'bg-rose-500',    text: 'text-rose-600' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">휴가 현황</h3>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-army-dark text-white rounded-lg text-xs font-medium hover:bg-army-dark/90 transition-colors">
          <Plus size={12}/> 휴가 추가
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-2xl font-black ${item.text}`}>
              {item.value}<span className="text-sm font-normal text-gray-400 ml-1">일</span>
            </p>
            {item.max !== null && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {vacation.employmentLeaveGranted && (
        <div className="mx-4 mb-3 px-3 py-2 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-700 font-medium">✅ 취업청원휴가 2일 지급 완료 (청원휴가에 포함)</p>
        </div>
      )}

      {expiringRewards.length > 0 && (
        <div className="mx-4 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
          <p className="text-xs text-amber-800 leading-relaxed">
            포상휴가 {expiringRewards.length}건이 30일 이내 만료됩니다.
          </p>
        </div>
      )}

      {rewardHistory.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">포상휴가 지급 이력</p>
          <div className="space-y-2">
            {rewardHistory.slice().reverse().map(entry => {
              const daysLeft = getDaysUntilExpiry(entry);
              const expiring = isRewardVacationExpiring(entry);
              const expired  = isRewardVacationExpired(entry);
              return (
                <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl ${expired ? 'bg-gray-50 opacity-60' : expiring ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      +{entry.daysEarned}일{entry.description && <span className="text-gray-400 font-normal"> · {entry.description}</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">취득: {format(parseISO(entry.dateEarned), 'yyyy.MM.dd')}</p>
                  </div>
                  <div className="text-right">
                    {expired ? (
                      <span className="text-[10px] text-gray-400">만료됨</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {expiring && <AlertTriangle size={10} className="text-amber-500"/>}
                        <span className={`text-[10px] ${expiring ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>{daysLeft}일 남음</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddVacationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vacation={vacation}
        onAddReward={onAddReward}
        onAddConsolation={onAddConsolation}
      />
    </div>
  );
}
