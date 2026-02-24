import { supabase } from './supabase';
import type { Event, Note, Patient } from '../types';

export interface EvolucaoRow {
  event_id: string;
  start_at: string;
  patient_name: string | null;
  responsible_user_id: string;
  responsible_name: string | null;
  status: string;
  note_id: string | null;
  evolution_ok: boolean;
  cosign_required: boolean;
  cosign_ok: boolean;
}

export interface EventWithNote {
  event: Event;
  note: Note | null;
  patient: Patient | null;
  author_name: string | null;
}

async function getEventsWithNotes(
  unitId: string,
  responsibleUserId?: string
): Promise<EvolucaoRow[]> {
  let q = supabase
    .from('events')
    .select('id, start_at, patient_id, responsible_user_id, status')
    .eq('unit_id', unitId)
    .in('type', ['atendimento', 'reuniao'])
    .order('start_at', { ascending: false });
  if (responsibleUserId) q = q.eq('responsible_user_id', responsibleUserId);
  const { data: events } = await q;
  if (!events?.length) return [];
  const eventIds = events.map((e: { id: string }) => e.id);
  const { data: notes } = await supabase
    .from('notes')
    .select('event_id, id, finalized_at, cosign_required, cosigned_at')
    .in('event_id', eventIds);
  const noteByEvent = new Map(
    (notes ?? []).map((n: { event_id: string; id: string; finalized_at: string | null; cosign_required: boolean; cosigned_at: string | null }) => [
      n.event_id,
      { id: n.id, finalized_at: n.finalized_at, cosign_required: n.cosign_required, cosigned_at: n.cosigned_at },
    ])
  );
  const patientIds = [...new Set((events as { patient_id: string | null }[]).map((e) => e.patient_id).filter(Boolean))];
  const { data: patients } = patientIds.length
    ? await supabase.from('patients').select('id, full_name').in('id', patientIds)
    : { data: [] };
  const patientMap = new Map((patients ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
  const userIds = [...new Set((events as { responsible_user_id: string }[]).map((e) => e.responsible_user_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));
  return (events as { id: string; start_at: string; patient_id: string | null; responsible_user_id: string; status: string }[]).map((e) => {
    const n = noteByEvent.get(e.id);
    return {
      event_id: e.id,
      start_at: e.start_at,
      patient_name: e.patient_id ? patientMap.get(e.patient_id) ?? null : null,
      responsible_user_id: e.responsible_user_id,
      responsible_name: profileMap.get(e.responsible_user_id) ?? null,
      status: e.status,
      note_id: n?.id ?? null,
      evolution_ok: !!n?.finalized_at,
      cosign_required: !!n?.cosign_required,
      cosign_ok: !!n?.cosigned_at,
    };
  });
}

export async function fetchMinhasPendentes(unitId: string, userId: string) {
  const rows = await getEventsWithNotes(unitId, userId);
  return rows.filter((r) => !r.evolution_ok);
}

export async function fetchPendentesUnidade(unitId: string) {
  const rows = await getEventsWithNotes(unitId);
  return rows.filter((r) => !r.evolution_ok);
}

export async function fetchCoassinaturasPendentes(unitId: string) {
  const { data: notes } = await supabase
    .from('notes')
    .select('id, event_id, author_id')
    .eq('cosign_required', true)
    .is('cosigned_at', null);
  if (!notes?.length) return [];
  const eventIds = notes.map((n: { event_id: string }) => n.event_id);
  const { data: events } = await supabase
    .from('events')
    .select('id, start_at, patient_id, responsible_user_id, status')
    .in('id', eventIds)
    .eq('unit_id', unitId);
  if (!events?.length) return [];
  const allRows = await getEventsWithNotes(unitId);
  return allRows.filter((r) => r.cosign_required && !r.cosign_ok);
}

export async function fetchEventWithNote(eventId: string): Promise<EventWithNote | null> {
  const { data: event, error: eErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  if (eErr || !event) return null;
  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();
  let patient: Patient | null = null;
  if (event.patient_id) {
    const { data: p } = await supabase.from('patients').select('*').eq('id', event.patient_id).single();
    patient = p as Patient | null;
  }
  let author_name: string | null = null;
  if (note?.author_id) {
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', note.author_id).single();
    author_name = prof?.full_name ?? null;
  }
  return {
    event: event as Event,
    note: (note as Note) ?? null,
    patient,
    author_name,
  };
}

export async function ensureNote(eventId: string, type: 'evolucao' | 'ata', authorId: string): Promise<Note | null> {
  const { data: existing } = await supabase.from('notes').select('*').eq('event_id', eventId).maybeSingle();
  if (existing) return existing as Note;
  const { data: inserted } = await supabase
    .from('notes')
    .insert({
      event_id: eventId,
      type,
      content: '',
      author_id: authorId,
      cosign_required: false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  return inserted as Note | null;
}

export async function updateNoteContent(noteId: string, content: string, tags?: string | null) {
  const payload: { content: string; updated_at: string; tags?: string | null } = {
    content,
    updated_at: new Date().toISOString(),
  };
  if (tags !== undefined) payload.tags = tags || null;
  const { error } = await supabase.from('notes').update(payload).eq('id', noteId);
  return { error };
}

export async function finalizeNote(noteId: string) {
  const { error } = await supabase
    .from('notes')
    .update({ finalized_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', noteId);
  return { error };
}

export async function requestCosign(noteId: string) {
  const { error } = await supabase
    .from('notes')
    .update({ cosign_required: true, updated_at: new Date().toISOString() })
    .eq('id', noteId);
  return { error };
}

export async function cosignNote(noteId: string, userId: string) {
  const { error } = await supabase
    .from('notes')
    .update({
      cosigned_at: new Date().toISOString(),
      cosigned_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);
  return { error };
}

/** Adiciona texto ao adendo (append-only, após finalização) */
export async function appendNoteAddendum(noteId: string, textToAppend: string) {
  const { data: note } = await supabase.from('notes').select('addendum').eq('id', noteId).single();
  const current = (note as { addendum?: string | null } | null)?.addendum ?? '';
  const newAddendum = current + (current ? '\n\n' : '') + textToAppend.trim();
  const { error } = await supabase
    .from('notes')
    .update({ addendum: newAddendum, updated_at: new Date().toISOString() })
    .eq('id', noteId);
  return { error };
}

export async function setNoteDefaultAndFinalize(
  eventId: string,
  type: 'evolucao' | 'ata',
  authorId: string,
  defaultContent: string
) {
  const note = await ensureNote(eventId, type, authorId);
  if (!note) return { error: new Error('Não foi possível criar/obter a nota') };
  const { error: updateErr } = await updateNoteContent(note.id, defaultContent);
  if (updateErr) return { error: updateErr };
  const { error } = await finalizeNote(note.id);
  return { error };
}
