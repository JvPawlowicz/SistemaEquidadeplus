-- Plano de Atendimento (ciclos e metas) e Avaliações (templates e instâncias)

-- Tipos de avaliação
CREATE TYPE evaluation_type AS ENUM ('anamnese', 'consentimento', 'avaliacao_interna');

-- Templates de avaliação (admin)
CREATE TABLE public.evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type evaluation_type NOT NULL DEFAULT 'avaliacao_interna',
  schema_json JSONB NOT NULL DEFAULT '[]',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluation_templates_unit ON public.evaluation_templates(unit_id);

CREATE TRIGGER evaluation_templates_updated_at BEFORE UPDATE ON public.evaluation_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluation_templates_select" ON public.evaluation_templates
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "evaluation_templates_insert" ON public.evaluation_templates
  FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "evaluation_templates_update" ON public.evaluation_templates
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "evaluation_templates_delete" ON public.evaluation_templates
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- Instâncias de avaliação por paciente
CREATE TABLE public.evaluation_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.evaluation_templates(id) ON DELETE RESTRICT,
  data_json JSONB NOT NULL DEFAULT '{}',
  signed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluation_instances_patient ON public.evaluation_instances(patient_id);
CREATE INDEX idx_evaluation_instances_template ON public.evaluation_instances(template_id);

CREATE TRIGGER evaluation_instances_updated_at BEFORE UPDATE ON public.evaluation_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.evaluation_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluation_instances_select" ON public.evaluation_instances
  FOR SELECT USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "evaluation_instances_insert" ON public.evaluation_instances
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "evaluation_instances_update" ON public.evaluation_instances
  FOR UPDATE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

-- Plano de Atendimento: ciclos
CREATE TABLE public.treatment_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  months INT NOT NULL DEFAULT 6,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT treatment_cycles_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_treatment_cycles_patient ON public.treatment_cycles(patient_id);

CREATE TRIGGER treatment_cycles_updated_at BEFORE UPDATE ON public.treatment_cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.treatment_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatment_cycles_select" ON public.treatment_cycles
  FOR SELECT USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "treatment_cycles_insert" ON public.treatment_cycles
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "treatment_cycles_update" ON public.treatment_cycles
  FOR UPDATE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "treatment_cycles_delete" ON public.treatment_cycles
  FOR DELETE USING (
    patient_id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

-- Metas do plano
CREATE TYPE goal_status AS ENUM ('ativa', 'pausada', 'concluida');

CREATE TABLE public.treatment_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.treatment_cycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status goal_status NOT NULL DEFAULT 'ativa',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_goals_cycle ON public.treatment_goals(cycle_id);

CREATE TRIGGER treatment_goals_updated_at BEFORE UPDATE ON public.treatment_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.treatment_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatment_goals_select" ON public.treatment_goals
  FOR SELECT USING (
    cycle_id IN (
      SELECT id FROM public.treatment_cycles
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

CREATE POLICY "treatment_goals_insert" ON public.treatment_goals
  FOR INSERT WITH CHECK (
    cycle_id IN (
      SELECT id FROM public.treatment_cycles
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

CREATE POLICY "treatment_goals_update" ON public.treatment_goals
  FOR UPDATE USING (
    cycle_id IN (
      SELECT id FROM public.treatment_cycles
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

CREATE POLICY "treatment_goals_delete" ON public.treatment_goals
  FOR DELETE USING (
    cycle_id IN (
      SELECT id FROM public.treatment_cycles
      WHERE patient_id IN (
        SELECT pu.patient_id FROM public.patient_units pu
        WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
      )
    )
  );

COMMENT ON TABLE public.evaluation_templates IS 'Templates de avaliação (anamnese, consentimento, avaliações internas).';
COMMENT ON TABLE public.evaluation_instances IS 'Instâncias preenchidas por paciente.';
COMMENT ON TABLE public.treatment_cycles IS 'Ciclos do plano de atendimento (ex.: 6 meses).';
COMMENT ON TABLE public.treatment_goals IS 'Metas por ciclo.';
