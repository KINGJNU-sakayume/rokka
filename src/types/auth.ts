// ─── 대대 ─────────────────────────────────────────────────────────────────────
export type BattalionCode = '155bn';   // 추후 '158bn' 등 추가 가능

export const BATTALION_LABELS: Record<BattalionCode, string> = {
  '155bn': '155대대',
};
export const BATTALION_CODES = Object.keys(BATTALION_LABELS) as BattalionCode[];

// ─── 중대 ─────────────────────────────────────────────────────────────────────
export type CompanyCode = '1co' | '2co' | '3co' | 'hqco';

export const COMPANY_LABELS: Record<CompanyCode, string> = {
  '1co':  '1중대',
  '2co':  '2중대',
  '3co':  '3중대',
  'hqco': '본부중대',
};
export const COMPANY_CODES = Object.keys(COMPANY_LABELS) as CompanyCode[];

// ─── 프로필 ───────────────────────────────────────────────────────────────────
export interface UserProfile {
  id:                       string;
  name:                     string;
  unit_company:             CompanyCode;
  unit_battalion:           BattalionCode;
  serial_number:            string;
  enlistment_date:          string | null;
  has_completed_onboarding: boolean;
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

/** 군번 → Supabase Auth email (ASCII 전용) */
export function buildEmail(
  serial: string,
  company: CompanyCode,
  battalion: BattalionCode,
): string {
  // 군번 하이픈 제거 + 유효한 도메인 형식 사용
  // 예: 25-12345678 + 1co + 155bn → 2512345678.1co@155bn.mil
  const cleanSerial = serial.replace('-', '');
  return `${cleanSerial}.${company}@${battalion}.mil`;
}

/** 화면 표시용 계정 ID */
export function formatDisplayId(profile: Pick<UserProfile, 'name' | 'unit_company' | 'unit_battalion'>): string {
  return `${profile.name} · ${COMPANY_LABELS[profile.unit_company]} · ${BATTALION_LABELS[profile.unit_battalion]}`;
}

/** 군번 형식 검증: YY-XXXXXXXX (2자리 연도 + 하이픈 + 8자리 숫자) */
export function validateSerial(serial: string): string | null {
  if (!/^\d{2}-\d{8}$/.test(serial)) {
    return "'25-12345678' 형태로 입력해주세요.";
  }
  return null;
}
