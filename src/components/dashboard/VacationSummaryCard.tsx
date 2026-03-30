import { AlertTriangle } from 'lucide-react';
import type { VacationData } from '../../types';
import {
  getExpiringRewardEntries,
  getActiveRewardVacationTotal, // [FIX] HIGH: 만료 제외 유효 일수
} from '../../logic/vacationLogic';

interface VacationSummaryCardProps {
  vacation: VacationData;
}

export default function VacationSummaryCard({ vacation }: VacationSummaryCardProps) {
  const expiringRewards = getExpiringRewardEntries(vacation.rewardVacation.history);

  // [FIX] HIGH: 만료된 포상휴가를 제외한 실제 유효 일수로 표시
  const activeRewardTotal = getActiveRewardVacationTotal(vacation.rewardVacation.history);

  const items = [
    { label: '연가', value: vacation.annualLeave, max: 28, color: 'bg-blue-500' },
    { label: '포상휴가', value: activeRewardTotal, max: 16, color: 'bg-amber-500' },
    { label: '위로휴가', value: vacation.consolationVacation, max: null, color: 'bg-emerald-500' },
    { label: '청원휴가', value: vacation.petitionVacation, max: null, color: 'bg-rose-500' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">휴가 현황</h3>

      <div className="grid grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-xl font-black text-gray-900 mb-0.5">{item.value}</div>
            <div className="text-[10px] text-gray-500 mb-2">{item.label}</div>
            {item.max !== null && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {expiringRewards.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            포상휴가 {expiringRewards.length}건이 30일 이내 만료됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
