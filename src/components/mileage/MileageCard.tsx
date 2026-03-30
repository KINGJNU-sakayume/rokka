import { useState, useEffect } from 'react';
import { Star, Plus, Minus, ChevronDown, AlertCircle } from 'lucide-react';
import type { MileageData, MileageTransactionType, ScheduleEvent } from '../../types';

interface EarnOption {
  type: MileageTransactionType;
  label: string;
  amount: number;
}

interface SpendOption {
  type: MileageTransactionType;
  label: string;
  amount: number;
  /** 포상휴가 1일이 함께 지급되는 항목 표시 */
  grantsRewardVacation?: boolean;
  eventType?: ScheduleEvent['type'];
}

const EARN_OPTIONS: EarnOption[] = [
  { type: 'church_general', label: '교회 참석 (일반)',  amount: 1 },
  { type: 'church_praise',  label: '교회 참석 (찬양단)', amount: 2 },
  { type: 'dining_cleaning', label: '주말 식당청소',    amount: 2 },
  { type: 'early_return',   label: '조기 복귀',         amount: 2 },
];

// [REQ3] 주말외박(-24h)과 포상휴가 1일(-24h)을 별도 항목으로 분리
const SPEND_OPTIONS: SpendOption[] = [
  { type: 'half_combat_rest', label: '반투휴무',            amount: -4,  eventType: 'half_combat_rest' },
  { type: 'weekday_outing',   label: '평일외출',            amount: -4,  eventType: 'weekday_outing'   },
  { type: 'full_combat_rest', label: '전투휴무',            amount: -8,  eventType: 'full_combat_rest' },
  { type: 'weekend_outing',   label: '주말외출',            amount: -12, eventType: 'weekend_outing'   },
  { type: 'weekend_overnight', label: '주말외박',           amount: -24, eventType: 'weekend_overnight' },
  {
    type: 'vacation_reward',
    label: '포상휴가 1일 수령',
    amount: -24,
    grantsRewardVacation: true, // [REQ3] 포상휴가 1일 자동 지급 표시
  },
];

interface MileageCardProps {
  mileage: MileageData;
  onEarn:  (type: MileageTransactionType, amount: number, description?: string, date?: string) => void;
  onSpend: (type: MileageTransactionType, amount: number) => void;
}

export default function MileageCard({ mileage, onEarn, onSpend }: MileageCardProps) {
  const [showEarn,  setShowEarn]  = useState(true);
  const [showSpend, setShowSpend] = useState(false);
  const [actionDate, setActionDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setError(null); }, [actionDate]);

  const handleEarnClick = (opt: EarnOption) => {
    setError(null);
    const day = new Date(actionDate).getDay();

    if (opt.type === 'dining_cleaning' && day !== 0 && day !== 6) {
      setError('주말 식당청소는 토요일 또는 일요일에만 적립할 수 있습니다.');
      return;
    }
    if ((opt.type === 'church_general' || opt.type === 'church_praise') && day !== 0 && day !== 3) {
      setError('교회 참석은 수요일 또는 일요일에만 적립할 수 있습니다.');
      return;
    }

    onEarn(opt.type, opt.amount, opt.label, actionDate);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-6">
      {/* 보유 마일리지 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">보유 마일리지</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-army-dark">{mileage.total}</span>
            <span className="text-sm font-bold text-gray-400 mb-1">시간</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
          <Star size={24} className="text-yellow-500" fill="currentColor" />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium leading-relaxed">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* ── 적립 ── */}
        <button onClick={() => setShowEarn(v => !v)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Plus size={12} className="text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">마일리지 적립</span>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${showEarn ? 'rotate-180' : ''}`} />
        </button>

        {showEarn && (
          <div className="space-y-3 pl-2">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-600">적립 날짜</span>
              <input
                type="date"
                value={actionDate}
                onChange={e => setActionDate(e.target.value)}
                className="text-xs border-none bg-transparent focus:outline-none text-gray-700"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {EARN_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => handleEarnClick(opt)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  <span className="text-xs font-bold text-emerald-600">+{opt.amount}h</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 소모 ── */}
        <button onClick={() => setShowSpend(v => !v)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
              <Minus size={12} className="text-red-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">마일리지 소모</span>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${showSpend ? 'rotate-180' : ''}`} />
        </button>

        {showSpend && (
          <div className="space-y-2 pl-2">
            {SPEND_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => onSpend(opt.type, opt.amount)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl hover:bg-red-50 hover:border-red-200 border border-gray-100 transition-colors"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  {/* [REQ3] 포상휴가 지급 안내 배지 */}
                  {opt.grantsRewardVacation && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      포상휴가 +1일 지급
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-red-500">{opt.amount}h</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
