# Aplicar migrations no Supabase

Para um **checklist completo de produção** (migrations, buckets, Edge Functions, frontend), veja **`PRODUCAO.md`** na raiz do repositório.

---

## Forma recomendada: CLI

```bash
# Na raiz do repositório
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Isso aplica todas as migrations em `supabase/migrations/` na ordem (00001 até 00027). A 00027 ajuda a evitar erros de schema cache.

---

## Alternativa: SQL Editor no Dashboard

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Execute, **na ordem**, o conteúdo de cada arquivo em `supabase/migrations/` (00001_... até 00027_...).
3. Se aparecer "already exists" ou "duplicate", ignore ou pule apenas essa parte.

Arquivos auxiliares neste diretório (opcionais):

- **apply_00023.sql** – Unidade padrão no perfil (já incluso na migration 00023).
- **migrations_apply_018_020.sql** – Bloco 00018–00020 (ABA, tipos de atendimento, organizações); use só se não for usar `db push`.

Depois de aplicar, teste o frontend com `npm run dev` na pasta `frontend`.
