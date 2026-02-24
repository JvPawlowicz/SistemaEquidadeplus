-- Cargos/funções e especialidades: CRUD por admin, usados no perfil do usuário
CREATE TABLE IF NOT EXISTS public.config_job_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.config_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_config_job_titles_order ON public.config_job_titles(sort_order);
CREATE INDEX IF NOT EXISTS idx_config_specialties_order ON public.config_specialties(sort_order);

ALTER TABLE public.config_job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_specialties ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler (para preencher perfil)
CREATE POLICY "config_job_titles_select" ON public.config_job_titles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "config_specialties_select" ON public.config_specialties
  FOR SELECT TO authenticated USING (true);

-- Apenas admins podem inserir/atualizar/deletar (quem tem role admin em user_units)
CREATE POLICY "config_job_titles_insert" ON public.config_job_titles
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "config_job_titles_update" ON public.config_job_titles
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "config_job_titles_delete" ON public.config_job_titles
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "config_specialties_insert" ON public.config_specialties
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "config_specialties_update" ON public.config_specialties
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "config_specialties_delete" ON public.config_specialties
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.config_job_titles IS 'Cargos/funções no time (admin cadastra; usuário escolhe no perfil).';
COMMENT ON TABLE public.config_specialties IS 'Especialidades (admin cadastra; usuário escolhe no perfil).';
