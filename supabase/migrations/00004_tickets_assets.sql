-- Chamados (tickets) e Ativos
CREATE TABLE public.ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT,
  status TEXT DEFAULT 'ativo',
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE ticket_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE ticket_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority ticket_priority NOT NULL DEFAULT 'media',
  status ticket_status NOT NULL DEFAULT 'aberto',
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_unit ON public.tickets(unit_id);
CREATE INDEX idx_tickets_status ON public.tickets(unit_id, status);
CREATE INDEX idx_tickets_category ON public.tickets(category_id);
CREATE INDEX idx_assets_unit ON public.assets(unit_id);
CREATE INDEX idx_ticket_comments_ticket ON public.ticket_comments(ticket_id);

CREATE TRIGGER ticket_categories_updated_at BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_categories_select" ON public.ticket_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "ticket_categories_all" ON public.ticket_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "assets_select_my_units" ON public.assets FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "assets_insert_my_units" ON public.assets FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "assets_update_my_units" ON public.assets FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "tickets_select_my_units" ON public.tickets FOR SELECT USING (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "tickets_insert_my_units" ON public.tickets FOR INSERT WITH CHECK (unit_id IN (SELECT public.get_my_unit_ids()));
CREATE POLICY "tickets_update_my_units" ON public.tickets FOR UPDATE USING (unit_id IN (SELECT public.get_my_unit_ids()));

CREATE POLICY "ticket_comments_select" ON public.ticket_comments FOR SELECT USING (
  ticket_id IN (SELECT id FROM public.tickets WHERE unit_id IN (SELECT public.get_my_unit_ids()))
);
CREATE POLICY "ticket_comments_insert" ON public.ticket_comments FOR INSERT WITH CHECK (
  ticket_id IN (SELECT id FROM public.tickets WHERE unit_id IN (SELECT public.get_my_unit_ids()))
);

COMMENT ON TABLE public.tickets IS 'Chamados internos (TI/manutenção).';
COMMENT ON TABLE public.assets IS 'Ativos (equipamentos, salas, etc.).';
