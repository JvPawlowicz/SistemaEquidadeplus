-- =============================================================================
-- Equidade+ — Tipos de roles de acesso e permissões no banco (documentação)
-- Execute no SQL Editor do Supabase após as migrations 00001–00031.
-- Este script NÃO altera RLS; apenas documenta roles e o que cada um acessa/altera.
-- =============================================================================

-- O tipo app_role já existe na migration 00001. Comentário para referência:
COMMENT ON TYPE public.app_role IS 'Papéis por unidade em user_units: admin, coordenador, secretaria, profissional, estagiario, ti. Ver tabela docs_role_permissions.';

-- Tabela de documentação: por role e recurso (tabela/área), o que pode SELECT/INSERT/UPDATE/DELETE
CREATE TABLE IF NOT EXISTS public.docs_role_permissions (
  role public.app_role NOT NULL,
  resource text NOT NULL,
  can_select boolean NOT NULL DEFAULT false,
  can_insert boolean NOT NULL DEFAULT false,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  observation text,
  PRIMARY KEY (role, resource)
);

COMMENT ON TABLE public.docs_role_permissions IS 'Documentação de permissões por role e recurso (reflete RLS + regras de app). Apenas referência.';

-- Limpar e preencher (permite reexecutar o script)
TRUNCATE public.docs_role_permissions;

-- =============================================================================
-- ADMIN
-- Acesso total às unidades em que é admin. Único que gerencia usuários, convênios,
-- config (cargos/especialidades), e pode atualizar qualquer perfil (bloquear etc.).
-- =============================================================================
INSERT INTO public.docs_role_permissions (role, resource, can_select, can_insert, can_update, can_delete, observation) VALUES
('admin', 'profiles', true, true, true, false, 'Atualiza qualquer perfil (bloquear, etc.). Insert só próprio no signup.'),
('admin', 'units', true, true, true, false, 'Apenas unidades em que está (get_my_unit_ids).'),
('admin', 'rooms', true, true, true, false, 'Por unidade que acessa.'),
('admin', 'user_units', true, true, true, true, 'Vê todos user_units (gestão de usuários). Insere/atualiza/remove vínculos.'),
('admin', 'insurances', true, true, true, true, 'Convênios: CRUD em Configurações.'),
('admin', 'patients', true, true, true, false, 'Pacientes das unidades que acessa; vincula em patient_units.'),
('admin', 'patient_units', true, true, false, true, 'Vincular/desvincular paciente à unidade.'),
('admin', 'events', true, true, true, true, 'Agenda da unidade: criar/editar/cancelar.'),
('admin', 'notes', true, true, true, false, 'Evoluções/atas dos eventos das unidades.'),
('admin', 'config_job_titles', true, true, true, true, 'Cargos: só admin no DB.'),
('admin', 'config_specialties', true, true, true, true, 'Especialidades: só admin no DB.'),
('admin', 'patient_tag_definitions', true, true, true, true, 'Definições de tags (nome, cor).'),
('admin', 'patient_tag_assignments', true, true, false, true, 'Atribuir/remover tags em pacientes das minhas unidades.'),
('admin', 'evaluation_templates', true, true, true, true, 'Por unidade.'),
('admin', 'evaluation_instances', true, true, true, false, 'Por paciente das unidades.'),
('admin', 'note_templates', true, true, true, true, 'Por unidade.'),
('admin', 'appointment_types', true, true, true, true, 'Por unidade.'),
('admin', 'aba_templates', true, true, true, true, 'Por unidade.'),
('admin', 'aba_programs', true, true, true, true, 'Por paciente das unidades.'),
('admin', 'tickets', true, true, true, true, 'Chamados das unidades.'),
('admin', 'ticket_categories', true, true, true, true, 'Categorias de chamados.'),
('admin', 'assets', true, true, true, true, 'Ativos das unidades.'),
('admin', 'attachments', true, true, true, true, 'Anexos (prontuário/chamados).'),
('admin', 'storage_avatars', true, true, true, true, 'Bucket avatars.'),
('admin', 'storage_patients', true, true, true, true, 'Bucket patients.'),
('admin', 'storage_attachments', true, true, true, true, 'Bucket attachments.');

