import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Inscreve em mudanças em tempo real na tabela events para uma unidade.
 * Útil para atualizar a agenda quando outro usuário cria/edita/remove evento.
 */
export function useRealtimeEvents(unitId: string | null, onEventChange: () => void) {
  useEffect(() => {
    if (!unitId) return;

    const channel = supabase
      .channel(`events:unit:${unitId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `unit_id=eq.${unitId}`,
        },
        () => {
          onEventChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitId, onEventChange]);
}
