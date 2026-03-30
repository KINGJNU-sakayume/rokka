import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { useProfile, ProfileProvider } from './context/ProfileContext';
import { useLocalAppState } from './hooks/useLocalAppState';

import { toISODateString, getEventsForDate } from './utils/dateUtils';
import { getMostRecentChurchDay } from './logic/churchLogic';
import { createMileageEntry } from './logic/mileageLogic';
import { isLeaveBlocked } from './logic/basicSkillLogic';
import { calculateServiceProgress } from './logic/serviceCalculator';

import type { ActiveTab, MileageTransactionType } from './types';

import { usePWA } from './hooks/usePWA';
import Header from './components/layout/Header';
import InstallBanner from './components/layout/InstallBanner';
import BottomNav from './components/layout/BottomNav';
import DashboardTab from './components/dashboard/DashboardTab';
import CalendarTab from './components/calendar/CalendarTab';
import MileageTab from './components/mileage/MileageTab';
import OnboardingModal, { type OnboardingPromoData } from './components/modals/OnboardingModal';
import ChurchAttendanceModal from './components/modals/ChurchAttendanceModal';
import SettingsModal from './components/modals/SettingsModal';
import ProfileSetupScreen from './components/auth/ProfileSetupScreen';

// 어느 단계에서 로딩 중인지 표시 → 무한 로딩 원인 파악용
function LoadingScreen({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen bg-[#0d1520] flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="text-army-green-400 animate-spin" />
      <p className="text-gray-400 text-sm">데이터를 불러오는 중...</p>
      <p className="text-gray-600 text-xs">{reason}</p>
    </div>
  );
}

function AppInner() {
  const {
    dataLoaded,
    userData, vacationData, mileageData, scheduleData, churchCheckData, basicSkillData,
    completeOnboarding,
    addScheduleEvent, removeScheduleEvent,
    addMileageEntry, addRewardVacation, addConsolationVacation,
    spendVacationBreakdown, restoreVacationBreakdown, grantEmploymentLeave,
    updateChurchCheck, resetAll,
    addRecord, removeRecord,
    confirmEliteWarrior, revokeEliteWarrior,
    setEarlyPromotion,
    addMissedPromotion, removeMissedPromotion,
  } = useLocalAppState();

  const { profile, clearProfile } = useProfile();

  const [activeTab,    setActiveTab]    = useState<ActiveTab>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [churchModal,  setChurchModal]  = useState<{
    isOpen: boolean; date: Date; dayName: '수요일' | '일요일';
  } | null>(null);

  const { isInstallable, promptInstall } = usePWA();

  const churchCheckRef  = useRef(churchCheckData);
  const scheduleDataRef = useRef(scheduleData);
  const updateChurchRef = useRef(updateChurchCheck);
  useEffect(() => { churchCheckRef.current  = churchCheckData;   }, [churchCheckData]);
  useEffect(() => { scheduleDataRef.current = scheduleData;      }, [scheduleData]);
  useEffect(() => { updateChurchRef.current = updateChurchCheck; }, [updateChurchCheck]);

  // 교회 출석 체크 모달 트리거
  useEffect(() => {
    if (!userData.hasCompletedOnboarding) return;
    const churchDay = getMostRecentChurchDay();
    if (!churchDay) return;
    const cc            = churchCheckRef.current;
    const sd            = scheduleDataRef.current;
    const churchDateStr = toISODateString(churchDay.date);
    const todayStr      = toISODateString(new Date());
    if (cc.lastCheckedDate === todayStr) return;
    if (cc.attendedDates.includes(churchDateStr)) { updateChurchRef.current(); return; }
    if (getEventsForDate(churchDay.date, sd.events).some(e => e.type === 'church')) {
      updateChurchRef.current(); return;
    }
    setChurchModal({ isOpen: true, date: churchDay.date, dayName: churchDay.dayName });
  }, [userData.hasCompletedOnboarding]);

  // 복무율 50% → 취업청원휴가 자동 지급
  useEffect(() => {
    if (!userData.enlistmentDate) return;
    if (vacationData.employmentLeaveGranted) return;
    const progress = calculateServiceProgress(userData.enlistmentDate);
    if (progress >= 50) grantEmploymentLeave();
  }, [userData.enlistmentDate, vacationData.employmentLeaveGranted, grantEmploymentLeave]);

  if (!dataLoaded) return <LoadingScreen reason="app_data 로딩 중" />;

  const handleChurchResponse = (type: 'general' | 'praise' | 'no') => {
    if (!churchModal) return;
    const dateStr = toISODateString(churchModal.date);
    if (type !== 'no') {
      const mType: MileageTransactionType = type === 'praise' ? 'church_praise' : 'church_general';
      addScheduleEvent({ type: 'church', date: dateStr, title: '교회' });
      addMileageEntry(createMileageEntry(mType, type === 'praise' ? 2 : 1));
      updateChurchCheck(dateStr);
    } else {
      updateChurchCheck();
    }
    setChurchModal(null);
  };

  const handleAddCalendarEvent = (event: Parameters<typeof addScheduleEvent>[0]) => {
    addScheduleEvent(event);
    if (event.type === 'vacation' && event.vacationBreakdown) {
      spendVacationBreakdown(event.vacationBreakdown);
    }
  };

  const handleRemoveCalendarEvent = (id: string) => {
    const event = scheduleData.events.find(e => e.id === id);
    removeScheduleEvent(id);
    if (event?.type === 'vacation' && event.vacationBreakdown) {
      restoreVacationBreakdown(event.vacationBreakdown);
    }
  };

  const handleEarnMileage = (
    type: MileageTransactionType, amount: number,
    description?: string, dateStr?: string,
  ) => {
    const date = dateStr ? new Date(dateStr + 'T00:00:00') : undefined;
    addMileageEntry(createMileageEntry(type, amount, description, date));
  };

  const handleSpendMileage = (type: MileageTransactionType, amount: number) => {
    addMileageEntry(createMileageEntry(type, amount));
    if (type === 'vacation_reward')
      addRewardVacation(1, toISODateString(new Date()), '마일리지 사용');
  };

  const weekendLeaveBlocked = isLeaveBlocked(basicSkillData, userData.enlistmentDate);
  const isOnboarding        = !userData.hasCompletedOnboarding;

  const handleOnboardingComplete = (enlistmentDate: string, promoData: OnboardingPromoData) => {
    completeOnboarding(enlistmentDate);
    setEarlyPromotion(promoData.earlyToCorporal, promoData.earlyToSergeant);
    for (let i = 0; i < promoData.missedCorporal;  i++) addMissedPromotion('상병', '');
    for (let i = 0; i < promoData.missedSergeant; i++) addMissedPromotion('병장', '');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingModal isOpen={isOnboarding} onComplete={handleOnboardingComplete} />
      {!isOnboarding && (
        <>
          <Header onSettingsClick={() => setSettingsOpen(true)} />
          {isInstallable && <InstallBanner onInstall={promptInstall} />}
          <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
            {activeTab === 'dashboard' && (
              <DashboardTab
                enlistmentDate={userData.enlistmentDate}
                vacation={vacationData}
                mileage={mileageData}
                events={scheduleData.events}
                basicSkillData={basicSkillData}
              />
            )}
            {activeTab === 'calendar' && (
              <CalendarTab
                events={scheduleData.events}
                onAddEvent={handleAddCalendarEvent}
                onDeleteEvent={handleRemoveCalendarEvent}
                userData={userData}
                scheduleData={scheduleData}
                vacationData={vacationData}
                weekendLeaveBlocked={weekendLeaveBlocked}
              />
            )}
            {activeTab === 'mileage' && (
              <MileageTab
                mileage={mileageData}
                vacation={vacationData}
                basicSkillData={basicSkillData}
                enlistmentDate={userData.enlistmentDate}
                onEarnMileage={handleEarnMileage}
                onSpendMileage={handleSpendMileage}
                onAddRewardVacation={addRewardVacation}
                onAddConsolationVacation={addConsolationVacation}
                onAddRecord={addRecord}
                onRemoveRecord={removeRecord}
                onConfirmElite={confirmEliteWarrior}
                onRevokeElite={revokeEliteWarrior}
                onSetEarlyPromotion={setEarlyPromotion}
                onAddMissed={addMissedPromotion}
                onRemoveMissed={removeMissedPromotion}
              />
            )}
          </main>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            enlistmentDate={userData.enlistmentDate}
            onResetAll={resetAll}
            onUpdateEnlistmentDate={completeOnboarding}
            onSignOut={clearProfile}
            profile={profile}
          />
          {churchModal && (
            <ChurchAttendanceModal
              isOpen={churchModal.isOpen}
              dayName={churchModal.dayName}
              date={churchModal.date}
              onGeneral={()    => handleChurchResponse('general')}
              onPraiseTeam={()  => handleChurchResponse('praise')}
              onNo={()          => handleChurchResponse('no')}
            />
          )}
        </>
      )}
    </div>
  );
}

function ProfileGate() {
  const { profile, loading } = useProfile();
  if (loading) return <LoadingScreen reason="프로필 로딩 중" />;
  if (!profile) return <ProfileSetupScreen />;
  return <AppInner />;
}

export default function App() {
  return (
    <ProfileProvider>
      <ProfileGate />
    </ProfileProvider>
  );
}
