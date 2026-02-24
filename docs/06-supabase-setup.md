# Supabase — EquidadePlus

Configuração do projeto Supabase Cloud e execução das migrations.

---

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New project**.
3. Preencha:
   - **Name:** EquidadePlus (ou outro).
   - **Database password:** guarde a senha.
   - **Region:** escolha a mais próxima.
4. Aguarde a criação do projeto.
5. No menu lateral: **Project Settings** (ícone de engrenagem) → **API**.
   - Copie **Project URL** e **anon public** (chave pública).

---

## 2. Configurar variáveis no frontend

Na pasta `frontend/`, crie um arquivo `.env` (use o `.env.example` como base):

```bash
cp .env.example .env
```

Edite `.env` e preencha:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Use a **Project URL** e a chave **anon public** do passo 1.

---

## 3. Executar as migrations

As tabelas e políticas RLS estão em `supabase/migrations/`. Você pode rodar de dois jeitos:

### Opção A — SQL Editor no Dashboard

1. No Supabase: **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/migrations/00001_initial_schema.sql`, copie todo o conteúdo e cole no editor.
3. Clique em **Run**. Confira se não há erros.
4. Abra `supabase/migrations/00002_rls_policies.sql`, copie e execute da mesma forma.

### Opção B — Supabase CLI

Se tiver o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e vinculado ao projeto:

```bash
supabase db push
```

Isso aplica todas as migrations da pasta `supabase/migrations/`.

### Opção C — MCP Supabase (Cursor)

Com o [MCP do Supabase conectado](07-mcp-supabase.md) e autenticado, você pode pedir ao agent para rodar as migrations usando as ferramentas `execute_sql` ou `apply_migration` (sem copiar/colar no SQL Editor).

---

## 4. Seed (opcional) — primeira unidade e admin

Após criar o **primeiro usuário** em **Authentication > Users** (ou pelo fluxo de sign up do app):

1. Copie o **User UID** desse usuário.
2. Abra `supabase/seed.sql` e substitua `'SEU_USER_UID_AQUI'` pelo UUID copiado.
3. No **SQL Editor**, execute o conteúdo de `seed.sql`.

Isso cria a primeira unidade (“Unidade Principal”), vincula o usuário a ela como **admin** e insere o convênio “Particular”.

---

## 5. Criar perfil ao cadastrar usuário

O schema tem a tabela `profiles` ligada a `auth.users`. Para criar o perfil automaticamente no sign up, você pode:

- **No frontend:** após `supabase.auth.signUp()` ou no primeiro login, fazer um `upsert` em `profiles` com o `id` do usuário (e opcionalmente `full_name` vindo de `user_meta`).
- **No Supabase:** em **Database > Webhooks**, criar um webhook no evento `auth.users` “insert” que chame uma Edge Function ou insira em `profiles`.

Para a Fase 1, criar o perfil no primeiro acesso no app é suficiente.

---

## Estrutura das migrations

| Arquivo | Conteúdo |
|---------|----------|
| `00001_initial_schema.sql` | Enums (app_role, event_type, event_status, note_type), tabelas: profiles, units, rooms, user_units, insurances, patients, patient_units, events, notes; índices e triggers de `updated_at`. |
| `00002_rls_policies.sql` | Função `get_my_unit_ids()`, RLS em todas as tabelas e políticas de SELECT/INSERT/UPDATE/DELETE por unidade. |
| `00003_patient_relatives.sql` | Tabela patient_relatives (familiares/responsáveis) e RLS. |
| `seed.sql` | Uso opcional: primeira unidade, vínculo user_unit (admin) e convênio “Particular”. |

---

*Depois disso, o próximo passo é integrar o Auth no frontend (login com Supabase, contexto de unidade ativa e dropdown).*
