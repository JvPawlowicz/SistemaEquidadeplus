import { supabase } from './supabase';

const BUCKET = 'avatars';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 2;

/**
 * Faz upload da foto de perfil para o Supabase Storage (bucket avatars).
 * Salva em avatars/{userId}/avatar.{ext}. Retorna a URL pública para guardar em profiles.avatar_url.
 */
export async function uploadAvatar(userId: string, file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: new Error('Formato não permitido. Use JPG, PNG, GIF ou WebP.') };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { url: null, error: new Error(`Tamanho máximo: ${MAX_SIZE_MB} MB.`) };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { url: null, error: uploadError as Error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/**
 * Remove a foto de perfil do Storage. Não altera profiles.avatar_url (faça updateProfile após).
 */
export async function removeAvatar(userId: string, currentAvatarUrl: string | null) {
  if (!currentAvatarUrl) return { error: null };
  try {
    const url = new URL(currentAvatarUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
    const path = pathMatch?.[1];
    if (!path || !path.startsWith(userId + '/')) return { error: null };
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    return { error: error as Error | null };
  } catch {
    return { error: null };
  }
}

/**
 * Retorna a URL pública de um path no bucket avatars (útil se você guardar só o path).
 */
export function getAvatarPublicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
