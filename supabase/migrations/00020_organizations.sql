-- Organizacoes (multi-tenant opcional)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "organizations_delete" ON public.organizations FOR DELETE TO authenticated USING (true);

ALTER TABLE public.units
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX idx_units_organization ON public.units(organization_id);
