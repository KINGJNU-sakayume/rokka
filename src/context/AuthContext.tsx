import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/auth';

interface AuthContextValue {
  session:  Session | null;
  profile:  UserProfile | null;
  loading:  boolean;
  signOut:  () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingDone = useRef(false);

  const finishLoading = useCallback(() => {
    if (!loadingDone.current) {
      loadingDone.current = true;
      setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) setProfile(data as UserProfile);
    } catch (e) {
      console.error('[AuthContext] loadProfile 예외:', e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) await loadProfile(s.user.id);
      finishLoading();
    }).catch((e) => {
      console.error('[AuthContext] getSession 실패:', e);
      finishLoading();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        (async () => {
          setSession(s);
          if (s) {
            await loadProfile(s.user.id);
          } else {
            setProfile(null);
          }
          if (event === 'INITIAL_SESSION') {
            finishLoading();
          }
        })();
      }
    );

    const timeout = setTimeout(() => {
      console.warn('[AuthContext] 타임아웃으로 loading 강제 종료');
      finishLoading();
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [loadProfile, finishLoading]);

  const signOut = async () => {
    setProfile(null);
    setSession(null);
    supabase.auth.signOut().catch(e => console.warn('[AuthContext] signOut 서버 요청 실패:', e));
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
