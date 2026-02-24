# EquidadePlus — Estrutura do repositório

Estrutura de pastas e convenções para o projeto. Usar como referência ao criar o sistema pelo agent.

---

## 1. Visão geral

```
Sistema-equidadeplus/
├── blueprint.md                 # Especificação funcional (fonte da verdade)
├── README.md                     # Visão geral + links para docs
├── .env.example                  # Variáveis necessárias (Supabase, tunnel)
├── .gitignore
├── docker-compose.yml            # frontend + cloudflared (tunnel)
├── docs/                         # Documentação de escopo e stack
│   ├── 01-stack-e-decisoes.md
│   ├── 02-escopo-fixo.md
│   ├── 03-estrutura-repositorio.md  # este arquivo
│   └── 04-criterios-nao-fugir.md
├── frontend/                     # React (Vite) + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/                  # Supabase client, helpers
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile                # build estático + nginx (ou similar)
└── backend/                      # Opcional; criar só quando a regra exigir
    ├── src/
    ├── package.json
    └── Dockerfile
```

- **Backend:** Pode não existir na fase 1; quando existir, apenas endpoints mínimos (ex.: coassinatura, validações que não couberem em RLS).
- **Supabase:** Configuração e migrations ficam no projeto Supabase (Cloud); pode haver pasta `supabase/migrations` na raiz se quiser versionar SQL.

---

## 2. Frontend — convenções

| Pasta / arquivo | Uso |
|-----------------|-----|
| `src/pages/` | Uma pasta por tela principal: Agenda, Pacientes, Evoluções, Relatórios, Configurações, Login. |
| `src/components/` | Componentes reutilizáveis: layout (Navbar, Sidebar), calendar, drawer de evento, formulários, tabelas. |
| `src/lib/` | Criação do cliente Supabase, funções de auth, formatação de data/fuso. |
| `src/hooks/` | useAuth, useActiveUnit, useAgenda, etc. |
| `src/types/` | Tipos TypeScript alinhados às tabelas e entidades do Supabase. |

- **Roteamento:** React Router; rota padrão após login = `/agenda` (home).
- **Estado global:** Contexto para usuário logado e unidade ativa; o restante pode ser local ou React Query/SWR para cache de dados do Supabase.
- **Chamadas ao Supabase:** Direto do frontend (Auth, Realtime, Storage, queries) respeitando RLS.

---

## 3. Deploy — Docker

- **docker-compose.yml** deve conter:
  - Serviço `frontend`: build do frontend, servir estático (nginx).
  - Serviço `tunnel` (opcional): cloudflared com config para expor o frontend.
- **Variáveis:** Ler de `.env`; documentar em `.env.example` (URL do Supabase, chaves anon/key, token do Cloudflare Tunnel se necessário).
- **Comando alvo:** `docker compose up -d` sobe o necessário para acesso local; com tunnel configurado, acesso externo pela URL do tunnel.

---

## 4. Supabase — organização lógica (no projeto Cloud)

Sugestão de “módulos” por domínio (tabelas/policies):

- **auth / users:** perfis estendidos (nome, foto, conselho, especialidades, unidades, papéis).
- **units:** unidades, fuso, salas (Fase 1: uma organização implícita; sem tabela/crud de organizações).
- **patients:** pacientes, habilitados por unidade, familiares, convênio.
- **agenda:** eventos (atendimentos/reuniões), status, responsável, sala, unidade.
- **notes:** evoluções e atas (vínculo com evento), coassinatura.
- **assessments:** templates e instâncias de avaliações.
- **plans:** ciclos e metas do plano de atendimento.
- **aba:** programas, metas, coleta (se habilitado).
- **tickets / assets:** chamados e ativos.
- **files:** metadados de anexos (Storage para arquivos).

RLS em todas as tabelas filtrando por unidade ativa e papel (conforme `02-escopo-fixo.md`).

---

## 5. Ordem sugerida para o agent implementar

1. **Projeto base:** frontend (Vite + React + TS), roteamento, layout (navbar, dropdown unidade, menu).
2. **Supabase:** projeto no Cloud, tabelas iniciais (users/profile, units, patients, agenda/events, notes).
3. **Auth e unidade ativa:** login, primeiro acesso/ativação, contexto de unidade e fuso.
4. **Agenda:** listagem por unidade/minha agenda, drawer do evento, criação/edição (Admin/Coordenador), finalização de status.
5. **Pacientes e prontuário:** lista, cadastro, abas do prontuário (timeline, dados, familiares, etc.).
6. **Evoluções e editor:** pendências, editor de evolução/ata, coassinatura (possível backend mínimo aqui).
7. **Demais telas:** Avaliações, Plano de Atendimento, ABA, Chamados/Ativos, Relatórios, Configurações.
8. **Deploy:** Dockerfile do frontend, docker-compose, .env.example, README com passos e tunnel.

---

*Este doc define a estrutura para não fugir ao criar o sistema pelo agent.*
