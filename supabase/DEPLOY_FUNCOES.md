# Publicar Edge Functions (convite e reset de senha)

As funções `invite-user` e `reset-password` precisam ser publicadas no Supabase para os botões **Enviar convite** e **Gerar link de redefinição** (Configurações → Usuários) funcionarem.

## 1. Login e link do projeto

```bash
# Na raiz do repositório (ou na pasta do projeto)
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
```

O `project-ref` está na URL do Dashboard: `https://supabase.com/dashboard/project/SEU_PROJECT_REF`.

## 2. Publicar as funções

```bash
npx supabase functions deploy invite-user
npx supabase functions deploy reset-password
```

As funções exigem usuário autenticado (JWT) e verificam se o usuário é **admin** em alguma unidade. Não use `--no-verify-jwt` em produção.

## 3. Variáveis no Supabase

As funções usam automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente do projeto. Não é necessário configurar nada extra no Dashboard para essas duas.

---

Depois de publicar, teste em **Configurações → Usuários**: “Enviar convite (e-mail)” e “Gerar link de redefinição” por usuário.
