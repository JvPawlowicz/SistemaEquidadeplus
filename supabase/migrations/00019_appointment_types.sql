CREATE TABLE public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_types_unit ON public.appointment_types(unit_id);

CREATE TRIGGER appointment_types_updated_at BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_types_select" ON public.appointment_types
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "appointment_types_insert" ON public.appointment_types
  FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "appointment_types_update" ON public.appointment_types
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "appointment_types_delete" ON public.appointment_types
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

ALTER TABLE public.events ADD COLUMN appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE SET NULL;

CREATE INDEX idx_events_appointment_type ON public.events(appointment_type_id);
