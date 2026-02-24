import { supabase } from './supabase';

const BUCKET = 'patients';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 3;

export async function uploadPatientPhoto(patientId: string, file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: new Error('Formato não permitido. Use JPG, PNG, GIF ou WebP.') };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { url: null, error: new Error(`Tamanho máximo: ${MAX_SIZE_MB} MB.`) };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${patientId}/photo.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { url: null, error: uploadError as Error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
