-- Aplicar migrations 00018, 00019 e 00020 no Supabase (SQL Editor).
-- Execute este arquivo no Supabase Dashboard: SQL Editor > New query > colar e Run.

-- ========== 00018_aba_session_data ==========
CREATE TABLE IF NOT EXISTS public.aba_session_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  aba_goal_id UUID NOT NULL REFERENCES public.aba_goals(id) ON DELETE CASCADE,
  value_numeric NUMERIC,
  value_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(note_id, aba_goal_id)
);
CREATE INDEX IF NOT EXISTS idx_aba_session_data_note ON public.aba_session_data(note_id);
CREATE INDEX IF NOT EXISTS idx_aba_session_data_goal ON public.aba_session_data(aba_goal_id);
DROP TRIGGER IF EXISTS aba_session_data_updated_at ON public.aba_session_data;
CREATE TRIGGER aba_session_data_updated_at BEFORE UPDATE ON public.aba_session_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.aba_session_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aba_session_data' AND policyname = 'aba_session_data_select') THEN
    CREATE POLICY "aba_session_data_select" ON public.aba_session_data FOR SELECT USING (
      note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aba_session_data' AND policyname = 'aba_session_data_insert') THEN
    CREATE POLICY "aba_session_data_insert" ON public.aba_session_data FOR INSERT WITH CHECK (
      note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aba_session_data' AND policyname = 'aba_session_data_update') THEN
    CREATE POLICY "aba_session_data_update" ON public.aba_session_data FOR UPDATE USING (
      note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aba_session_data' AND policyname = 'aba_session_data_delete') THEN
    CREATE POLICY "aba_session_data_delete" ON public.aba_session_data FOR DELETE USING (
      note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
    );
  END IF;
END $$;

-- ========== 00019_appointment_types ==========
CREATE TABLE IF NOT EXISTS public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointment_types_unit ON public.appointment_types(unit_id);
DROP TRIGGER IF EXISTS appointment_types_updated_at ON public.appointment_types;
CREATE TRIGGER appointment_types_updated_at BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_types' AND policyname = 'appointment_types_select') THEN
    CREATE POLICY "appointment_types_select" ON public.appointment_types FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_types' AND policyname = 'appointment_types_insert') THEN
    CREATE POLICY "appointment_types_insert" ON public.appointment_types FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_types' AND policyname = 'appointment_types_update') THEN
    CREATE POLICY "appointment_types_update" ON public.appointment_types FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_types' AND policyname = 'appointment_types_delete') THEN
    CREATE POLICY "appointment_types_delete" ON public.appointment_types FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));
  END IF;
END $$;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_appointment_type ON public.events(appointment_type_id);

-- ========== 00020_organizations ==========
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organizations_select') THEN
    CREATE POLICY "organizations_select" ON public.organizations FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organizations_insert') THEN
    CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organizations_update') THEN
    CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organizations_delete') THEN
    CREATE POLICY "organizations_delete" ON public.organizations FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_units_organization ON public.units(organization_id);
