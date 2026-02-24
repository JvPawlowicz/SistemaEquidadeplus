import { supabase } from './supabase';
import type { Patient, Insurance, PatientRelative } from '../types';

export interface PatientWithInsurance extends Patient {
  insurance?: Insurance | null;
}

export interface TimelineItem {
  id: string;
  type: 'event' | 'note';
  event_id: string;
  start_at: string;
  end_at?: string;
  title: string;
  status: string;
  note_finalized: boolean | null;
}

export async function fetchPatientsInUnitWithInsurance(unitId: string) {
  const { data: pu } = await supabase
    .from('patient_units')
    .select('patient_id')
    .eq('unit_id', unitId);
  const ids = (pu ?? []).map((p: { patient_id: string }) => p.patient_id);
  if (ids.length === 0) return { patients: [] as PatientWithInsurance[] };
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*, insurance:insurances(*)')
    .in('id', ids)
    .order('full_name');
  if (error) return { patients: [] as PatientWithInsurance[], error };
  const list = (patients ?? []).map((p: Patient & { insurance?: unknown }) => ({
    ...p,
    insurance: Array.isArray(p.insurance) ? null : p.insurance ?? null,
  })) as PatientWithInsurance[];
  return { patients: list };
}

export async function fetchPatient(id: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, insurance:insurances(*)')
    .eq('id', id)
    .single();
  if (error) return { patient: null, error };
  const p = data as Patient & { insurance?: unknown };
  const raw = p.insurance;
  const insurance: Insurance | null =
    raw && typeof raw === 'object' && !Array.isArray(raw) && 'id' in raw && 'name' in raw
      ? (raw as Insurance)
      : null;
  const patient: PatientWithInsurance = {
    ...p,
    insurance,
  };
  return { patient };
}

export async function fetchPatientTimeline(patientId: string): Promise<TimelineItem[]> {
  const { data: events } = await supabase
    .from('events')
    .select('id, start_at, end_at, type, title, status')
    .eq('patient_id', patientId)
    .order('start_at', { ascending: false });
  if (!events?.length) return [];
  const eventIds = events.map((e: { id: string }) => e.id);
  const { data: notes } = await supabase
    .from('notes')
    .select('event_id, finalized_at')
    .in('event_id', eventIds);
  const noteByEvent = new Map(
    (notes ?? []).map((n: { event_id: string; finalized_at: string | null }) => [n.event_id, !!n.finalized_at])
  );
  return events.map((e: { id: string; start_at: string; end_at: string; type: string; title: string | null; status: string }) => ({
    id: e.id,
    type: 'event' as const,
    event_id: e.id,
    start_at: e.start_at,
    end_at: e.end_at,
    title: e.type === 'atendimento' ? 'Atendimento' : (e.title ?? 'Reunião'),
    status: e.status,
    note_finalized: noteByEvent.get(e.id) ?? null,
  }));
}

export async function fetchPatientRelatives(patientId: string) {
  const { data, error } = await supabase
    .from('patient_relatives')
    .select('*')
    .eq('patient_id', patientId)
    .order('name');
  return { relatives: (data ?? []) as PatientRelative[], error };
}

/** Mapa patient_id -> nome do primeiro responsável principal (is_primary_contact ou is_legal_guardian). */
export async function fetchPrimaryContactsByPatientIds(
  patientIds: string[]
): Promise<Record<string, string>> {
  if (patientIds.length === 0) return {};
  const { data } = await supabase
    .from('patient_relatives')
    .select('patient_id, name, is_primary_contact, is_legal_guardian')
    .in('patient_id', patientIds)
    .or('is_primary_contact.eq.true,is_legal_guardian.eq.true')
    .order('is_primary_contact', { ascending: false })
    .order('name');
  const map: Record<string, string> = {};
  for (const r of data ?? []) {
    const row = r as { patient_id: string; name: string };
    if (!map[row.patient_id]) map[row.patient_id] = row.name;
  }
  return map;
}

export type CreateRelativePayload = {
  name: string;
  relationship?: string | null;
  is_legal_guardian?: boolean;
  is_primary_contact?: boolean;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
};

export async function createRelative(patientId: string, payload: CreateRelativePayload) {
  const { data, error } = await supabase
    .from('patient_relatives')
    .insert({
      patient_id: patientId,
      name: payload.name.trim(),
      relationship: payload.relationship?.trim() || null,
      is_legal_guardian: payload.is_legal_guardian ?? false,
      is_primary_contact: payload.is_primary_contact ?? false,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      document: payload.document?.trim() || null,
      address: payload.address?.trim() || null,
      notes: payload.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { relative: data as PatientRelative | null, error };
}

export async function updateRelative(
  id: string,
  payload: Partial<Omit<PatientRelative, 'id' | 'patient_id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('patient_relatives')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { relative: data as PatientRelative | null, error };
}

export async function deleteRelative(id: string) {
  const { error } = await supabase.from('patient_relatives').delete().eq('id', id);
  return { error };
}

export async function fetchInsurances() {
  const { data, error } = await supabase
    .from('insurances')
    .select('*')
    .order('name');
  return { insurances: (data ?? []) as Insurance[], error };
}

export async function createPatient(
  payload: Omit<Patient, 'id' | 'created_at' | 'updated_at'>,
  unitId: string
) {
  const { data: patient, error: err1 } = await supabase
    .from('patients')
    .insert({
      ...payload,
      tags: payload.tags ?? [],
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (err1 || !patient) return { patientId: null, error: err1 };
  const { error: err2 } = await supabase
    .from('patient_units')
    .insert({ patient_id: patient.id, unit_id: unitId });
  if (err2) return { patientId: patient.id, error: err2 };
  return { patientId: patient.id, error: null };
}

export async function updatePatient(
  id: string,
  payload: Partial<Omit<Patient, 'id' | 'created_at'>>
) {
  const { error } = await supabase
    .from('patients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

export async function addPatientToUnit(patientId: string, unitId: string) {
  const { error } = await supabase
    .from('patient_units')
    .upsert({ patient_id: patientId, unit_id: unitId }, { onConflict: 'patient_id,unit_id' });
  return { error };
}

export async function removePatientFromUnit(patientId: string, unitId: string) {
  const { error } = await supabase
    .from('patient_units')
    .delete()
    .eq('patient_id', patientId)
    .eq('unit_id', unitId);
  return { error };
}

/** Unidades em que o paciente está habilitado (para admin/coordenador). */
export async function fetchPatientUnits(patientId: string) {
  const { data, error } = await supabase
    .from('patient_units')
    .select('unit_id')
    .eq('patient_id', patientId);
  if (error) return { unitIds: [] as string[], error };
  const unitIds = (data ?? []).map((r: { unit_id: string }) => r.unit_id);
  return { unitIds, error: null };
}
