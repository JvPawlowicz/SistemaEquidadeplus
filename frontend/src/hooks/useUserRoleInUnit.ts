import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AppRole } from '../types';

/** Retorna a role do usuário na unidade ativa e se é admin em alguma unidade (para Configurações). */
export function useUserRoleInUnit(unitId: string | null, userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isAdminInAnyUnit, setIsAdminInAnyUnit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setRole(null);
        setIsAdminInAnyUnit(false);
        setLoading(false);
      });
      return;
    }
    queueMicrotask(() => setLoading(true));
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from('user_units')
        .select('unit_id, role')
        .eq('user_id', userId);
      if (cancelled) return;
      const list = (rows ?? []) as { unit_id: string; role: AppRole }[];
      const adminInAny = list.some((r) => r.role === 'admin');
      const roleInActive = unitId ? list.find((r) => r.unit_id === unitId)?.role ?? null : null;
      setRole(roleInActive);
      setIsAdminInAnyUnit(adminInAny);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [unitId, userId]);

  const canCreateEditEvents = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const seesUnitAgenda = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const seesMyAgendaOnly = role === 'profissional' || role === 'estagiario';
  const canCreateEditPatient = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const isAdmin = role === 'admin';

  return {
    role,
    loading,
    canCreateEditEvents,
    seesUnitAgenda,
    seesMyAgendaOnly,
    canCreateEditPatient,
    isAdmin,
    /** True se o usuário tem role admin em pelo menos uma unidade (ex.: para exibir Configurações). */
    isAdminInAnyUnit,
    isTi: role === 'ti',
  };
}
