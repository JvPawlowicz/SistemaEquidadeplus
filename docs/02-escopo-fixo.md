# EquidadePlus — Escopo fixo

Resumo do que **está dentro** e do que **está fora** do escopo. O desenvolvimento deve seguir o blueprint; este doc fixa os limites para não fugir.

---

## 1. Objetivo do sistema (dentro do escopo)

- Sistema **self-hosted** para gestão de **clínicas multi-unidade** (mesmo dono).
- **Agenda** como centro operacional (estilo Google Calendar).
- **Prontuário global** do paciente (igual em todas as unidades) com timeline.
- **Evolução** obrigatória (texto livre) para atendimentos; **Ata** (texto livre) para reuniões.
- **Avaliações** (anamnese/consentimentos/avaliações internas) por builder visual.
- **ABA** opcional, integrado ao prontuário e à evolução, sem travar o sistema.
- **Chamados internos + Ativos** (ERP lite) para manutenção/infra/TI.
- **Gestão de usuários e acessos** centralizada no Admin.
- **Home sempre na Agenda** — sem dashboards.

---

## 2. Conceitos obrigatórios

| Conceito | Regra |
|----------|--------|
| **Unidade ativa** | Dropdown no topo; define agenda exibida, fuso horário da UI e pacientes habilitados na unidade. |
| **Prontuário global** | Um por paciente; mesmo conteúdo em todas as unidades; por unidade só muda “habilitado” e onde ocorreu atendimento. |
| **Agenda como núcleo** | Tudo nasce ou aparece a partir da Agenda; não existe dashboard inicial. |
| **Nota obrigatória** | Atendimento → Evolução (texto livre). Reunião → Ata (texto livre). |

---

## 3. Papéis e acesso

- **Papéis:** Admin Global, Coordenador da Unidade, Secretaria, Profissional, Estagiário, TI.
- **Agenda:** Admin/Coordenador/Secretaria veem Agenda da Unidade; Profissional/Estagiário veem Minha Agenda; TI não tem agenda.
- **Criar/editar/transferir agendamentos:** somente Admin e Coordenador.
- **Finalizar status (Realizado/Faltou/Cancelado):** qualquer um exceto TI; Realizado exige evolução com texto; estagiário exige coassinatura.
- **Reabrir:** somente Admin/Coordenador, com motivo obrigatório.
- **Secretaria:** não vê texto de evolução; vê apenas meta (pendente/ok, autor, datas).
- **TI:** acessa apenas Chamados, Ativos, Relatórios de chamados, Meu Perfil.

---

## 4. Fluxo de usuários

- Admin cria usuário (nome, e-mail, unidades, papel por unidade).
- **Fase 1 — Ativação:** apenas **link manual** de ativação (Admin copia/envia o link por fora); usuário acessa o link, define senha e completa perfil (foto, dados pessoais, conselho, especialidades). E-mail SMTP para convite/ativação fica para fase posterior.
- Admin pode: reenviar convite (mostrar/copiar link), novo link de ativação, link de redefinição de senha, forçar logout/revogar sessões, bloquear, remover de unidade, alterar papel.
- Logout visível no menu; logout por inatividade com aviso e opção “Continuar conectado”.

---

## 5. Fuso horário

- Cada unidade tem fuso configurado.
- UI exibe horários no fuso da **unidade ativa**.
- Ao trocar unidade, agenda e horários se ajustam ao fuso correspondente.

---

## 6. Navegação (UI fixa)

- **Navbar fixa no topo:** logo EquidadePlus, dropdown de unidade ativa, menu (Agenda | Pacientes | Evoluções | Relatórios | Configurações), botão + Chamado, menu do usuário (Meu Perfil + Sair).
- **Página inicial:** sempre Agenda (após login).

---

## 7. Telas e funcionalidades (resumo)

- **Agenda (home):** visualizações Semana (padrão), Dia, Mês, Lista; filtros (status, tipo, sala, profissional, paciente); drawer do evento com detalhes, pendências e ações; criação/edição rápida (Admin/Coordenador); finalização com validações.
- **Pacientes:** lista (nome, foto, idade, convênio, responsáveis, tags); busca e filtro; cadastro (Admin/Coordenador/Secretaria); prontuário com abas (Timeline, Dados, Familiares, Avaliações, Plano de Atendimento, ABA, Chamados, Arquivos); habilitar paciente em unidades.
- **Evoluções:** views Minhas pendências, Pendências da unidade, Coassinaturas pendentes; lista com colunas e “Abrir evolução”.
- **Editor Evolução/Ata:** texto livre, autosave, templates, anexos, finalizar (trava), adendo append-only; coassinatura para estagiário.
- **Avaliações:** anamnese, consentimentos (com assinatura), avaliações internas; templates versionados; exportação PDF.
- **Plano de Atendimento:** ciclos (3/6/9/12 meses), metas (título, descrição, categoria, status); marcar metas trabalhadas na evolução.
- **ABA (opcional):** no prontuário (programas, metas, gráficos) e no editor de evolução (coleta: contagem/escala/sim-não).
- **Chamados + Ativos:** abrir chamado (título, descrição, categoria, prioridade, sala/ativo, anexos); lista/kanban; comentários; atribuição; cadastro de ativos; TI só aqui + relatórios.
- **Relatórios:** listas/tabelas filtráveis e exportáveis (presença, pendências, chamados, ABA); sem dashboard nem gráficos gerais.
- **Configurações:** Meu Perfil e Preferências (todos); Admin: CRUDs (Unidades, Salas, Usuários, Tipos de atendimento, Templates, Convênios, Categorias de chamados). **Fase 1:** uma organização implícita (sem CRUD de Organizações); CRUD de Organizações só se houver necessidade futura (multi-tenant).

---

## 8. Arquivos e anexos

- Categorias: Laudo, Termo, Relatório, Imagem, Vídeo, Outros.
- Anexar em: paciente, evento, nota, avaliação, chamado, ativo.
- Validade opcional; vencidos/expirando aparecem em Pendências (sem lembretes automáticos).

---

## 9. Fora do escopo (não fazer)

- **Financeiro** (faturamento, cobrança, NF-e, etc.).
- **Integrações externas** (laboratório, convênio, prontuário externo).
- **Lista de espera.**
- **Lembretes** (e-mail/SMS automáticos de lembrete).
- **Check-in / check-out** de paciente.
- **Dashboard inicial** com gráficos gerais; home é sempre a Agenda.
- **Criptografia especial** além de HTTPS e Supabase (conforme decisão do usuário).

---

## 10. Critérios de aceite (checklist)

- [ ] Login → redireciona para Agenda.
- [ ] Dropdown de unidade altera contexto e fuso horário.
- [ ] Agenda da unidade mostra todos os agendamentos (Admin/Coordenador/Secretaria).
- [ ] Minha agenda mostra só do usuário (Profissional/Estagiário).
- [ ] Finalização de status segue validações e gera nota.
- [ ] Evoluções pendentes visíveis ao responsável e ao admin.
- [ ] Secretaria não vê texto de evolução.
- [ ] Convênios: CRUD no admin e seleção no paciente (default Particular).
- [ ] Meu Perfil disponível para todos.
- [ ] Logout visível + logout por inatividade.

---

*Fonte: blueprint.md. Este doc fixa o escopo para o agent e para o desenvolvedor.*
