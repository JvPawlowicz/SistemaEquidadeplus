import { supabase } from './supabase';

export interface AbaSessionDataRow {
  id: string;
  note_id: string;
  aba_goal_id: string;
  value_numeric: number | null;
  value_text: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchSessionDataByNote(noteId: string) {
  const { data, error } = await supabase
    .from('aba_session_data')
    .select('*')
    .eq('note_id', noteId);
  return {
    rows: (data ?? []) as AbaSessionDataRow[],
    error: error as Error | null,
  };
}

export async function upsertSessionData(
  noteId: string,
  abaGoalId: string,
  value: { value_numeric?: number | null; value_text?: string | null }
) {
  const { data: existing } = await supabase
    .from('aba_session_data')
    .select('id')
    .eq('note_id', noteId)
    .eq('aba_goal_id', abaGoalId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('aba_session_data')
      .update({
        value_numeric: value.value_numeric ?? null,
        value_text: value.value_text ?? null,
      })
      .eq('id', existing.id)
      .select()
      .single();
    return { row: data as AbaSessionDataRow | null, error: error as Error | null };
  }
  const { data, error } = await supabase
    .from('aba_session_data')
    .insert({
      note_id: noteId,
      aba_goal_id: abaGoalId,
      value_numeric: value.value_numeric ?? null,
      value_text: value.value_text ?? null,
    })
    .select()
    .single();
  return { row: data as AbaSessionDataRow | null, error: error as Error | null };
}

/** Para gráficos: dados de coleta de uma meta em um período (por data da sessão/nota). */
export async function fetchSessionDataByGoal(
  abaGoalId: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; value_numeric: number | null; value_text: string | null }[]> {
  const { data: rows, error } = await supabase
    .from('aba_session_data')
    .select('id, note_id, value_numeric, value_text')
    .eq('aba_goal_id', abaGoalId);
  if (error || !rows?.length) return [];
  const noteIds = [...new Set((rows as AbaSessionDataRow[]).map((r) => r.note_id))];
  const { data: notes } = await supabase
    .from('notes')
    .select('id, event_id')
    .in('id', noteIds);
  if (!notes?.length) return [];
  const eventIds = (notes as { id: string; event_id: string }[]).map((n) => n.event_id);
  const { data: events } = await supabase
    .from('events')
    .select('id, start_at')
    .in('id', eventIds);
  const eventByNote = new Map<string, string>();
  (notes as { id: string; event_id: string }[]).forEach((n) => eventByNote.set(n.id, n.event_id));
  const startAtByEvent = new Map<string, string>();
  (events ?? []).forEach((e: { id: string; start_at: string }) => startAtByEvent.set(e.id, e.start_at));
  const start = new Date(startDate);
  const end = new Date(endDate);
  const out: { date: string; value_numeric: number | null; value_text: string | null }[] = [];
  for (const r of rows as AbaSessionDataRow[]) {
    const eventId = eventByNote.get(r.note_id);
    const startAt = eventId ? startAtByEvent.get(eventId) : null;
    if (!startAt) continue;
    const d = new Date(startAt);
    if (d < start || d > end) continue;
    out.push({
      date: startAt.slice(0, 10),
      value_numeric: r.value_numeric ?? null,
      value_text: r.value_text ?? null,
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}
