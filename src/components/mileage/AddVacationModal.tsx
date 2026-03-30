import { useState } from 'react';
import Modal from '../shared/Modal';
import { AlertTriangle } from 'lucide-react';
import type { VacationData } from '../../types';
import { canAddRewardVacation, REWARD_VACATION_MAX_DAYS, getActiveRewardVacationTotal } from '../../logic/vacationLogic';

interface AddVacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacation: VacationData;
  onAddReward: (days: number, dateEarned: string, description?: string) => void;
  onAddConsolation: (days: number) => void;
}

export default function AddVacationModal({
  isOpen,
  onClose,
  vacation,
  onAddReward,
  onAddConsolation,
}: AddVacationModalProps) {
  const [vacType, setVacType] = useState<'reward' | 'consolation'>('reward');
  const [days, setDays] = useState('1');
  const [dateEarned, setDateEarned] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  const currentReward = getActiveRewardVacationTotal(vacation.rewardVacation.history);
  const wouldExceedCap = vacType === 'reward' && !canAddRewardVacation(currentReward, parseInt(days || '0'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays <= 0) return;

    if (vacType === 'reward') {
      if (wouldExceedCap) return;
      onAddReward(numDays, dateEarned, description || undefined);
    } else {
      onAddConsolation(numDays);
    }

    setDays('1');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="휴가 추가">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">휴가 유형</label>
          <div className="grid grid-cols-2 gap-2">
            {(['reward', 'consolation'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setVacType(t)}
                className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  vacType === t
                    ? 'border-army-green-400 bg-army-green-50 text-army-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t === 'reward' ? '포상휴가' : '위로휴가'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">일수</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min={1}
            max={vacType === 'reward' ? REWARD_VACATION_MAX_DAYS - currentReward : undefined}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-army-green-400 transition-colors"
          />
          {vacType === 'reward' && (
            <p className="text-xs text-gray-400 mt-1">
              현재 포상휴가: {currentReward}일 / 최대 {REWARD_VACATION_MAX_DAYS}일
            </p>
          )}
        </div>

        {vacType === 'reward' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">획득일</label>
              <input
                type="date"
                value={dateEarned}
                onChange={(e) => setDateEarned(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-army-green-400 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">6개월 후 자동 만료됩니다</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">사유 (선택)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 사격 우수"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-army-green-400 transition-colors"
              />
            </div>
          </>
        )}

        {wouldExceedCap && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              포상휴가는 최대 16일을 초과할 수 없습니다.<br />
              현재 {currentReward}일 보유 중입니다.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={wouldExceedCap}
          className="w-full bg-army-dark hover:bg-army-dark/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          추가
        </button>
      </form>
    </Modal>
  );
}
