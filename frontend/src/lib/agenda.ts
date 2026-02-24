import { supabase } from './supabase';
import type { Event, Room, Patient } from '../types';

export interface EventWithRelations extends Event {
  room?: Room | null;
  patient?: Patient | null;
  responsibleProfile?: { id: string; full_name: string | null } | null;
  note?: { id: string; finalized_at: string | null } | null;
}

export async function fetchEvents(
  unitId: string,
  start: Date,
  end: Date,
  responsibleUserId?: string
) {
  const startStr = start.toISOString();
  const endStr = end.toISOString();
  let q = supabase
    .from('events')
    .select('*, room:rooms(*), patient:patients(*)')
    .eq('unit_id', unitId)
    .gte('start_at', startStr)
    .lte('end_at', endStr)
    .order('start_at');
  if (responsibleUserId) {
    q = q.eq('responsible_user_id', responsibleUserId);
  }
  const { data: events, error } = await q;
  if (error) return { events: [], error };
  const ids = [...new Set((events as Event[]).map((e) => e.responsible_user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const eventIds = (events as Event[]).map((e) => e.id);
  const { data: notes } = eventIds.length
    ? await supabase
        .from('notes')
        .select('event_id, id, finalized_at')
        .in('event_id', eventIds)
    : { data: [] };
  const noteByEvent = new Map(
    (notes ?? []).map((n: { event_id: string; id: string; finalized_at: string | null }) => [
      n.event_id,
      { id: n.id, finalized_at: n.finalized_at },
    ])
  );
  const withRelations: EventWithRelations[] = (events as Event[]).map((e) => ({
    ...e,
    room: Array.isArray((e as unknown as { room: unknown }).room)
      ? null
      : ((e as unknown as { room: Room }).room ?? null),
    patient: Array.isArray((e as unknown as { patient: unknown }).patient)
      ? null
      : ((e as unknown as { patient: Patient }).patient ?? null),
    responsibleProfile: profileMap.get(e.responsible_user_id) ?? null,
    note: noteByEvent.get(e.id) ?? null,
  }));
  return { events: withRelations, error: null };
}

export async function fetchRooms(unitId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  return { rooms: (data ?? []) as Room[], error };
}

export async function fetchPatientsInUnit(unitId: string) {
  const { data: pu } = await supabase
    .from('patient_units')
    .select('patient_id')
    .eq('unit_id', unitId);
  const ids = (pu ?? []).map((p: { patient_id: string }) => p.patient_id);
  if (ids.length === 0) return { patients: [] };
  const { data } = await supabase
    .from('patients')
    .select('id, full_name, birth_date')
    .in('id', ids)
    .order('full_name');
  return { patients: (data ?? []) as Pick<Patient, 'id' | 'full_name' | 'birth_date'>[] };
}

export async function fetchProfessionalsInUnit(unitId: string) {
  const { data: uu } = await supabase
    .from('user_units')
    .select('user_id')
    .eq('unit_id', unitId)
    .in('role', ['admin', 'coordenador', 'profissional', 'estagiario']);
  const ids = (uu ?? []).map((r: { user_id: string }) => r.user_id);
  if (ids.length === 0) return { profiles: [] };
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
    .order('full_name');
  return { profiles: (data ?? []) as { id: string; full_name: string | null }[] };
}

/** Todos os usuários da unidade (para atribuição em chamados, etc.). */
export async function fetchProfilesInUnit(unitId: string) {
  const { data: uu } = await supabase
    .from('user_units')
    .select('user_id')
    .eq('unit_id', unitId);
  const ids = (uu ?? []).map((r: { user_id: string }) => r.user_id);
  if (ids.length === 0) return { profiles: [] as { id: string; full_name: string | null }[] };
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
    .order('full_name');
  return { profiles: (data ?? []) as { id: string; full_name: string | null }[] };
}

export async function updateEventStatus(
  eventId: string,
  status: Event['status'],
  reopenReason?: string | null
) {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'aberto') {
    payload.reopen_reason = reopenReason ?? null;
  }
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId)
    .select()
    .single();
  return { event: data as Event | null, error };
}

export async function updateEventResponsible(eventId: string, responsibleUserId: string) {
  const { data, error } = await supabase
    .from('events')
    .update({
      responsible_user_id: responsibleUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();
  return { event: data as Event | null, error };
}
