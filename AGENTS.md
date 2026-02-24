# Sistema EquidadePlus – Contexto para o Cursor

Este projeto é o **EquidadePlus**: gestão de clínicas multi-unidade (agenda, pacientes, prontuário, evoluções, avaliações, plano de atendimento, ABA, chamados).

## Como abrir e rodar o sistema

- **Frontend (app web):** `cd frontend && npm install && npm run dev`  
  - Abre em **http://localhost:5173**
- **Variáveis:** copiar `frontend/.env.example` para `frontend/.env` e preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- **Supabase:** migrations em `supabase/migrations/` (00001 a 00031). Ver `README.md` e `MCP_CONTEXT.md`.

## Estrutura principal

| Pasta/arquivo | Uso |
|---------------|-----|
| `frontend/` | App React (Vite + TypeScript). Páginas em `src/pages/`, libs em `src/lib/`, componentes em `src/components/`. |
| `supabase/migrations/` | Schema e RLS do banco. Aplicar na ordem. |
| `supabase/functions/` | Edge Functions: `invite-user`, `reset-password`, `create-user`, `set-password`. |
| `.cursor/rules/` | Regras do Cursor (ex.: equidadeplus-supabase-mcp.mdc). |
| `MCP_CONTEXT.md` | Referência para MCP Supabase (project_id, tabelas, buckets). |
| `blueprint.md` | Especificação funcional. |

## Convenções

- **Idioma:** responder em português brasileiro quando o usuário escrever em PT-BR.
- **Pacientes:** criação/edição em `PatientFormModal`; import em lote via planilha em `PatientImportModal` e `frontend/src/lib/patientImport.ts` (modelo XLSX com colunas definidas).
- **Supabase:** usar project_id e schema conforme `MCP_CONTEXT.md` ao usar MCP Supabase.

## Vincular ao Cursor

- Abrir a **pasta raiz** do projeto no Cursor (File → Open Folder → `Sistema- equidadeplus`).
- Este `AGENTS.md` e as regras em `.cursor/rules/` fornecem contexto automático.
- Para rodar o app e testar no navegador: terminal no Cursor com `cd frontend && npm run dev` e acessar http://localhost:5173.
