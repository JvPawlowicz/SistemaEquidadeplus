# Corrigir "Unrecognized client_id" e vincular o MCP do Supabase

O erro **"Unrecognized client_id"** acontece quando o Cursor tenta autenticar no MCP do Supabase e o servidor não reconhece o cliente OAuth. Segue como corrigir e vincular de forma estável.

---

## 1. Usar a URL recomendada (sem `project_ref` na primeira conexão)

A documentação oficial do Supabase usa apenas a URL base no “Add to Cursor”. Teste primeiro **sem** `project_ref` para forçar o fluxo OAuth padrão (que costuma usar o client_id correto).

**Edite `.cursor/mcp.json`** e deixe assim:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

Salve o arquivo.

---

## 2. Forçar nova autenticação no Cursor

1. **Reinicie o Cursor** (feche e abra de novo).
2. Abra **Settings** (Cmd/Ctrl + ,) → **Cursor Settings** → **Tools & MCP**.
3. Localize o servidor **supabase**.
4. **Não** use só o botão “Connect”. Em vez disso:
   - Clique no texto **“Needs authentication”** (ou no estado de auth) **abaixo** do nome do servidor.  
   Isso costuma abrir o fluxo OAuth no navegador.
5. Se não abrir nada:
   - Abra **View** → **Output**.
   - No seletor do painel, escolha **“MCP: Supabase”** (ou similar).
   - Procure uma URL que comece com `https://api.supabase.com/v1/oauth/authorize?...`.
   - Copie essa URL, cole no navegador e conclua o login e a autorização da organização.
6. Depois de autorizar, volte ao Cursor e confira em **Tools & MCP** se o supabase aparece como conectado/autenticado.

Com a URL **sem** `project_ref`, você escolhe a organização (e o projeto) na tela de login do Supabase; o MCP terá acesso à org e você pode usar o projeto desejado nas ferramentas.

---

## 3. (Opcional) Escopar de novo para um projeto

Depois de a autenticação funcionar, você pode limitar o MCP a um projeto editando de novo o `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=wwcsmkmwelkgloklbmkw"
    }
  }
}
```

Substitua `wwcsmkmwelkgloklbmkw` pelo **Reference ID** do seu projeto (em **Project Settings** → **General** no dashboard). Reinicie o Cursor após alterar.

---

## 4. Alternativa: autenticar com Personal Access Token (PAT)

Se o OAuth continuar dando “Unrecognized client_id”, use um **token de acesso** em vez do fluxo no navegador. O Cursor pode aceitar header `Authorization` em servidores MCP HTTP.

1. Acesse [Supabase → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
2. Crie um token com os escopos necessários (ex.: acesso à organização/projeto).
3. Em **`.cursor/mcp.json`** use (substitua `SEU_TOKEN` pelo token gerado):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "streamableHttp",
      "url": "https://mcp.supabase.com/mcp?project_ref=wwcsmkmwelkgloklbmkw",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN"
      }
    }
  }
}
```

4. Reinicie o Cursor.

**Nota:** Em algumas versões do Cursor os headers do MCP podem ser ignorados. Se mesmo assim aparecer “Unrecognized client_id” ou “No valid authentication”, o problema é do cliente; nesse caso a solução estável é o fluxo OAuth dos passos 1–2.

---

## 5. Conferir se está vinculado

- Em **Settings** → **Tools & MCP**, o servidor **supabase** deve aparecer como conectado (sem “Needs authentication” ou erro de client_id).
- Você pode perguntar ao assistente: *“Use o MCP do Supabase para listar as tabelas do projeto”* (ou “execute_sql” com um `SELECT 1`). Se responder com resultado do Supabase, o MCP está vinculado e funcionando.

---

## Resumo rápido

| Objetivo | Ação |
|----------|------|
| Corrigir "Unrecognized client_id" | Usar só `https://mcp.supabase.com/mcp` (sem `project_ref`), reiniciar o Cursor e clicar em “Needs authentication” para abrir o OAuth. |
| Vincular ao projeto | Depois de autenticado, opcionalmente colocar `?project_ref=SEU_REF` na URL em `.cursor/mcp.json` e reiniciar. |
| Se OAuth continuar falhando | Gerar um PAT no dashboard do Supabase e testar com `type: "streamableHttp"` e `headers.Authorization`. |

Se após esses passos o erro “Unrecognized client_id” continuar, é provável que seja uma limitação ou bug da combinação Cursor + Supabase MCP (lado do cliente OAuth). Nesse caso, usar o [SQL Editor para aplicar as migrations](08-aplicar-migrations-sql-editor.md) continua sendo a opção estável.
