import { supabase } from './supabase';

export interface AbaTemplateGoal {
  id: string;
  template_id: string;
  name: string;
  target_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AbaTemplate {
  id: string;
  unit_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAbaTemplateGoals(templateId: string) {
  const { data, error } = await supabase
    .from('aba_template_goals')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order');
  return { goals: (data ?? []) as AbaTemplateGoal[], error: error as Error | null };
}

export async function createAbaTemplateGoal(templateId: string, params: { name: string; target_type?: string; sort_order?: number }) {
  const { data, error } = await supabase
    .from('aba_template_goals')
    .insert({
      template_id: templateId,
      name: params.name.trim(),
      target_type: params.target_type ?? 'contagem',
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  return { goal: data as AbaTemplateGoal | null, error: error as Error | null };
}

export async function updateAbaTemplateGoal(id: string, params: { name?: string; target_type?: string; sort_order?: number }) {
  const { data, error } = await supabase
    .from('aba_template_goals')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { goal: data as AbaTemplateGoal | null, error: error as Error | null };
}

export async function deleteAbaTemplateGoal(id: string) {
  const { error } = await supabase.from('aba_template_goals').delete().eq('id', id);
  return { error: error as Error | null };
}

export async function fetchAbaTemplatesByUnit(unitId: string) {
  const { data, error } = await supabase
    .from('aba_templates')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  return { templates: (data ?? []) as AbaTemplate[], error: error as Error | null };
}

export async function createAbaTemplate(unitId: string, params: { name: string; description?: string | null }) {
  const { data, error } = await supabase
    .from('aba_templates')
    .insert({
      unit_id: unitId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { template: data as AbaTemplate | null, error: error as Error | null };
}

export async function updateAbaTemplate(id: string, params: { name?: string; description?: string | null }) {
  const { data, error } = await supabase
    .from('aba_templates')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { template: data as AbaTemplate | null, error: error as Error | null };
}

export async function deleteAbaTemplate(id: string) {
  const { error } = await supabase.from('aba_templates').delete().eq('id', id);
  return { error: error as Error | null };
}
