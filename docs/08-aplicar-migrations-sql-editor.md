# Aplicar migrations e seed no Supabase (sem MCP)

O erro **"Unrecognized client_id"** vem da autenticação do **MCP do Supabase** no Cursor. Você pode ignorar o MCP e aplicar o schema pelo **SQL Editor** do dashboard.

---

## Passos

### 1. Abrir o SQL Editor

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard).
2. Abra o projeto **EquidadePlus** (ref: `wwcsmkmwelkgloklbmkw`).
3. No menu lateral: **SQL Editor** → **New query**.

### 2. Rodar as migrations na ordem

Execute **uma query por vez**, colando o conteúdo de cada arquivo abaixo (na ordem). Se alguma migration já tiver sido aplicada antes, o Supabase pode acusar “object already exists”; nesse caso pule para a próxima.

| Ordem | Arquivo | O que faz |
|-------|---------|-----------|
| 1 | `supabase/migrations/00001_initial_schema.sql` | Enums, tabelas base (profiles, units, rooms, user_units, insurances, patients, patient_units, events, notes), índices e triggers |
| 2 | `supabase/migrations/00002_rls_policies.sql` | Função `get_my_unit_ids`, RLS em todas as tabelas, políticas e `handle_new_user` |
| 3 | `supabase/migrations/00003_patient_relatives.sql` | Tabela `patient_relatives` e RLS |
| 4 | `supabase/migrations/00004_tickets_assets.sql` | `ticket_categories`, `assets`, `tickets`, `ticket_comments`, enums e RLS |
| 5 | `supabase/migrations/00005_config_delete_policies.sql` | Política DELETE em `insurances` |
| 6 | `supabase/migrations/00006_profiles_email.sql` | E-mail em profiles, políticas admin |
| 7 | `supabase/migrations/00007_note_templates.sql` | Templates de texto (evolução/ata) |
| 8 | `supabase/migrations/00008_plano_avaliacoes.sql` | Plano de atendimento, avaliações |
| 9 | `supabase/migrations/00009_attachments.sql` | Tabela e RLS de anexos |
| 10 | `supabase/migrations/00010_aba.sql` | Programas e metas ABA |
| 11 | `supabase/migrations/00011_storage_bucket_attachments.sql` | Políticas Storage (bucket attachments) |
| 12 | `supabase/migrations/00012_storage_bucket_avatars.sql` | Políticas Storage (bucket avatars) |
| 13 | `supabase/migrations/00013_note_goals.sql` | Metas trabalhadas por evolução (note_goals) |
| 14 | `supabase/migrations/00014_storage_bucket_patients.sql` | Políticas Storage (bucket patients) |

**Como fazer:** abra cada arquivo na pasta `supabase/migrations/`, copie **todo** o conteúdo, cole no SQL Editor e clique em **Run**.

### 3. Rodar o seed (uma vez)

1. No Supabase: **Authentication** → **Users** → copie o **User UID** do usuário que será admin.
2. Abra `supabase/seed.sql`.
3. Substitua **`SEU_USER_UID_AQUI`** pelo UUID copiado (em todas as ocorrências).
4. Cole o conteúdo no SQL Editor e execute **Run**.

Isso insere:

- Uma unidade “Unidade Principal”
- O vínculo do usuário com essa unidade como **admin**
- Convênio “Particular”
- Categorias de chamados: TI, Manutenção, Limpeza, Outros

### 4. Conferir se está tudo criado

No **Table Editor**, verifique se existem as tabelas:

- `profiles`, `units`, `rooms`, `user_units`, `insurances`, `patients`, `patient_units`, `events`, `notes`
- `patient_relatives`
- `ticket_categories`, `assets`, `tickets`, `ticket_comments`
- `evaluation_templates`, `evaluation_instances`, `treatment_cycles`, `treatment_goals`
- `attachments`, `aba_programs`, `aba_goals`, `note_goals`

Em **Storage**, crie os buckets: **attachments**, **avatars**, **patients** (conforme README).

Em **Authentication** → **Users** deve existir pelo menos um usuário; após o seed, em `user_units` esse usuário deve aparecer como admin da primeira unidade.

---

## Sobre o "Unrecognized client_id"

Esse erro aparece quando o **plugin/MCP do Supabase** no Cursor tenta autenticar e o Supabase não reconhece o `client_id` do plugin. Não tem relação com o código do EquidadePlus.

- Para **migrations e seed**: use o SQL Editor como acima; não é necessário o MCP.
- Se quiser usar o MCP de novo no futuro: atualize o Cursor e o plugin Supabase; se o erro continuar, é limitação do plugin e seguir pelo SQL Editor é a opção estável.
