# Deploy: Render + Supabase (sem servidor físico)

Com o frontend no **Render** e os dados no **Supabase**, você elimina:
- Servidor físico ou VPS
- Tunnel (Cloudflare ou similar)
- Riscos de queda e manutenção de rede

## 1. Supabase (já é seu backend)

- Crie/use o projeto em [supabase.com](https://supabase.com).
- Aplique as migrations: veja `supabase/APLICAR_MIGRATIONS.md`.
- Em **Project Settings → API** anote:
  - **Project URL** → `VITE_SUPABASE_URL`
  - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 2. Render (frontend estático)

1. Acesse [render.com](https://render.com) e conecte o repositório Git do EquidadePlus.
2. Crie um **Static Site**:
   - **Build Command:** `cd frontend && npm ci && npm run build`
   - **Publish Directory:** `frontend/dist`
3. Em **Environment** do serviço, adicione (valores do projeto: ver **docs/env-variaveis.md**):
   - `VITE_SUPABASE_URL` = `https://wwcsmkmwelkgloklbmkw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = chave anon do Supabase (Dashboard → API → anon public, ou via MCP)
4. Deploy. A URL ficará tipo `https://equidadeplus.onrender.com`.

**Se a página ficar em branco:** as variáveis são usadas no **momento do build**. Confira em **Environment** se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão preenchidos e faça um **novo deploy** (Manual Deploy ou novo push). Depois do deploy com variáveis corretas, a tela de login deve aparecer (ou uma mensagem clara de configuração).

## 3. CORS e URL no Supabase

No Supabase: **Authentication → URL Configuration** (ou **Settings → API**):

- **Site URL:** `https://seu-app.onrender.com` (a URL que o Render der)
- **Redirect URLs:** inclua `https://seu-app.onrender.com/**`

Assim o login e o redirect funcionam no domínio do Render.

## 4. (Opcional) Docker no Render

Se preferir usar o Dockerfile do projeto:

- Crie um **Web Service** no Render.
- Build: Docker; Dockerfile na raiz.
- Defina **Environment** com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (e use como build args no Docker se necessário).

---

Depois do deploy, use a URL do Render no **Kiosk** (ver abaixo) para abrir o sistema em tela cheia nos computadores da empresa.

---

## 5. Kiosk (exe / dmg) para computadores da empresa

Na pasta `kiosk/` há um app Electron que abre o EquidadePlus em **tela cheia (modo kiosk)**.

- **Configurar URL:** edite `kiosk/main.js` e altere `APP_URL` para a URL do Render (ex.: `https://equidadeplus.onrender.com`).
- **Gerar instalador:**
  - macOS: `cd kiosk && npm install && npm run build:mac` → gera `.dmg` em `kiosk/dist/`
  - Windows: `cd kiosk && npm install && npm run build:win` → gera `.exe` em `kiosk/dist/`
- **Testar:** `cd kiosk && npm start`

Detalhes em `kiosk/README.md`.
