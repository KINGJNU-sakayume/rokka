import { startOfDay, getDay, subDays } from 'date-fns';

/**
 * 한국 시각(KST = UTC+9) 기준 현재 시각 정보 반환
 */
function getKSTNow(): { dow: number; hour: number; minute: number } {
  const now = new Date();
  // UTC 기준으로 +9시간 오프셋 적용
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    dow:    kst.getUTCDay(),
    hour:   kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  };
}

/**
 * [REQ4] 현재 KST 시각이 교회 모달 표시 가능 시간대인지 검사
 *
 * 수요일 교회: 수요일 19:00 KST ~ 목요일 20:30 KST
 * 일요일 교회: 일요일 11:00 KST ~ 일요일 20:30 KST
 *
 * 반환값: 현재 표시해야 할 교회 날짜 { date, dayName } | null
 */
export function getMostRecentChurchDay(): { date: Date; dayName: '수요일' | '일요일' } | null {
  const { dow, hour, minute } = getKSTNow();
  const totalMinutes = hour * 60 + minute; // 자정 기준 경과 분

  // ── 수요일 교회 시간대 확인 (수 19:00 ~ 목 20:30 KST)
  const WED_START = 19 * 60;        // 1140분
  const WED_END   = 20 * 60 + 30;  // 1230분 (목요일 기준)

  const isWedWindow =
    (dow === 3 && totalMinutes >= WED_START) ||   // 수요일 19:00 이후
    (dow === 4 && totalMinutes <= WED_END);        // 목요일 20:30 이전

  // ── 일요일 교회 시간대 확인 (일 11:00 ~ 일 20:30 KST)
  const SUN_START = 11 * 60;        // 660분
  const SUN_END   = 20 * 60 + 30;  // 1230분

  const isSunWindow =
    dow === 0 &&
    totalMinutes >= SUN_START &&
    totalMinutes <= SUN_END;

  // 현재 시간이 어떤 교회 시간대에도 해당하지 않으면 모달 표시 안 함
  if (!isWedWindow && !isSunWindow) return null;

  // 가장 최근 교회 날짜 계산 (오늘 기준 최근 7일 이내 수/일)
  const today = startOfDay(new Date());

  for (let i = 0; i <= 7; i++) {
    const candidate = subDays(today, i);
    const candidateDow = getDay(candidate);

    if (isWedWindow && candidateDow === 3) {
      return { date: candidate, dayName: '수요일' };
    }
    if (isSunWindow && candidateDow === 0) {
      return { date: candidate, dayName: '일요일' };
    }
  }

  return null;
}
