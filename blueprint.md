EquidadePlus — Especificação Funcional Completa (Sem stack)
0) Objetivo do sistema

O EquidadePlus é um sistema self-hosted para gestão de clínicas (multi-unidade) com mesmo dono, com foco em:

Agenda como centro operacional (estilo Google Calendar)

Prontuário global do paciente (igual em todas as unidades) com timeline

Evolução obrigatória (texto livre) para atendimentos e Ata (texto livre) para reuniões

Avaliações (anamnese/consentimentos/avaliações internas) por builder visual

ABA opcional integrado ao prontuário e à evolução, sem travar o sistema em ABA

Chamados internos + Ativos (ERP lite) para manutenção/infra/TI

Gestão de usuários e acessos centralizada no Admin

Sem financeiro, sem integrações externas, sem lista de espera, sem lembretes, sem check-in/out

Home sempre na Agenda (sem dashboards)

1) Conceitos principais
1.1 Unidade ativa

O usuário sempre opera dentro de uma Unidade ativa, escolhida por um dropdown no topo.

A unidade ativa define:

a agenda exibida (no caso de admin/coordenador/secretaria)

o fuso horário usado na UI

os pacientes “habilitados” para aquela unidade

1.2 Prontuário global (igual em todas as unidades)

O paciente tem um único prontuário global, com os mesmos dados independentemente da unidade.

O que muda entre unidades é:

se o paciente está habilitado para aparecer na unidade

o local onde atendimentos ocorreram (a unidade do atendimento)

1.3 Agenda como núcleo

Tudo importante nasce ou aparece a partir da Agenda.

Não existe dashboard inicial — após login, sempre abre Agenda.

1.4 Nota obrigatória

Todo item de agenda gera uma nota obrigatória:

Atendimento clínico → Evolução (texto livre)

Reuniões (equipe/fornecedor) → Ata (texto livre)

2) Papéis de usuário e regras de acesso
2.1 Papéis

Admin Global

Coordenador da Unidade

Secretaria

Profissional

Estagiário

TI

2.2 Visões da Agenda por papel

Admin/Coordenador/Secretaria: veem Agenda da Unidade (todos os agendamentos da unidade ativa: todos profissionais e pacientes programados)

Profissional/Estagiário: veem Minha Agenda (somente atendimentos em que são responsáveis + reuniões em que participam)

TI: não tem acesso à agenda

2.3 Governança de agendamentos

Somente Admin e Coordenador podem:

criar atendimentos/reuniões

editar (horário, sala, paciente, profissional, tipo)

transferir responsável

Outros usuários não criam nem editam atendimentos.

2.4 Finalização de atendimento (status)

Qualquer usuário (exceto TI) pode finalizar status em um atendimento:

Realizado

Faltou

Cancelado

Reabrir (voltar para Aberto): somente Admin/Coordenador, com motivo obrigatório.

2.5 Evolução e visualização

Evolução é texto livre e obrigatória.

Secretaria não pode ver texto de evolução clínica; vê apenas meta (pendente/ok, autor, datas).

Profissionais, estagiários, coordenador e admin podem ver texto de evolução conforme o atendimento.

2.6 Estagiário e coassinatura

Estagiário pode escrever evolução.

Para marcar Realizado, se autor for estagiário, é obrigatório:

coassinatura por terapeuta (profissional) ou coordenador, da mesma unidade.

2.7 TI

TI acessa apenas:

Chamados

Ativos

Relatórios de chamados

Meu Perfil

3) Fluxo de usuários (cadastro, convite, reset e bloqueio)
3.1 Criação de usuário (Admin)

Admin cria usuário com:

nome

e-mail

unidades atribuídas

papel em cada unidade

3.2 Cadastro inicial do usuário (primeiro acesso)

Usuário recebe link de ativação (via e-mail SMTP) ou link manual.

No primeiro acesso, o usuário:

define senha

completa perfil:

foto/avatar

dados pessoais relevantes

dados profissionais (conselho: tipo/número/UF) e especialidades

3.3 Reset de senha

Admin pode:

reenviar convite

gerar novo link de ativação

gerar link de redefinição de senha

forçar logout / revogar sessões

3.4 Bloqueio e remoção de acesso

Admin pode:

bloquear usuário

remover usuário de uma unidade

alterar papel em unidade

3.5 Logout e logout por inatividade

Botão Sair (logout) fica visível no menu.

Logout automático por inatividade:

aviso na tela antes de expirar

opção “Continuar conectado”

ao expirar, volta para login

4) Fuso horário por unidade

Cada unidade tem um fuso horário configurado.

A UI sempre exibe horários conforme o fuso da unidade ativa.

Ao trocar unidade ativa, a agenda e horários se ajustam ao fuso correspondente.

5) Estrutura de navegação (UI fixa)
5.1 Layout

Navbar horizontal fixa no topo.

Elementos fixos:

logo EquidadePlus

dropdown de unidade ativa

menu: Agenda | Pacientes | Evoluções | Relatórios | Configurações

botão + Chamado

menu do usuário (Meu Perfil + Sair)

