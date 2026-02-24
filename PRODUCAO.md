# Checklist: Sistema Equidade+ para Produção

Siga esta ordem para deixar o sistema pronto para produção (Supabase + frontend).

---

## 1. Banco de dados (migrations)

Aplique todas as migrations no projeto Supabase.

### Opção A – CLI (recomendado)

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

### Opção B – Dashboard

1. No [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Execute, **na ordem**, o conteúdo de cada arquivo em `supabase/migrations/` (00001 até 00027).
3. Se aparecer “already exists” ou “duplicate”, ignore ou pule apenas essa parte.

Migrations importantes para o sistema atual:

- **00001** – Schema inicial (profiles, units, rooms, patients, events, etc.)
- **00016** – Coluna `patients.tags`
- **00025** – Tags de paciente (tabelas + cores), unidades (endereço, CNPJ), eventos (cor)
- **00026** – Perfil (phone, job_title, bio)
- **00027** – Sincronização do schema (evita erros de schema cache)
- **00011, 00012, 00014** – Políticas RLS dos buckets (attachments, avatars, patients)

---

## 2. Storage (buckets)

O app usa três buckets: **avatars**, **attachments**, **patients**.

### Opção A – Script (recomendado)

A partir da pasta **frontend** (usa o `@supabase/supabase-js` já instalado):

```bash
cd frontend
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/create-storage-buckets.mjs
```

Se você tiver um `.env.local` na pasta frontend com `VITE_SUPABASE_URL` e a service role key em alguma variável, pode carregar antes (ex.: `source .env.local` no Linux/Mac ou usar `dotenv-cli`).

### Opção B – Dashboard

1. Supabase Dashboard → **Storage** → **New bucket**.
2. Crie, um por vez:
   - **avatars** – Public: sim (fotos de perfil).
   - **attachments** – Public: sim (anexos de prontuário/chamados).
   - **patients** – Public: sim (fotos de pacientes).

As políticas RLS já estão nas migrations 00011, 00012 e 00014; elas passam a valer assim que os buckets existirem.

### Local (Supabase local)

O `supabase/config.toml` já define os três buckets. Ao rodar `supabase start`, eles são criados automaticamente no ambiente local.

---

## 3. Edge Functions (convite e reset de senha)

1. Login e link (se ainda não fez):
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   ```

2. Deploy das funções (com JWT ativado; apenas admins podem chamar):
   ```bash
   npx supabase functions deploy invite-user
   npx supabase functions deploy reset-password
   ```

3. Não use `--no-verify-jwt` em produção. As funções checam se o usuário autenticado é **admin** em alguma unidade.

Detalhes: `supabase/DEPLOY_FUNCOES.md`.

---

## 4. SMTP (opcional)

Para que convites e redefinição de senha cheguem por e-mail:

1. Supabase Dashboard → **Project Settings** → **Auth** → **SMTP Settings**.
2. Configure um provedor (SendGrid, Resend, etc.).
3. Sem SMTP, o link de convite/reset ainda é retornado pela Edge Function e pode ser copiado e enviado manualmente na tela de Configurações → Usuários.

---

## 5. Frontend em produção

1. **Variáveis de ambiente** no build/hosting:
   - `VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=eyJ...` (chave anônima pública do projeto)

2. Build:
   ```bash
   cd frontend && npm ci && npm run build
   ```

3. Sirva a pasta `frontend/dist` no seu host (Vercel, Netlify, etc.) ou configure o servidor para apontar para ela.

4. Em **Authentication** → **URL Configuration**, configure:
   - **Site URL**: sua URL de produção (ex.: `https://app.equidadeplus.com.br`).
   - **Redirect URLs**: inclua a mesma URL e, se usar, `http://localhost:5173` para dev.

---

## 6. Resumo rápido

| Etapa              | Ação                                                |
|--------------------|-----------------------------------------------------|
| DB                 | `npx supabase db push` (ou rodar migrations no SQL Editor) |
| Buckets            | Script `frontend/scripts/create-storage-buckets.mjs` ou criar no Dashboard |
| Edge Functions     | `npx supabase functions deploy invite-user` e `reset-password` |
| SMTP               | Opcional: configurar em Auth → SMTP                  |
| Frontend           | Build com `VITE_SUPABASE_*` e publicar `frontend/dist` |
| Auth URLs          | Ajustar Site URL e Redirect URLs no Dashboard       |

---

## 7. Schema cache e MCP Supabase

Se aparecer erro **"Could not find the 'X' column in the schema cache"**:

1. Aplique todas as migrations (incluindo **00027_schema_cache_sync.sql**), via `npx supabase db push` ou pelo SQL Editor.
2. O cache do Supabase atualiza após as migrations; em alguns minutos o erro deve sumir. Se persistir, reinicie o projeto no Dashboard (Settings → General → Pause project → Restore) apenas como último recurso.

Para o **MCP Supabase** (Cursor) refletir o schema atual: com o projeto linkado (`supabase link`), as ferramentas do MCP (list_tables, execute_sql, apply_migration, etc.) usam o schema do projeto. Basta aplicar as migrations; não é necessário “atualizar” manualmente a pasta mcps. Contexto completo para o MCP: **MCP_CONTEXT.md** (raiz) e `.cursor/rules/equidadeplus-supabase-mcp.mdc`. Regenerar tipos: `npx supabase gen types typescript --project-id SEU_PROJECT_REF > frontend/src/types/supabase-generated.ts` (opcional).

---

Depois disso, o sistema está pronto para produção: migrations aplicadas, buckets e políticas de storage corretas, edge functions publicadas com verificação de admin, e frontend apontando para o projeto Supabase de produção.
