-- Templates de texto (push) para evolução/ata (blueprint 6.10)
CREATE TABLE public.note_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_templates_unit ON public.note_templates(unit_id);

CREATE TRIGGER note_templates_updated_at BEFORE UPDATE ON public.note_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.note_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_templates_select" ON public.note_templates
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "note_templates_insert" ON public.note_templates
  FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "note_templates_update" ON public.note_templates
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "note_templates_delete" ON public.note_templates
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

COMMENT ON TABLE public.note_templates IS 'Templates de texto para evolução/ata (push no editor).';
