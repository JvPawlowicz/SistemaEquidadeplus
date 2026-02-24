import { supabase } from './supabase';

export interface ConfigSpecialty {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchSpecialties() {
  const { data, error } = await supabase
    .from('config_specialties')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name');
  return { list: (data ?? []) as ConfigSpecialty[], error: error as Error | null };
}

export async function createSpecialty(name: string) {
  const { data, error } = await supabase
    .from('config_specialties')
    .insert({ name: name.trim() })
    .select()
    .single();
  return { item: data as ConfigSpecialty | null, error: error as Error | null };
}

export async function updateSpecialty(id: string, name: string) {
  const { data, error } = await supabase
    .from('config_specialties')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { item: data as ConfigSpecialty | null, error: error as Error | null };
}

export async function deleteSpecialty(id: string) {
  const { error } = await supabase.from('config_specialties').delete().eq('id', id);
  return { error: error as Error | null };
}
