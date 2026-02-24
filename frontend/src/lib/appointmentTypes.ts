import { supabase } from './supabase';
import type { AppointmentType } from '../types';

export async function fetchAppointmentTypesByUnit(unitId: string) {
  const { data, error } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  return { types: (data ?? []) as AppointmentType[], error: error as Error | null };
}

export async function createAppointmentType(unitId: string, name: string) {
  const { data, error } = await supabase
    .from('appointment_types')
    .insert({ unit_id: unitId, name: name.trim() })
    .select()
    .single();
  return { type: data as AppointmentType | null, error: error as Error | null };
}

export async function updateAppointmentType(id: string, name: string) {
  const { data, error } = await supabase
    .from('appointment_types')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  return { type: data as AppointmentType | null, error: error as Error | null };
}

export async function deleteAppointmentType(id: string) {
  const { error } = await supabase.from('appointment_types').delete().eq('id', id);
  return { error: error as Error | null };
}
