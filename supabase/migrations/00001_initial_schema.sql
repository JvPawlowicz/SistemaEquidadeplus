-- EquidadePlus — Schema inicial (Fase 1)
-- Execute no SQL Editor do projeto Supabase ou via Supabase CLI.
-- Fase 1: uma organização implícita (sem tabela organizations).

-- Enum para papéis (conforme blueprint)
CREATE TYPE app_role AS ENUM (
  'admin',
  'coordenador',
  'secretaria',
  'profissional',
  'estagiario',
  'ti'
);

-- Enum para tipo de evento
CREATE TYPE event_type AS ENUM ('atendimento', 'reuniao');

-- Enum para status do evento
CREATE TYPE event_status AS ENUM ('aberto', 'realizado', 'faltou', 'cancelado');

-- Enum para tipo de nota
CREATE TYPE note_type AS ENUM ('evolucao', 'ata');

-- Perfis estendidos (vinculados a auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  council_type TEXT,
  council_number TEXT,
  council_uf TEXT,
  specialties TEXT[] DEFAULT '{}',
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unidades (Fase 1: org implícita)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Salas por unidade
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuário por unidade e papel
CREATE TABLE public.user_units (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, unit_id)
);

-- Convênios (CRUD admin; "Particular" pode ser valor default na UI)
CREATE TABLE public.insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pacientes (prontuário global)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  photo_url TEXT,
  address TEXT,
  insurance_id UUID REFERENCES public.insurances(id) ON DELETE SET NULL,
  summary TEXT,
  alerts TEXT,
  diagnoses TEXT,
  medications TEXT,
  allergies TEXT,
  routine_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paciente habilitado por unidade
CREATE TABLE public.patient_units (
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, unit_id)
);

-- Eventos da agenda (atendimentos e reuniões)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  type event_type NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  responsible_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status event_status NOT NULL DEFAULT 'aberto',
  reopen_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_end_after_start CHECK (end_at > start_at)
);

-- Evoluções e atas (uma por evento)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type note_type NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  finalized_at TIMESTAMPTZ,
  cosign_required BOOLEAN NOT NULL DEFAULT false,
  cosigned_at TIMESTAMPTZ,
  cosigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notes_one_per_event UNIQUE (event_id)
);

-- Índices para consultas comuns
CREATE INDEX idx_events_unit_start ON public.events(unit_id, start_at);
CREATE INDEX idx_events_responsible ON public.events(responsible_user_id, start_at);
CREATE INDEX idx_events_status ON public.events(unit_id, status);
CREATE INDEX idx_patient_units_unit ON public.patient_units(unit_id);
CREATE INDEX idx_user_units_user ON public.user_units(user_id);
CREATE INDEX idx_notes_event ON public.notes(event_id);

-- Trigger para updated_at em profiles, units, rooms, patients, events, notes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Criar perfil automaticamente ao inserir usuário em auth.users (via trigger no Supabase)
-- Opção: usar Database Webhooks ou Edge Function. Por simplicidade, o app pode criar o profile no primeiro acesso.
-- Inserção manual no profile pode ser feita no signup ou no primeiro login.

COMMENT ON TABLE public.profiles IS 'Perfis estendidos dos usuários (auth.users).';
COMMENT ON TABLE public.units IS 'Unidades da clínica. Fase 1: uma organização implícita.';
COMMENT ON TABLE public.user_units IS 'Papel do usuário em cada unidade.';
COMMENT ON TABLE public.events IS 'Eventos da agenda: atendimentos e reuniões.';
COMMENT ON TABLE public.notes IS 'Evolução (atendimento) ou Ata (reunião) por evento.';
