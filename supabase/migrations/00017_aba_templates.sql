-- Templates ABA para criar programa a partir de template (conforme blueprint)
CREATE TABLE public.aba_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aba_templates_unit ON public.aba_templates(unit_id);

CREATE TRIGGER aba_templates_updated_at BEFORE UPDATE ON public.aba_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.aba_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aba_templates_select" ON public.aba_templates
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "aba_templates_insert" ON public.aba_templates
  FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "aba_templates_update" ON public.aba_templates
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "aba_templates_delete" ON public.aba_templates
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

COMMENT ON TABLE public.aba_templates IS 'Templates de programas ABA para criar programa a partir de template.';
