import { TrendingUp } from 'lucide-react';
import {
  calculateServiceProgress, calculateRemainingDays,
  calculateRemainingWorkingDays, calculateDischargeDate,
} from '../../logic/serviceCalculator';
import { formatDate } from '../../utils/dateUtils';
import type { ScheduleEvent } from '../../types';

interface ServiceProgressCardProps {
  enlistmentDate: string;
  events: ScheduleEvent[];
}

export default function ServiceProgressCard({ enlistmentDate, events }: ServiceProgressCardProps) {
  const progress             = calculateServiceProgress(enlistmentDate);
  const remainingDays        = calculateRemainingDays(enlistmentDate);
  const remainingWorkingDays = calculateRemainingWorkingDays(enlistmentDate, events ?? []);
  const dischargeDate        = calculateDischargeDate(enlistmentDate);

  const progressColor = progress >= 75 ? 'bg-army-green-500' : progress >= 50 ? 'bg-amber-500' : 'bg-gray-400';

  return (
    <div className="bg-army-dark rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">전역일</p>
          <p className="text-lg font-bold">{formatDate(dischargeDate, 'yyyy년 MM월 dd일')}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">복무율</p>
          <p className="text-2xl font-black text-army-green-400">{progress}%</p>
        </div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-1000 ease-out ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">남은 복무일수</p>
          <p className="text-xl font-bold">
            <span className="text-army-green-300">{remainingDays.toLocaleString()}</span>
            <span className="text-gray-400 text-sm font-normal ml-1">일</span>
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={10} className="text-gray-400"/>
            <p className="text-gray-400 text-xs">남은 근무일수</p>
          </div>
          <p className="text-xl font-bold">
            <span className="text-blue-300">{remainingWorkingDays.toLocaleString()}</span>
            <span className="text-gray-400 text-sm font-normal ml-1">일</span>
          </p>
        </div>
      </div>
    </div>
  );
}
