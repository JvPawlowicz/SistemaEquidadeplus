-- Metas (goals) por template ABA: ao criar programa a partir do template, as metas são copiadas
CREATE TABLE public.aba_template_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.aba_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'contagem',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aba_template_goals_template ON public.aba_template_goals(template_id);

CREATE TRIGGER aba_template_goals_updated_at BEFORE UPDATE ON public.aba_template_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.aba_template_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aba_template_goals_select" ON public.aba_template_goals
  FOR SELECT USING (template_id IN (SELECT id FROM public.aba_templates WHERE unit_id IN (SELECT public.get_my_unit_ids())));

CREATE POLICY "aba_template_goals_insert" ON public.aba_template_goals
  FOR INSERT WITH CHECK (template_id IN (SELECT id FROM public.aba_templates WHERE unit_id IN (SELECT public.get_my_unit_ids())));

CREATE POLICY "aba_template_goals_update" ON public.aba_template_goals
  FOR UPDATE USING (template_id IN (SELECT id FROM public.aba_templates WHERE unit_id IN (SELECT public.get_my_unit_ids())));

CREATE POLICY "aba_template_goals_delete" ON public.aba_template_goals
  FOR DELETE USING (template_id IN (SELECT id FROM public.aba_templates WHERE unit_id IN (SELECT public.get_my_unit_ids())));

COMMENT ON TABLE public.aba_template_goals IS 'Metas do template ABA; copiadas ao criar programa a partir do template.';
