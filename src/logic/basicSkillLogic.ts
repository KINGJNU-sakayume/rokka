import {
  parseISO, format, addMonths, startOfMonth, endOfMonth,
  isBefore, startOfDay, differenceInCalendarMonths, subMonths,
} from 'date-fns';
import type {
  BasicSkillGrade, BasicSkillSubject, BasicSkillData, MilitaryRank, BasicSkillRecord,
} from '../types/basicSkill';
import { GRADE_VALUES, ALL_SUBJECTS } from '../types/basicSkill';

// ─── 유효기간 계산 ────────────────────────────────────────────────────────────
// 2026년 1월 이후 취득: 취득월 포함 6개월 (취득월 + 5)
// 2025년 12월 이전 취득: 취득월 포함 3개월 (취득월 + 2)
const NEW_RULE_CUTOFF = '2026-01-01';

export function calcExpiresAt(acquiredDate: string): string {
  const d          = parseISO(acquiredDate);
  const isNew      = !isBefore(d, parseISO(NEW_RULE_CUTOFF));
  const offsetMonths = isNew ? 5 : 2;
  return format(endOfMonth(addMonths(startOfMonth(d), offsetMonths)), 'yyyy-MM-dd');
}

// ─── 특정 기준일 기준 유효 성적 ───────────────────────────────────────────────
function getValidGradeAt(
  subject: BasicSkillSubject,
  records: BasicSkillRecord[],
  eliteWarrior: { isActive: boolean },
  asOfDate: string,
): BasicSkillGrade {
  if (eliteWarrior.isActive) return '특급';
  const valid = records
    .filter(r => r.subject === subject && r.expiresAt >= asOfDate)
    .sort((a, b) => b.acquiredDate.localeCompare(a.acquiredDate));
  return valid[0]?.grade ?? '미측정';
}

function getGradesAt(data: BasicSkillData, asOfDate: string): Record<BasicSkillSubject, BasicSkillGrade> {
  return Object.fromEntries(
    ALL_SUBJECTS.map(s => [s, getValidGradeAt(s, data.records, data.eliteWarrior, asOfDate)])
  ) as Record<BasicSkillSubject, BasicSkillGrade>;
}

/** 오늘 기준 유효 성적 */
export function getValidGrade(
  subject: BasicSkillSubject,
  records: BasicSkillRecord[],
  eliteWarrior: { isActive: boolean },
): BasicSkillGrade {
  return getValidGradeAt(subject, records, eliteWarrior, format(startOfDay(new Date()), 'yyyy-MM-dd'));
}

export function getAllValidGrades(data: BasicSkillData): Record<BasicSkillSubject, BasicSkillGrade> {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  return getGradesAt(data, today);
}

export function gradeAtLeast(grade: BasicSkillGrade, min: BasicSkillGrade): boolean {
  return GRADE_VALUES[grade] >= GRADE_VALUES[min];
}

// ─── 계급별 병기본 기준 ───────────────────────────────────────────────────────
export function meetsRequirement(
  rank: MilitaryRank,
  grades: Record<BasicSkillSubject, BasicSkillGrade>,
): boolean {
  if (rank === '이병' || rank === '일병') {
    if (!gradeAtLeast(grades['physical'], '2급')) return false;
    return ALL_SUBJECTS.filter(s => s !== 'physical').every(s => gradeAtLeast(grades[s], '3급'));
  }
  return ALL_SUBJECTS.every(s => gradeAtLeast(grades[s], '2급'));
}

export function meetsPromotionRequirement(
  currentRank: MilitaryRank,
  grades: Record<BasicSkillSubject, BasicSkillGrade>,
): boolean {
  if (currentRank === '이병') return true;
  if (currentRank === '일병') {
    if (!gradeAtLeast(grades['physical'], '2급')) return false;
    return ALL_SUBJECTS.filter(s => s !== 'physical').every(s => gradeAtLeast(grades[s], '3급'));
  }
  if (currentRank === '상병') return ALL_SUBJECTS.every(s => gradeAtLeast(grades[s], '2급'));
  return false;
}

