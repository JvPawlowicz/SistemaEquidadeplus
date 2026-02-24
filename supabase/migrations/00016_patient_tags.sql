-- Tags do paciente (lista na tela Pacientes e busca, conforme blueprint)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.patients.tags IS 'Tags para filtrar e exibir na lista de pacientes.';
