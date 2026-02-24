# Contexto MCP – Sistema Equidade+

Este documento é a referência única para o **MCP Supabase** e para deploy (Render, etc.). Mantenha-o atualizado quando alterar schema, funções ou variáveis.

**Estado atual via MCP (project_id: wwcsmkmwelkgloklbmkw):**
- **URL:** https://wwcsmkmwelkgloklbmkw.supabase.co
- **Migrations:** 00001 → 00032 **aplicadas** (schema, storage RLS e docs_role_permissions).
- **Buckets:** avatars, attachments, patients (todos public: true).
- **Edge Functions:** invite-user, reset-password, create-user, set-password (ACTIVE, verify_jwt: true).
- **Tabelas public (resumo):** profiles, units (com cep), rooms, user_units, insurances, patients, patient_units, events, notes, patient_tag_definitions, patient_tag_assignments, config_job_titles, config_specialties, evaluation_templates, evaluation_instances, aba_templates, aba_template_goals, aba_programs, aba_goals, tickets, ticket_categories, assets, attachments, note_templates, appointment_types, etc.

Para atualizar: `list_migrations`, `list_edge_functions`, `execute_sql` (storage.buckets), `list_tables` e `get_project_url` com `project_id: wwcsmkmwelkgloklbmkw`.

**Funcionalidades de backend / frontend:** Importar foto de perfil em Meu Perfil (bucket avatars, lib/avatars.ts). Fotos de pacientes (bucket patients). Anexos (bucket attachments). Admin cria usuário com create-user (e-mail, senha, unidade, role) e redefine senha com set-password. Role definida ao criar usuário; sem tela Completar perfil. Tags de pacientes com cores (patient_tag_definitions.color_hex) na listagem de Pacientes. Configurações: abas CRUD visíveis se usuário é admin em qualquer unidade (hook `isAdminInAnyUnit`). Página Avaliações: layout com padding e conteúdo centralizado.

---

## Supabase – Projeto

- **project_id / ref**: `wwcsmkmwelkgloklbmkw` (projeto **EquidadePlus** no Dashboard).
- **URL do projeto**: https://wwcsmkmwelkgloklbmkw.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/wwcsmkmwelkgloklbmkw
- **Link CLI**: `npx supabase link --project-ref wwcsmkmwelkgloklbmkw`.

Ao usar as ferramentas do MCP Supabase (`list_tables`, `execute_sql`, `apply_migration`, `deploy_edge_function`, etc.), use **project_id**: `wwcsmkmwelkgloklbmkw`.

**Variáveis de ambiente (frontend/Render):** ver **docs/env-variaveis.md** (lista completa, URL deste projeto, onde obter chave anon via Dashboard ou MCP `get_publishable_keys`).

---

## Migrations (ordem 00001 → 00032)

Todas em `supabase/migrations/`. Aplicar na ordem (via `npx supabase db push` ou SQL Editor). A 00032 foi aplicada via MCP (apply_migration + execute_sql).

| Arquivo | Descrição |
|--------|-----------|
| 00001_initial_schema.sql | Schema inicial: profiles, units, rooms, user_units, patients, events, notes, insurances, etc. |
| 00002_rls_policies.sql | RLS em profiles, units, rooms, patients, events, notes |
| 00003_patient_relatives.sql | patient_relatives |
| 00004_tickets_assets.sql | tickets, ticket_comments, assets, ticket_categories |
| 00005_config_delete_policies.sql | Políticas de delete |
| 00006_profiles_email.sql | profiles.email |
| 00007_note_templates.sql | note_templates |
| 00008_plano_avaliacoes.sql | treatment_cycles, treatment_goals, note_goals, evaluation_templates, evaluation_instances |
| 00009_attachments.sql | attachments |
| 00010_aba.sql | aba_programs, aba_goals |
| 00011_storage_bucket_attachments.sql | RLS storage bucket attachments |
| 00012_storage_bucket_avatars.sql | RLS storage bucket avatars |
| 00013_note_goals.sql | note_goals |
| 00014_storage_bucket_patients.sql | RLS storage bucket patients |
| 00015_notes_addendum.sql | notes.addendum |
| 00016_patient_tags.sql | patients.tags |
| 00017_aba_templates.sql | aba_templates |
| 00018_aba_session_data.sql | aba_session_data |
| 00019_appointment_types.sql | appointment_types |
| 00020_organizations.sql | organizations |
| 00021_patient_document.sql | patients.document |
| 00022_notes_tags.sql | notes.tags |
| 00023_profiles_default_unit.sql | profiles.default_unit_id |
| 00024_realtime_events.sql | Realtime para events |
| 00025_units_tags_events_color.sql | patient_tag_definitions, patient_tag_assignments; units (address, cnpj, phone, email, is_active); events.color_hex; patients.tags |
| 00026_profiles_extra_fields.sql | profiles.phone, job_title, bio |
| 00027_schema_cache_sync.sql | Sincronização de colunas (evita schema cache) |
| 00028_storage_rls_relax_authenticated.sql | Storage: políticas relaxadas para autenticados |
| 00029_config_job_titles_specialties.sql | config_job_titles, config_specialties (CRUD admin; uso em Meu Perfil para especialidades) |
| 00030_aba_template_goals.sql | aba_template_goals (metas por template ABA) |
| 00031_units_cep.sql | units.cep (fuso horário por CEP) |
| 00032_docs_role_permissions.sql | Tabela docs_role_permissions + comentário em app_role; RLS SELECT para authenticated. |

---

## Tabelas principais (schema público)

