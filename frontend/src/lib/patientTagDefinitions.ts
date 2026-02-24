import { supabase } from './supabase';
import type { PatientTagDefinition } from '../types';

export async function fetchPatientTagDefinitions() {
  const { data, error } = await supabase
    .from('patient_tag_definitions')
    .select('*')
    .order('name');
  return { definitions: (data ?? []) as PatientTagDefinition[], error };
}

export async function createPatientTagDefinition(name: string, color_hex: string) {
  const { data, error } = await supabase
    .from('patient_tag_definitions')
    .insert({ name: name.trim(), color_hex: color_hex || '#6b7280', updated_at: new Date().toISOString() })
    .select()
    .single();
  return { definition: data as PatientTagDefinition | null, error };
}

export async function updatePatientTagDefinition(id: string, payload: { name?: string; color_hex?: string }) {
  const { data, error } = await supabase
    .from('patient_tag_definitions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { definition: data as PatientTagDefinition | null, error };
}

export async function deletePatientTagDefinition(id: string) {
  const { error } = await supabase.from('patient_tag_definitions').delete().eq('id', id);
  return { error };
}
