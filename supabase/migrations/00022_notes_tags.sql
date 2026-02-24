-- Tags opcionais na evolução/ata (ex.: labels para filtro)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tags TEXT;

COMMENT ON COLUMN public.notes.tags IS 'Tags da evolução/ata (texto livre, ex. separado por vírgula).';
