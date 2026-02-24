# MCP Supabase — Conectar no Cursor

O projeto já inclui a configuração do MCP do Supabase em **`.cursor/mcp.json`**.

---

## 1. Reiniciar o Cursor

Após criar ou alterar `.cursor/mcp.json`, **reinicie o Cursor** (feche e abra de novo) para o servidor MCP ser carregado.

---

## 2. Autenticar

Na primeira vez, o Cursor deve abrir uma janela no navegador para você fazer login na sua conta Supabase e autorizar o acesso ao MCP. Escolha a organização que contém o projeto EquidadePlus.

Se não abrir sozinho:

- Vá em **Settings** → **Cursor Settings** → **Tools & MCP**.
- Localize o servidor **supabase** e use a opção de autenticação indicada (ex.: “Authenticate” ou chamar a ferramenta `mcp_auth`).

---

## 3. Escopar para um projeto (opcional)

Depois de criar o projeto no Supabase, você pode limitar o MCP a esse projeto editando `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=SEU_PROJECT_REF"
    }
  }
}
```

Substitua `SEU_PROJECT_REF` pelo **Reference ID** do projeto (em Project Settings → General no dashboard do Supabase).

---

## 4. O que o agent pode fazer com o MCP

Com o MCP conectado e autenticado, você pode pedir ao agent para:

- **Rodar as migrations** (`execute_sql` ou `apply_migration`) em vez de copiar/colar no SQL Editor.
- **Listar tabelas** e consultar o schema.
- **Gerar tipos TypeScript** a partir do schema.
- **Executar outros SQL** (incluindo o seed) quando precisar.

Exemplo: *“Use o MCP do Supabase para executar o conteúdo de supabase/migrations/00001_initial_schema.sql no meu projeto.”*

---

*Configuração atual em `.cursor/mcp.json`: URL `https://mcp.supabase.com/mcp` (sem project_ref).*
