import { supabase } from './supabase';
import type { EvaluationTemplate, EvaluationInstance, EvaluationType } from '../types';

export async function fetchTemplatesByUnit(unitId: string) {
  const { data, error } = await supabase
    .from('evaluation_templates')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  return { templates: (data ?? []) as EvaluationTemplate[], error: error as Error | null };
}

export async function fetchInstanceById(id: string) {
  const { data, error } = await supabase
    .from('evaluation_instances')
    .select('*, template:evaluation_templates(id, name, type, schema_json)')
    .eq('id', id)
    .single();
  if (error) return { instance: null, error: error as Error };
  const row = data as EvaluationInstance & { template?: { id: string; name: string; type: string; schema_json: unknown } | null };
  const template = Array.isArray(row.template) ? null : row.template ?? null;
  return { instance: { ...row, template }, error: null };
}

export async function fetchInstancesByPatient(patientId: string) {
  const { data, error } = await supabase
    .from('evaluation_instances')
    .select('*, template:evaluation_templates(id, name, type)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) return { instances: [], error: error as Error };
  const list = (data ?? []).map((row: EvaluationInstance & { template?: unknown }) => ({
    ...row,
    template: Array.isArray(row.template) ? null : row.template ?? null,
  }));
  return { instances: list, error: null };
}

export async function createTemplate(unitId: string, params: {
  name: string;
  type: EvaluationType;
  schema_json?: unknown;
}) {
  const { data, error } = await supabase
    .from('evaluation_templates')
    .insert({
      unit_id: unitId,
      name: params.name,
      type: params.type,
      schema_json: params.schema_json ?? [],
    })
    .select()
    .single();
  return { template: data as EvaluationTemplate | null, error: error as Error | null };
}

export async function updateTemplate(id: string, params: Partial<Pick<EvaluationTemplate, 'name' | 'type' | 'schema_json'>>) {
  const { data, error } = await supabase
    .from('evaluation_templates')
    .update(params)
    .eq('id', id)
    .select()
    .single();
  return { template: data as EvaluationTemplate | null, error: error as Error | null };
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('evaluation_templates').delete().eq('id', id);
  return { error: error as Error | null };
}

/** Clona um template como nova versão (mesmo nome, tipo e schema; version + 1). */
export async function cloneTemplateAsNewVersion(templateId: string) {
  const { data: existing, error: fetchErr } = await supabase
    .from('evaluation_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  if (fetchErr || !existing) return { template: null, error: (fetchErr as Error) ?? new Error('Template não encontrado') };
  const t = existing as EvaluationTemplate;
  const { data: created, error: insertErr } = await supabase
    .from('evaluation_templates')
    .insert({
      unit_id: t.unit_id,
      name: t.name,
      type: t.type,
      schema_json: t.schema_json ?? [],
      version: (t.version ?? 1) + 1,
    })
    .select()
    .single();
  return { template: created as EvaluationTemplate | null, error: insertErr as Error | null };
}

export async function createInstance(patientId: string, templateId: string, createdBy: string, dataJson?: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('evaluation_instances')
    .insert({
      patient_id: patientId,
      template_id: templateId,
      data_json: dataJson ?? {},
      created_by: createdBy,
    })
    .select()
    .single();
  return { instance: data as EvaluationInstance | null, error: error as Error | null };
}

export async function updateInstance(id: string, dataJson: Record<string, unknown>, signedAt?: string | null) {
  const payload: Record<string, unknown> = { data_json: dataJson };
  if (signedAt !== undefined) payload.signed_at = signedAt;
  const { data, error } = await supabase
    .from('evaluation_instances')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return { instance: data as EvaluationInstance | null, error: error as Error | null };
}

export async function signInstance(id: string) {
  return updateInstance(id, {}, new Date().toISOString());
}
