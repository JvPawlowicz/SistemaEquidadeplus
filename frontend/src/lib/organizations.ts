import { supabase } from './supabase';
import type { Organization } from '../types';

export async function fetchOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');
  return { organizations: (data ?? []) as Organization[], error: error as Error | null };
}

export async function createOrganization(name: string) {
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name: name.trim() })
    .select()
    .single();
  return { organization: data as Organization | null, error: error as Error | null };
}

export async function updateOrganization(id: string, name: string) {
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  return { organization: data as Organization | null, error: error as Error | null };
}

export async function deleteOrganization(id: string) {
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  return { error: error as Error | null };
}
