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
      return new Response(JSON.stringify({ error: 'Apenas administradores podem gerar link de redefinição.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email } = (await req.json()) as { email?: string };
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'E-mail é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const link = (data as { properties?: { action_link?: string } })?.properties?.action_link ?? null;
    return new Response(
      JSON.stringify({
        message: 'Link de redefinição gerado. Copie e envie ao usuário (o e-mail de recuperação também pode ter sido enviado se o SMTP estiver configurado).',
        link: link ?? undefined,
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
