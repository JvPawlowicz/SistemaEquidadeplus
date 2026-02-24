-- Políticas adicionais: DELETE em insurances (admin gerencia em Configurações)
CREATE POLICY "insurances_delete" ON public.insurances
  FOR DELETE TO authenticated USING (true);
