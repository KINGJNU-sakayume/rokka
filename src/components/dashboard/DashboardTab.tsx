import ServiceProgressCard from './ServiceProgressCard';
import MileageMiniCard from './MileageMiniCard';
import BasicSkillMiniCard from './BasicSkillMiniCard';
import VacationSummaryCard from './VacationSummaryCard';
import type { VacationData, MileageData, ScheduleEvent } from '../../types';
import type { BasicSkillData } from '../../types/basicSkill';
import { formatDateStr } from '../../utils/dateUtils';

interface DashboardTabProps {
  enlistmentDate: string;
  vacation: VacationData;
  mileage: MileageData;
  events: ScheduleEvent[];
  basicSkillData: BasicSkillData;
}

export default function DashboardTab({ enlistmentDate, vacation, mileage, events, basicSkillData }: DashboardTabProps) {
  const today = new Date();
  const dayOfWeek = ['일','월','화','수','목','금','토'][today.getDay()];

  return (
    <div className="space-y-4">
      {/* 날짜 박스 */}
      <div className="bg-army-dark/5 rounded-2xl px-5 py-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider">오늘</p>
        <p className="text-base font-semibold text-gray-800">
          {today.getFullYear()}년 {today.getMonth()+1}월 {today.getDate()}일 ({dayOfWeek})
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          입대일: {formatDateStr(enlistmentDate, 'yyyy년 MM월 dd일')}
        </p>
      </div>

      {/* 전역일 박스 */}
      <ServiceProgressCard enlistmentDate={enlistmentDate} events={events} />

      {/* 마일리지 박스 */}
      <MileageMiniCard mileage={mileage} />

      {/* 휴가 현황 */}
      <VacationSummaryCard vacation={vacation} />

      {/* 병기본 박스 */}
      <BasicSkillMiniCard basicSkillData={basicSkillData} enlistmentDate={enlistmentDate} />
    </div>
  );
}
