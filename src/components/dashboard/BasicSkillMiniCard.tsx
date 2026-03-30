import { Shield, CheckCircle, XCircle, Award } from 'lucide-react';
import type { BasicSkillData } from '../../types/basicSkill';
import {
  computeCurrentRank, computePromotionEligibility, isLeaveBlocked,
  computeHobong,
} from '../../logic/basicSkillLogic';
import { format } from 'date-fns';
import { SUBJECT_LABELS } from '../../types/basicSkill';

interface BasicSkillMiniCardProps {
  basicSkillData: BasicSkillData;
  enlistmentDate: string;
}

const RANK_COLORS: Record<string, string> = {
  '이병': 'bg-gray-100 text-gray-700',
  '일병': 'bg-green-100 text-green-800',
  '상병': 'bg-blue-100 text-blue-800',
  '병장': 'bg-violet-100 text-violet-800',
};

export default function BasicSkillMiniCard({ basicSkillData, enlistmentDate }: BasicSkillMiniCardProps) {
  const currentRank  = computeCurrentRank(enlistmentDate, basicSkillData);
  const { hobong }   = computeHobong(enlistmentDate, basicSkillData);
  const eligibility  = computePromotionEligibility(enlistmentDate, basicSkillData);
  const leaveBlocked = isLeaveBlocked(basicSkillData, enlistmentDate);

  const totalMissed  = basicSkillData.missedPromotions.length;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-army-dark" />
          <h3 className="text-sm font-semibold text-gray-700">병기본 현황</h3>
        </div>
        {basicSkillData.eliteWarrior.isActive && (
          <span className="flex items-center gap-1 text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">
            <Award size={9}/> 특급전사
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* 현재 계급 */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400 mb-1">현재 계급</p>
          <span className={`text-sm font-black px-2.5 py-1 rounded-xl ${RANK_COLORS[currentRank]}`}>
              {currentRank} {hobong}호봉
            </span>
          {totalMissed > 0 && (
            <p className="text-[10px] text-red-500 mt-1 font-semibold">{totalMissed}진누</p>
          )}
        </div>

        {/* 출타 통제 */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400 mb-1">출타 통제</p>
          <div className="flex items-center justify-center">
            {leaveBlocked
              ? <XCircle size={22} className="text-red-500" />
              : <CheckCircle size={22} className="text-emerald-500" />}
          </div>
          <p className={`text-[10px] mt-1 font-semibold ${leaveBlocked ? 'text-red-500' : 'text-emerald-600'}`}>
            {leaveBlocked ? '차단' : '정상'}
          </p>
        </div>

        {/* 진급 가능 여부 */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400 mb-1">진급 가능</p>
          {eligibility.nextRank === null ? (
            <p className="text-sm font-bold text-gray-400">—</p>
          ) : eligibility.isAutoPromo ? (
            <div>
              <CheckCircle size={22} className="text-emerald-500 mx-auto" />
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">자동</p>
            </div>
          ) : eligibility.isEligible ? (
            <div>
              <CheckCircle size={22} className="text-emerald-500 mx-auto" />
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">가능</p>
            </div>
          ) : (
            <div>
              <XCircle size={22} className="text-red-500 mx-auto" />
              <p className="text-[10px] text-red-500 mt-1 font-semibold">
                {eligibility.failingSubjects.length}과목 미달
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 진급 예정일 */}
      {eligibility.nextRank && eligibility.promoDate && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
          eligibility.isEligible || eligibility.isAutoPromo ? 'bg-army-dark/5' : 'bg-red-50'
        }`}>
          <div>
            <p className="text-xs font-semibold text-gray-700">
              {eligibility.nextRank} 진급 예정
              {eligibility.examMonth && (
                <span className="text-gray-400 font-normal ml-1 text-[10px]">
                  심사: {format(eligibility.examMonth, 'yy.MM')}
                </span>
              )}
            </p>
            {!eligibility.isEligible && !eligibility.isAutoPromo && (
              <p className="text-[10px] text-red-500 mt-0.5">
                미달: {eligibility.failingSubjects.map(s => SUBJECT_LABELS[s]).join(', ')}
              </p>
            )}
          </div>
          <p className={`text-xs font-bold ${
            eligibility.isEligible || eligibility.isAutoPromo ? 'text-army-green-700' : 'text-red-500'
          }`}>
            {format(eligibility.promoDate, 'yy.MM.dd')}
          </p>
        </div>
      )}
    </div>
  );
}
