import { useState, useEffect } from 'react';
import { Shield, Calendar, ChevronRight } from 'lucide-react';
import { addMonths, startOfMonth, parseISO, isBefore, startOfDay } from 'date-fns';

export interface OnboardingPromoData {
  earlyToCorporal: number;
  earlyToSergeant: number;
  missedCorporal:  number;
  missedSergeant:  number;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (enlistmentDate: string, promoData: OnboardingPromoData) => void;
}

type Step = 'date' | 'corporal' | 'corporal_detail' | 'sergeant' | 'sergeant_detail';

/** 표준 진급일 계산 (조기/누락 없음) */
function stdPromoDate(enlistmentDate: string, offsetMonths: number): Date {
  const d = parseISO(enlistmentDate);
  return addMonths(startOfMonth(d), offsetMonths);
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep]           = useState<Step>('date');
  const [date, setDate]           = useState('');
  const [dateError, setDateError] = useState('');

  // 상병 진급 정보
  const [cplEarly,  setCplEarly]  = useState(0);  // 0~2
  const [cplMissed, setCplMissed] = useState(0);  // 0~2

  // 병장 진급 정보
  const [sgtEarly,  setSgtEarly]  = useState(0);  // 0~2
  const [sgtMissed, setSgtMissed] = useState(0);  // 0~1

  // 모달이 열릴 때마다 상태 초기화 (데이터 초기화 후 재진입 시 이전 step/date 잔류 방지)
  useEffect(() => {
    if (isOpen) {
      setStep('date');
      setDate('');
      setDateError('');
      setCplEarly(0);
      setCplMissed(0);
      setSgtEarly(0);
      setSgtMissed(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const today = startOfDay(new Date());

  /** 상병1호봉 이상인지 (표준 기준) */
  const pastCorporal = date ? !isBefore(today, stdPromoDate(date, 9)) : false;
  /** 병장1호봉 이상인지 (표준 기준) */
  const pastSergeant = date ? !isBefore(today, stdPromoDate(date, 15)) : false;

  const handleDateNext = () => {
    if (!date) { setDateError('입대일을 입력해주세요.'); return; }
    if (isNaN(new Date(date).getTime())) { setDateError('유효한 날짜를 입력해주세요.'); return; }
    setDateError('');
    if (pastCorporal) { setStep('corporal'); }
    else              { finish(); }
  };

  const finish = (ec = cplEarly, mc = cplMissed, es = sgtEarly, ms = sgtMissed) => {
    onComplete(date, { earlyToCorporal: ec, earlyToSergeant: es, missedCorporal: mc, missedSergeant: ms });
  };

  // ── 단계별 렌더 ──────────────────────────────────────────────────────────────

  const BtnSelect = ({ val, cur, onClick, label }: { val: number; cur: number; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick}
      className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
        cur === val ? 'bg-army-green-600 text-white border-army-green-600' : 'bg-white/10 text-gray-200 border-white/20 hover:border-white/40'
      }`}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-army-dark">
      <div className="w-full max-w-sm px-6">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-army-green-800/40 mb-5">
            <Shield size={40} className="text-army-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">군생활 관리</h1>
          <p className="text-gray-400 text-sm">대한민국 육군 병사를 위한 스마트 군 생활 관리 앱</p>
        </div>

        {/* ── STEP 1: 입대일 ── */}
        {step === 'date' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar size={14} className="inline mr-1" />
                입대일 (훈련병 입소일)
              </label>
              <input type="date" value={date}
                onChange={e => { setDate(e.target.value); setDateError(''); }}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-army-green-400 focus:ring-1 focus:ring-army-green-400 transition-colors [color-scheme:dark]"
              />
              {dateError && <p className="text-red-400 text-xs mt-1.5">{dateError}</p>}
            </div>
            <button onClick={handleDateNext}
              className="w-full bg-army-green-600 hover:bg-army-green-500 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              다음 <ChevronRight size={16}/>
            </button>
            <p className="text-center text-gray-500 text-xs">모든 데이터는 기기에 안전하게 저장됩니다</p>
          </div>
        )}

        {/* ── STEP 2: 상병 정상진급 여부 ── */}
        {step === 'corporal' && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-white font-semibold text-base mb-1">상병 진급</p>
              <p className="text-gray-400 text-sm">상병 진급 시 정상진급 하셨나요?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCplEarly(0); setCplMissed(0); if (pastSergeant) setStep('sergeant'); else finish(0,0,sgtEarly,sgtMissed); }}
                className="flex-1 py-3 rounded-xl bg-army-green-600 hover:bg-army-green-500 text-white font-semibold transition-all text-sm">
                예, 정상진급
              </button>
              <button onClick={() => setStep('corporal_detail')}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 font-semibold transition-all text-sm">
                아니오
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2b: 상병 조기/누락 상세 ── */}
        {step === 'corporal_detail' && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <p className="text-white font-semibold text-base mb-1">상병 진급 상세</p>
              <p className="text-gray-400 text-xs">조기진급과 진급누락 중 해당하는 항목을 선택하세요</p>
            </div>
            <div>
              <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">조기진급 (개월)</p>
              <div className="flex gap-2">
                {[0,1,2].map(v => (
                  <BtnSelect key={v} val={v} cur={cplEarly} onClick={() => { setCplEarly(v); if (v > 0) setCplMissed(0); }} label={v === 0 ? '없음' : `${v}개월`}/>
                ))}
              </div>
            </div>
            {cplEarly === 0 && (
              <div>
                <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">진급누락 (회) <span className="text-gray-500 normal-case font-normal">최대 2회</span></p>
                <div className="flex gap-2">
                  {[0,1,2].map(v => (
                    <BtnSelect key={v} val={v} cur={cplMissed} onClick={() => setCplMissed(v)} label={v === 0 ? '없음' : `${v}회`}/>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { if (pastSergeant) setStep('sergeant'); else finish(cplEarly,cplMissed,0,0); }}
              className="w-full bg-army-green-600 hover:bg-army-green-500 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              다음 <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── STEP 3: 병장 정상진급 여부 ── */}
        {step === 'sergeant' && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-white font-semibold text-base mb-1">병장 진급</p>
              <p className="text-gray-400 text-sm">병장 진급 시 정상진급 하셨나요?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSgtEarly(0); setSgtMissed(0); finish(cplEarly,cplMissed,0,0); }}
                className="flex-1 py-3 rounded-xl bg-army-green-600 hover:bg-army-green-500 text-white font-semibold transition-all text-sm">
                예, 정상진급
              </button>
              <button onClick={() => setStep('sergeant_detail')}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 font-semibold transition-all text-sm">
                아니오
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3b: 병장 조기/누락 상세 ── */}
        {step === 'sergeant_detail' && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <p className="text-white font-semibold text-base mb-1">병장 진급 상세</p>
              <p className="text-gray-400 text-xs">조기진급과 진급누락 중 해당하는 항목을 선택하세요</p>
            </div>
            <div>
              <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">조기진급 (개월)</p>
              <div className="flex gap-2">
                {[0,1,2].map(v => (
                  <BtnSelect key={v} val={v} cur={sgtEarly} onClick={() => { setSgtEarly(v); if (v > 0) setSgtMissed(0); }} label={v === 0 ? '없음' : `${v}개월`}/>
                ))}
              </div>
            </div>
            {sgtEarly === 0 && (
              <div>
                <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">진급누락 (회) <span className="text-gray-500 normal-case font-normal">최대 1회</span></p>
                <div className="flex gap-2">
                  {[0,1].map(v => (
                    <BtnSelect key={v} val={v} cur={sgtMissed} onClick={() => setSgtMissed(v)} label={v === 0 ? '없음' : `${v}회`}/>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => finish(cplEarly,cplMissed,sgtEarly,sgtMissed)}
              className="w-full bg-army-green-600 hover:bg-army-green-500 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
              시작하기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}