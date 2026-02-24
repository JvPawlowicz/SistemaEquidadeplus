-- CEP da unidade: usado para buscar endereço e definir fuso horário automaticamente (por UF)
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS cep TEXT;
COMMENT ON COLUMN public.units.cep IS 'CEP da unidade; ao buscar CEP o endereço e o fuso horário (por UF) são preenchidos automaticamente.';
