import { supabase } from './supabase';
import type { Attachment, AttachmentCategory } from '../types';

const BUCKET = 'attachments';

export async function fetchAttachmentsByPatient(patientId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return { attachments: (data ?? []) as Attachment[], error: error as Error | null };
}

export async function fetchAttachmentsByTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  return { attachments: (data ?? []) as Attachment[], error: error as Error | null };
}

export async function fetchAttachmentsByNote(noteId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });
  return { attachments: (data ?? []) as Attachment[], error: error as Error | null };
}

export async function fetchAttachmentsByEvaluationInstance(instanceId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('evaluation_instance_id', instanceId)
    .order('created_at', { ascending: false });
  return { attachments: (data ?? []) as Attachment[], error: error as Error | null };
}

export async function fetchAttachmentsByAsset(assetId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });
  return { attachments: (data ?? []) as Attachment[], error: error as Error | null };
}

export async function uploadAttachment(
  file: File,
  opts: {
    patient_id?: string;
    event_id?: string;
    note_id?: string;
    ticket_id?: string;
    asset_id?: string;
    evaluation_instance_id?: string;
    category?: AttachmentCategory;
    created_by: string;
  }
) {
  const atLeastOne =
    opts.patient_id ?? opts.event_id ?? opts.note_id ?? opts.ticket_id ?? opts.asset_id ?? opts.evaluation_instance_id;
  if (!atLeastOne) return { attachment: null, error: new Error('É necessário um vínculo (paciente, evento, etc.).') };

  const path = `${opts.created_by}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) return { attachment: null, error: uploadError as Error };

  const filePath = path;

  const { data: row, error: insertError } = await supabase
    .from('attachments')
    .insert({
      patient_id: opts.patient_id ?? null,
      event_id: opts.event_id ?? null,
      note_id: opts.note_id ?? null,
      ticket_id: opts.ticket_id ?? null,
      asset_id: opts.asset_id ?? null,
      evaluation_instance_id: opts.evaluation_instance_id ?? null,
      category: opts.category ?? 'outros',
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || null,
      created_by: opts.created_by,
    })
    .select()
    .single();
  if (insertError) return { attachment: null, error: insertError as Error };
  return { attachment: row as Attachment, error: null };
}

export async function deleteAttachment(id: string, filePath: string) {
  await supabase.storage.from(BUCKET).remove([filePath]);
  const { error } = await supabase.from('attachments').delete().eq('id', id);
  return { error: error as Error | null };
}

export function getAttachmentUrl(filePath: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/** Anexos com validade (expires_at) vencidos ou a vencer em 30 dias, para pacientes da unidade */
export async function fetchExpiringAttachmentsByUnit(unitId: string) {
  const { data: pu } = await supabase
    .from('patient_units')
    .select('patient_id')
    .eq('unit_id', unitId);
  const patientIds = (pu ?? []).map((p: { patient_id: string }) => p.patient_id);
  if (patientIds.length === 0) return { attachments: [] as Attachment[], error: null };
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .in('patient_id', patientIds)
    .not('expires_at', 'is', null)
    .lte('expires_at', in30.toISOString())
    .order('expires_at', { ascending: true });
  return { attachments: (data ?? []) as Attachment[], error: error as Error | null };
}
