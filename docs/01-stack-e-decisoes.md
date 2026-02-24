# EquidadePlus — Stack e decisões de arquitetura

Documento de referência para **não fugir** da stack e das decisões combinadas. Qualquer mudança deve ser explícita e documentada aqui.

---

## 1. Stack fixada

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| **Frontend** | React 18+ (Vite) + TypeScript | SPA; sem Next.js. |
| **Backend** | Inicialmente **nenhum**; depois **só quando a regra exigir** | Ver seção 4. |
| **Banco / Auth / Storage / Realtime** | **Supabase (Cloud)** | Não self-hosted. |
| **Deploy** | Docker (frontend + tunnel) no servidor próprio | Um comando sobe tudo. |
| **Acesso externo** | Cloudflare Tunnel | Sem abrir portas no roteador. |
| **Desktop** | Apenas web (navegador) | PWA ou app desktop só em fase posterior. |

---

## 2. Supabase

- **Uso:** Supabase **Cloud** (não self-hosted no Docker).
- **Serviços usados:** Auth, PostgreSQL (Database), Storage, Realtime.
- **Segurança:** Row Level Security (RLS) para filtrar por unidade ativa e papel.
- **Backend próprio:** Só quando a lógica não couber em RLS ou Edge Functions (ex.: coassinatura, validação “Realizado só com evolução”).

---

## 3. Deploy

- **Onde roda:** Servidor próprio do usuário.
- **Forma:** Docker Compose com:
  - Serviço do **frontend** (build estático servido por nginx ou similar).
  - **Cloudflare Tunnel** (container ou binário) expondo o frontend.
- **Não inclui no Docker:** Postgres, Auth nem Realtime (ficam no Supabase Cloud).
- **Objetivo:** Plug and play — após configurar tunnel e variáveis, `docker compose up` sobe o necessário.

---

## 4. Estratégia de backend

- **Fase 1:** Apenas frontend (React) + Supabase Client. Regras possíveis em RLS e, se necessário, Edge Functions.
- **Fase 2:** Se surgir regra que não couber (ex.: fluxo de coassinatura, validações complexas de “Realizado”), criar **backend mínimo em Node (Express)** em um container e chamar só nesses fluxos.
- **Não fazer:** Backend monolítico grande desde o início; duplicar no backend o que o Supabase já resolve.

---

## 5. Equipe e ambiente

- **Equipe:** 1 pessoa (solo).
- **Requisitos de criptografia:** Nenhum além do padrão (HTTPS, Supabase).
- **MCP:** Uso aceito (ex.: MCP Supabase para schema e consultas).

---

## 6. Decisões de Fase 1 (não fugir)

- **Ativação de usuário:** apenas **link manual**. O Admin gera/copia o link de ativação e envia por fora (ex.: WhatsApp, e-mail manual). E-mail SMTP automático pelo Supabase fica para fase posterior.
- **Organização:** **uma organização implícita**. Não há CRUD de Organizações na Fase 1; todas as unidades pertencem a essa org implícita. CRUD de Organizações só se o usuário pedir multi-tenant depois.

---

## 7. Resumo de “não mudar sem documentar”

- Frontend: React (Vite) + TypeScript.
- Supabase: Cloud, não self-hosted.
- Deploy: Docker no servidor próprio + Cloudflare Tunnel.
- Backend: só quando a regra exigir; começar sem.
- Interface: só web; desktop/PWA depois.
- Fase 1: ativação só por link manual; uma organização implícita (sem tela CRUD Organizações).

---

*Última atualização: conforme combinação com o usuário (solo, servidor próprio, mais rápido e simples com Supabase).*
