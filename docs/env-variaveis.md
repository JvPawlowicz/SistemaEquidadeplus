# Variáveis de ambiente — EquidadePlus

Referência única de **todas** as variáveis do sistema e onde obtê-las.

---

## Projeto Supabase em uso

| Campo | Valor |
|-------|--------|
| **project_id / ref** | `wwcsmkmwelkgloklbmkw` |
| **URL do projeto** | `https://wwcsmkmwelkgloklbmkw.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/wwcsmkmwelkgloklbmkw |

Use esses valores em **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY** (ambos abaixo).

---

## Valores prontos para copiar (frontend / Render)

| Variável | Valor |
|----------|--------|
| **VITE_SUPABASE_URL** | `https://wwcsmkmwelkgloklbmkw.supabase.co` |
| **VITE_SUPABASE_ANON_KEY** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Y3Nta213ZWxrZ2xva2xibWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDU2MjIsImV4cCI6MjA4NzQyMTYyMn0.ar5dSFzF47ZPqnGOFradFb5d0M1fFV2b-gyJ7odfGic` |

Para **SUPABASE_SERVICE_ROLE_KEY** (só scripts locais): Dashboard → Project Settings → API → **service_role** (não colocar no frontend nem no Render).

---

## Onde obter a chave anon (se precisar renovar)

- **Supabase Dashboard:** Project Settings → **API** → **Project API keys** → **anon** (public).
- **MCP Supabase (Cursor):** ferramenta `get_publishable_keys` com `project_id: wwcsmkmwelkgloklbmkw`; usar a key com `"name": "anon"` e `"type": "legacy"`.

---

## Lista de variáveis

### Frontend (obrigatório para build e execução)

Usar no **.env** local (pasta `frontend/` ou raiz) e no **Render → Environment**.

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| **VITE_SUPABASE_URL** | Sim | URL do projeto Supabase | `https://wwcsmkmwelkgloklbmkw.supabase.co` |
| **VITE_SUPABASE_ANON_KEY** | Sim | Chave anon (pública) do projeto | Ver tabela "Valores prontos para copiar" acima |

### Scripts locais (opcional)

Apenas para rodar `frontend/scripts/create-storage-buckets.mjs`. **Não** usar no frontend nem no Render.

| Variável | Descrição |
|----------|-----------|
| **SUPABASE_URL** | Mesmo valor de `VITE_SUPABASE_URL` |
| **SUPABASE_SERVICE_ROLE_KEY** | Supabase Dashboard → Project Settings → API → **service_role** (secret). Nunca expor no frontend. |

### Opcional (Docker + Cloudflare Tunnel)

| Variável | Descrição |
|----------|-----------|
| **TUNNEL_TOKEN** | Token do Cloudflare Tunnel; descomentar no `docker-compose.yml` se usar. |

---

## Uso por ambiente

- **Desenvolvimento local:** copiar `.env.example` para `.env` na raiz ou em `frontend/` e preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- **Render:** preencher as mesmas duas variáveis em **Environment** do serviço; fazer novo deploy após alterar.
- **Docker:** passar as variáveis como build-args ou em `.env` na raiz conforme `README.md`.

Ver também: `DEPLOY.md`, `MCP_CONTEXT.md`, `PRODUCAO.md`.
