-- Familiares/Responsáveis do paciente (conforme blueprint)
CREATE TABLE public.patient_relatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  is_legal_guardian BOOLEAN NOT NULL DEFAULT false,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  email TEXT,
  document TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_relatives_patient ON public.patient_relatives(patient_id);

CREATE TRIGGER patient_relatives_updated_at BEFORE UPDATE ON public.patient_relatives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.patient_relatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_relatives_select" ON public.patient_relatives
  FOR SELECT USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "patient_relatives_insert" ON public.patient_relatives
  FOR INSERT TO authenticated WITH CHECK (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "patient_relatives_update" ON public.patient_relatives
  FOR UPDATE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "patient_relatives_delete" ON public.patient_relatives
  FOR DELETE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

COMMENT ON TABLE public.patient_relatives IS 'Familiares/responsáveis do paciente.';
