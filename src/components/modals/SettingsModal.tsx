import { useState } from 'react';
import Modal from '../shared/Modal';
import { AlertTriangle, LogOut } from 'lucide-react';
import { COMPANY_LABELS, BATTALION_LABELS, type UserProfile } from '../../types/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enlistmentDate: string;
  onResetAll: () => void;
  onUpdateEnlistmentDate: (date: string) => void;
  onSignOut?: () => void;
  profile?: UserProfile | null;
}

export default function SettingsModal({
  isOpen, onClose, enlistmentDate, onResetAll,
  onUpdateEnlistmentDate, onSignOut, profile,
}: SettingsModalProps) {
  const [newDate, setNewDate] = useState(enlistmentDate);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleDateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate) { onUpdateEnlistmentDate(newDate); onClose(); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="설정">
      <div className="space-y-5">

        {/* 계정 정보 */}
        {profile && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">계정 정보</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">이름</span>
              <span className="font-semibold text-gray-800">{profile.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">소속</span>
              <span className="font-semibold text-gray-800">
                {BATTALION_LABELS[profile.unit_battalion]} {COMPANY_LABELS[profile.unit_company]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">군번</span>
              <span className="font-semibold text-gray-800">{profile.serial_number}</span>
            </div>
          </div>
        )}

        {/* 입대일 수정 */}
        <form onSubmit={handleDateSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">입대일 수정</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-army-green-400 transition-colors"/>
          </div>
          <button type="submit" className="w-full bg-army-dark text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-army-dark/90 transition-colors">저장</button>
        </form>

        {/* 로그아웃 */}
        {onSignOut && (
          <div className="border-t border-gray-100 pt-4">
            {!confirmSignOut ? (
              <button onClick={() => setConfirmSignOut(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <LogOut size={14}/> 로그아웃
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 font-medium text-center">로그아웃 하시겠습니까?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setConfirmSignOut(false)}
                    className="py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">취소</button>
                  <button onClick={() => { onSignOut(); onClose(); }}
                    className="py-2.5 bg-gray-700 text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-colors">로그아웃</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 위험 구역 */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">위험 구역</p>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-50 transition-colors">
              <AlertTriangle size={14}/> 모든 데이터 초기화
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-600 font-medium text-center">정말 모든 데이터를 삭제하시겠습니까?</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setConfirmReset(false)}
                  className="py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">취소</button>
                <button onClick={() => { onResetAll(); onClose(); setConfirmReset(false); }}
                  className="py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors">삭제</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
