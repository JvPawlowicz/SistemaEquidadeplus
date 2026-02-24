/**
 * Tipos TypeScript alinhados ao schema do Supabase.
 * Atualizar conforme migrations em supabase/migrations/.
 */

export type AppRole =
  | 'admin'
  | 'coordenador'
  | 'secretaria'
  | 'profissional'
  | 'estagiario'
  | 'ti';

export type EventType = 'atendimento' | 'reuniao';

export type EventStatus = 'aberto' | 'realizado' | 'faltou' | 'cancelado';

export type NoteType = 'evolucao' | 'ata';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  bio?: string | null;
  council_type: string | null;
  council_number: string | null;
  council_uf: string | null;
  specialties: string[] | null;
  is_blocked: boolean;
  default_unit_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  timezone: string;
  organization_id?: string | null;
  address?: string | null;
  cep?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientTagDefinition {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  unit_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserUnit {
  user_id: string;
  unit_id: string;
  role: AppRole;
  created_at: string;
}

export interface Insurance {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
  photo_url: string | null;
  address: string | null;
  document?: string | null;
  insurance_id: string | null;
  tags?: string[] | null;
  summary: string | null;
  alerts: string | null;
  diagnoses: string | null;
  medications: string | null;
  allergies: string | null;
  routine_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientUnit {
  patient_id: string;
  unit_id: string;
  created_at: string;
}

export interface PatientRelative {
  id: string;
  patient_id: string;
  name: string;
  relationship: string | null;
  is_legal_guardian: boolean;
  is_primary_contact: boolean;
  phone: string | null;
  email: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentType {
  id: string;
  unit_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  unit_id: string;
  room_id: string | null;
  type: EventType;
  appointment_type_id?: string | null;
  patient_id: string | null;
  responsible_user_id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  status: EventStatus;
  reopen_reason: string | null;
  color_hex?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  event_id: string;
  type: NoteType;
  content: string;
  author_id: string;
  finalized_at: string | null;
  cosign_required: boolean;
  cosigned_at: string | null;
  cosigned_by: string | null;
  addendum?: string | null;
  tags?: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos com relações (para joins no frontend)
export interface EventWithRelations extends Event {
  room?: Room | null;
  patient?: Patient | null;
  note?: Note | null;
}

export type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';

export interface TicketCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface NoteTemplate {
  id: string;
  unit_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  unit_id: string | null;
  name: string;
  asset_type: string | null;
  status: string;
  room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  unit_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  asset_id: string | null;
  room_id: string | null;
  patient_id: string | null;
  author_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export type EvaluationType = 'anamnese' | 'consentimento' | 'avaliacao_interna';

export interface EvaluationTemplate {
  id: string;
  unit_id: string;
  name: string;
  type: EvaluationType;
  schema_json: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface EvaluationInstance {
  id: string;
  patient_id: string;
  template_id: string;
  data_json: Record<string, unknown>;
  signed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'ativa' | 'pausada' | 'concluida';

export interface TreatmentCycle {
  id: string;
  patient_id: string;
  name: string;
  months: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TreatmentGoal {
  id: string;
  cycle_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: GoalStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AttachmentCategory = 'laudo' | 'termo' | 'relatorio' | 'imagem' | 'video' | 'outros';

export interface Attachment {
  id: string;
  patient_id: string | null;
  event_id: string | null;
  note_id: string | null;
  ticket_id: string | null;
  asset_id: string | null;
  evaluation_instance_id: string | null;
  category: AttachmentCategory;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface AbaProgram {
  id: string;
  patient_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AbaGoal {
  id: string;
  program_id: string;
  name: string;
  target_type: string;
  target_value: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
