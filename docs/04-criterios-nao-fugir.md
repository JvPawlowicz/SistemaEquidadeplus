# EquidadePlus — Critérios para não fugir do escopo

Checklist e regras curtas para o agent e para o desenvolvedor. Antes de implementar algo novo, conferir aqui.

---

## 1. Stack — não mudar sem documentar em `01-stack-e-decisoes.md`

- [ ] Frontend é React (Vite) + TypeScript.
- [ ] Backend só existe se a regra não couber em RLS/Edge Functions.
- [ ] Supabase é Cloud (não self-hosted no Docker).
- [ ] Deploy é Docker no servidor próprio + Cloudflare Tunnel.
- [ ] Não há dashboard inicial; home é sempre a Agenda.

---

## 2. Escopo — não incluir o que está fora (ver `02-escopo-fixo.md`)

- [ ] Não implementar: financeiro, integrações externas, lista de espera, lembretes, check-in/out.
- [ ] Não implementar: dashboard com gráficos gerais; home é Agenda.
- [ ] Não exigir criptografia além de HTTPS e Supabase.
- [ ] **Fase 1:** ativação de usuário apenas por link manual (sem e-mail SMTP automático).
- [ ] **Fase 1:** uma organização implícita (sem CRUD de Organizações).

---

## 3. Regras de negócio — conferir antes de codar

- [ ] Criar/editar/transferir agendamentos: só Admin e Coordenador.
- [ ] Finalizar status (Realizado/Faltou/Cancelado): qualquer um exceto TI; Realizado exige evolução com texto; estagiário exige coassinatura.
- [ ] Reabrir atendimento: só Admin/Coordenador, com motivo obrigatório.
- [ ] Secretaria não vê texto de evolução (só meta: pendente/ok, autor, datas).
- [ ] TI acessa apenas: Chamados, Ativos, Relatórios de chamados, Meu Perfil.
- [ ] Prontuário é global; paciente aparece na unidade só se habilitado nela.
- [ ] Evolução finalizada não edita; correção por adendo (append-only).
- [ ] Fuso horário da UI = fuso da unidade ativa.

---

## 4. UI e navegação — manter fixo

- [ ] Navbar: logo, dropdown unidade ativa, Agenda | Pacientes | Evoluções | Relatórios | Configurações, + Chamado, Meu Perfil + Sair.
- [ ] Após login → sempre redirecionar para Agenda.
- [ ] Menu e rotas respeitam o papel (ex.: TI não vê Agenda).

---

## 5. Antes de cada sessão do agent

- Ler `docs/01-stack-e-decisoes.md` e `docs/02-escopo-fixo.md`.
- Seguir a ordem sugerida em `docs/03-estrutura-repositorio.md` (ou combinar com o usuário).
- Ao adicionar feature, checar se não está em “Fora do escopo” em `02-escopo-fixo.md`.

---

## 6. Se precisar mudar algo

- Atualizar o doc correspondente em `docs/` (stack, escopo ou estrutura).
- Não introduzir nova tech ou tela “fora do escopo” sem o usuário concordar.

---

*Use este doc como checklist para não fugir do escopo ao estruturar e criar o sistema.*