// ─── 특급전사 / 전투프로 ──────────────────────────────────────────────────────
export function checkEliteWarrior(data: BasicSkillData): boolean {
  if (data.eliteWarrior.isActive) return true;
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const activeRecords = data.records.filter(r => r.expiresAt >= today);
  return ALL_SUBJECTS.every(subject => {
    const valid = activeRecords
      .filter(r => r.subject === subject)
      .sort((a, b) => b.acquiredDate.localeCompare(a.acquiredDate));
    return valid[0]?.grade === '특급';
  });
}

export function checkCombatPro(data: BasicSkillData): boolean {
  if (data.eliteWarrior.isActive) return true;
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const activeRecords = data.records.filter(r => r.expiresAt >= today);
  return ALL_SUBJECTS.every(subject => {
    const valid = activeRecords
      .filter(r => r.subject === subject)
      .sort((a, b) => b.acquiredDate.localeCompare(a.acquiredDate));
    return gradeAtLeast(valid[0]?.grade ?? '미측정', '1급');
  });
}

// ─── 진급 일정 계산 ───────────────────────────────────────────────────────────
export interface PromotionSchedule {
  pfcDate:       Date;
  cplExamMonth:  Date;
  cplPromoDate:  Date;
  sgtExamMonth:  Date;
  sgtPromoDate:  Date;
  earlyToCpl:    number;
  earlyToSgt:    number;
  missedCpl:     number;
  missedSgt:     number;
}

export function computePromotionSchedule(
  enlistmentDate: string,
  data: BasicSkillData,
): PromotionSchedule {
  const d       = parseISO(enlistmentDate);
  const base    = startOfMonth(d);
  const isFirst = d.getDate() === 1;

  const earlyToCpl = data.earlyPromotion.toCorporal;
  const earlyToSgt = data.earlyPromotion.toSergeant;
  const missedCpl  = data.missedPromotions.filter(m => m.targetRank === '상병').length;
  const missedSgt  = data.missedPromotions.filter(m => m.targetRank === '병장').length;

  const cplOffset = 9 - earlyToCpl + missedCpl;
  const sgtOffset = cplOffset + 6 - earlyToSgt + missedSgt;

  return {
    pfcDate:      addMonths(base, isFirst ? 2 : 3),
    cplExamMonth: addMonths(base, cplOffset - 1),
    cplPromoDate: addMonths(base, cplOffset),
    sgtExamMonth: addMonths(base, sgtOffset - 1),
    sgtPromoDate: addMonths(base, sgtOffset),
    earlyToCpl, earlyToSgt, missedCpl, missedSgt,
  };
}

// ─── 현재 계급 ────────────────────────────────────────────────────────────────
export function computeCurrentRank(enlistmentDate: string, data: BasicSkillData): MilitaryRank {
  if (!enlistmentDate) return '이병';
  const today = startOfDay(new Date());
  const s = computePromotionSchedule(enlistmentDate, data);
  if (isBefore(today, s.pfcDate))      return '이병';
  if (isBefore(today, s.cplPromoDate)) return '일병';
  if (isBefore(today, s.sgtPromoDate)) return '상병';
  return '병장';
}

// ─── 진급 가능 여부 ───────────────────────────────────────────────────────────
// 판단 기준: 심사월 말일 시점에 성적이 유효한가
// 예) 심사월 8월 → 8월 31일에 모든 과목 성적이 유효해야 함
// 심사월이 이미 지난 경우: 다음 심사월 기준 or 오늘 기준
export interface PromotionEligibility {
  currentRank:     MilitaryRank;
  nextRank:        MilitaryRank | null;
  examMonth:       Date | null;
  promoDate:       Date | null;
  isEligible:      boolean;
  isAutoPromo:     boolean;
  failingSubjects: BasicSkillSubject[];
}

