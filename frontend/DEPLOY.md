# EquidadePlus — Deploy para produção

## Build

```bash
cd frontend
cp .env.example .env
# Edite .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do seu projeto Supabase
npm ci
npm run build
```

A pasta `dist/` conterá os arquivos estáticos. Sirva-a com qualquer servidor HTTP (Nginx, Apache, Vercel, Netlify, Render, etc.) com suporte a SPA (fallback para `index.html` em rotas como `/agenda`, `/pacientes`, etc.).

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto (Supabase Dashboard → Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anon/public (Supabase Dashboard → Settings → API) |

## Checklist pós-deploy

1. **Supabase**: Migrations aplicadas (incl. `00024_realtime_events.sql` se usar agenda em tempo real).
2. **RLS**: Políticas ativas nas tabelas usadas pelo app.
3. **Auth**: Em Supabase → Authentication → URL Configuration, adicione a URL de produção em "Site URL" e em "Redirect URLs".
4. **Storage**: Buckets e políticas de storage configurados se usar upload de fotos/anexos.

## Funcionalidades principais

- **Login** → `/login`
- **Completar perfil** → redirecionamento automático para `/completar-perfil` quando o perfil não tem nome; também acessível por link em Configurações.
- **Agenda, Pacientes, Evoluções, Relatórios, Chamados, Configurações** → menu superior e rotas correspondentes.
- **Prontuário** → por paciente: Timeline, Dados, Familiares, Avaliações, Plano, ABA, Chamados, Arquivos.
- **Real-time** → agenda atualiza em tempo real (tabela `events` na publicação Realtime).
