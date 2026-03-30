import { useState } from 'react';
import { Plus, Trash2, Award, Shield, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { BasicSkillData, BasicSkillSubject, BasicSkillGrade, MilitaryRank } from '../../types/basicSkill';
import { ALL_SUBJECTS, ALL_GRADES, SUBJECT_LABELS, GRADE_COLORS } from '../../types/basicSkill';
import {
  computePromotionSchedule, computeCurrentRank, checkEliteWarrior,
  getAllValidGrades, isLeaveBlocked, computePromotionEligibility, computeHobong,
} from '../../logic/basicSkillLogic';

interface Props {
  data: BasicSkillData;
  enlistmentDate: string;
  onAddRecord: (subject: BasicSkillSubject, grade: BasicSkillGrade, acquiredDate: string) => void;
  onRemoveRecord: (id: string) => void;
  onConfirmElite: () => void;
  onRevokeElite: () => void;
  onSetEarlyPromotion: (toCorporal: number, toSergeant: number) => void;
  onAddMissed: (targetRank: '상병' | '병장', examMonth: string) => void;
  onRemoveMissed: (id: string) => void;
}

export default function BasicSkillSection({
  data, enlistmentDate, onAddRecord, onRemoveRecord, onConfirmElite, onRevokeElite,
  onSetEarlyPromotion, onAddMissed, onRemoveMissed,
}: Props) {
  const [showAddForm, setShowAddForm]         = useState(false);
  const [showPromoMgmt, setShowPromoMgmt]     = useState(false);
  const [addSubject, setAddSubject]           = useState<BasicSkillSubject>('physical');
  const [addGrade, setAddGrade]               = useState<BasicSkillGrade>('2급');
  const [addDate, setAddDate]                 = useState(new Date().toISOString().slice(0,10));
  const [missedRank, setMissedRank]           = useState<'상병'|'병장'>('상병');
  const [missedMonth, setMissedMonth]         = useState(new Date().toISOString().slice(0,7));
  const [earlyCorpInput, setEarlyCorpInput]   = useState(String(data.earlyPromotion.toCorporal));
  const [earlySgtInput, setEarlySgtInput]     = useState(String(data.earlyPromotion.toSergeant));

  const currentRank  = enlistmentDate ? computeCurrentRank(enlistmentDate, data) : '이병';
  const { hobong }   = enlistmentDate ? computeHobong(enlistmentDate, data) : { hobong: 1 };
  const grades       = getAllValidGrades(data);
  const sched        = enlistmentDate ? computePromotionSchedule(enlistmentDate, data) : null;
  const eligibility  = enlistmentDate ? computePromotionEligibility(enlistmentDate, data) : null;
  const leaveBlocked = isLeaveBlocked(data, enlistmentDate);
  const eliteReady   = checkEliteWarrior(data);

  const missedCpl    = data.missedPromotions.filter(m => m.targetRank === '상병').length;
  const missedSgt    = data.missedPromotions.filter(m => m.targetRank === '병장').length;
  const totalMissed  = missedCpl + missedSgt;

  const today = new Date().toISOString().slice(0,10);

  const RANK_COLORS: Record<MilitaryRank, string> = {
    '이병': 'bg-gray-100 text-gray-700',
    '일병': 'bg-green-100 text-green-800',
    '상병': 'bg-blue-100 text-blue-800',
    '병장': 'bg-violet-100 text-violet-800',
  };

  return (
    <div className="space-y-4">
      {/* ── 상태 요약 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-army-dark"/>
            <h3 className="text-sm font-semibold text-gray-700">병기본 현황</h3>
          </div>
          {data.eliteWarrior.isActive && (
            <span className="flex items-center gap-1 text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">
              <Award size={9}/> 특급전사 확정
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-1.5">현재 계급</p>
            <span className={`text-sm font-black px-3 py-1 rounded-xl ${RANK_COLORS[currentRank]}`}>{currentRank} {hobong}호봉</span>
            {totalMissed > 0 && <p className="text-[10px] text-red-500 mt-1.5 font-bold">{totalMissed}진누</p>}
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-1.5">출타 통제</p>
            {leaveBlocked
              ? <XCircle size={20} className="text-red-500 mx-auto"/>
              : <CheckCircle size={20} className="text-emerald-500 mx-auto"/>}
            <p className={`text-[10px] mt-1.5 font-semibold ${leaveBlocked ? 'text-red-500' : 'text-emerald-600'}`}>
              {leaveBlocked ? '차단됨' : '정상'}
            </p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-1.5">진급 가능</p>
            {!eligibility || eligibility.nextRank===null
              ? <p className="text-sm text-gray-400 font-bold">—</p>
              : eligibility.isAutoPromo || eligibility.isEligible
                ? <CheckCircle size={20} className="text-emerald-500 mx-auto"/>
                : <XCircle size={20} className="text-red-500 mx-auto"/>}
            <p className={`text-[10px] mt-1.5 font-semibold ${
              !eligibility||eligibility.nextRank===null ? 'text-gray-400'
              : eligibility.isAutoPromo||eligibility.isEligible ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {!eligibility||eligibility.nextRank===null ? '완료'
               : eligibility.isAutoPromo ? '자동'
               : eligibility.isEligible ? '가능'
               : `${eligibility.failingSubjects.length}과목 미달`}
            </p>
          </div>
        </div>

        {/* 진급 일정 */}
        {sched && (
          <div className="bg-army-dark/5 rounded-xl p-3 space-y-2 text-xs">
            <p className="font-semibold text-gray-700 mb-2">진급 일정</p>
            {[
              { rank:'일병', date: sched.pfcDate,       exam: null },
              { rank:'상병', date: sched.cplPromoDate,  exam: sched.cplExamMonth },
              { rank:'병장', date: sched.sgtPromoDate,  exam: sched.sgtExamMonth },
            ].map(r => (
              <div key={r.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${RANK_COLORS[r.rank as MilitaryRank]}`}>{r.rank}</span>
                  {r.exam && <span className="text-gray-400 text-[10px]">심사 {format(r.exam,'yy.MM')}</span>}
                </div>
                <span className="font-semibold text-gray-800">{format(r.date,'yyyy.MM.dd')}</span>
              </div>
            ))}
            {(sched.earlyToCpl > 0 || sched.earlyToSgt > 0) && (
              <p className="text-[10px] text-army-green-600 font-medium pt-1 border-t border-gray-200">
                조기진급: {sched.earlyToCpl>0 ? `상병 ${sched.earlyToCpl}개월` : ''}{sched.earlyToCpl>0&&sched.earlyToSgt>0 ? ' · ' : ''}{sched.earlyToSgt>0 ? `병장 ${sched.earlyToSgt}개월` : ''}
              </p>
            )}
          </div>
        )}

        {/* 미달 과목 경고 */}
        {eligibility && !eligibility.isEligible && !eligibility.isAutoPromo && eligibility.failingSubjects.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0"/>
            <p className="text-xs text-red-700">
              진급 미달: {eligibility.failingSubjects.map(s => SUBJECT_LABELS[s]).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* ── 특급전사 배너 ── */}
      {!data.eliteWarrior.isActive && eliteReady && (
        <div className="bg-violet-50 border-2 border-violet-300 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-violet-800 flex items-center gap-1.5">
              <Award size={14}/> 특급전사 달성 조건 충족!
            </p>
            <p className="text-xs text-violet-600 mt-0.5">지휘관 확인 후 확정 처리하세요.</p>
          </div>
          <button onClick={onConfirmElite}
            className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors">
            확정
          </button>
        </div>
      )}
      {data.eliteWarrior.isActive && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-violet-800 flex items-center gap-1.5"><Award size={14}/> 특급전사</p>
            {data.eliteWarrior.confirmedDate && (
              <p className="text-xs text-violet-600 mt-0.5">확정일: {data.eliteWarrior.confirmedDate}</p>
            )}
          </div>
          <button onClick={onRevokeElite}
            className="px-3 py-1.5 text-violet-600 text-xs font-medium border border-violet-300 rounded-xl hover:bg-violet-100 transition-colors">
            취소
          </button>
        </div>
      )}

      {/* ── 진급 수동 관리 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowPromoMgmt(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">진급 수동 관리</span>
            {totalMissed > 0 && (
              <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                {totalMissed}진누
              </span>
            )}
          </div>
          {showPromoMgmt ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showPromoMgmt && (
          <div className="px-5 pb-5 space-y-5 border-t border-gray-50">
            {/* 조기진급 설정 */}
            <div className="pt-4">
              <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">조기진급 개월 수</p>
              <div className="grid grid-cols-2 gap-3">
                {(['상병','병장'] as const).map((rank, i) => {
                  const val = i===0 ? earlyCorpInput : earlySgtInput;
                  const setter = i===0 ? setEarlyCorpInput : setEarlySgtInput;
                  return (
                    <div key={rank}>
                      <label className="block text-[11px] text-gray-500 mb-1.5">{rank} 진급 시 조기 (개월)</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="2" value={val}
                          onChange={e => setter(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-army-green-400"/>
                        <button
                          onClick={() => {
                            const c = parseInt(i===0 ? val : earlyCorpInput) || 0;
                            const s = parseInt(i===1 ? val : earlySgtInput) || 0;
                            onSetEarlyPromotion(c, s);
                          }}
                          className="px-3 py-2 bg-army-dark text-white text-xs font-semibold rounded-xl hover:bg-army-dark/90 transition-colors">
                          저장
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">현재: {i===0 ? data.earlyPromotion.toCorporal : data.earlyPromotion.toSergeant}개월 조기</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 진급 누락 이력 */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">
                진급 누락 이력
                <span className="text-gray-400 font-normal ml-1 normal-case">(상병 최대 2회, 병장 최대 1회 / 병기본 사유)</span>
              </p>

              {/* 누락 추가 */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-end gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">계급</label>
                  <select value={missedRank} onChange={e => setMissedRank(e.target.value as any)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-army-green-400">
                    <option value="상병">상병</option>
                    <option value="병장">병장</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">심사월</label>
                  <input type="month" value={missedMonth} onChange={e => setMissedMonth(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-army-green-400"/>
                </div>
                <button
                  onClick={() => {
                    const maxCount = missedRank === '상병' ? 2 : 1;
                    const current  = data.missedPromotions.filter(m => m.targetRank === missedRank).length;
                    if (current >= maxCount) return alert(`${missedRank} 진누는 최대 ${maxCount}회까지만 기록 가능합니다 (병기본 기준).`);
                    onAddMissed(missedRank, missedMonth);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 transition-colors whitespace-nowrap">
                  <Plus size={11}/> 추가
                </button>
              </div>

              {/* 누락 이력 목록 */}
              {data.missedPromotions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">진급 누락 이력 없음</p>
              ) : (
                <div className="space-y-2">
                  {data.missedPromotions.map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-700">{idx+1}진누</span>
                        <span className="text-[10px] text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">{m.targetRank}</span>
                        <span className="text-xs text-gray-500">{m.examMonth} 심사</span>
                      </div>
                      <button onClick={() => onRemoveMissed(m.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 과목별 성적 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">과목별 성적</h3>
          <button onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-army-dark text-white rounded-lg text-xs font-medium hover:bg-army-dark/90 transition-colors">
            <Plus size={12}/> 성적 추가
          </button>
        </div>

        {/* 추가 폼 */}
        {showAddForm && (
          <div className="mb-4 bg-gray-50 rounded-xl p-3 space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">과목</label>
              <select value={addSubject} onChange={e => setAddSubject(e.target.value as BasicSkillSubject)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-army-green-400">
                {ALL_SUBJECTS.map(s => <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">등급</label>
                <select value={addGrade} onChange={e => setAddGrade(e.target.value as BasicSkillGrade)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-army-green-400">
                  {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">취득 년월</label>
                <input type="month" value={addDate} onChange={e => setAddDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-army-green-400"/>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-500 text-xs font-medium rounded-xl">취소</button>
              <button onClick={() => { onAddRecord(addSubject, addGrade, addDate ? addDate + '-01' : ''); setShowAddForm(false); }}
                className="flex-1 py-2 bg-army-dark text-white text-xs font-semibold rounded-xl hover:bg-army-dark/90 transition-colors">저장</button>
            </div>
          </div>
        )}

        {/* 과목 목록 */}
        <div className="space-y-2">
          {ALL_SUBJECTS.map(subject => {
            const currentGrade = data.eliteWarrior.isActive ? '특급' : grades[subject];
            const subjectRecords = data.records.filter(r => r.subject === subject);
            const latestValid = subjectRecords
              .filter(r => r.expiresAt >= today)
              .sort((a,b) => b.acquiredDate.localeCompare(a.acquiredDate))[0];
            const allExpired = subjectRecords.length > 0 && !latestValid;

            return (
              <div key={subject} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-700">{SUBJECT_LABELS[subject]}</p>
                    {allExpired && <span className="text-[10px] text-red-500 font-medium">(만료)</span>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${GRADE_COLORS[currentGrade]}`}>
                    {currentGrade}
                  </span>
                </div>
                {subjectRecords.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {subjectRecords.slice().reverse().map(r => {
                      const expired = r.expiresAt < today;
                      return (
                        <div key={r.id} className={`flex items-center justify-between px-3 py-2 ${expired ? 'opacity-40' : ''}`}>
                          <div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${GRADE_COLORS[r.grade]}`}>{r.grade}</span>
                            <span className="text-[10px] text-gray-400 ml-2">취득 {format(parseISO(r.acquiredDate),'yy.MM')} · 만료 {format(parseISO(r.expiresAt),'yy.MM')}</span>
                          </div>
                          <button onClick={() => onRemoveRecord(r.id)}
                            className="p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
