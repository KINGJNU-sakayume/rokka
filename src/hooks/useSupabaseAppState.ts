/**
 * useSupabaseAppState
 *
 * 기존 useAppState (localStorage) 를 Supabase 기반으로 완전 대체합니다.
 * 반환 인터페이스는 App.tsx 가 사용하는 useAppState 와 동일하게 유지됩니다.
 *
 * 전략:
 *  - 로그인 직후 app_data 테이블에서 전체 데이터를 한 번에 로드
 *  - 변경이 발생하면 로컬 state 를 즉시 반영(optimistic) + Supabase 비동기 저장
 *  - profiles 테이블에서 userData (입대일, 온보딩 여부) 를 관리
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { generateId } from '../utils/mileageUtils';
import { calcExpiresAt } from '../logic/basicSkillLogic';
import { toISODateString, addMonths, parseISO } from '../utils/dateUtils';
import {
  DEFAULT_VACATION, DEFAULT_MILEAGE, DEFAULT_SCHEDULE,
  DEFAULT_CHURCH_CHECK, DEFAULT_BASIC_SKILL,
} from '../constants/initialState';
import type {
  UserData, VacationData, MileageData, ScheduleData,
  ChurchCheckData, ScheduleEvent, MileageEntry, RewardVacationEntry,
} from '../types';
import type { BasicSkillData, BasicSkillSubject, BasicSkillGrade } from '../types/basicSkill';
import { KOREAN_PUBLIC_HOLIDAYS } from '../constants/holidays';
import { format, parseISO as dfParseISO, addDays, getDay } from 'date-fns';

// ─── DB row 타입 ──────────────────────────────────────────────────────────────
interface AppDataRow {
  user_id:       string;
  vacation:      VacationData;
  mileage:       MileageData;
  schedule:      ScheduleData;
  church_check:  ChurchCheckData;
  basic_skill:   BasicSkillData;
  week_schedules: Record<string, string>;
}

// ─── Supabase 저장 헬퍼 ────────────────────────────────────────────────────────
async function saveColumn(userId: string, column: string, value: unknown) {
  const { error } = await supabase
    .from('app_data')
    .update({ [column]: value })
    .eq('user_id', userId);
  if (error) console.error(`[Supabase] save ${column}:`, error.message);
}

async function saveProfile(userId: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId);
  if (error) console.error('[Supabase] save profile:', error.message);
}

// ─── getRewardVacationTotal (useVacation 의 동일 함수) ────────────────────────
export function getRewardVacationTotal(vacation: VacationData): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  const earned = (vacation.rewardVacation.history ?? [])
    .filter(e => e.expiresAt >= today)
    .reduce((sum, e) => sum + e.daysEarned, 0);
  return Math.max(0, earned - (vacation.rewardVacation.usedDays ?? 0));
}

// ─── 메인 훅 ──────────────────────────────────────────────────────────────────
export function useSupabaseAppState() {
  const { session, profile, refreshProfile } = useAuth();
  const userId = session?.user?.id ?? null;

  // ── 로컬 상태 ─────────────────────────────────────────────────────────────
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userData,       setUserData]       = useState<UserData>({
    enlistmentDate: '', hasCompletedOnboarding: false,
  });
  const [vacationData,   setVacationData]   = useState<VacationData>(DEFAULT_VACATION);
  const [mileageData,    setMileageData]    = useState<MileageData>(DEFAULT_MILEAGE);
  const [scheduleData,   setScheduleData]   = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [churchCheckData,setChurchCheckData]= useState<ChurchCheckData>(DEFAULT_CHURCH_CHECK);
  const [basicSkillData, setBasicSkillData] = useState<BasicSkillData>(DEFAULT_BASIC_SKILL);
  const [weekSchedules,  setWeekSchedules]  = useState<Record<string, string>>({});

  // ── 데이터 로드 ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      // 세션 없음 → 로딩 종료 (AuthGate에서 로그인 화면으로 분기됨)
      setDataLoaded(true);
      return;
    }

    // 쿼리에 타임아웃을 걸어 hang 방지
    function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
        ),
      ]);
    }

    const load = async () => {
      try {
        // AuthContext에서 이미 로드된 profile을 직접 사용 (별도 DB 쿼리 불필요)
        if (profile) {
          setUserData({
            enlistmentDate: profile.enlistment_date ?? '',
            hasCompletedOnboarding: profile.has_completed_onboarding ?? false,
          });
        }

        // app_data 조회 (5초 타임아웃)
        const query = supabase
          .from('app_data')
          .select('*')
          .eq('user_id', userId)
          .single();
        const queryPromise = Promise.resolve(query);
        const result = await withTimeout(queryPromise, 5000);

        const { data, error } = result as { data: unknown; error: { message: string } | null };

        if (error) {
          console.error('[Supabase] load app_data:', error.message);
        } else {
          const row = data as unknown as AppDataRow;
          if (row.vacation)       setVacationData(row.vacation);
          if (row.mileage)        setMileageData(row.mileage);
          if (row.schedule)       setScheduleData(row.schedule);
          if (row.church_check)   setChurchCheckData(row.church_check);
          if (row.basic_skill)    setBasicSkillData(row.basic_skill);
          if (row.week_schedules) setWeekSchedules(row.week_schedules);
        }
      } catch (e) {
        console.error('[Supabase] load 예외 (타임아웃 포함):', e);
      } finally {
        setDataLoaded(true);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profile]);

  // ── 저장 래퍼 (낙관적 업데이트) ───────────────────────────────────────────
  const save = useCallback((col: string, val: unknown) => {
    if (userId) saveColumn(userId, col, val);
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // userData / onboarding
  // ─────────────────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback((enlistmentDate: string) => {
    const next = { enlistmentDate, hasCompletedOnboarding: true };
    setUserData(next);
    if (userId) {
      saveProfile(userId, {
        enlistment_date: enlistmentDate,
        has_completed_onboarding: true,
      });
    }
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // scheduleData
  // ─────────────────────────────────────────────────────────────────────────
  const addScheduleEvent = useCallback((event: Omit<ScheduleEvent, 'id'>): ScheduleEvent => {
    const newEvent: ScheduleEvent = { ...event, id: generateId() };

    const getNextValidWeekday = (startDate: string, existing: ScheduleEvent[]): string => {
      let cur = addDays(dfParseISO(startDate), 1);
      while (true) {
        const ds  = format(cur, 'yyyy-MM-dd');
        const dow = getDay(cur);
        const rest = dow === 0 || dow === 6 || KOREAN_PUBLIC_HOLIDAYS.includes(ds);
        if (!rest) {
          const blocked = existing.some(
            e => e.date === ds &&
              ['duty','vacation','full_combat_rest','after_duty_sleep'].includes(e.type)
          );
          if (!blocked) return ds;
        }
        cur = addDays(cur, 1);
      }
    };

    setScheduleData(prev => {
      let events = [...prev.events, newEvent];
      const sleepSources: string[] = [];

      if (event.type === 'duty') sleepSources.push(event.date);

      if (['duty','vacation','full_combat_rest'].includes(event.type)) {
        const overlapped = events.filter(
          e => e.type === 'after_duty_sleep' && e.date === event.date
        );
        if (overlapped.length) {
          events = events.filter(e => !(e.type === 'after_duty_sleep' && e.date === event.date));
          overlapped.forEach(() => sleepSources.push(event.date));
        }
      }

      for (const src of sleepSources) {
        const sleepDate = getNextValidWeekday(src, events);
        events.push({ id: generateId(), date: sleepDate, type: 'after_duty_sleep', title: '근무취침' });
      }

      const next = { ...prev, events };
      save('schedule', next);
      return next;
    });

    return newEvent;
  }, [save]);

  const removeScheduleEvent = useCallback((id: string) => {
    setScheduleData(prev => {
      const next = { ...prev, events: prev.events.filter(e => e.id !== id) };
      save('schedule', next);
      return next;
    });
  }, [save]);

  // ─────────────────────────────────────────────────────────────────────────
  // vacationData
  // ─────────────────────────────────────────────────────────────────────────
  const updateVacation = useCallback((updater: (prev: VacationData) => VacationData) => {
    setVacationData(prev => {
      const next = updater(prev);
      save('vacation', next);
      return next;
    });
  }, [save]);

  const addRewardVacation = useCallback((daysEarned: number, dateEarned: string, description?: string) => {
    const entry: RewardVacationEntry = {
      id: generateId(), daysEarned, dateEarned,
      expiresAt: toISODateString(addMonths(parseISO(dateEarned), 6)),
      description,
    };
    updateVacation(prev => ({
      ...prev,
      rewardVacation: {
        ...prev.rewardVacation,
        history: [...(prev.rewardVacation.history ?? []), entry],
      },
    }));
  }, [updateVacation]);

  const addConsolationVacation = useCallback((days: number) => {
    updateVacation(prev => ({ ...prev, consolationVacation: prev.consolationVacation + days }));
  }, [updateVacation]);

  const spendVacationBreakdown = useCallback((bd: { annual: number; reward: number; consolation: number; petition: number }) => {
    updateVacation(prev => ({
      ...prev,
      annualLeave:         Math.max(0, prev.annualLeave - bd.annual),
      consolationVacation: Math.max(0, prev.consolationVacation - bd.consolation),
      petitionVacation:    Math.max(0, prev.petitionVacation - bd.petition),
      rewardVacation: {
        ...prev.rewardVacation,
        usedDays: (prev.rewardVacation.usedDays ?? 0) + bd.reward,
      },
    }));
  }, [updateVacation]);

  const restoreVacationBreakdown = useCallback((bd: { annual: number; reward: number; consolation: number; petition: number }) => {
    updateVacation(prev => ({
      ...prev,
      annualLeave:         prev.annualLeave + bd.annual,
      consolationVacation: prev.consolationVacation + bd.consolation,
      petitionVacation:    prev.petitionVacation + bd.petition,
      rewardVacation: {
        ...prev.rewardVacation,
        usedDays: Math.max(0, (prev.rewardVacation.usedDays ?? 0) - bd.reward),
      },
    }));
  }, [updateVacation]);

  const grantEmploymentLeave = useCallback(() => {
    updateVacation(prev => {
      if (prev.employmentLeaveGranted) return prev;
      return { ...prev, petitionVacation: prev.petitionVacation + 2, employmentLeaveGranted: true };
    });
  }, [updateVacation]);

  // ─────────────────────────────────────────────────────────────────────────
  // mileageData
  // ─────────────────────────────────────────────────────────────────────────
  const addMileageEntry = useCallback((entry: MileageEntry) => {
    setMileageData(prev => {
      const next = { total: prev.total + entry.amount, history: [entry, ...prev.history] };
      save('mileage', next);
      return next;
    });
  }, [save]);

  // ─────────────────────────────────────────────────────────────────────────
  // churchCheckData
  // ─────────────────────────────────────────────────────────────────────────
  const updateChurchCheck = useCallback((attendedDate?: string) => {
    setChurchCheckData(prev => {
      const attended = attendedDate
        ? [...prev.attendedDates, attendedDate]
        : prev.attendedDates;
      const next = { lastCheckedDate: toISODateString(new Date()), attendedDates: attended };
      save('church_check', next);
      return next;
    });
  }, [save]);

  // ─────────────────────────────────────────────────────────────────────────
  // basicSkillData
  // ─────────────────────────────────────────────────────────────────────────
  const updateBasicSkill = useCallback((updater: (prev: BasicSkillData) => BasicSkillData) => {
    setBasicSkillData(prev => {
      const next = updater(prev);
      save('basic_skill', next);
      return next;
    });
  }, [save]);

  const addRecord = useCallback((subject: BasicSkillSubject, grade: BasicSkillGrade, acquiredDate: string) => {
    updateBasicSkill(prev => ({
      ...prev,
      records: [...prev.records,
        { id: generateId(), subject, grade, acquiredDate, expiresAt: calcExpiresAt(acquiredDate) },
      ],
    }));
  }, [updateBasicSkill]);

  const removeRecord = useCallback((id: string) => {
    updateBasicSkill(prev => ({ ...prev, records: prev.records.filter(r => r.id !== id) }));
  }, [updateBasicSkill]);

  const confirmEliteWarrior = useCallback(() => {
    updateBasicSkill(prev => ({
      ...prev,
      eliteWarrior: { isActive: true, confirmedDate: new Date().toISOString().slice(0, 10) },
    }));
  }, [updateBasicSkill]);

  const revokeEliteWarrior = useCallback(() => {
    updateBasicSkill(prev => ({ ...prev, eliteWarrior: { isActive: false } }));
  }, [updateBasicSkill]);

  const setEarlyPromotion = useCallback((toCorporal: number, toSergeant: number) => {
    updateBasicSkill(prev => ({ ...prev, earlyPromotion: { toCorporal, toSergeant } }));
  }, [updateBasicSkill]);

  const addMissedPromotion = useCallback((targetRank: '상병' | '병장', examMonth: string) => {
    updateBasicSkill(prev => ({
      ...prev,
      missedPromotions: [...prev.missedPromotions,
        { id: generateId(), targetRank, examMonth, isManual: true },
      ],
    }));
  }, [updateBasicSkill]);

  const removeMissedPromotion = useCallback((id: string) => {
    updateBasicSkill(prev => ({
      ...prev,
      missedPromotions: prev.missedPromotions.filter(m => m.id !== id),
    }));
  }, [updateBasicSkill]);

  // ─────────────────────────────────────────────────────────────────────────
  // weekSchedules
  // ─────────────────────────────────────────────────────────────────────────
  const setWeekName = useCallback((sundayKey: string, name: string) => {
    setWeekSchedules(prev => {
      const next = { ...prev, [sundayKey]: name };
      save('week_schedules', next);
      return next;
    });
  }, [save]);

  const removeWeekName = useCallback((sundayKey: string) => {
    setWeekSchedules(prev => {
      const next = { ...prev };
      delete next[sundayKey];
      save('week_schedules', next);
      return next;
    });
  }, [save]);

  // ─────────────────────────────────────────────────────────────────────────
  // resetAll
  // ─────────────────────────────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    if (!userId) return;
    const defaults = {
      vacation:      DEFAULT_VACATION,
      mileage:       DEFAULT_MILEAGE,
      schedule:      DEFAULT_SCHEDULE,
      church_check:  DEFAULT_CHURCH_CHECK,
      basic_skill:   DEFAULT_BASIC_SKILL,
      week_schedules: {},
    };
    await supabase.from('app_data').update(defaults).eq('user_id', userId);
    await saveProfile(userId, { enlistment_date: null, has_completed_onboarding: false });

    setVacationData(DEFAULT_VACATION);
    setMileageData(DEFAULT_MILEAGE);
    setScheduleData(DEFAULT_SCHEDULE);
    setChurchCheckData(DEFAULT_CHURCH_CHECK);
    setBasicSkillData(DEFAULT_BASIC_SKILL);
    setWeekSchedules({});
    setUserData({ enlistmentDate: '', hasCompletedOnboarding: false });
    await refreshProfile();
  }, [userId, refreshProfile]);

  // ─────────────────────────────────────────────────────────────────────────
  return {
    dataLoaded,
    // data
    userData, vacationData, mileageData, scheduleData, churchCheckData, basicSkillData,
    weekSchedules,
    // userData
    completeOnboarding,
    // schedule
    addScheduleEvent, removeScheduleEvent,
    // vacation
    addRewardVacation, addConsolationVacation, grantEmploymentLeave,
    spendVacationBreakdown, restoreVacationBreakdown,
    setVacationData: updateVacation,
    useAnnualLeave: (days: number) =>
      updateVacation(prev => ({ ...prev, annualLeave: Math.max(0, prev.annualLeave - days) })),
    // mileage
    addMileageEntry,
    // church
    updateChurchCheck,
    // basicSkill
    addRecord, removeRecord,
    confirmEliteWarrior, revokeEliteWarrior,
    setEarlyPromotion,
    addMissedPromotion, removeMissedPromotion,
    // weekSchedules
    setWeekName, removeWeekName,
    // reset
    resetAll,
  };
}