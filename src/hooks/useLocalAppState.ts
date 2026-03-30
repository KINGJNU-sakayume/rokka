/**
 * useLocalAppState
 *
 * localStorage/IndexedDB 기반 앱 상태 관리 훅.
 * useSupabaseAppState 와 완전히 동일한 반환 인터페이스를 유지합니다.
 *
 * 전략:
 *  - IndexedDB(Dexie)에서 전체 데이터를 한 번에 로드
 *  - userData(입대일, 온보딩 여부)는 ProfileContext에서 관리
 *  - 변경이 발생하면 로컬 state 즉시 반영(optimistic) + IndexedDB 비동기 저장
 */

import { useState, useEffect, useCallback } from 'react';
import { db, LOCAL_USER_ID, type AppDataRecord } from '../lib/db';
import { useProfile } from '../context/ProfileContext';
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

// ─── getRewardVacationTotal ────────────────────────────────────────────────────
export function getRewardVacationTotal(vacation: VacationData): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  const earned = (vacation.rewardVacation.history ?? [])
    .filter(e => e.expiresAt >= today)
    .reduce((sum, e) => sum + e.daysEarned, 0);
  return Math.max(0, earned - (vacation.rewardVacation.usedDays ?? 0));
}

// ─── 기본 레코드 ────────────────────────────────────────────────────────────────
const DEFAULT_RECORD: Omit<AppDataRecord, 'userId'> = {
  vacation:      DEFAULT_VACATION,
  mileage:       DEFAULT_MILEAGE,
  schedule:      DEFAULT_SCHEDULE,
  church_check:  DEFAULT_CHURCH_CHECK,
  basic_skill:   DEFAULT_BASIC_SKILL,
  week_schedules: {},
};

// ─── 메인 훅 ──────────────────────────────────────────────────────────────────
export function useLocalAppState() {
  const { profile, saveProfile, clearProfile } = useProfile();

  // ── userData: ProfileContext에서 파생 ─────────────────────────────────────
  const userData: UserData = {
    enlistmentDate: profile?.enlistment_date ?? '',
    hasCompletedOnboarding: profile?.has_completed_onboarding ?? false,
  };

  // ── 로컬 상태 ─────────────────────────────────────────────────────────────
  const [dataLoaded,      setDataLoaded]      = useState(false);
  const [vacationData,    setVacationData]    = useState<VacationData>(DEFAULT_VACATION);
  const [mileageData,     setMileageData]     = useState<MileageData>(DEFAULT_MILEAGE);
  const [scheduleData,    setScheduleData]    = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [churchCheckData, setChurchCheckData] = useState<ChurchCheckData>(DEFAULT_CHURCH_CHECK);
  const [basicSkillData,  setBasicSkillData]  = useState<BasicSkillData>(DEFAULT_BASIC_SKILL);
  const [weekSchedules,   setWeekSchedules]   = useState<Record<string, string>>({});

  // ── 데이터 로드 ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        let row = await db.appData.get(LOCAL_USER_ID);
        if (!row) {
          row = { userId: LOCAL_USER_ID, ...DEFAULT_RECORD };
          await db.appData.put(row);
        }
        if (row.vacation)       setVacationData(row.vacation);
        if (row.mileage)        setMileageData(row.mileage);
        if (row.schedule)       setScheduleData(row.schedule);
        if (row.church_check)   setChurchCheckData(row.church_check);
        if (row.basic_skill)    setBasicSkillData(row.basic_skill);
        if (row.week_schedules) setWeekSchedules(row.week_schedules);
      } catch (e) {
        console.error('[useLocalAppState] load 예외:', e);
      } finally {
        setDataLoaded(true);
      }
    };
    load();
  }, []);

  // ── IndexedDB 저장 래퍼 ───────────────────────────────────────────────────
  const saveField = useCallback(
    (field: keyof Omit<AppDataRecord, 'userId'>, value: unknown) => {
      db.appData
        .update(LOCAL_USER_ID, { [field]: value })
        .catch(e => console.error(`[useLocalAppState] save ${field}:`, e));
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // userData / onboarding
  // ─────────────────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback((enlistmentDate: string) => {
    if (!profile) return;
    saveProfile({
      ...profile,
      enlistment_date: enlistmentDate,
      has_completed_onboarding: true,
    });
  }, [profile, saveProfile]);

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
              ['duty', 'vacation', 'full_combat_rest', 'after_duty_sleep'].includes(e.type)
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

      if (['duty', 'vacation', 'full_combat_rest'].includes(event.type)) {
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
      saveField('schedule', next);
      return next;
    });

    return newEvent;
  }, [saveField]);

  const removeScheduleEvent = useCallback((id: string) => {
    setScheduleData(prev => {
      const next = { ...prev, events: prev.events.filter(e => e.id !== id) };
      saveField('schedule', next);
      return next;
    });
  }, [saveField]);

  // ─────────────────────────────────────────────────────────────────────────
  // vacationData
  // ─────────────────────────────────────────────────────────────────────────
  const updateVacation = useCallback((updater: (prev: VacationData) => VacationData) => {
    setVacationData(prev => {
      const next = updater(prev);
      saveField('vacation', next);
      return next;
    });
  }, [saveField]);

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
      saveField('mileage', next);
      return next;
    });
  }, [saveField]);

  // ─────────────────────────────────────────────────────────────────────────
  // churchCheckData
  // ─────────────────────────────────────────────────────────────────────────
  const updateChurchCheck = useCallback((attendedDate?: string) => {
    setChurchCheckData(prev => {
      const attended = attendedDate
        ? [...prev.attendedDates, attendedDate]
        : prev.attendedDates;
      const next = { lastCheckedDate: toISODateString(new Date()), attendedDates: attended };
      saveField('church_check', next);
      return next;
    });
  }, [saveField]);

  // ─────────────────────────────────────────────────────────────────────────
  // basicSkillData
  // ─────────────────────────────────────────────────────────────────────────
  const updateBasicSkill = useCallback((updater: (prev: BasicSkillData) => BasicSkillData) => {
    setBasicSkillData(prev => {
      const next = updater(prev);
      saveField('basic_skill', next);
      return next;
    });
  }, [saveField]);

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
      saveField('week_schedules', next);
      return next;
    });
  }, [saveField]);

  const removeWeekName = useCallback((sundayKey: string) => {
    setWeekSchedules(prev => {
      const next = { ...prev };
      delete next[sundayKey];
      saveField('week_schedules', next);
      return next;
    });
  }, [saveField]);

  // ─────────────────────────────────────────────────────────────────────────
  // resetAll
  // ─────────────────────────────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    await db.appData.delete(LOCAL_USER_ID);
    setVacationData(DEFAULT_VACATION);
    setMileageData(DEFAULT_MILEAGE);
    setScheduleData(DEFAULT_SCHEDULE);
    setChurchCheckData(DEFAULT_CHURCH_CHECK);
    setBasicSkillData(DEFAULT_BASIC_SKILL);
    setWeekSchedules({});
    clearProfile();
  }, [clearProfile]);

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
