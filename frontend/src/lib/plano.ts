import { supabase } from './supabase';
import type { TreatmentCycle, TreatmentGoal, GoalStatus } from '../types';

export async function fetchCyclesByPatient(patientId: string) {
  const { data, error } = await supabase
    .from('treatment_cycles')
    .select('*')
    .eq('patient_id', patientId)
    .order('start_date', { ascending: false });
  return { cycles: (data ?? []) as TreatmentCycle[], error: error as Error | null };
}

export async function fetchGoalsByCycle(cycleId: string) {
  const { data, error } = await supabase
    .from('treatment_goals')
    .select('*')
    .eq('cycle_id', cycleId)
    .order('sort_order');
  return { goals: (data ?? []) as TreatmentGoal[], error: error as Error | null };
}

export async function createCycle(patientId: string, params: {
  name: string;
  months: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('treatment_cycles')
    .insert({
      patient_id: patientId,
      name: params.name,
      months: params.months,
      start_date: params.start_date,
      end_date: params.end_date,
      is_active: params.is_active ?? true,
    })
    .select()
    .single();
  return { cycle: data as TreatmentCycle | null, error: error as Error | null };
}

export async function updateCycle(id: string, params: Partial<Pick<TreatmentCycle, 'name' | 'months' | 'start_date' | 'end_date' | 'is_active'>>) {
  const { data, error } = await supabase
    .from('treatment_cycles')
    .update(params)
    .eq('id', id)
    .select()
    .single();
  return { cycle: data as TreatmentCycle | null, error: error as Error | null };
}

export async function deleteCycle(id: string) {
  const { error } = await supabase.from('treatment_cycles').delete().eq('id', id);
  return { error: error as Error | null };
}

export async function createGoal(cycleId: string, params: {
  title: string;
  description?: string;
  category?: string;
  status?: GoalStatus;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from('treatment_goals')
    .insert({
      cycle_id: cycleId,
      title: params.title,
      description: params.description ?? null,
      category: params.category ?? null,
      status: params.status ?? 'ativa',
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  return { goal: data as TreatmentGoal | null, error: error as Error | null };
}

export async function updateGoal(id: string, params: Partial<Pick<TreatmentGoal, 'title' | 'description' | 'category' | 'status' | 'sort_order'>>) {
  const { data, error } = await supabase
    .from('treatment_goals')
    .update(params)
    .eq('id', id)
    .select()
    .single();
  return { goal: data as TreatmentGoal | null, error: error as Error | null };
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('treatment_goals').delete().eq('id', id);
  return { error: error as Error | null };
}

/** Metas marcadas como trabalhadas nesta evolução */
export async function fetchNoteGoals(noteId: string) {
  const { data, error } = await supabase
    .from('note_goals')
    .select('goal_id')
    .eq('note_id', noteId);
  const goalIds = (data ?? []).map((r: { goal_id: string }) => r.goal_id);
  return { goalIds, error: error as Error | null };
}

/** Substitui as metas trabalhadas desta nota (remove todas e insere as selecionadas) */
export async function setNoteGoals(noteId: string, goalIds: string[]) {
  const { error: delErr } = await supabase.from('note_goals').delete().eq('note_id', noteId);
  if (delErr) return { error: delErr as Error };
  if (goalIds.length === 0) return { error: null };
  const { error: insErr } = await supabase
    .from('note_goals')
    .insert(goalIds.map((goal_id) => ({ note_id: noteId, goal_id })));
  return { error: insErr as Error | null };
}
