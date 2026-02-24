-- Criar usuário admin diretamente no banco (Auth + profile + user_units).
-- Execute no Supabase Dashboard: SQL Editor → New query → cole este conteúdo → Run.
--
-- Se der erro de permissão em auth.users, use o script Node com service_role:
--   cd frontend && SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-first-admin.mjs

-- Garantir extensão para hash de senha
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Variáveis do usuário (edite se quiser)
DO $$
DECLARE
  new_id uuid := gen_random_uuid();
  unit_id uuid;
  pwd_hash text;
BEGIN
  -- Hash da senha (bcrypt)
  pwd_hash := crypt('muda1234', gen_salt('bf'));

  -- Unidade: usar a primeira cadastrada
  SELECT id INTO unit_id FROM public.units LIMIT 1;
  IF unit_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma unidade cadastrada. Crie uma unidade antes.';
  END IF;

  -- Inserir em auth.users (pode falhar por política do projeto)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at
  ) VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'joao.victor@grupoequidade.com.br',
    pwd_hash,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"João Victor G. Pawlowicz"}',
    now()
  );

  -- Perfil em public.profiles
  INSERT INTO public.profiles (id, full_name, email, is_blocked)
  VALUES (new_id, 'João Victor G. Pawlowicz', 'joao.victor@grupoequidade.com.br', false)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_blocked = false;

  -- Vincular à unidade como admin
  INSERT INTO public.user_units (user_id, unit_id, role)
  VALUES (new_id, unit_id, 'admin')
  ON CONFLICT (user_id, unit_id) DO UPDATE SET role = 'admin';

  RAISE NOTICE 'Usuário criado: %', new_id;
END $$;
