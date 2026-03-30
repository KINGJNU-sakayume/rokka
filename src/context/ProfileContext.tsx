import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserProfile } from '../types/auth';

const STORAGE_KEY = 'soldier-profile';

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  saveProfile: (p: UserProfile) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function readProfileFromStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => readProfileFromStorage());
  // loading is false immediately — localStorage read is synchronous
  const [loading] = useState(false);

  const saveProfile = useCallback((p: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, saveProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
