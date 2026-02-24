import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

async function isAdmin(supabaseUrl: string, serviceRoleKey: string, authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user?.id) return false;
  const { data } = await admin.from('user_units').select('role').eq('user_id', user.id).limit(1);
  return (data ?? []).some((r: { role: string }) => r.role === 'admin');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const ok = await isAdmin(supabaseUrl, serviceRoleKey, req.headers.get('Authorization'));
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem criar usuários.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as { email?: string; password?: string; full_name?: string; unit_id?: string; role?: string };
    const { email, password, full_name, unit_id, role } = body;
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!unit_id || typeof unit_id !== 'string' || !unit_id.trim()) {
      return new Response(JSON.stringify({ error: 'Unidade é obrigatória ao criar usuário.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: full_name ? { full_name: full_name.trim() } : undefined,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = (userData as { user: { id: string } }).user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Usuário criado mas ID não retornado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        full_name: full_name?.trim() || email.split('@')[0],
        email: email.trim(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      return new Response(JSON.stringify({ error: 'Usuário criado mas falha ao atualizar perfil: ' + profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roleValue = (role && ['admin', 'coordenador', 'secretaria', 'profissional', 'estagiario', 'ti'].includes(role)) ? role : 'profissional';
    await supabaseAdmin.from('user_units').insert({ user_id: userId, unit_id: unit_id.trim(), role: roleValue });

    return new Response(
      JSON.stringify({
        message: 'Usuário criado com sucesso. Ele já pode entrar com o e-mail e a senha definidos.',
        user_id: userId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