- **profiles** – id, full_name, avatar_url, email, phone, job_title, bio, council_*, specialties, is_blocked, default_unit_id
- **units** – id, name, timezone, organization_id, address, cnpj, phone, email, is_active
- **rooms** – id, unit_id, name
- **user_units** – user_id, unit_id, role (admin, coordenador, secretaria, profissional, estagiario, ti)
- **patients** – id, full_name, birth_date, photo_url, address, document, insurance_id, tags[], summary, alerts, diagnoses, medications, allergies, routine_notes
- **patient_units** – patient_id, unit_id
- **patient_tag_definitions** – id, name, color_hex
- **patient_tag_assignments** – patient_id, tag_id
- **events** – id, unit_id, room_id, patient_id, responsible_user_id, start_at, end_at, type, status, title, color_hex
- **notes** – id, event_id, author_id, type, content, addendum, finalized_at, cosign_required, cosigned_at
- **attachments** – id, patient_id, note_id, ticket_id, file_path, file_name, category, created_by
- **insurances**, **ticket_categories**, **tickets**, **ticket_comments**, **assets**, **organizations**
- **evaluation_templates**, **evaluation_instances**, **aba_templates**, **aba_programs**, **aba_goals**, **aba_session_data**
- **note_templates**, **appointment_types**, **treatment_cycles**, **treatment_goals**, **note_goals**, **patient_relatives**
- **config_job_titles**, **config_specialties** – listas admin (especialidades no perfil; cargos eliminados em favor da role em user_units)
- **docs_role_permissions** – tabela de documentação (opcional): criada por `docs/sql-roles-acesso-documentacao.sql`; descreve por role/recurso o que pode SELECT/INSERT/UPDATE/DELETE. RLS: SELECT para authenticated.

---

## Scripts SQL em docs/ (executar no SQL Editor quando necessário)

| Arquivo | Uso |
|--------|-----|
| **sql-criar-usuario-admin.sql** | Criar primeiro usuário admin (auth.users + profiles + user_units com role admin). Exige ao menos uma unidade em `units`. |
| **sql-corrigir-admin-user-units.sql** | Corrigir vínculo admin: inserir/atualizar `user_units` (user_id, unit_id, role = 'admin') se o admin não vê CRUDs em Configurações ou botões Novo paciente / Criar agendamento. |
| **sql-roles-acesso-documentacao.sql** | Documentação de roles: cria `docs_role_permissions` e preenche matriz admin, coordenador, secretaria, profissional, estagiario, ti × recursos (profiles, units, events, patients, etc.). Não altera RLS. |

---

## Roles (app_role em user_units)

Papéis por unidade: **admin**, **coordenador**, **secretaria**, **profissional**, **estagiario**, **ti**. Detalhe do que cada um acessa/altera: tabela `docs_role_permissions` (após rodar `docs/sql-roles-acesso-documentacao.sql`) ou blueprint. No frontend: Configurações exibem abas CRUD se o usuário é admin em **qualquer** unidade (`isAdminInAnyUnit`); Pacientes/Agenda usam a role na unidade ativa.

---

## Storage (buckets)

| Bucket | Público | Uso |
|--------|---------|-----|
| avatars | sim | Fotos de perfil (profiles.avatar_url). **Importar foto:** Meu Perfil → Enviar foto (lib/avatars.ts). |
| attachments | sim | Anexos de prontuário/chamados/notas (tabela attachments). |
| patients | sim | Fotos de pacientes (patients.photo_url). |

Criação: script `frontend/scripts/create-storage-buckets.mjs` (com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY) ou criar manualmente no Dashboard. Políticas RLS nas migrations 00011, 00012, 00014.

---

## Edge Functions

| Nome | Descrição | JWT |
|------|-----------|-----|
| invite-user | Convite por e-mail (admin); usa auth.admin.inviteUserByEmail | verify_jwt: true; checa role admin em user_units |
| reset-password | Gera link de redefinição de senha (admin) | verify_jwt: true; checa role admin em user_units |
| **create-user** | Cria usuário com e-mail e senha; insere profile e user_units (unidade + role obrigatórios). Body: email, password, full_name?, unit_id, role? | verify_jwt: true; checa admin |
| **set-password** | Admin redefine senha de um usuário. Body: user_id, new_password | verify_jwt: true; checa admin |

Deploy: `npx supabase functions deploy invite-user`, `reset-password`, `create-user`, `set-password` (sem --no-verify-jwt). Código em `supabase/functions/`.

---

## Variáveis de ambiente (frontend / Render)

- **VITE_SUPABASE_URL** – `https://<PROJECT_REF>.supabase.co`
- **VITE_SUPABASE_ANON_KEY** – Chave anônima (pública) do projeto

Para criar buckets ou usar Admin API no backend: **SUPABASE_SERVICE_ROLE_KEY** (nunca no frontend).

---

## Deploy Render (frontend estático)

- **Build command**: `cd frontend && npm ci && npm run build`
- **Publish directory**: `frontend/dist`
- **Environment**: adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no dashboard do Render.
- **Site URL / Redirect URLs** no Supabase Auth devem incluir a URL do Render (ex.: `https://equidadeplus.onrender.com`).

---

## Regenerar tipos TypeScript (opcional)

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> > frontend/src/types/supabase-generated.ts
```

---

## Referências no repositório

- **PRODUCAO.md** – Checklist completo de produção (migrations, buckets, Edge Functions, SMTP, frontend).
- **supabase/APLICAR_MIGRATIONS.md** – Como aplicar migrations.
- **supabase/DEPLOY_FUNCOES.md** – Deploy das Edge Functions.
- **docs/sql-*.sql** – Scripts opcionais: criar admin, corrigir user_units admin, documentação de roles (ver tabela acima).