export function computePromotionEligibility(
  enlistmentDate: string,
  data: BasicSkillData,
): PromotionEligibility {
  const currentRank = computeCurrentRank(enlistmentDate, data);
  const sched       = enlistmentDate ? computePromotionSchedule(enlistmentDate, data) : null;

  if (currentRank === '이병') {
    return {
      currentRank, nextRank: '일병',
      examMonth: null,
      promoDate: sched?.pfcDate ?? null,
      isEligible: true, isAutoPromo: true, failingSubjects: [],
    };
  }

  if (currentRank === '일병') {
    // 심사월 말일 기준으로 성적 유효 여부 판단
    const examEnd = sched
      ? format(endOfMonth(sched.cplExamMonth), 'yyyy-MM-dd')
      : format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const grades  = getGradesAt(data, examEnd);
    const failing = ALL_SUBJECTS.filter(s =>
      s === 'physical'
        ? !gradeAtLeast(grades[s], '2급')
        : !gradeAtLeast(grades[s], '3급'),
    );
    return {
      currentRank, nextRank: '상병',
      examMonth: sched?.cplExamMonth ?? null,
      promoDate: sched?.cplPromoDate ?? null,
      isEligible: failing.length === 0,
      isAutoPromo: false, failingSubjects: failing,
    };
  }

  if (currentRank === '상병') {
    const examEnd = sched
      ? format(endOfMonth(sched.sgtExamMonth), 'yyyy-MM-dd')
      : format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const grades  = getGradesAt(data, examEnd);
    const failing = ALL_SUBJECTS.filter(s => !gradeAtLeast(grades[s], '2급'));
    return {
      currentRank, nextRank: '병장',
      examMonth: sched?.sgtExamMonth ?? null,
      promoDate: sched?.sgtPromoDate ?? null,
      isEligible: failing.length === 0,
      isAutoPromo: false, failingSubjects: failing,
    };
  }

  return {
    currentRank: '병장', nextRank: null,
    examMonth: null, promoDate: null,
    isEligible: false, isAutoPromo: false, failingSubjects: [],
  };
}

// ─── 출타 통제 여부 ───────────────────────────────────────────────────────────
// 기준: 현재 분기의 전 분기 마지막 월 말일 시점 성적
//   1Q(1~3월) → 작년 12월 말일
//   2Q(4~6월) → 3월 말일
//   3Q(7~9월) → 6월 말일
//   4Q(10~12월) → 9월 말일
function getPrevQuarterLastDayStr(): string {
  const now   = new Date();
  const month = now.getMonth() + 1; // 1~12

  // 현재 분기의 첫 달: 1,4,7,10
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  // 전 분기 마지막 달 = 현재 분기 첫 달 - 1
  const prevQuarterLastMonth = subMonths(new Date(now.getFullYear(), quarterStartMonth - 1, 1), 1);
  return format(endOfMonth(prevQuarterLastMonth), 'yyyy-MM-dd');
}

export function isLeaveBlocked(data: BasicSkillData, enlistmentDate: string): boolean {
  if (data.eliteWarrior.isActive) return false;
  if (!enlistmentDate) return false;
  const rank        = computeCurrentRank(enlistmentDate, data);
  const refDate     = getPrevQuarterLastDayStr();
  const grades      = getGradesAt(data, refDate);
  return !meetsRequirement(rank, grades);
}

export function getCurrentQuarterInfo(): { label: string; examMonth: number } {
  const m = new Date().getMonth() + 1;
  if (m <= 3)  return { label: '1분기 (1~3월)', examMonth: 3  };
  if (m <= 6)  return { label: '2분기 (4~6월)', examMonth: 6  };
  if (m <= 9)  return { label: '3분기 (7~9월)', examMonth: 9  };
  return             { label: '4분기 (10~12월)', examMonth: 12 };
}

export function computeRewardVacationAvailable(
  history: { daysEarned: number; expiresAt: string }[],
  usedDays: number,
): number {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const total = history
    .filter(e => e.expiresAt >= today)
    .reduce((sum, e) => sum + e.daysEarned, 0);
  return Math.max(0, total - usedDays);
}

// ─── 호봉 계산 ────────────────────────────────────────────────────────────────
export function computeHobong(
  enlistmentDate: string,
  data: BasicSkillData,
): { rank: MilitaryRank; hobong: number } {
  const rank  = computeCurrentRank(enlistmentDate, data);
  const sched = computePromotionSchedule(enlistmentDate, data);
  const today = startOfDay(new Date());

  let rankStart: Date;
  if      (rank === '이병') rankStart = startOfMonth(parseISO(enlistmentDate));
  else if (rank === '일병') rankStart = startOfMonth(sched.pfcDate);
  else if (rank === '상병') rankStart = startOfMonth(sched.cplPromoDate);
  else                      rankStart = startOfMonth(sched.sgtPromoDate);

  const hobong = differenceInCalendarMonths(startOfMonth(today), rankStart) + 1;
  return { rank, hobong: Math.max(1, hobong) };
}