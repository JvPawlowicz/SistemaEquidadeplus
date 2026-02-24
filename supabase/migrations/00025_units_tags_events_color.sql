-- Garante coluna tags em patients (evita erro de schema cache)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Definições de tags de paciente (admin CRUD, cada uma com cor)
CREATE TABLE IF NOT EXISTS public.patient_tag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER patient_tag_definitions_updated_at
  BEFORE UPDATE ON public.patient_tag_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.patient_tag_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient_tag_definitions_select" ON public.patient_tag_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "patient_tag_definitions_insert" ON public.patient_tag_definitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patient_tag_definitions_update" ON public.patient_tag_definitions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "patient_tag_definitions_delete" ON public.patient_tag_definitions FOR DELETE TO authenticated USING (true);

-- Associação paciente <-> tag (muitos para muitos)
CREATE TABLE IF NOT EXISTS public.patient_tag_assignments (
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.patient_tag_definitions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, tag_id)
);

ALTER TABLE public.patient_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient_tag_assignments_select" ON public.patient_tag_assignments
  FOR SELECT TO authenticated USING (
    patient_id IN (SELECT patient_id FROM public.patient_units WHERE unit_id IN (SELECT public.get_my_unit_ids()))
  );
CREATE POLICY "patient_tag_assignments_insert" ON public.patient_tag_assignments
  FOR INSERT TO authenticated WITH CHECK (
    patient_id IN (SELECT patient_id FROM public.patient_units WHERE unit_id IN (SELECT public.get_my_unit_ids()))
  );
CREATE POLICY "patient_tag_assignments_delete" ON public.patient_tag_assignments
  FOR DELETE TO authenticated USING (
    patient_id IN (SELECT patient_id FROM public.patient_units WHERE unit_id IN (SELECT public.get_my_unit_ids()))
  );

-- Unidades: dados completos (endereço, CNPJ, etc.)
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
COMMENT ON COLUMN public.units.address IS 'Endereço da unidade';
COMMENT ON COLUMN public.units.cnpj IS 'CNPJ da unidade';
COMMENT ON COLUMN public.units.is_active IS 'Unidade ativa (oculta se false)';

-- Cor por evento na agenda (ex.: cor aleatória ou definida)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS color_hex TEXT;
COMMENT ON COLUMN public.events.color_hex IS 'Cor do evento na agenda (ex.: #3b82f6)';
