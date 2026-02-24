-- Coleta ABA por sessão (evolução): um valor por meta por nota
CREATE TABLE public.aba_session_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  aba_goal_id UUID NOT NULL REFERENCES public.aba_goals(id) ON DELETE CASCADE,
  value_numeric NUMERIC,
  value_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(note_id, aba_goal_id)
);

CREATE INDEX idx_aba_session_data_note ON public.aba_session_data(note_id);
CREATE INDEX idx_aba_session_data_goal ON public.aba_session_data(aba_goal_id);

CREATE TRIGGER aba_session_data_updated_at BEFORE UPDATE ON public.aba_session_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.aba_session_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aba_session_data_select" ON public.aba_session_data
  FOR SELECT USING (
    note_id IN (
      SELECT n.id FROM public.notes n
      JOIN public.events e ON e.id = n.event_id
      WHERE e.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "aba_session_data_insert" ON public.aba_session_data
  FOR INSERT WITH CHECK (
    note_id IN (
      SELECT n.id FROM public.notes n
      JOIN public.events e ON e.id = n.event_id
      WHERE e.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "aba_session_data_update" ON public.aba_session_data
  FOR UPDATE USING (
    note_id IN (
      SELECT n.id FROM public.notes n
      JOIN public.events e ON e.id = n.event_id
      WHERE e.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "aba_session_data_delete" ON public.aba_session_data
  FOR DELETE USING (
    note_id IN (
      SELECT n.id FROM public.notes n
      JOIN public.events e ON e.id = n.event_id
      WHERE e.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

COMMENT ON TABLE public.aba_session_data IS 'Dados de coleta ABA por sessão (evolução): contagem, escala ou sim-não por meta.';