-- =============================================================================
-- COORDENADOR
-- Agenda da unidade (ver todos agendamentos). Pode criar/editar atendimentos e
-- reuniões, transferir responsável. Reabrir status com motivo. Vê evoluções.
-- No DB: mesmo RLS que demais (por unidade); app restringe quem cria/edita agenda.
-- =============================================================================
INSERT INTO public.docs_role_permissions (role, resource, can_select, can_insert, can_update, can_delete, observation) VALUES
('coordenador', 'profiles', true, false, false, false, 'Próprio perfil + colegas da mesma unidade.'),
('coordenador', 'units', true, false, true, false, 'Só unidades em que está; pode atualizar dados da unidade.'),
('coordenador', 'rooms', true, true, true, false, 'Por unidade.'),
('coordenador', 'user_units', true, false, false, false, 'Vê próprias linhas e colegas da mesma unidade.'),
('coordenador', 'insurances', true, false, false, false, 'Só leitura.'),
('coordenador', 'patients', true, true, true, false, 'Pacientes das unidades que acessa.'),
('coordenador', 'patient_units', true, true, false, true, 'Vincular/desvincular paciente à unidade.'),
('coordenador', 'events', true, true, true, true, 'Criar/editar/transferir/cancelar (app permite).'),
('coordenador', 'notes', true, true, true, false, 'Evoluções/atas; pode coassinar estagiário.'),
('coordenador', 'config_job_titles', true, false, false, false, 'Só leitura.'),
('coordenador', 'config_specialties', true, false, false, false, 'Só leitura.'),
('coordenador', 'patient_tag_definitions', true, true, true, true, 'RLS permite authenticated; app pode restringir.'),
('coordenador', 'patient_tag_assignments', true, true, false, true, 'Pacientes das minhas unidades.'),
('coordenador', 'evaluation_templates', true, true, true, true, 'Por unidade.'),
('coordenador', 'evaluation_instances', true, true, true, false, 'Por paciente das unidades.'),
('coordenador', 'note_templates', true, true, true, true, 'Por unidade.'),
('coordenador', 'appointment_types', true, true, true, true, 'Por unidade.'),
('coordenador', 'aba_templates', true, true, true, true, 'Por unidade.'),
('coordenador', 'aba_programs', true, true, true, true, 'Por paciente das unidades.'),
('coordenador', 'tickets', true, true, true, false, 'Chamados das unidades.'),
('coordenador', 'ticket_categories', true, true, true, true, 'Categorias.'),
('coordenador', 'assets', true, true, true, false, 'Ativos das unidades.'),
('coordenador', 'attachments', true, true, true, true, 'Anexos.'),
('coordenador', 'storage_avatars', true, true, true, true, 'Próprio avatar.'),
('coordenador', 'storage_patients', true, true, true, true, 'Fotos pacientes.'),
('coordenador', 'storage_attachments', true, true, true, true, 'Anexos.');

-- =============================================================================
-- SECRETARIA
-- Agenda da unidade (ver todos). Não cria/edita agendamentos (app). Não vê
-- texto de evolução clínica (app mostra só meta: pendente/ok, autor, datas).
-- No DB: mesmo acesso por unidade a events/notes; app oculta conteúdo de nota.
-- =============================================================================
INSERT INTO public.docs_role_permissions (role, resource, can_select, can_insert, can_update, can_delete, observation) VALUES
('secretaria', 'profiles', true, false, false, false, 'Próprio + colegas da mesma unidade.'),
('secretaria', 'units', true, false, true, false, 'Unidades em que está.'),
('secretaria', 'rooms', true, true, true, false, 'Por unidade.'),
('secretaria', 'user_units', true, false, false, false, 'Próprias linhas e colegas da unidade.'),
('secretaria', 'insurances', true, false, false, false, 'Só leitura.'),
('secretaria', 'patients', true, true, true, false, 'Cadastro de pacientes das unidades.'),
('secretaria', 'patient_units', true, true, false, true, 'Vincular/desvincular paciente.'),
('secretaria', 'events', true, true, true, true, 'No DB pode; app não permite criar/editar agenda.'),
('secretaria', 'notes', true, true, true, false, 'App não exibe texto de evolução (só meta).'),
('secretaria', 'config_job_titles', true, false, false, false, 'Só leitura.'),
('secretaria', 'config_specialties', true, false, false, false, 'Só leitura.'),
('secretaria', 'patient_tag_definitions', true, true, true, true, 'Por unidade.'),
('secretaria', 'patient_tag_assignments', true, true, false, true, 'Pacientes das unidades.'),
('secretaria', 'evaluation_templates', true, true, true, true, 'Por unidade.'),
('secretaria', 'evaluation_instances', true, true, true, false, 'Por paciente.'),
('secretaria', 'note_templates', true, true, true, true, 'Por unidade.'),
('secretaria', 'appointment_types', true, true, true, true, 'Por unidade.'),
('secretaria', 'aba_templates', true, true, true, true, 'Por unidade.'),
('secretaria', 'aba_programs', true, true, true, true, 'Por paciente.'),
('secretaria', 'tickets', true, true, true, false, 'Chamados.'),
('secretaria', 'ticket_categories', true, true, true, true, 'Categorias.'),
('secretaria', 'assets', true, true, true, false, 'Ativos.'),
('secretaria', 'attachments', true, true, true, true, 'Anexos.'),
('secretaria', 'storage_avatars', true, true, true, true, 'Avatar.'),
('secretaria', 'storage_patients', true, true, true, true, 'Fotos pacientes.'),
('secretaria', 'storage_attachments', true, true, true, true, 'Anexos.');

