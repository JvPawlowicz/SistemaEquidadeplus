-- EquidadePlus — Row Level Security (RLS)
-- Execute após 00001_initial_schema.sql

-- Função: unidades às quais o usuário atual pertence
CREATE OR REPLACE FUNCTION public.get_my_unit_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.user_units WHERE user_id = auth.uid();
$$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- profiles: usuário lê e atualiza próprio perfil; lê outros perfis que compartilham alguma unidade
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_shared_units" ON public.profiles
  FOR SELECT USING (
    id <> auth.uid() AND id IN (
      SELECT uu2.user_id FROM public.user_units uu1
      JOIN public.user_units uu2 ON uu1.unit_id = uu2.unit_id
      WHERE uu1.user_id = auth.uid()
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- units: usuário vê apenas unidades em que está
CREATE POLICY "units_select_my" ON public.units
  FOR SELECT USING (id IN (SELECT public.get_my_unit_ids()));

-- rooms: por unidade que o usuário acessa
CREATE POLICY "rooms_select_my_units" ON public.rooms
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- user_units: usuário vê próprias linhas; admin pode gerenciar (política mais restritiva no app)
CREATE POLICY "user_units_select_own" ON public.user_units
  FOR SELECT USING (user_id = auth.uid());

-- insurances: todos autenticados podem ler (convênios)
CREATE POLICY "insurances_select" ON public.insurances
  FOR SELECT TO authenticated USING (true);

-- patients: apenas pacientes habilitados em unidades do usuário
CREATE POLICY "patients_select_my_units" ON public.patients
  FOR SELECT USING (
    id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

-- patient_units: ler quando a unidade é do usuário
CREATE POLICY "patient_units_select_my_units" ON public.patient_units
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- events: ler eventos das unidades do usuário
CREATE POLICY "events_select_my_units" ON public.events
  FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- notes: ler notas de eventos que o usuário pode ver
CREATE POLICY "notes_select_events_my_units" ON public.notes
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

-- Políticas de INSERT/UPDATE/DELETE: por enquanto restritas; o app vai usar service role ou políticas mais granulares depois.
-- Para o app funcionar com anon/authenticated, precisamos permitir que usuários autenticados inseriam/atualizem
-- dentro das regras de negócio. Abaixo: políticas básicas para desenvolvimento (admin/coordenador etc. podem ser checadas no app ou em funções).

-- units: só leitura para todos (admin gerencia via dashboard com service role ou política específica)
-- rooms: idem
CREATE POLICY "rooms_insert_my_units" ON public.rooms
  FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "rooms_update_my_units" ON public.rooms
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- insurances: só leitura (admin gerencia em Configurações)
-- patients: inserir/atualizar para usuários que têm acesso às unidades (secretaria/admin/coordenador no app)
CREATE POLICY "patients_insert" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patients_update" ON public.patients
  FOR UPDATE USING (
    id IN (
      SELECT pu.patient_id FROM public.patient_units pu
      WHERE pu.unit_id IN (SELECT public.get_my_unit_ids())
    )
  );

CREATE POLICY "patient_units_insert" ON public.patient_units
  FOR INSERT TO authenticated WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "patient_units_delete" ON public.patient_units
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- events: inserir/atualizar para quem pode ver a unidade (regra de admin/coordenador no app)
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "events_update" ON public.events
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "events_delete" ON public.events
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- notes: inserir/atualizar para eventos das minhas unidades
CREATE POLICY "notes_insert" ON public.notes
  FOR INSERT TO authenticated WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE unit_id IN (SELECT public.get_my_unit_ids()))
  );
CREATE POLICY "notes_update" ON public.notes
  FOR UPDATE USING (
    event_id IN (SELECT id FROM public.events WHERE unit_id IN (SELECT public.get_my_unit_ids()))
  );

-- units: permitir insert/update para criar primeira unidade (ou usar service role no setup)
CREATE POLICY "units_insert" ON public.units
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "units_update" ON public.units
  FOR UPDATE USING (id IN (SELECT public.get_my_unit_ids()));

-- user_units: apenas admins podem inserir/atualizar (em produção usar função que verifica role); para desenvolvimento permitir insert do próprio usuário para testes
CREATE POLICY "user_units_insert" ON public.user_units
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "user_units_update" ON public.user_units
  FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "user_units_delete" ON public.user_units
  FOR DELETE USING (unit_id IN (SELECT public.get_my_unit_ids()));

-- insurances: admin gerencia; permitir insert/update para authenticated (restrição de papel no app)
CREATE POLICY "insurances_insert" ON public.insurances
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insurances_update" ON public.insurances
  FOR UPDATE TO authenticated USING (true);

-- Perfil: trigger para criar profile ao signup (Supabase Auth)
-- O app pode criar o profile no primeiro acesso se não existir.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger no auth.users é gerenciado pelo Supabase; para self-managed trigger em auth.users não temos acesso direto.
-- Alternativa: no frontend, após signUp ou primeiro login, chamar upsert em profiles se não existir.
-- Ou usar Database Webhook "user created" para inserir em profiles.
