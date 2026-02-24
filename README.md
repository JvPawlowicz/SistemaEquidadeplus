# EquidadePlus

Sistema self-hosted para gestão de clínicas (multi-unidade), com **Agenda** como centro operacional, prontuário global do paciente, evoluções/atas obrigatórias, avaliações, plano de atendimento, ABA opcional e chamados/ativos para TI.

**Especificação funcional:** [blueprint.md](blueprint.md).

---

## Stack

- **Frontend:** React 18+ (Vite) + TypeScript
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Deploy:** Docker (Nginx) + opcional Cloudflare Tunnel

---

## Entrega do sistema

### Requisitos

- Node.js 20+ (desenvolvimento)
- Conta [Supabase](https://supabase.com) (Cloud)
- Docker (para build de produção)

### 1. Variáveis de ambiente

Copie o exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env
```

Edite `.env`:

- `VITE_SUPABASE_URL`: URL do projeto (ex: `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: chave anônima (Settings → API)

### 2. Supabase: migrations

Execute as migrations **na ordem** pelo **SQL Editor** do Supabase (ou via CLI):

| Ordem | Arquivo | Conteúdo |
|-------|---------|----------|
| 1 | `supabase/migrations/00001_initial_schema.sql` | Schema inicial (profiles, units, rooms, events, notes, patients, etc.) |
| 2 | `supabase/migrations/00002_rls_policies.sql` | RLS e políticas |
| 3 | `supabase/migrations/00003_patient_relatives.sql` | Familiares/responsáveis |
| 4 | `supabase/migrations/00004_tickets_assets.sql` | Chamados, ativos, comentários |
| 5 | `supabase/migrations/00005_config_delete_policies.sql` | Políticas de exclusão |
| 6 | `supabase/migrations/00006_profiles_email.sql` | E-mail em profiles, políticas admin |
| 7 | `supabase/migrations/00007_note_templates.sql` | Templates de texto (evolução/ata) |
| 8 | `supabase/migrations/00008_plano_avaliacoes.sql` | Plano de atendimento, avaliações |
| 9 | `supabase/migrations/00009_attachments.sql` | Anexos (tabela + RLS) |
| 10 | `supabase/migrations/00010_aba.sql` | Programas e metas ABA |
| 11 | `supabase/migrations/00011_storage_bucket_attachments.sql` | Políticas Storage anexos |
| 12 | `supabase/migrations/00012_storage_bucket_avatars.sql` | Políticas Storage avatares |
| 13 | `supabase/migrations/00013_note_goals.sql` | Metas trabalhadas por evolução |
| 14 | `supabase/migrations/00014_storage_bucket_patients.sql` | Políticas Storage fotos pacientes |
| 15 | `supabase/migrations/00015_notes_addendum.sql` | Coluna addendum em notes (adendo na evolução) |
| 16 | `supabase/migrations/00016_patient_tags.sql` | Coluna tags em patients |
| 17 | `supabase/migrations/00017_aba_templates.sql` | Tabela aba_templates |
| 18 | `supabase/migrations/00018_aba_session_data.sql` | Coleta ABA por sessão (evolução) |
| 19 | `supabase/migrations/00019_appointment_types.sql` | Tipos de atendimento por unidade |
| 20 | `supabase/migrations/00020_organizations.sql` | Organizações (multi-tenant) |
| 21 | `supabase/migrations/00021_patient_document.sql` | Coluna document em patients |
| 22 | `supabase/migrations/00022_notes_tags.sql` | Coluna tags em notes |
| 23 | `supabase/migrations/00023_profiles_default_unit.sql` | Unidade padrão do perfil |
| 24 | `supabase/migrations/00024_realtime_events.sql` | Realtime na tabela events (agenda) |
| 25 | `supabase/migrations/00025_units_tags_events_color.sql` | Tags de pacientes, units (endereço, CNPJ, etc.), events.color_hex |
| 26 | `supabase/migrations/00026_profiles_extra_fields.sql` | phone, job_title, bio em profiles |
| 27 | `supabase/migrations/00027_schema_cache_sync.sql` | Sincronização de colunas (schema cache) |
| 28 | `supabase/migrations/00028_storage_rls_relax_authenticated.sql` | Storage: políticas relaxadas para autenticados |
| 29 | `supabase/migrations/00029_config_job_titles_specialties.sql` | config_job_titles, config_specialties (admin; perfil) |
| 30 | `supabase/migrations/00030_aba_template_goals.sql` | Metas por template ABA |
| 31 | `supabase/migrations/00031_units_cep.sql` | Coluna cep em units (fuso por CEP) |

As políticas RLS para os buckets estão nas migrations 00011, 00012, 00014 e 00028.

### 3. Supabase: buckets de Storage

Crie no **Dashboard → Storage** os buckets (todos **públicos** se usar URL pública):

- **attachments** — anexos (prontuário, evento, chamado, etc.)
- **avatars** — foto de perfil do usuário
- **patients** — foto do paciente

### 4. Seed inicial (opcional)

1. Crie um usuário em **Authentication → Users**.
2. Edite `supabase/seed.sql`: substitua `SEU_USER_UID_AQUI` pelo UUID do usuário.
3. Execute o conteúdo no SQL Editor.

Isso cria uma unidade, vincula o usuário como admin, convênio “Particular” e categorias de chamados.

### 5. Desenvolvimento (frontend)

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. Faça login com o usuário criado no Supabase (e-mail/senha).

### 6. Build e Docker (produção)

```bash
docker build -t equidadeplus \
  --build-arg VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=sua_anon_key \
  .
docker run -p 80:80 equidadeplus
```

Ou use `docker-compose.yml` com as variáveis em `.env`.

---

## Funcionalidades implementadas

- **Agenda:** Semana/Dia/Mês/Lista, filtros (status, tipo, sala, profissional, paciente), drawer com detalhes, finalizar (Realizado/Faltou/Cancelado), reabrir com motivo, anexar arquivo, copiar link da reunião.
- **Pacientes:** Lista com foto, idade, convênio, responsável, tags, busca por nome/responsável/tag; cadastro/edição (nome, nascimento, endereço, convênio, tags); **busca de CEP** via [Brasil API (CEP v2)](https://brasilapi.com.br/docs#tag/CEP-V2) no cadastro e em familiares; prontuário com abas: Timeline, Dados, Familiares, Avaliações, Plano de Atendimento, ABA, Chamados, Arquivos; foto do paciente (upload no cabeçalho); habilitar em unidades (admin/coordenador).
- **Evoluções:** Minhas pendências, Pendências da unidade, Coassinaturas pendentes; editor com autosave, templates “push”, finalizar, coassinatura (estagiário); metas trabalhadas nesta sessão (checkbox); secretaria não vê texto.
- **Avaliações:** Templates por unidade (Config); instâncias por paciente; tela de edição/assinatura (JSON); rota `/pacientes/:id/avaliacao/:instanceId`.
- **Plano de Atendimento:** Ciclos e metas no prontuário; CRUD de ciclos e metas; vínculo com evolução (metas trabalhadas).
- **ABA:** Programas e metas no prontuário; CRUD; relatório ABA em Relatórios.
- **Chamados:** Lista, filtros, drawer com comentários e atribuição; novo chamado (com paciente opcional via `?paciente=id`).
- **Relatórios:** Presença, Pendências, Chamados, ABA (metas), Documentos vencendo; export CSV.
- **Configurações:** Unidades, Salas, Convênios, Categorias de chamados, Usuários (bloquear, papéis, remover unidade), Ativos, Templates de texto, Templates de avaliação, **Templates ABA**; preferências (unidade padrão, densidade da agenda).
- **Meu Perfil:** Nome, foto (upload Supabase), conselho (tipo/número/UF), especialidades.
- **Anexos e fotos:** Tudo no Supabase Storage (attachments, avatars, patients).
- **TI:** Menu restrito a Chamados, Relatórios, Meu Perfil e + Chamado; sem Agenda/Pacientes/Evoluções/Configurações.
- **Logout por inatividade:** Aviso “Sessão expirando”, Continuar conectado, Sair.

---

## Documentação adicional

- [docs/06-supabase-setup.md](docs/06-supabase-setup.md) — Setup do projeto Supabase
- [docs/08-aplicar-migrations-sql-editor.md](docs/08-aplicar-migrations-sql-editor.md) — Aplicar migrations pelo SQL Editor
- [docs/10-usuarios-teste-e-verificacao-blueprint.md](docs/10-usuarios-teste-e-verificacao-blueprint.md) — Usuários de teste e verificação
- [docs/env-variaveis.md](docs/env-variaveis.md) — **Variáveis de ambiente** (lista completa, projeto em uso, onde obter chaves)

---

*EquidadePlus — gestão de clínicas multi-unidade.*
# SistemaEquidadeplus
