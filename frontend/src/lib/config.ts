import { supabase } from './supabase';
import type { Unit, Room, Insurance, TicketCategory } from '../types';

export async function updateProfile(userId: string, data: {
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  job_title?: string | null;
  bio?: string | null;
  council_type?: string | null;
  council_number?: string | null;
  council_uf?: string | null;
  specialties?: string[] | null;
  default_unit_id?: string | null;
}) {
  const { data: updated, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single();
  return { profile: updated, error };
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return {
    profile: data as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      phone: string | null;
      job_title: string | null;
      bio: string | null;
      council_type: string | null;
      council_number: string | null;
      council_uf: string | null;
      specialties: string[] | null;
      default_unit_id: string | null;
    } | null,
    error,
  };
}

export async function fetchAllUnits() {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('name');
  return { units: (data ?? []) as Unit[], error };
}

export async function createUnit(
  name: string,
  timezone = 'America/Sao_Paulo',
  extra?: Partial<Pick<Unit, 'address' | 'cep' | 'cnpj' | 'phone' | 'email' | 'is_active'>>
) {
  const { data, error } = await supabase
    .from('units')
    .insert({ name, timezone, ...extra })
    .select()
    .single();
  return { unit: data as Unit | null, error };
}

export async function updateUnit(
  id: string,
  data: Partial<Pick<Unit, 'name' | 'timezone' | 'address' | 'cep' | 'cnpj' | 'phone' | 'email' | 'is_active'>>
) {
  const { data: updated, error } = await supabase
    .from('units')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  return { unit: updated as Unit | null, error };
}

export async function createRoom(unitId: string, name: string) {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ unit_id: unitId, name })
    .select()
    .single();
  return { room: data as Room | null, error };
}

export async function updateRoom(id: string, name: string) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  return { room: data as Room | null, error };
}

export async function deleteRoom(id: string) {
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  return { error };
}

export async function fetchInsurances() {
  const { data, error } = await supabase
    .from('insurances')
    .select('*')
    .order('name');
  return { insurances: (data ?? []) as Insurance[], error };
}

export async function createInsurance(name: string) {
  const { data, error } = await supabase
    .from('insurances')
    .insert({ name })
    .select()
    .single();
  return { insurance: data as Insurance | null, error };
}

export async function updateInsurance(id: string, name: string) {
  const { data, error } = await supabase
    .from('insurances')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  return { insurance: data as Insurance | null, error };
}

export async function deleteInsurance(id: string) {
  const { error } = await supabase.from('insurances').delete().eq('id', id);
  return { error };
}

export async function fetchTicketCategoriesConfig() {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .order('name');
  return { categories: (data ?? []) as TicketCategory[], error };
}

export async function createTicketCategory(name: string) {
  const { data, error } = await supabase
    .from('ticket_categories')
    .insert({ name })
    .select()
    .single();
  return { category: data as TicketCategory | null, error };
}

export async function updateTicketCategory(id: string, name: string) {
  const { data, error } = await supabase
    .from('ticket_categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  return { category: data as TicketCategory | null, error };
}

export async function deleteTicketCategory(id: string) {
  const { error } = await supabase.from('ticket_categories').delete().eq('id', id);
  return { error };
}