-- =============================================================================
-- PROFISSIONAL
-- Minha Agenda (só atendimentos em que é responsável + reuniões que participa).
-- Não cria/edita agendamentos. Finaliza status (Realizado/Faltou/Cancelado).
-- Vê e escreve evolução. Pode coassinar estagiário.
-- =============================================================================
INSERT INTO public.docs_role_permissions (role, resource, can_select, can_insert, can_update, can_delete, observation) VALUES
('profissional', 'profiles', true, false, false, false, 'Próprio + colegas da unidade.'),
('profissional', 'units', true, false, true, false, 'Unidades em que está.'),
('profissional', 'rooms', true, true, true, false, 'Por unidade.'),
('profissional', 'user_units', true, false, false, false, 'Próprias + colegas da unidade.'),
('profissional', 'insurances', true, false, false, false, 'Só leitura.'),
('profissional', 'patients', true, true, true, false, 'Pacientes das unidades.'),
('profissional', 'patient_units', true, true, false, true, 'Por unidade.'),
('profissional', 'events', true, true, true, true, 'App: Minha Agenda; finaliza status.'),
('profissional', 'notes', true, true, true, false, 'Vê e escreve evolução; coassina estagiário.'),
('profissional', 'config_job_titles', true, false, false, false, 'Só leitura.'),
('profissional', 'config_specialties', true, false, false, false, 'Só leitura.'),
('profissional', 'patient_tag_definitions', true, true, true, true, 'Por unidade.'),
('profissional', 'patient_tag_assignments', true, true, false, true, 'Pacientes das unidades.'),
('profissional', 'evaluation_templates', true, true, true, true, 'Por unidade.'),
('profissional', 'evaluation_instances', true, true, true, false, 'Por paciente.'),
('profissional', 'note_templates', true, true, true, true, 'Por unidade.'),
('profissional', 'appointment_types', true, true, true, true, 'Por unidade.'),
('profissional', 'aba_templates', true, true, true, true, 'Por unidade.'),
('profissional', 'aba_programs', true, true, true, true, 'Por paciente.'),
('profissional', 'tickets', true, true, true, false, 'Chamados.'),
('profissional', 'ticket_categories', true, true, true, true, 'Categorias.'),
('profissional', 'assets', true, true, true, false, 'Ativos.'),
('profissional', 'attachments', true, true, true, true, 'Anexos.'),
('profissional', 'storage_avatars', true, true, true, true, 'Avatar.'),
('profissional', 'storage_patients', true, true, true, true, 'Fotos pacientes.'),
('profissional', 'storage_attachments', true, true, true, true, 'Anexos.');

