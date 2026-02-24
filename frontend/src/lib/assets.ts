import { supabase } from './supabase';
import type { Asset } from '../types';

export async function fetchAssetsInUnit(unitId: string) {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  return { assets: (data ?? []) as Asset[], error };
}

export async function fetchAllAssetsForUnits(unitIds: string[]) {
  if (unitIds.length === 0) return { assets: [] as Asset[], error: null };
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .in('unit_id', unitIds)
    .order('name');
  return { assets: (data ?? []) as Asset[], error };
}

export async function createAsset(params: {
  unit_id: string;
  name: string;
  asset_type?: string;
  status?: string;
  room_id?: string;
}) {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      unit_id: params.unit_id,
      name: params.name,
      asset_type: params.asset_type ?? null,
      status: params.status ?? 'ativo',
      room_id: params.room_id ?? null,
    })
    .select()
    .single();
  return { asset: data as Asset | null, error };
}

export async function updateAsset(id: string, params: Partial<Pick<Asset, 'name' | 'asset_type' | 'status' | 'room_id'>>) {
  const { data, error } = await supabase
    .from('assets')
    .update(params)
    .eq('id', id)
    .select()
    .single();
  return { asset: data as Asset | null, error };
}

export async function deleteAsset(id: string) {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  return { error };
}
