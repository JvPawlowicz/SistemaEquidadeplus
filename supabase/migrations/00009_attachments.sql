-- Anexos (documentos) — paciente, evento, nota, avaliação, chamado, ativo
CREATE TYPE attachment_category AS ENUM (
  'laudo', 'termo', 'relatorio', 'imagem', 'video', 'outros'
);

CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  evaluation_instance_id UUID REFERENCES public.evaluation_instances(id) ON DELETE CASCADE,
  category attachment_category NOT NULL DEFAULT 'outros',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  expires_at DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attachments_at_least_one_ref CHECK (
    (patient_id IS NOT NULL)::int +
    (event_id IS NOT NULL)::int +
    (note_id IS NOT NULL)::int +
    (ticket_id IS NOT NULL)::int +
    (asset_id IS NOT NULL)::int +
    (evaluation_instance_id IS NOT NULL)::int >= 1
  )
);

CREATE INDEX idx_attachments_patient ON public.attachments(patient_id);
CREATE INDEX idx_attachments_event ON public.attachments(event_id);
CREATE INDEX idx_attachments_note ON public.attachments(note_id);
CREATE INDEX idx_attachments_ticket ON public.attachments(ticket_id);
CREATE INDEX idx_attachments_asset ON public.attachments(asset_id);
CREATE INDEX idx_attachments_evaluation ON public.attachments(evaluation_instance_id);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attachments_select" ON public.attachments
  FOR SELECT USING (
    (patient_id IS NOT NULL AND patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    ))
    OR (event_id IS NOT NULL AND event_id IN (
      SELECT id FROM public.events WHERE unit_id IN (SELECT public.get_my_unit_ids())
    ))
    OR (note_id IS NOT NULL AND note_id IN (
      SELECT n.id FROM public.notes n
      JOIN public.events e ON e.id = n.event_id
      WHERE e.unit_id IN (SELECT public.get_my_unit_ids())
    ))
    OR (ticket_id IS NOT NULL AND ticket_id IN (
      SELECT id FROM public.tickets WHERE unit_id IN (SELECT public.get_my_unit_ids())
    ))
    OR (asset_id IS NOT NULL AND asset_id IN (
      SELECT id FROM public.assets WHERE unit_id IN (SELECT public.get_my_unit_ids())
    ))
    OR (evaluation_instance_id IS NOT NULL AND evaluation_instance_id IN (
      SELECT id FROM public.evaluation_instances WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    ))
  );

CREATE POLICY "attachments_insert" ON public.attachments
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "attachments_delete_own" ON public.attachments
  FOR DELETE USING (created_by = auth.uid());

COMMENT ON TABLE public.attachments IS 'Anexos em paciente, evento, nota, avaliação, chamado, ativo.';