5.2 Página inicial

Após login, sempre abre Agenda.

6) Telas e funcionalidades
6.1 Tela: Agenda (home)
Objetivo

Centralizar operação do dia.

Visualizações

Semana (padrão)

Dia

Mês

Lista (Dia) — tabela dentro da Agenda

Filtros

status: Aberto/Realizado/Faltou/Cancelado (Aberto implícito)

tipo de atendimento

sala

profissional (somente agenda unitária)

paciente

Drawer do evento (painel lateral)

Ao clicar no evento:

mostra detalhes

mostra pendências (evolução/coassinatura)

ações rápidas:

Abrir prontuário (se clínico)

Abrir evolução/ata

Copiar link de reunião (se houver)

Finalizar (Realizado/Faltou/Cancelado)

Reabrir (apenas admin/coordenador)

Editar/Transferir (apenas admin/coordenador)

Anexar arquivo (atalho)

Criação/edição de atendimento (Admin/Coordenador)

Modal único “criação rápida”:

paciente

tipo

profissional responsável

sala

horário

Finalização de status (qualquer usuário exceto TI)

Realizado:

exige evolução com texto

se estagiário autor → exige coassinatura

Faltou/Cancelado:

exige motivo curto

o sistema preenche automaticamente a nota com texto padrão (editável)

6.2 Tela: Pacientes
Objetivo

Listar pacientes habilitados na unidade e acessar prontuário global.

Lista de pacientes

mostra: nome, foto, idade, convênio, responsáveis principais, tags

busca por nome/documento/responsável

filtro por “habilitado na unidade” (implícito)

Cadastro de paciente (Admin/Coordenador/Secretaria)

Campos mínimos:

Nome completo (obrigatório)

Data de nascimento (obrigatório; sistema calcula idade)
Campos recomendados:

Foto

Endereço

Convênio (ou Particular)

Familiares/responsáveis

Prontuário do paciente (dentro de Pacientes)

Ao abrir o paciente:

Cabeçalho com:

foto

idade calculada

convênio

responsáveis principais

botões rápidos:

Criar atendimento (admin/coordenador)

Abrir última evolução

Criar avaliação

Abrir ABA (se habilitado)

Abrir chamados

Abas do prontuário

Timeline única

Dados do paciente (campos grandes)

Familiares/Responsáveis (estendido)

Avaliações (anamnese/consent/avaliações internas)

Plano de Atendimento (ciclos e metas)

ABA (opcional)

Chamados

Arquivos

Dados do paciente (campos grandes)

Campos longos sugeridos:

resumo do caso

alertas

diagnósticos

medicamentos

alergias

rotina e observações gerais

Familiares/Responsáveis (estendido)

Permite múltiplos:

pai, mãe, avô, avó, tutor, responsável legal etc.
Para cada:

nome, parentesco

responsável legal? / contato principal?

telefone(s), e-mail

documento (opcional)

endereço (opcional)

observações (campo longo)

Convênios

Paciente pode ter convênio selecionado.

Se não tiver, fica como Particular.

Habilitar paciente em unidades

Admin (e opcional coordenador) pode “habilitar” o paciente em outras unidades.

Isso controla em quais unidades o paciente aparece nas listas.

6.3 Tela: Evoluções
Objetivo

Gerir obrigatoriedade e pendências.

Views rápidas

Minhas pendências

Pendências da unidade (admin/coordenador)

Coassinaturas pendentes

Lista

Colunas:

data/hora

paciente

profissional responsável

status do atendimento (Aberto/Realizado/Faltou/Cancelado)

evolução pendente/ok

coassinatura pendente/ok

botão “Abrir evolução”

6.4 Tela: Editor de Evolução/Ata
Evolução (atendimento)

texto livre com autosave

templates “push” (modelos de texto)

anexos e tags

finalizar (trava edição)

adendo após finalização (append-only)

Ata (reunião)

texto livre com autosave

template sugerido (participantes, decisões, ações)

Estagiário

Botão “Enviar para coassinatura”

Coassinatura 1 clique por terapeuta/coordenador

6.5 Avaliações (formulários)
Objetivo

Estruturar intake/consent/avaliações internas sem exigir “schema”.

Tipos dentro de “Avaliações”

Anamnese (intake)

Consentimentos/Termos (com assinatura)

Avaliações internas

Funcionamento

Admin mantém biblioteca de templates versionados.

Instâncias são criadas para pacientes e preenchidas.

Consentimentos registram assinatura.

Exportação em PDF.

6.6 Plano de Atendimento (ciclos e metas)
Objetivo

Planejamento clínico em ciclos (3/6/9/12 meses) com metas.

Ciclos

criar ciclo com duração predefinida e datas

ciclo ativo por vez (recomendado)

Metas

cards com:

título

descrição

categoria (opcional)

status (ativa/pausada/concluída)

Na evolução, permitir marcar metas trabalhadas (checkbox).

6.7 ABA (opcional e integrado)

ABA aparece somente:

no prontuário (aba ABA)

no editor de evolução (painel lateral de coleta)