-- =============================================================================
-- ESTAGIÁRIO
-- Minha Agenda. Escreve evolução; para marcar Realizado exige coassinatura de
-- profissional ou coordenador da mesma unidade (regra no app).
-- =============================================================================
INSERT INTO public.docs_role_permissions (role, resource, can_select, can_insert, can_update, can_delete, observation) VALUES
('estagiario', 'profiles', true, false, false, false, 'Próprio + colegas da unidade.'),
('estagiario', 'units', true, false, true, false, 'Unidades em que está.'),
('estagiario', 'rooms', true, true, true, false, 'Por unidade.'),
('estagiario', 'user_units', true, false, false, false, 'Próprias + colegas da unidade.'),
('estagiario', 'insurances', true, false, false, false, 'Só leitura.'),
('estagiario', 'patients', true, true, true, false, 'Pacientes das unidades.'),
('estagiario', 'patient_units', true, true, false, true, 'Por unidade.'),
('estagiario', 'events', true, true, true, true, 'App: Minha Agenda; finaliza status (coassinatura se estagiário).'),
('estagiario', 'notes', true, true, true, false, 'Escreve evolução; coassinatura obrigatória no app.'),
('estagiario', 'config_job_titles', true, false, false, false, 'Só leitura.'),
('estagiario', 'config_specialties', true, false, false, false, 'Só leitura.'),
('estagiario', 'patient_tag_definitions', true, true, true, true, 'Por unidade.'),
('estagiario', 'patient_tag_assignments', true, true, false, true, 'Pacientes das unidades.'),
('estagiario', 'evaluation_templates', true, true, true, true, 'Por unidade.'),
('estagiario', 'evaluation_instances', true, true, true, false, 'Por paciente.'),
('estagiario', 'note_templates', true, true, true, true, 'Por unidade.'),
('estagiario', 'appointment_types', true, true, true, true, 'Por unidade.'),
('estagiario', 'aba_templates', true, true, true, true, 'Por unidade.'),
('estagiario', 'aba_programs', true, true, true, true, 'Por paciente.'),
('estagiario', 'tickets', true, true, true, false, 'Chamados.'),
('estagiario', 'ticket_categories', true, true, true, true, 'Categorias.'),
('estagiario', 'assets', true, true, true, false, 'Ativos.'),
('estagiario', 'attachments', true, true, true, true, 'Anexos.'),
('estagiario', 'storage_avatars', true, true, true, true, 'Avatar.'),
('estagiario', 'storage_patients', true, true, true, true, 'Fotos pacientes.'),
('estagiario', 'storage_attachments', true, true, true, true, 'Anexos.');

-- =============================================================================
-- TI
-- No app acessa apenas: Chamados, Ativos, Relatórios de chamados, Meu Perfil.
-- No DB continua com acesso por unidade; a restrição é na UI/rotas.
-- =============================================================================
INSERT INTO public.docs_role_permissions (role, resource, can_select, can_insert, can_update, can_delete, observation) VALUES
('ti', 'profiles', true, false, false, false, 'Próprio (Meu Perfil) + colegas da unidade.'),
('ti', 'units', true, false, false, false, 'Só leitura das unidades em que está.'),
('ti', 'rooms', true, false, false, false, 'Só leitura.'),
('ti', 'user_units', true, false, false, false, 'Próprias + colegas da unidade.'),
('ti', 'insurances', true, false, false, false, 'Só leitura.'),
('ti', 'patients', true, false, false, false, 'App não exibe; DB permitiria por unidade.'),
('ti', 'patient_units', true, false, false, false, 'App não exibe.'),
('ti', 'events', true, false, false, false, 'App: sem acesso à agenda.'),
('ti', 'notes', true, false, false, false, 'App: sem acesso a evoluções.'),
('ti', 'config_job_titles', true, false, false, false, 'Só leitura.'),
('ti', 'config_specialties', true, false, false, false, 'Só leitura.'),
('ti', 'patient_tag_definitions', true, false, false, false, 'Só leitura.'),
('ti', 'patient_tag_assignments', true, false, false, false, 'App não exibe.'),
('ti', 'evaluation_templates', true, false, false, false, 'App não exibe.'),
('ti', 'evaluation_instances', true, false, false, false, 'App não exibe.'),
('ti', 'note_templates', true, false, false, false, 'Só leitura.'),
('ti', 'appointment_types', true, false, false, false, 'Só leitura.'),
('ti', 'aba_templates', true, false, false, false, 'Só leitura.'),
('ti', 'aba_programs', true, false, false, false, 'App não exibe.'),
('ti', 'tickets', true, true, true, false, 'Chamados: acesso principal no app.'),
('ti', 'ticket_categories', true, true, true, true, 'Categorias de chamados.'),
('ti', 'assets', true, true, true, true, 'Ativos: ERP lite.'),
('ti', 'attachments', true, true, true, true, 'Anexos em chamados.'),
('ti', 'storage_avatars', true, true, true, true, 'Avatar.'),
('ti', 'storage_patients', true, false, false, false, 'App não exibe.'),
('ti', 'storage_attachments', true, true, true, true, 'Anexos em chamados.');

-- Leitura da documentação: qualquer autenticado pode consultar (não contém dados sensíveis)
ALTER TABLE public.docs_role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "docs_role_permissions_select" ON public.docs_role_permissions;
CREATE POLICY "docs_role_permissions_select" ON public.docs_role_permissions
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- Resumo por role (consulta de referência)
-- =============================================================================
-- SELECT role, resource, can_select, can_insert, can_update, can_delete, observation
-- FROM public.docs_role_permissions
-- ORDER BY role, resource;
