-- Metas do plano de atendimento trabalhadas em cada evolução (sessão)
CREATE TABLE public.note_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.treatment_goals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (note_id, goal_id)
);

CREATE INDEX idx_note_goals_note ON public.note_goals(note_id);
CREATE INDEX idx_note_goals_goal ON public.note_goals(goal_id);

ALTER TABLE public.note_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_goals_select" ON public.note_goals
  FOR SELECT USING (
    note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
  );

CREATE POLICY "note_goals_insert" ON public.note_goals
  FOR INSERT WITH CHECK (
    note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
  );

CREATE POLICY "note_goals_delete" ON public.note_goals
  FOR DELETE USING (
    note_id IN (SELECT n.id FROM public.notes n JOIN public.events e ON e.id = n.event_id WHERE e.unit_id IN (SELECT public.get_my_unit_ids()))
  );

COMMENT ON TABLE public.note_goals IS 'Metas do plano de atendimento marcadas como trabalhadas nesta evolução/sessão.';
