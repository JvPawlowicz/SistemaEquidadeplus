import { supabase } from './supabase';
import type { AbaProgram, AbaGoal } from '../types';

export async function fetchProgramsByPatient(patientId: string) {
  const { data, error } = await supabase
    .from('aba_programs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return { programs: (data ?? []) as AbaProgram[], error: error as Error | null };
}

export async function fetchGoalsByProgram(programId: string) {
  const { data, error } = await supabase
    .from('aba_goals')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order');
  return { goals: (data ?? []) as AbaGoal[], error: error as Error | null };
}

export async function createProgram(patientId: string, params: { name: string; description?: string; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('aba_programs')
    .insert({
      patient_id: patientId,
      name: params.name,
      description: params.description ?? null,
      is_active: params.is_active ?? true,
    })
    .select()
    .single();
  return { program: data as AbaProgram | null, error: error as Error | null };
}

export async function updateProgram(id: string, params: Partial<Pick<AbaProgram, 'name' | 'description' | 'is_active'>>) {
  const { data, error } = await supabase.from('aba_programs').update(params).eq('id', id).select().single();
  return { program: data as AbaProgram | null, error: error as Error | null };
}

export async function deleteProgram(id: string) {
  const { error } = await supabase.from('aba_programs').delete().eq('id', id);
  return { error: error as Error | null };
}

export async function createGoal(programId: string, params: { name: string; target_type?: string; target_value?: string; sort_order?: number }) {
  const { data, error } = await supabase
    .from('aba_goals')
    .insert({
      program_id: programId,
      name: params.name,
      target_type: params.target_type ?? 'contagem',
      target_value: params.target_value ?? null,
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  return { goal: data as AbaGoal | null, error: error as Error | null };
}

export async function updateGoal(id: string, params: Partial<Pick<AbaGoal, 'name' | 'target_type' | 'target_value' | 'sort_order'>>) {
  const { data, error } = await supabase.from('aba_goals').update(params).eq('id', id).select().single();
  return { goal: data as AbaGoal | null, error: error as Error | null };
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('aba_goals').delete().eq('id', id);
  return { error: error as Error | null };
}
