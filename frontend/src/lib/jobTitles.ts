import { supabase } from './supabase';

export interface ConfigJobTitle {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchJobTitles() {
  const { data, error } = await supabase
    .from('config_job_titles')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name');
  return { list: (data ?? []) as ConfigJobTitle[], error: error as Error | null };
}

export async function createJobTitle(name: string) {
  const { data, error } = await supabase
    .from('config_job_titles')
    .insert({ name: name.trim() })
    .select()
    .single();
  return { item: data as ConfigJobTitle | null, error: error as Error | null };
}

export async function updateJobTitle(id: string, name: string) {
  const { data, error } = await supabase
    .from('config_job_titles')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { item: data as ConfigJobTitle | null, error: error as Error | null };
}

export async function deleteJobTitle(id: string) {
  const { error } = await supabase.from('config_job_titles').delete().eq('id', id);
  return { error: error as Error | null };
}
