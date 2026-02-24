-- Documento (CPF/RG) opcional do paciente para busca
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS document TEXT;

COMMENT ON COLUMN public.patients.document IS 'Documento do paciente (CPF/RG) para busca.';
