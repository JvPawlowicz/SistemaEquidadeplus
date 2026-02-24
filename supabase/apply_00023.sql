-- Migration 00023: Unidade padrão do usuário (preferência ao abrir o sistema)
-- Cole este conteúdo no SQL Editor do Supabase Dashboard e execute (Run).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.default_unit_id IS 'Unidade padrão ao abrir o sistema (preferência do usuário).';
