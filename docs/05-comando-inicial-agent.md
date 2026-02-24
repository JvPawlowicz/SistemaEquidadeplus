# Comando inicial para o Agent

Use o texto abaixo numa nova conversa em **modo Agent** para iniciar a implementação do EquidadePlus. O agent vai ler a documentação e começar pelo projeto base do frontend.

---

## Comando para colar no Agent

```
Leia os documentos docs/01-stack-e-decisoes.md, docs/02-escopo-fixo.md e docs/03-estrutura-repositorio.md.

Siga a ordem de implementação do 03-estrutura-repositorio.md. Comece pelo passo 1:

1) Projeto base do frontend: crie a pasta frontend/ com React 18 (Vite) + TypeScript, configure roteamento (React Router), e implemente o layout fixo da aplicação:
   - Navbar no topo com: logo EquidadePlus, dropdown de unidade ativa (placeholder por enquanto), menu (Agenda | Pacientes | Evoluções | Relatórios | Configurações), botão + Chamado, menu do usuário (Meu Perfil + Sair).
   - Página inicial após login deve ser a Agenda (rota /agenda); por enquanto pode ter uma página de Login placeholder e uma página Agenda placeholder.
   - Use a estrutura de pastas definida no doc 03 (src/pages, src/components, src/lib, src/hooks, src/types).

Não crie backend nem configure Supabase ainda. Respeite a stack e o escopo dos docs 01 e 02 (Fase 1: ativação só link manual, uma organização implícita).
```

---

*Depois que o passo 1 estiver pronto, peça ao agent o passo 2 (Supabase: projeto no Cloud, tabelas iniciais), e assim por diante conforme o doc 03.*
