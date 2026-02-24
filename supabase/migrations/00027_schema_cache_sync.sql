-- Sincronização do schema para evitar erros de "schema cache" no Supabase.
-- Execute junto com as outras migrations (db push) ou rode este bloco uma vez no SQL Editor.
-- Todas as alterações são idempotentes (IF NOT EXISTS).

-- patients (tags)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- profiles (campos extras do perfil)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- units (endereço, CNPJ, etc.)
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- events (cor na agenda)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS color_hex TEXT;
