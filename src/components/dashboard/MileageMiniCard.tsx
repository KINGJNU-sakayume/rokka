import { Star, TrendingDown } from 'lucide-react';
import type { MileageData } from '../../types';

interface MileageMiniCardProps {
  mileage: MileageData;
}

export default function MileageMiniCard({ mileage }: MileageMiniCardProps) {
  const isNegative = mileage.total < 0;

  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${isNegative ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">현재 마일리지</p>
          <p className={`text-3xl font-black ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
            {isNegative ? '' : '+'}{mileage.total}
            <span className="text-sm font-normal text-gray-400 ml-1">시간</span>
          </p>
          {isNegative && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <TrendingDown size={11} />
              목표까지 {Math.abs(mileage.total)}시간 부족
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isNegative ? 'bg-red-100' : 'bg-amber-50'}`}>
          <Star size={22} className={isNegative ? 'text-red-400' : 'text-amber-500'} />
        </div>
      </div>
    </div>
  );
}
