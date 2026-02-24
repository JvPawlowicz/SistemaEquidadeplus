-- Adiciona email em profiles para exibição na gestão de usuários (admin).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.email IS 'E-mail do usuário (espelho de auth.users, atualizado no login).';

-- Admin pode atualizar qualquer perfil (bloquear, etc.).
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admin pode listar user_units de todos (para gestão de usuários).
CREATE POLICY "user_units_select_admin" ON public.user_units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_units uu WHERE uu.user_id = auth.uid() AND uu.role = 'admin')
  );

-- Usuário pode ver colegas da mesma unidade (para atribuição em chamados, etc.).
CREATE POLICY "user_units_select_same_unit" ON public.user_units
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- DELETE em assets (por unidade).
CREATE POLICY "assets_delete" ON public.assets
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));
