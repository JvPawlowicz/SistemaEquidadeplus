import { supabase } from './supabase';
import type { AppRole } from '../types';

/** Chama a Edge Function para enviar convite por e-mail. Requer deploy da função invite-user. */
export async function inviteUserByEmail(email: string): Promise<{ message?: string; link?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('invite-user', { body: { email } });
  if (error) return { error: error.message };
  const err = (data as { error?: string })?.error;
  if (err) return { error: err };
  return {
    message: (data as { message?: string })?.message,
    link: (data as { link?: string })?.link,
  };
}

/** Chama a Edge Function para gerar link de redefinição de senha. Requer deploy da função reset-password. */
export async function generateResetPasswordLink(email: string): Promise<{ message?: string; link?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('reset-password', { body: { email } });
  if (error) return { error: error.message };
  const err = (data as { error?: string })?.error;
  if (err) return { error: err };
  return {
    message: (data as { message?: string })?.message,
    link: (data as { link?: string })?.link,
  };
}

export interface UserWithUnits {
  id: string;
  full_name: string | null;
  email: string | null;
  is_blocked: boolean;
  units: { unit_id: string; unit_name: string; role: AppRole }[];
}

/** Lista usuários com suas unidades e papéis (para admin). */
export async function fetchUsersForAdmin(): Promise<{ users: UserWithUnits[]; error: Error | null }> {
  const { data: uuList, error: uuError } = await supabase
    .from('user_units')
    .select('user_id, unit_id, role');
  if (uuError) return { users: [], error: uuError as Error };

  const unitIds = [...new Set((uuList ?? []).map((r: { unit_id: string }) => r.unit_id))];
  const { data: units } = unitIds.length
    ? await supabase.from('units').select('id, name').in('id', unitIds)
    : { data: [] };
  const unitMap = new Map((units ?? []).map((u: { id: string; name: string }) => [u.id, u.name]));

  const userIds = [...new Set((uuList ?? []).map((r: { user_id: string }) => r.user_id))];
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_blocked')
    .in('id', userIds);
  if (profError) return { users: [], error: profError as Error };

  const byUser = new Map<string, UserWithUnits>();
  for (const p of profiles ?? []) {
    const profile = p as { id: string; full_name: string | null; email: string | null; is_blocked: boolean };
    byUser.set(profile.id, {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      is_blocked: profile.is_blocked,
      units: [],
    });
  }
  for (const r of uuList ?? []) {
    const row = r as { user_id: string; unit_id: string; role: AppRole };
    const u = byUser.get(row.user_id);
    if (u) u.units.push({ unit_id: row.unit_id, unit_name: unitMap.get(row.unit_id) ?? row.unit_id, role: row.role });
  }
  return { users: Array.from(byUser.values()), error: null };
}

export async function setProfileBlocked(userId: string, isBlocked: boolean) {
  const { error } = await supabase.from('profiles').update({ is_blocked: isBlocked }).eq('id', userId);
  return { error: error as Error | null };
}

export async function removeUserFromUnit(userId: string, unitId: string) {
  const { error } = await supabase.from('user_units').delete().eq('user_id', userId).eq('unit_id', unitId);
  return { error: error as Error | null };
}

export async function setUserUnitRole(userId: string, unitId: string, role: AppRole) {
  const { error } = await supabase.from('user_units').update({ role }).eq('user_id', userId).eq('unit_id', unitId);
  return { error: error as Error | null };
}
