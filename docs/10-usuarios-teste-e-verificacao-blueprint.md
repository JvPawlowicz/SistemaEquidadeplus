# Usuários de teste por role (EquidadePlus)

Senha de todos: **senha123**

| E-mail | Papel | Uso |
|--------|--------|-----|
| admin@teste.equidadeplus.local | Admin | Agenda unidade, criar/editar eventos, pacientes, evoluções, relatórios, chamados, configurações (CRUDs). |
| coordenador@teste.equidadeplus.local | Coordenador | Igual ao admin na unidade: agenda unidade, criar/editar eventos e pacientes, evoluções, coassinaturas. |
| secretaria@teste.equidadeplus.local | Secretaria | Agenda unidade, pacientes (criar/editar), evoluções (só meta: pendente/ok, sem ver texto). |
| profissional@teste.equidadeplus.local | Profissional | Minha agenda, pacientes (só abrir), evoluções, coassinar, relatórios, chamados. |
| estagiario@teste.equidadeplus.local | Estagiário | Minha agenda, evoluções (escrever e enviar para coassinatura), relatórios, chamados. |
| ti@teste.equidadeplus.local | TI | **Apenas:** Chamados, Ativos, Relatórios (aba Chamados), Meu Perfil. Sem Agenda, Pacientes, Evoluções, Configurações. Home → /chamados. |

Todos estão vinculados à unidade **Unidade Principal** (primeira unidade do seed).

---

## Verificação rápida (blueprint)

- [x] Login → home: Agenda para todos exceto TI; TI → Chamados.
- [x] Dropdown de unidade no topo; troca contexto e fuso.
- [x] Agenda: Admin/Coordenador/Secretaria veem agenda da unidade; Profissional/Estagiário veem “minha agenda”.
- [x] Somente Admin e Coordenador criam/editam eventos (canCreateEditEvents).
- [x] Secretaria não vê texto da evolução (só meta no editor).
- [x] Estagiário: evolução + “Enviar para coassinatura”; Profissional/Coordenador/Admin podem coassinar.
- [x] TI: menu só Chamados, Relatórios, Meu Perfil e + Chamado; sem Agenda, Pacientes, Evoluções, Configurações.
- [x] Pacientes: Admin/Coordenador/Secretaria criam/editam; outros abrem prontuário.
- [x] Convênios: CRUD em Configurações (admin); default Particular.
- [x] Meu Perfil e Sair visíveis para todos.
- [x] Chamados e Ativos: lista, novo chamado, categorias, comentários, status.
- [x] Relatórios: Presença, Pendências, Chamados; exportar CSV.
