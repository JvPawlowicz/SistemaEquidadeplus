import { supabase } from './supabase';
import type { NoteTemplate } from '../types';

export async function fetchNoteTemplates(unitId: string) {
  const { data, error } = await supabase
    .from('note_templates')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  return { templates: (data ?? []) as NoteTemplate[], error: error as Error | null };
}

export async function createNoteTemplate(unitId: string, name: string, content: string) {
  const { data, error } = await supabase
    .from('note_templates')
    .insert({ unit_id: unitId, name: name.trim(), content: content || '' })
    .select()
    .single();
  return { template: data as NoteTemplate | null, error: error as Error | null };
}

export async function updateNoteTemplate(id: string, name: string, content: string) {
  const { data, error } = await supabase
    .from('note_templates')
    .update({ name: name.trim(), content: content || '' })
    .eq('id', id)
    .select()
    .single();
  return { template: data as NoteTemplate | null, error: error as Error | null };
}

export async function deleteNoteTemplate(id: string) {
  const { error } = await supabase.from('note_templates').delete().eq('id', id);
  return { error: error as Error | null };
}
