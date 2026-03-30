import { useState } from 'react';
import { Shield } from 'lucide-react';
import {
  BATTALION_CODES, BATTALION_LABELS,
  COMPANY_CODES, COMPANY_LABELS,
  validateSerial,
  type BattalionCode, type CompanyCode, type UserProfile,
} from '../../types/auth';
import { useProfile } from '../../context/ProfileContext';

export default function ProfileSetupScreen() {
  const { saveProfile } = useProfile();

  const [name, setName]                     = useState('');
  const [serial, setSerial]                 = useState('');
  const [battalion, setBattalion]           = useState<BattalionCode>(BATTALION_CODES[0]);
  const [company, setCompany]               = useState<CompanyCode>(COMPANY_CODES[0]);
  const [serialError, setSerialError]       = useState<string | null>(null);
  const [nameError, setNameError]           = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;

    if (!name.trim()) {
      setNameError('이름을 입력해주세요.');
      valid = false;
    } else {
      setNameError(null);
    }

    const serialErr = validateSerial(serial.trim());
    if (serialErr) {
      setSerialError(serialErr);
      valid = false;
    } else {
      setSerialError(null);
    }

    if (!valid) return;

    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      serial_number: serial.trim(),
      unit_battalion: battalion,
      unit_company: company,
      enlistment_date: null,
      has_completed_onboarding: false,
    };

    saveProfile(profile);
  };

  return (
    <div className="min-h-screen bg-[#0d1520] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-army-green-900/40 border border-army-green-600/30 flex items-center justify-center mb-4">
            <Shield size={32} className="text-army-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">프로필 설정</h1>
          <p className="text-gray-400 text-sm mt-1 text-center">
            병사 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full bg-[#1a2535] border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-army-green-500 focus:ring-1 focus:ring-army-green-500/30"
            />
            {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
          </div>

          {/* 군번 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">군번</label>
            <input
              type="text"
              value={serial}
              onChange={e => setSerial(e.target.value)}
              placeholder="25-12345678"
              className="w-full bg-[#1a2535] border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-army-green-500 focus:ring-1 focus:ring-army-green-500/30"
            />
            {serialError && <p className="text-red-400 text-xs mt-1">{serialError}</p>}
          </div>

          {/* 대대 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">대대</label>
            <select
              value={battalion}
              onChange={e => setBattalion(e.target.value as BattalionCode)}
              className="w-full bg-[#1a2535] border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-army-green-500 focus:ring-1 focus:ring-army-green-500/30"
            >
              {BATTALION_CODES.map(code => (
                <option key={code} value={code}>{BATTALION_LABELS[code]}</option>
              ))}
            </select>
          </div>

          {/* 중대 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">중대</label>
            <select
              value={company}
              onChange={e => setCompany(e.target.value as CompanyCode)}
              className="w-full bg-[#1a2535] border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-army-green-500 focus:ring-1 focus:ring-army-green-500/30"
            >
              {COMPANY_CODES.map(code => (
                <option key={code} value={code}>{COMPANY_LABELS[code]}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-army-green-600 hover:bg-army-green-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
}
