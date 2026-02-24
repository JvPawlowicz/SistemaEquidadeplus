-- ABA (opcional): programas e metas por paciente
CREATE TABLE public.aba_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aba_programs_patient ON public.aba_programs(patient_id);

CREATE TRIGGER aba_programs_updated_at BEFORE UPDATE ON public.aba_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.aba_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aba_programs_select" ON public.aba_programs
  FOR SELECT USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "aba_programs_insert" ON public.aba_programs
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "aba_programs_update" ON public.aba_programs
  FOR UPDATE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "aba_programs_delete" ON public.aba_programs
  FOR DELETE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE TABLE public.aba_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.aba_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'contagem',
  target_value TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aba_goals_program ON public.aba_goals(program_id);

CREATE TRIGGER aba_goals_updated_at BEFORE UPDATE ON public.aba_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.aba_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aba_goals_select" ON public.aba_goals
  FOR SELECT USING (
    program_id IN (
      SELECT id FROM public.aba_programs
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

CREATE POLICY "aba_goals_insert" ON public.aba_goals
  FOR INSERT WITH CHECK (
    program_id IN (
      SELECT id FROM public.aba_programs
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

CREATE POLICY "aba_goals_update" ON public.aba_goals
  FOR UPDATE USING (
    program_id IN (
      SELECT id FROM public.aba_programs
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

CREATE POLICY "aba_goals_delete" ON public.aba_goals
  FOR DELETE USING (
    program_id IN (
      SELECT id FROM public.aba_programs
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

COMMENT ON TABLE public.aba_programs IS 'Programas ABA por paciente.';
COMMENT ON TABLE public.aba_goals IS 'Metas/objetivos por programa ABA.';
