-- Permite que qualquer usuário autenticado faça INSERT nos buckets (evita "new row violates row-level security policy").
-- O app já restringe o path (avatars: userId/..., attachments: created_by/...).

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Attachments e patients já tinham políticas mais abertas; garantir INSERT/UPDATE para authenticated.
DROP POLICY IF EXISTS "attachments_insert_authenticated" ON storage.objects;
CREATE POLICY "attachments_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_update_authenticated" ON storage.objects;
CREATE POLICY "attachments_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');
