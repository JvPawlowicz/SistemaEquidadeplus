import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (userId: string, email?: string, fullName?: string) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    if (!existing) {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName ?? email ?? null,
        email: email ?? null,
      }, { onConflict: 'id' });
    } else if (email) {
      await supabase.from('profiles').update({ email }).eq('id', userId);
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          ensureProfile(
            s.user.id,
            s.user.email ?? undefined,
            (s.user.user_metadata?.full_name as string) ?? undefined
          ).then(() => {
            supabase.from('profiles').select('is_blocked').eq('id', s.user.id).single().then(({ data: profile }) => {
              if ((profile as { is_blocked?: boolean } | null)?.is_blocked) {
                supabase.auth.signOut().then(() => {
                  setSession(null);
                  setUser(null);
                });
              }
            });
          }).catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        ensureProfile(
          s.user.id,
          s.user.email ?? undefined,
          (s.user.user_metadata?.full_name as string) ?? undefined
        ).then(() => {
          supabase.from('profiles').select('is_blocked').eq('id', s.user.id).single().then(({ data: profile }) => {
            if ((profile as { is_blocked?: boolean } | null)?.is_blocked) {
              supabase.auth.signOut().then(() => {
                setSession(null);
                setUser(null);
              });
            }
          });
        }).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, [ensureProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
