import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { MileageData } from '../../types';
import { groupEntriesByDate } from '../../utils/mileageUtils';

interface MileageHistoryProps {
  mileage: MileageData;
}

export default function MileageHistory({ mileage }: MileageHistoryProps) {
  const byDate = useMemo(
    () => Array.from(groupEntriesByDate(mileage.history).entries()),
    [mileage.history],
  );

  // Group date entries by month (YYYY-MM), maintaining newest-first order
  const byMonth = useMemo(() => {
    const monthMap = new Map<string, [string, typeof byDate[0][1]][]>();
    for (const [date, entries] of byDate) {
      const monthKey = date.slice(0, 7); // 'YYYY-MM'
      const group = monthMap.get(monthKey) ?? [];
      group.push([date, entries]);
      monthMap.set(monthKey, group);
    }
    return Array.from(monthMap.entries());
  }, [byDate]);

  if (byDate.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Clock size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">아직 마일리지 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">마일리지 내역</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {byMonth.map(([monthKey, dateGroups]) => (
          <div key={monthKey}>
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-bold text-gray-500">
                {format(parseISO(monthKey + '-01'), 'yyyy년 MM월', { locale: ko })}
              </p>
            </div>
            {dateGroups.map(([date, dayEntries]) => (
              <div key={date} className="px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {format(parseISO(date), 'MM월 dd일 (eee)', { locale: ko })}
                </p>
                <div className="space-y-2">
                  {dayEntries.map((entry) => {
                    const isPositive = entry.amount > 0;
                    return (
                      <div key={entry.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {isPositive
                              ? <TrendingUp size={10} className="text-emerald-600" />
                              : <TrendingDown size={10} className="text-red-500" />
                            }
                          </div>
                          <span className="text-xs text-gray-700 truncate">{entry.description}</span>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{entry.amount}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
