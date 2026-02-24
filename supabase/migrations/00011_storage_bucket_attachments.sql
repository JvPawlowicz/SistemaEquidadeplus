-- Bucket "attachments": crie no Dashboard (Storage → New bucket → Nome: attachments, Public: sim).
-- Políticas abaixo garantem acesso autenticado e deleção apenas pelo dono do arquivo (path = auth.uid()/...).

CREATE POLICY "attachments_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "attachments_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "attachments_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
