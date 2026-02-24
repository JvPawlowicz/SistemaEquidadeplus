-- Campos extras no perfil (time / dados de contato e função)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'Telefone de contato do profissional.';
COMMENT ON COLUMN public.profiles.job_title IS 'Cargo/função no time (ex.: Psicólogo, Terapeuta ABA).';
COMMENT ON COLUMN public.profiles.bio IS 'Breve descrição ou observações do perfil.';
