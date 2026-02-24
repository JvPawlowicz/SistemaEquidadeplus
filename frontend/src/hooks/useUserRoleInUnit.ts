import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AppRole } from '../types';

export function useUserRoleInUnit(unitId: string | null, userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId || !userId) {
      setRole(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('user_units')
        .select('role')
        .eq('unit_id', unitId)
        .eq('user_id', userId)
        .single();
      if (!cancelled && data) setRole(data.role as AppRole);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [unitId, userId]);

  const canCreateEditEvents = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const seesUnitAgenda = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const seesMyAgendaOnly = role === 'profissional' || role === 'estagiario';
  const canCreateEditPatient = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const isAdmin = role === 'admin';
  const isTi = role === 'ti';

  return {
    role,
    loading,
    canCreateEditEvents,
    seesUnitAgenda,
    seesMyAgendaOnly,
    canCreateEditPatient,
    isAdmin,
    isTi,
  };
}
