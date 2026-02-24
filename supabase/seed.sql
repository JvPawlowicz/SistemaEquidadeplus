-- EquidadePlus — Seed opcional (executar uma vez após criar o primeiro usuário no Supabase Auth)
-- 1. No Supabase Dashboard: Authentication > Users > crie um usuário ou use "Sign up" no app.
-- 2. Copie o UUID do usuário (Authentication > Users > clique no usuário > User UID).
-- 3. Substitua 'SEU_USER_UID_AQUI' abaixo pelo UUID e execute no SQL Editor.

-- Inserir primeira unidade (guarde o id retornado ou use o primeiro da lista depois)
INSERT INTO public.units (name, timezone)
VALUES ('Unidade Principal', 'America/Sao_Paulo');

-- Vincular usuário à unidade como admin: substitua SEU_USER_UID_AQUI pelo UUID do usuário em Auth
INSERT INTO public.user_units (user_id, unit_id, role)
SELECT 'SEU_USER_UID_AQUI'::uuid, id, 'admin'::app_role
FROM public.units
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, unit_id) DO UPDATE SET role = 'admin'::app_role;

-- Inserir convênio "Particular" (default na UI)
INSERT INTO public.insurances (name)
VALUES ('Particular');

-- Categorias de chamados (admin pode adicionar mais em Configurações)
INSERT INTO public.ticket_categories (name)
VALUES ('TI'), ('Manutenção'), ('Limpeza'), ('Outros');
