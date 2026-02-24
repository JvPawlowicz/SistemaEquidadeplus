import { supabase } from './supabase';
import type { Ticket, TicketCategory, TicketComment } from '../types';

function normalizeCategory(c: unknown): TicketCategory | null {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const o = c as Record<string, unknown>;
  if (typeof o.id === 'string' && typeof o.name === 'string') return o as unknown as TicketCategory;
  return null;
}
function normalizeRoomAsset(c: unknown): { id: string; name: string } | null {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const o = c as Record<string, unknown>;
  if (typeof o.id === 'string' && typeof o.name === 'string') return o as { id: string; name: string };
  return null;
}

export interface TicketWithRelations extends Ticket {
  category?: TicketCategory | null;
  author_profile?: { id: string; full_name: string | null } | null;
  assigned_profile?: { id: string; full_name: string | null } | null;
  room?: { id: string; name: string } | null;
  asset?: { id: string; name: string } | null;
}

export async function fetchTicketCategories() {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .order('name');
  return { categories: (data ?? []) as TicketCategory[], error };
}

export async function fetchTicketsInUnit(unitId: string, filters?: { status?: string; category_id?: string; patient_id?: string }) {
  let q = supabase
    .from('tickets')
    .select(`
      *,
      category:ticket_categories(id,name),
      room:rooms(id,name),
      asset:assets(id,name)
    `)
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false });
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.category_id) q = q.eq('category_id', filters.category_id);
  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  const { data, error } = await q;
  if (error) return { tickets: [] as TicketWithRelations[], error };
  const list = (data ?? []) as (Ticket & { category?: unknown; room?: unknown; asset?: unknown })[];
  const userIds = [...new Set(list.flatMap((t) => [t.author_id, t.assigned_to].filter(Boolean)))] as string[];
  const profileMap = new Map<string, { id: string; full_name: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => profileMap.set(p.id, p));
  }
  const tickets: TicketWithRelations[] = list.map((t) => ({
    ...t,
    category: normalizeCategory(t.category),
    author_profile: profileMap.get(t.author_id) ?? null,
    assigned_profile: t.assigned_to ? profileMap.get(t.assigned_to) ?? null : null,
    room: normalizeRoomAsset(t.room),
    asset: normalizeRoomAsset(t.asset),
  }));
  return { tickets, error: null };
}

export async function fetchTicketsByAsset(assetId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      category:ticket_categories(id,name),
      room:rooms(id,name),
      asset:assets(id,name)
    `)
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });
  if (error) return { tickets: [] as TicketWithRelations[], error };
  const list = (data ?? []) as (Ticket & { category?: unknown; room?: unknown; asset?: unknown })[];
  const userIds = [...new Set(list.flatMap((t) => [t.author_id, t.assigned_to].filter(Boolean)))] as string[];
  const profileMap = new Map<string, { id: string; full_name: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => profileMap.set(p.id, p));
  }
  const tickets: TicketWithRelations[] = list.map((t) => ({
    ...t,
    category: normalizeCategory(t.category),
    author_profile: profileMap.get(t.author_id) ?? null,
    assigned_profile: t.assigned_to ? profileMap.get(t.assigned_to) ?? null : null,
    room: normalizeRoomAsset(t.room),
    asset: normalizeRoomAsset(t.asset),
  }));
  return { tickets, error: null };
}

export async function fetchTicket(id: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      category:ticket_categories(id,name),
      room:rooms(id,name),
      asset:assets(id,name)
    `)
    .eq('id', id)
    .single();
  if (error) return { ticket: null, error };
  const t = data as Ticket & { category?: unknown; room?: unknown; asset?: unknown };
  const userIds = [t.author_id, t.assigned_to].filter(Boolean);
  const profileMap = new Map<string, { id: string; full_name: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => profileMap.set(p.id, p));
  }
  const ticket: TicketWithRelations = {
    ...t,
    category: normalizeCategory(t.category),
    author_profile: profileMap.get(t.author_id) ?? null,
    assigned_profile: t.assigned_to ? profileMap.get(t.assigned_to) ?? null : null,
    room: normalizeRoomAsset(t.room),
    asset: normalizeRoomAsset(t.asset),
  };
  return { ticket, error: null };
}

export async function fetchTicketComments(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) return { comments: [], error };
  const list = (data ?? []) as (TicketComment & { author_id: string })[];
  const authorIds = [...new Set(list.map((c) => c.author_id))];
  const profileMap = new Map<string, { id: string; full_name: string | null }>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', authorIds);
    (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => profileMap.set(p.id, p));
  }
  const comments = list.map((c) => ({
    ...c,
    author: profileMap.get(c.author_id) ?? null,
  }));
  return { comments, error: null };
}

export async function createTicket(params: {
  unit_id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority?: string;
  asset_id?: string;
  room_id?: string;
  patient_id?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ticket: null, error: new Error('Não autenticado') };
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      unit_id: params.unit_id,
      title: params.title,
      description: params.description ?? null,
      category_id: params.category_id ?? null,
      priority: (params.priority as 'baixa' | 'media' | 'alta' | 'urgente') ?? 'media',
      asset_id: params.asset_id ?? null,
      room_id: params.room_id ?? null,
      patient_id: params.patient_id ?? null,
      author_id: user.id,
    })
    .select()
    .single();
  return { ticket: data as Ticket | null, error };
}

export async function updateTicketStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  return { ticket: data as Ticket | null, error };
}

export async function updateTicketAssignment(id: string, assigned_to: string | null) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ assigned_to })
    .eq('id', id)
    .select()
    .single();
  return { ticket: data as Ticket | null, error };
}

export async function addTicketComment(ticketId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { comment: null, error: new Error('Não autenticado') };
  const { data, error } = await supabase
    .from('ticket_comments')
    .insert({ ticket_id: ticketId, author_id: user.id, content })
    .select()
    .single();
  return { comment: data as TicketComment | null, error };
}
