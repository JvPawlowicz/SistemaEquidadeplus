-- Bucket "patients": fotos de perfil dos pacientes. Crie no Dashboard (Storage → New bucket → Nome: patients, Public: sim).

CREATE POLICY "patients_photo_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'patients');

CREATE POLICY "patients_photo_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patients');

CREATE POLICY "patients_photo_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'patients');

CREATE POLICY "patients_photo_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patients');
