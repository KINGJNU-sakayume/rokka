import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { EVENT_CONFIG } from '../../constants/eventConfig';
import { KOREAN_PUBLIC_HOLIDAYS } from '../../constants/holidays';
import { AlertCircle } from 'lucide-react';
import type { EventType, ScheduleEvent, ScheduleData, VacationData } from '../../types';
import { getRewardVacationTotal } from '../../hooks/useVacation';

const EVENT_TYPES: EventType[] = [
  'vacation', 'duty', 'after_duty_sleep', 'weekday_outing',
  'weekend_outing', 'weekend_overnight', 'night_watch',
  'full_combat_rest', 'half_combat_rest', 'dining_cleaning',
];

interface AddEventModalProps {
  isOpen: boolean; onClose: () => void; defaultDate?: string;
  scheduleData: ScheduleData;
  vacationData?: VacationData; weekendLeaveBlocked?: boolean;
  onAdd: (event: Omit<ScheduleEvent, 'id'>) => void;
}

export default function AddEventModal({
  isOpen, onClose, defaultDate, scheduleData,
  vacationData, weekendLeaveBlocked = false, onAdd,
}: AddEventModalProps) {
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<EventType>('duty');
  const [date, setDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [nightWatchNumber, setNightWatchNumber] = useState('');
  const [isRewardOrMileage, setIsRewardOrMileage] = useState(false);
  const [vacationBreakdown, setVacationBreakdown] = useState({ annual:0, reward:0, consolation:0, petition:0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (defaultDate) setDate(defaultDate); }, [defaultDate]);
  useEffect(() => { if (isOpen) setError(null); }, [isOpen, type, date, endDate]);

  // [REQ2] 주말외박: 종료일 자동 = 출발일 + 1
  useEffect(() => {
    if (type === 'weekend_overnight' && date) {
      const d = new Date(date); d.setDate(d.getDate() + 1);
      setEndDate(d.toISOString().slice(0, 10));
    }
  }, [type, date]);

  const vacTotal = vacationBreakdown.annual + vacationBreakdown.reward + vacationBreakdown.consolation + vacationBreakdown.petition;

  // [REQ2] 휴가: 배분 합계 변경 시 종료일 자동
  useEffect(() => {
    if (type === 'vacation' && date && vacTotal > 0) {
      const d = new Date(date); d.setDate(d.getDate() + vacTotal - 1);
      setEndDate(d.toISOString().slice(0, 10));
    }
  }, [type, date, vacTotal]);

  const rewardAvailable = vacationData ? getRewardVacationTotal(vacationData) : 0;
  const available = {
    annual: vacationData?.annualLeave ?? 0,
    reward: rewardAvailable,
    consolation: vacationData?.consolationVacation ?? 0,
    petition: vacationData?.petitionVacation ?? 0,
  };

  const isMultiDay = ['vacation', 'weekend_overnight'].includes(type);
  const isNightWatch = type === 'night_watch';
  const isOuting = ['weekday_outing', 'weekend_outing', 'weekend_overnight'].includes(type);
  const isRestDay = (d: string) => [0,6].includes(new Date(d).getDay()) || KOREAN_PUBLIC_HOLIDAYS.includes(d);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!date) return;

    if (type === 'weekday_outing' && !isRewardOrMileage) {
      const cnt = scheduleData.events.filter(ev => ev.type === 'weekday_outing' && !ev.isRewardOrMileage && ev.date.startsWith(date.slice(0,7))).length;
      if (cnt >= 2) { setError('평일외출(기본)은 달마다 2회까지만 가능합니다.'); return; }
    }

    if ((type === 'weekend_outing' || type === 'weekend_overnight') && !isRewardOrMileage) {
      if (weekendLeaveBlocked) { setError('이번 분기 병기본 기준 미달로 주말 외출/외박이 차단됩니다.\n마일리지 탭 > 병기본에서 성적을 업데이트하세요.'); return; }
      const cm = date.slice(0,7); const d = new Date(date); const yr = d.getFullYear(); const q = Math.floor(d.getMonth()/3);
      if (scheduleData.events.filter(ev => (ev.type==='weekend_outing'||ev.type==='weekend_overnight') && !ev.isRewardOrMileage && ev.date.startsWith(cm)).length >= 1) {
        setError('기본 주말외출/외박은 달에 한 번만 사용할 수 있습니다.'); return;
      }
      const qEvs = scheduleData.events.filter(ev => {
        if (ev.isRewardOrMileage || (ev.type!=='weekend_outing'&&ev.type!=='weekend_overnight')) return false;
        const ed = new Date(ev.date); return ed.getFullYear()===yr && Math.floor(ed.getMonth()/3)===q;
      });
      if (type==='weekend_outing' && qEvs.filter(ev=>ev.type==='weekend_outing').length>=2) { setError('이번 분기 기본 주말외출(2회) 소진.'); return; }
      if (type==='weekend_overnight' && qEvs.filter(ev=>ev.type==='weekend_overnight').length>=1) { setError('이번 분기 기본 주말외박(1회) 소진.'); return; }
    }

    if (type === 'weekend_overnight') {
      if (!endDate) { setError('종료일을 선택해주세요.'); return; }
      if (Math.round((new Date(endDate).getTime()-new Date(date).getTime())/86400000)!==1) { setError('주말외박은 1박 2일 일정만 가능합니다.'); return; }
      if (!isRestDay(date)||!isRestDay(endDate)) { setError('주말외박 시작일/종료일은 주말·공휴일이어야 합니다.'); return; }
    }

    if (type === 'vacation') {
      const diffDays = Math.round((new Date(endDate||date).getTime()-new Date(date).getTime())/86400000)+1;
      if (vacTotal === 0) { setError('항목 배분을 입력해주세요.'); return; }
      if (diffDays !== vacTotal) { setError(`휴가 기간(${diffDays}일)과 배분 합계(${vacTotal}일)가 다릅니다.`); return; }
      if (vacationData) {
        if (vacationBreakdown.annual > available.annual) { setError(`연가 잔량 부족 (보유: ${available.annual}일)`); return; }
        if (vacationBreakdown.reward > available.reward) { setError(`포상휴가 잔량 부족 (보유: ${available.reward}일)`); return; }
        if (vacationBreakdown.consolation > available.consolation) { setError(`위로휴가 잔량 부족 (보유: ${available.consolation}일)`); return; }
        if (vacationBreakdown.petition > available.petition) { setError(`청원휴가 잔량 부족 (보유: ${available.petition}일)`); return; }
      }
    }

    const cfg = EVENT_CONFIG[type] || { label: '기타' };
    onAdd({
      type, date,
      endDate: isMultiDay && endDate ? endDate : undefined,
      title: type==='vacation' ? '휴가' : (title.trim()||cfg.label),
      nightWatchNumber: isNightWatch && nightWatchNumber ? parseInt(nightWatchNumber) : undefined,
      vacationBreakdown: type==='vacation' ? { ...vacationBreakdown } : undefined,
      isRewardOrMileage: isOuting ? isRewardOrMileage : undefined,
    });
    setTitle(''); setEndDate(''); setNightWatchNumber('');
    setIsRewardOrMileage(false); setVacationBreakdown({ annual:0,reward:0,consolation:0,petition:0 });
    onClose();
  };

  const VAC_LABELS = { annual:'연가', reward:'포상', consolation:'위로', petition:'청원' } as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="일정 추가">
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium leading-relaxed whitespace-pre-line">
          <AlertCircle size={14} className="mt-0.5 shrink-0"/><span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">일정 유형</label>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TYPES.map(t => {
              const cfg=EVENT_CONFIG[t]; const sel=type===t;
              return (
                <button key={t} type="button" onClick={()=>setType(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${sel?'border-army-green-400 bg-army-green-50 text-army-green-700':'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`}/>{cfg.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">날짜</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-army-green-400"/>
        </div>
        {isMultiDay && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              종료 날짜 {((type==='vacation'&&vacTotal>0)||type==='weekend_overnight') && <span className="text-[10px] text-army-green-600 ml-1">(자동 설정됨)</span>}
            </label>
            <input type="date" value={endDate} min={date} required={type==='weekend_overnight'}
              readOnly disabled
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"/>
          </div>
        )}
        {isOuting && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input type="checkbox" id="rewardOuting" checked={isRewardOrMileage} onChange={e=>setIsRewardOrMileage(e.target.checked)} className="w-4 h-4 text-army-green-600 bg-gray-100 border-gray-300 rounded"/>
            <label htmlFor="rewardOuting" className="text-xs text-gray-700 font-medium cursor-pointer">마일리지/포상 외출·외박 (기본 횟수 차감 안 됨)</label>
          </div>
        )}
        {type==='vacation' && (
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">세부 항목 배분 (일 단위)</label>
              {vacTotal>0 && <span className="text-[10px] text-army-green-600 font-semibold">합계 {vacTotal}일 · 복귀일 {endDate||'-'}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['annual','reward','consolation','petition'] as const).map(k=>(
                <div key={k}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 font-medium">{VAC_LABELS[k]}</span>
                    {vacationData && <span className="text-[10px] text-gray-400">잔: {available[k]}일</span>}
                  </div>
                  <input type="number" min="0" max={available[k]||999} value={vacationBreakdown[k]}
                    onChange={e=>setVacationBreakdown({...vacationBreakdown,[k]:parseInt(e.target.value)||0})}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-army-green-400"/>
                </div>
              ))}
            </div>
          </div>
        )}
        {isNightWatch && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">불침번 번호 (초)</label>
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} type="button"
                  onClick={() => setNightWatchNumber(String(n))}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    nightWatchNumber === String(n)
                      ? 'bg-army-dark text-white border-army-dark'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        {type!=='vacation' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">제목 (선택)</label>
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder={(EVENT_CONFIG[type]||{label:''}).label} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-army-green-400"/>
          </div>
        )}
        <button type="submit" className="w-full bg-army-dark hover:bg-army-dark/90 text-white font-semibold py-3 rounded-xl transition-colors text-sm">일정 추가</button>
      </form>
    </Modal>
  );
}
