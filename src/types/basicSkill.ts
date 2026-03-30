export type BasicSkillGrade = '특급' | '1급' | '2급' | '3급' | '불합격' | '미측정';

export const GRADE_VALUES: Record<BasicSkillGrade, number> = {
  '특급': 5, '1급': 4, '2급': 3, '3급': 2, '불합격': 1, '미측정': 0,
};

export const GRADE_COLORS: Record<BasicSkillGrade, string> = {
  '특급':  'bg-violet-100 text-violet-800 border-violet-300',
  '1급':   'bg-blue-100 text-blue-800 border-blue-300',
  '2급':   'bg-emerald-100 text-emerald-800 border-emerald-300',
  '3급':   'bg-amber-100 text-amber-800 border-amber-300',
  '불합격':'bg-red-100 text-red-800 border-red-300',
  '미측정':'bg-gray-100 text-gray-500 border-gray-200',
};

export const ALL_GRADES: BasicSkillGrade[] = ['특급', '1급', '2급', '3급', '불합격'];

export type BasicSkillSubject =
  | 'physical' | 'shooting' | 'nuclear' | 'firstAid'
  | 'mentalStrength' | 'specialty' | 'combatDrill';

export const SUBJECT_LABELS: Record<BasicSkillSubject, string> = {
  physical:       '체력측정',
  shooting:       '사격',
  nuclear:        '핵 및 화생방',
  firstAid:       '전투부상자처치',
  mentalStrength: '정신전력',
  specialty:      '주특기',
  combatDrill:    '전투체단',
};

export const ALL_SUBJECTS: BasicSkillSubject[] = [
  'physical', 'shooting', 'nuclear', 'firstAid', 'mentalStrength', 'specialty', 'combatDrill',
];

export type MilitaryRank = '이병' | '일병' | '상병' | '병장';
export const ALL_RANKS: MilitaryRank[] = ['이병', '일병', '상병', '병장'];

export interface BasicSkillRecord {
  id: string;
  subject: BasicSkillSubject;
  grade: BasicSkillGrade;
  acquiredDate: string;  // YYYY-MM-DD
  expiresAt: string;     // YYYY-MM-DD
}

export interface BasicSkillData {
  records: BasicSkillRecord[];

  eliteWarrior: {
    isActive: boolean;
    confirmedDate?: string;
  };

  /**
   * 조기진급 설정 (계급별 실제 적용된 개월 수)
   * - toCorporal: 상병 진급 시 조기진급 개월 수 (0~2)
   * - toSergeant: 병장 진급 시 조기진급 개월 수 (0~2)
   */
  earlyPromotion: {
    toCorporal: number;
    toSergeant: number;
  };

  /**
   * 진급 누락 이력 (병기본 사유)
   * - 상병 최대 2회, 병장 최대 1회 (기본 규정 상)
   * - isManual: 수동 입력 여부
   */
  missedPromotions: {
    id: string;
    targetRank: '상병' | '병장';
    examMonth: string;  // YYYY-MM
    isManual?: boolean;
  }[];
}
