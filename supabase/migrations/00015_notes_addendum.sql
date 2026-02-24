-- Adendo à evolução/ata após finalização (append-only, conforme blueprint)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS addendum TEXT DEFAULT '';

COMMENT ON COLUMN public.notes.addendum IS 'Texto append-only adicionado após a finalização da evolução/ata.';