No prontuário

programas ABA

metas ativas

gráficos simples por meta/período

criar programa a partir de template

Na evolução

coleta da sessão:

contagem / escala / sim-não

6.8 Chamados internos + Ativos
Chamados

abrir chamado: título, descrição, categoria, prioridade, sala/ativo opcional, anexos

acompanhar por lista/kanban

comentários e histórico

atribuição para TI/responsável

Ativos

cadastro: nome, tipo, status, sala opcional

histórico de chamados por ativo

TI

acessa somente Chamados/Ativos/Relatórios de chamados.

6.9 Relatórios (sem dashboard)

Sem painel inicial e sem gráficos gerais por padrão.
Relatórios são listas/tabelas filtráveis e exportáveis:

presença: realizado/faltou/cancelado por período/unidade/profissional

pendências: evoluções/coassinaturas

chamados: por categoria/status/ativo

ABA: progresso de metas (se habilitado)

6.10 Configurações
Configurações (todos)

Meu Perfil (editar dados e foto)

Preferências (unidade padrão, densidade agenda)

Configurações (Admin global)

CRUDs:

Organizações (se aplicável)

Unidades (com fuso horário)

Salas (por unidade)

Usuários (criar, vincular a unidades, papéis, reset/bloquear)

Tipos de atendimento

Templates de texto (push)

Templates de avaliações

Templates ABA

Convênios

Categorias de chamados

7) Arquivos e anexos (regras)

Permitir: laudo, termo, PDF, imagem, vídeo e demais necessários.

Categorias fixas: Laudo, Termo, Relatório, Imagem, Vídeo, Outros.

Permitir anexar em: paciente, evento, nota, avaliação, chamado, ativo.

Documentos podem ter validade opcional; vencidos/expirando aparecem em Pendências (sem lembretes).

8) Regras finais de consistência

Somente Admin/Coordenador criam/editam/transferem agendamentos.

Todos exceto TI podem finalizar status (Realizado/Faltou/Cancelado), com validações.

Reabrir somente Admin/Coordenador e com motivo obrigatório.

“Realizado” exige evolução com texto; estagiário exige coassinatura.

Evolução finalizada não edita; correção por adendo.

Paciente é global; aparece na unidade apenas se habilitado nela.

Agenda sempre é a home; sem dashboards.

9) Critérios de aceite (resumo)

Login → Agenda (sempre)

Dropdown de unidade muda contexto e fuso horário

Agenda da unidade mostra todos os agendamentos (A/C/S)

Minha agenda mostra só do usuário (P/I)

Status finaliza com validações e gera nota

Evoluções pendentes visíveis ao responsável e ao admin

Secretaria não lê evolução

Convênios: CRUD do admin e seleção no paciente (default Particular)

Meu Perfil disponível para todos

Logout visível + logout por inatividade

---

10) Status de implementação (fev/2025)

Implementado em conformidade com o blueprint:

- Agenda: Reabrir com motivo obrigatório; Faltou/Cancelado com motivo e nota padrão; filtros (status, tipo, sala, profissional, paciente); abrir modal Editar via URL ?editar=id; Realizado exige evolução finalizada (validação antes de marcar).
- Drawer do evento: Abrir prontuário, Abrir evolução/ata, Editar (admin/coordenador).
- Logout por inatividade: aviso “Sessão expirando”, “Continuar conectado” e “Sair”.
- Config: Usuários (listar, bloquear, remover unidade, papel, instruções convite); Preferências (unidade padrão, densidade agenda); Ativos (CRUD por unidade); Templates de texto (CRUD por unidade, inserção no editor de evolução/ata).
- Prontuário: Habilitar paciente em outras unidades (aba Dados); botão “Abrir chamados” (link para /chamados?paciente=id).
- Chamados: atribuir responsável no drawer; filtro por paciente via ?paciente=id.
- Editor de evolução/ata: templates “push” (dropdown Inserir template); secretaria não vê texto (apenas meta); coassinatura para estagiário.
- UI: fuso horário da unidade exibido no dropdown da navbar.
- Migrations: 00006 (profiles.email, políticas admin/same_unit, assets_delete); 00007 (note_templates).
- Avaliações, Plano de Atendimento, ABA: abas no prontuário implementadas (ciclos/metas, programas ABA, avaliações com templates, arquivos, chamados). Rota de instância de avaliação e Config “Templates de avaliação”.
- Anexos e fotos centralizados no Supabase: bucket attachments (anexos), bucket avatars (foto do usuário), bucket patients (foto do paciente). Meu Perfil: upload de foto, conselho e especialidades.
- Relatórios: Presença, Pendências, Chamados, ABA (metas), Documentos vencendo (anexos com validade). Export CSV em todos.
- Editor de evolução: “Metas trabalhadas nesta sessão” (note_goals) para atendimentos com plano.
- Drawer do evento na Agenda: atalho “Anexar arquivo” (upload com event_id/patient_id).
- Migrations: 00008 a 00014 (plano/avaliações, attachments, ABA, storage attachments/avatars/patients, note_goals).