#!/usr/bin/env node
/**
 * Cria o primeiro usuário admin no Supabase (Auth + profile + user_units).
 * Use quando ainda não existir nenhum admin (a Edge Function create-user exige um admin logado).
 *
 * Execute a partir da pasta frontend:
 *
 *   cd frontend
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   ADMIN_EMAIL=joao.victor@grupoequidade.com.br ADMIN_PASSWORD=muda1234 ADMIN_NAME="João Victor G. Pawlowicz" \
 *   node scripts/create-first-admin.mjs
 *
 * Opcional: UNIT_ID=uuid  (se não informado, usa a primeira unidade cadastrada)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'joao.victor@grupoequidade.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'muda1234';
const ADMIN_NAME = process.env.ADMIN_NAME || 'João Victor G. Pawlowicz';
const UNIT_ID = process.env.UNIT_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  let unitId = UNIT_ID;
  if (!unitId) {
    const { data: units, error: unitsError } = await supabase.from('units').select('id').limit(1);
    if (unitsError || !units?.length) {
      console.error('Nenhuma unidade encontrada. Crie uma unidade no Dashboard (Table Editor → units) ou defina UNIT_ID.');
      process.exit(1);
    }
    unitId = units[0].id;
    console.log('Usando unidade:', unitId);
  }

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL.trim(),
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME.trim() },
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      console.error('Este e-mail já está cadastrado. Use outro e-mail ou redefina a senha pelo Dashboard.');
    } else {
      console.error('Erro ao criar usuário:', createError.message);
    }
    process.exit(1);
  }

  const userId = userData?.user?.id;
  if (!userId) {
    console.error('Usuário criado mas ID não retornado.');
    process.exit(1);
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    { id: userId, full_name: ADMIN_NAME.trim(), email: ADMIN_EMAIL.trim() },
    { onConflict: 'id' }
  );
  if (profileError) {
    console.error('Erro ao criar perfil:', profileError.message);
    process.exit(1);
  }

  const { error: uuError } = await supabase.from('user_units').insert({
    user_id: userId,
    unit_id: unitId,
    role: 'admin',
  });
  if (uuError) {
    if (uuError.code === '23505') {
      console.log('Usuário já estava vinculado à unidade como admin.');
    } else {
      console.error('Erro ao vincular à unidade:', uuError.message);
      process.exit(1);
    }
  }

  console.log('Admin criado com sucesso.');
  console.log('E-mail:', ADMIN_EMAIL);
  console.log('Nome:', ADMIN_NAME);
  console.log('Role: admin');
  console.log('Faça login no app com esse e-mail e a senha definida.');
}

main();
