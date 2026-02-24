# Contexto MCP – Sistema Equidade+

Este documento é a referência única para o **MCP Supabase** e para deploy (Render, etc.). Mantenha-o atualizado quando alterar schema, funções ou variáveis.

**Estado atual via MCP (project_id: wwcsmkmwelkgloklbmkw):**
- **URL:** https://wwcsmkmwelkgloklbmkw.supabase.co
- **Migrations:** 15 aplicadas (00001_initial_schema → patient_tag_definitions_and_assignments).
- **Buckets:** avatars, attachments, patients (todos public: true). Conferir: `execute_sql` → `SELECT id, name, public FROM storage.buckets`.
- **Edge Functions:** invite-user, reset-password (ACTIVE, verify_jwt: true).
- **Tabelas public (20):** profiles, units, rooms, user_units, insurances, patients, patient_units, events, notes, patient_relatives, ticket_categories, assets, tickets, ticket_comments, appointment_types, organizations, aba_programs, aba_goals, aba_session_data, patient_tag_definitions, patient_tag_assignments.

Para atualizar: `list_migrations`, `list_edge_functions`, `execute_sql` (storage.buckets), `list_tables` e `get_project_url` com `project_id: wwcsmkmwelkgloklbmkw`.

---

## Supabase – Projeto

- **project_id / ref**: `wwcsmkmwelkgloklbmkw` (projeto **EquidadePlus** no Dashboard).
- **URL do projeto**: https://wwcsmkmwelkgloklbmkw.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/wwcsmkmwelkgloklbmkw
- **Link CLI**: `npx supabase link --project-ref wwcsmkmwelkgloklbmkw`.

Ao usar as ferramentas do MCP Supabase (`list_tables`, `execute_sql`, `apply_migration`, `deploy_edge_function`, etc.), use **project_id**: `wwcsmkmwelkgloklbmkw`.

**Variáveis de ambiente (frontend/Render):** ver **docs/env-variaveis.md** (lista completa, URL deste projeto, onde obter chave anon via Dashboard ou MCP `get_publishable_keys`).

---

## Migrations (ordem 00001 → 00027)

Todas em `supabase/migrations/`. Aplicar na ordem (via `npx supabase db push` ou SQL Editor).

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

---

## Storage (buckets)

| Bucket | Público | Uso |
|--------|---------|-----|
| avatars | sim | Fotos de perfil (profiles.avatar_url) |
| attachments | sim | Anexos de prontuário/chamados/notas |
| patients | sim | Fotos de pacientes |

Criação: script `frontend/scripts/create-storage-buckets.mjs` (com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY) ou criar manualmente no Dashboard. Políticas RLS nas migrations 00011, 00012, 00014.

---

## Edge Functions

| Nome | Descrição | JWT |
|------|-----------|-----|
| invite-user | Convite por e-mail (admin); usa auth.admin.inviteUserByEmail | verify_jwt: true; checa role admin em user_units |
| reset-password | Gera link de redefinição de senha (admin) | verify_jwt: true; checa role admin em user_units |

Deploy: `npx supabase functions deploy invite-user` e `npx supabase functions deploy reset-password` (sem --no-verify-jwt). Código em `supabase/functions/invite-user/index.ts` e `supabase/functions/reset-password/index.ts`.

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
