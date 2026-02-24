import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../lib/config';
import { useAuth } from './AuthContext';
import type { Unit } from '../types';

const STORAGE_KEY = 'equidadeplus_active_unit_id';

export const AGENDA_DENSITY_KEY = 'equidadeplus_agenda_density';
export type AgendaDensity = 'normal' | 'compacta';

interface ActiveUnitContextValue {
  units: Unit[];
  activeUnit: Unit | null;
  activeUnitId: string | null;
  setActiveUnitId: (id: string) => void;
  timezone: string;
  loading: boolean;
}

const ActiveUnitContext = createContext<ActiveUnitContextValue | null>(null);

export function ActiveUnitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);
  const appliedProfileDefaultRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    const unitsPromise = supabase.from('units').select('*').order('name');
    Promise.resolve(unitsPromise)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setUnits((data ?? []) as Unit[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const setActiveUnitId = useCallback((id: string) => {
    setActiveUnitIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    if (units.length > 0 && !activeUnitId) {
      const first = units[0].id;
      setActiveUnitIdState(first);
      localStorage.setItem(STORAGE_KEY, first);
    }
  }, [units, activeUnitId]);

  useEffect(() => {
    if (appliedProfileDefaultRef.current || !user?.id || units.length === 0) return;
    appliedProfileDefaultRef.current = true;
    fetchProfile(user.id)
      .then(({ profile }) => {
        const defaultId = profile?.default_unit_id ?? null;
        if (defaultId && units.some((u) => u.id === defaultId)) {
          setActiveUnitIdState(defaultId);
          localStorage.setItem(STORAGE_KEY, defaultId);
        }
      })
      .catch(() => {});
  }, [user?.id, units]);

  const activeUnit = activeUnitId
    ? units.find((u) => u.id === activeUnitId) ?? null
    : null;
  const timezone = activeUnit?.timezone ?? 'America/Sao_Paulo';

  const value: ActiveUnitContextValue = {
    units,
    activeUnit,
    activeUnitId,
    setActiveUnitId,
    timezone,
    loading,
  };

  return (
    <ActiveUnitContext.Provider value={value}>
      {children}
    </ActiveUnitContext.Provider>
  );
}

export function useActiveUnit(): ActiveUnitContextValue {
  const ctx = useContext(ActiveUnitContext);
  if (!ctx) throw new Error('useActiveUnit must be used within ActiveUnitProvider');
  return ctx;
}
