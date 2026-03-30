import { format } from 'date-fns';
import Modal from '../shared/Modal';
import { Church, Music, X } from 'lucide-react';

interface ChurchAttendanceModalProps {
  isOpen: boolean;
  dayName: '수요일' | '일요일';
  date: Date;
  onGeneral: () => void;
  onPraiseTeam: () => void;
  onNo: () => void;
}

export default function ChurchAttendanceModal({
  isOpen,
  dayName,
  date,
  onGeneral,
  onPraiseTeam,
  onNo,
}: ChurchAttendanceModalProps) {
  const dateStr = format(date, 'MM월 dd일');

  return (
    <Modal isOpen={isOpen} title="교회 예배 확인" showClose={false}>
      <div className="space-y-5">
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
            <Church size={28} className="text-emerald-600" />
          </div>
          <p className="text-base font-semibold text-gray-900">
            지난 {dayName} ({dateStr}) 교회에 참석했나요?
          </p>
          <p className="text-sm text-gray-500 mt-1">마일리지가 자동으로 적립됩니다</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onGeneral}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center shrink-0">
              <Church size={16} className="text-emerald-700" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-emerald-800">네, 참석했습니다 (일반)</p>
              <p className="text-xs text-emerald-600">+1시간 마일리지 적립</p>
            </div>
          </button>

          <button
            onClick={onPraiseTeam}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center shrink-0">
              <Music size={16} className="text-blue-700" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-blue-800">네, 참석했습니다 (찬양단)</p>
              <p className="text-xs text-blue-600">+2시간 마일리지 적립</p>
            </div>
          </button>

          <button
            onClick={onNo}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
              <X size={16} className="text-gray-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-700">아니오, 참석하지 않았습니다</p>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}
