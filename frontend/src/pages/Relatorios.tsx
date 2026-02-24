import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import { fetchEvents, fetchProfessionalsInUnit, type EventWithRelations } from '../lib/agenda';
import { fetchPendentesUnidade, fetchMinhasPendentes, type EvolucaoRow } from '../lib/evolucoes';
import { fetchTicketsInUnit, type TicketWithRelations } from '../lib/tickets';
import { fetchTicketCategories } from '../lib/tickets';
import { fetchExpiringAttachmentsByUnit } from '../lib/attachments';
import { fetchPatientsInUnitWithInsurance } from '../lib/patients';
import { fetchProgramsByPatient, fetchGoalsByProgram } from '../lib/aba';
import { downloadCsv } from '../lib/exportCsv';
import './Relatorios.css';

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  realizado: 'Realizado',
  faltou: 'Faltou',
  cancelado: 'Cancelado',
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

function lastMonth(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function Relatorios() {
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const { seesUnitAgenda } = useUserRoleInUnit(activeUnitId, user?.id);
  const [tab, setTab] = useState<'presenca' | 'pendencias' | 'chamados' | 'aba' | 'documentos'>('presenca');

  const [presencaStart, setPresencaStart] = useState(() => {
    const { start } = lastMonth();
    return start.toISOString().slice(0, 10);
  });
  const [presencaEnd, setPresencaEnd] = useState(() => {
    const end = new Date();
    return end.toISOString().slice(0, 10);
  });
  const [presencaStatus, setPresencaStatus] = useState<string>('');
  const [presencaProfessional, setPresencaProfessional] = useState<string>('');
  const [presencaEvents, setPresencaEvents] = useState<EventWithRelations[]>([]);
  const [presencaLoading, setPresencaLoading] = useState(false);
  const [professionals, setProfessionals] = useState<{ id: string; full_name: string | null }[]>([]);

  const [pendenciasRows, setPendenciasRows] = useState<EvolucaoRow[]>([]);
  const [pendenciasLoading, setPendenciasLoading] = useState(false);

  const [chamadosFilterStatus, setChamadosFilterStatus] = useState<string>('');
  const [chamadosFilterCategory, setChamadosFilterCategory] = useState<string>('');
  const [chamadosTickets, setChamadosTickets] = useState<TicketWithRelations[]>([]);
  const [chamadosCategories, setChamadosCategories] = useState<{ id: string; name: string }[]>([]);
  const [chamadosLoading, setChamadosLoading] = useState(false);

  type AbaRow = { patientName: string; programName: string; goalName: string; targetType: string };
  const [abaRows, setAbaRows] = useState<AbaRow[]>([]);
  const [abaLoading, setAbaLoading] = useState(false);

  const [docExpiring, setDocExpiring] = useState<{ id: string; file_name: string; patient_id: string | null; expires_at: string; category: string }[]>([]);
  const [docExpiringLoading, setDocExpiringLoading] = useState(false);

  useEffect(() => {
    if (!activeUnitId) return;
    fetchProfessionalsInUnit(activeUnitId).then(({ profiles }) => setProfessionals(profiles));
  }, [activeUnitId]);

  useEffect(() => {
    if (!activeUnitId || tab !== 'presenca') return;
    setPresencaLoading(true);
    const start = new Date(presencaStart + 'T00:00:00');
    const end = new Date(presencaEnd + 'T23:59:59');
    fetchEvents(
      activeUnitId,
      start,
      end,
      presencaProfessional || undefined
    ).then(({ events }) => {
      setPresencaEvents(events);
      setPresencaLoading(false);
    });
  }, [activeUnitId, tab, presencaStart, presencaEnd, presencaProfessional]);

  const presencaFiltered = presencaStatus
    ? presencaEvents.filter((e) => e.status === presencaStatus)
    : presencaEvents;

  useEffect(() => {
    if (!activeUnitId || tab !== 'pendencias') return;
    setPendenciasLoading(true);
    if (seesUnitAgenda) {
      fetchPendentesUnidade(activeUnitId).then((rows) => {
        setPendenciasRows(rows);
        setPendenciasLoading(false);
      });
    } else {
      fetchMinhasPendentes(activeUnitId, user?.id ?? '').then((rows) => {
        setPendenciasRows(rows);
        setPendenciasLoading(false);
      });
    }
  }, [activeUnitId, tab, seesUnitAgenda, user?.id]);

  useEffect(() => {
    if (!activeUnitId || tab !== 'chamados') return;
    setChamadosLoading(true);
    fetchTicketCategories().then(({ categories }) =>
      setChamadosCategories(categories.map((c) => ({ id: c.id, name: c.name })))
    );
    fetchTicketsInUnit(activeUnitId, {
      status: chamadosFilterStatus || undefined,
      category_id: chamadosFilterCategory || undefined,
    }).then(({ tickets }) => {
      setChamadosTickets(tickets);
      setChamadosLoading(false);
    });
  }, [activeUnitId, tab, chamadosFilterStatus, chamadosFilterCategory]);

  useEffect(() => {
    if (!activeUnitId || tab !== 'aba') return;
    setAbaLoading(true);
    fetchPatientsInUnitWithInsurance(activeUnitId).then(({ patients }) => {
      const limit = 25;
      const slice = patients.slice(0, limit);
      if (slice.length === 0) {
        setAbaRows([]);
        setAbaLoading(false);
        return;
      }
      const rows: AbaRow[] = [];
      Promise.all(
        slice.map(async (p) => {
          const { programs } = await fetchProgramsByPatient(p.id);
          for (const prog of programs) {
            const { goals } = await fetchGoalsByProgram(prog.id);
            for (const g of goals) {
              rows.push({
                patientName: p.full_name,
                programName: prog.name,
                goalName: g.name,
                targetType: g.target_type ?? '—',
              });
            }
          }
        })
      ).then(() => {
        setAbaRows(rows);
        setAbaLoading(false);
      });
    });
  }, [activeUnitId, tab]);

  useEffect(() => {
    if (!activeUnitId || (tab !== 'documentos' && tab !== 'pendencias')) return;
    setDocExpiringLoading(true);
    fetchExpiringAttachmentsByUnit(activeUnitId).then(({ attachments }) => {
      setDocExpiring(attachments.map((a) => ({
        id: a.id,
        file_name: a.file_name,
        patient_id: a.patient_id,
        expires_at: a.expires_at!,
        category: a.category,
      })));
      setDocExpiringLoading(false);
    });
  }, [activeUnitId, tab]);

  const exportPresenca = () => {
    const rows = presencaFiltered.map((e) => ({
      data: new Date(e.start_at).toLocaleDateString('pt-BR'),
      hora: new Date(e.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      paciente: e.patient?.full_name ?? '—',
      responsavel: e.responsibleProfile?.full_name ?? '—',
      sala: e.room?.name ?? '—',
      status: STATUS_LABEL[e.status] ?? e.status,
    }));
    downloadCsv(rows, `relatorio-presenca-${presencaStart}-${presencaEnd}.csv`, [
      { key: 'data', label: 'Data' },
      { key: 'hora', label: 'Hora' },
      { key: 'paciente', label: 'Paciente' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'sala', label: 'Sala' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const exportPendencias = () => {
    const rows = pendenciasRows.map((r) => ({
      data: new Date(r.start_at).toLocaleString('pt-BR'),
      paciente: r.patient_name ?? '—',
      responsavel: r.responsible_name ?? '—',
      status: r.status,
    }));
    downloadCsv(rows, 'relatorio-pendencias-evolucoes.csv', [
      { key: 'data', label: 'Data' },
      { key: 'paciente', label: 'Paciente' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const exportChamados = () => {
    const rows = chamadosTickets.map((t) => ({
      titulo: t.title,
      categoria: t.category?.name ?? '—',
      prioridade: t.priority,
      status: TICKET_STATUS_LABEL[t.status] ?? t.status,
      data: new Date(t.created_at).toLocaleDateString('pt-BR'),
      autor: (t as TicketWithRelations & { author_profile?: { full_name: string | null } }).author_profile?.full_name ?? '—',
    }));
    downloadCsv(rows, 'relatorio-chamados.csv', [
      { key: 'titulo', label: 'Título' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'prioridade', label: 'Prioridade' },
      { key: 'status', label: 'Status' },
      { key: 'data', label: 'Data' },
      { key: 'autor', label: 'Autor' },
    ]);
  };

  const exportAba = () => {
    downloadCsv(abaRows, 'relatorio-aba-metas.csv', [
      { key: 'patientName', label: 'Paciente' },
      { key: 'programName', label: 'Programa' },
      { key: 'goalName', label: 'Meta' },
      { key: 'targetType', label: 'Tipo alvo' },
    ]);
  };

  const exportDocExpiring = () => {
    const rows = docExpiring.map((d) => ({
      arquivo: d.file_name,
      categoria: d.category,
      vencimento: new Date(d.expires_at).toLocaleDateString('pt-BR'),
      paciente_id: d.patient_id ?? '—',
    }));
    downloadCsv(rows, 'relatorio-documentos-vencendo.csv', [
      { key: 'arquivo', label: 'Arquivo' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'vencimento', label: 'Vencimento' },
      { key: 'paciente_id', label: 'ID Paciente' },
    ]);
  };

  return (
    <div className="relatorios-page">
      <h1 className="relatorios-title">Relatórios</h1>
      <div className="relatorios-tabs">
        <button
          type="button"
          className={`relatorios-tab ${tab === 'presenca' ? 'is-active' : ''}`}
          onClick={() => setTab('presenca')}
        >
          Presença
        </button>
        <button
          type="button"
          className={`relatorios-tab ${tab === 'pendencias' ? 'is-active' : ''}`}
          onClick={() => setTab('pendencias')}
        >
          Pendências (evoluções)
        </button>
        <button
          type="button"
          className={`relatorios-tab ${tab === 'chamados' ? 'is-active' : ''}`}
          onClick={() => setTab('chamados')}
        >
          Chamados
        </button>
        <button
          type="button"
          className={`relatorios-tab ${tab === 'aba' ? 'is-active' : ''}`}
          onClick={() => setTab('aba')}
        >
          ABA (metas)
        </button>
        <button
          type="button"
          className={`relatorios-tab ${tab === 'documentos' ? 'is-active' : ''}`}
          onClick={() => setTab('documentos')}
        >
          Documentos vencendo
        </button>
      </div>

      {tab === 'presenca' && (
        <div className="relatorios-block">
          <div className="relatorios-filters">
            <label>
              De <input type="date" value={presencaStart} onChange={(e) => setPresencaStart(e.target.value)} />
            </label>
            <label>
              Até <input type="date" value={presencaEnd} onChange={(e) => setPresencaEnd(e.target.value)} />
            </label>
            <select value={presencaStatus} onChange={(e) => setPresencaStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={presencaProfessional} onChange={(e) => setPresencaProfessional(e.target.value)}>
              <option value="">Todos os profissionais</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? '—'}</option>
              ))}
            </select>
            <button type="button" className="relatorios-btn-export" onClick={exportPresenca} disabled={presencaFiltered.length === 0}>
              Exportar CSV
            </button>
          </div>
          {presencaLoading && <p className="relatorios-loading"><span className="loading-spinner" aria-hidden /> Carregando…</p>}
          <div className="relatorios-table-wrap">
            <table className="relatorios-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Responsável</th>
                  <th>Sala</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {presencaFiltered.length === 0 && !presencaLoading && (
                  <tr><td colSpan={6} className="relatorios-empty">Nenhum registro.</td></tr>
                )}
                {presencaFiltered.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.start_at).toLocaleDateString('pt-BR')}</td>
                    <td>{new Date(e.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{e.patient?.full_name ?? '—'}</td>
                    <td>{e.responsibleProfile?.full_name ?? '—'}</td>
                    <td>{e.room?.name ?? '—'}</td>
                    <td>{STATUS_LABEL[e.status] ?? e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'pendencias' && (
        <div className="relatorios-block">
          <h2 className="relatorios-subtitle">Evoluções pendentes</h2>
          <div className="relatorios-filters">
            <button type="button" className="relatorios-btn-export" onClick={exportPendencias} disabled={pendenciasRows.length === 0}>
              Exportar CSV
            </button>
            <button
              type="button"
              className="relatorios-btn-export"
              onClick={() => window.print()}
              title="Imprimir / salvar como PDF"
            >
              Exportar PDF (imprimir)
            </button>
          </div>
          {pendenciasLoading && <p className="relatorios-loading"><span className="loading-spinner" aria-hidden /> Carregando…</p>}
          <div className="relatorios-table-wrap">
            <table className="relatorios-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Paciente</th>
                  <th>Responsável</th>
                  <th>Status evento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendenciasRows.length === 0 && !pendenciasLoading && (
                  <tr><td colSpan={5} className="relatorios-empty">Nenhuma pendência.</td></tr>
                )}
                {pendenciasRows.map((r) => (
                  <tr key={r.event_id}>
                    <td>{new Date(r.start_at).toLocaleString('pt-BR')}</td>
                    <td>{r.patient_name ?? '—'}</td>
                    <td>{r.responsible_name ?? '—'}</td>
                    <td>{r.status}</td>
                    <td>
                      <Link to={`/evolucoes/editor/${r.event_id}`} className="relatorios-link-evolucao">Abrir evolução</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="relatorios-subtitle">Documentos vencendo</h2>
          <p className="relatorios-desc">Anexos com validade vencida ou a vencer em 30 dias.</p>
          {docExpiringLoading && <p className="relatorios-loading"><span className="loading-spinner" aria-hidden /> Carregando…</p>}
          <div className="relatorios-table-wrap">
            <table className="relatorios-table">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Categoria</th>
                  <th>Validade</th>
                  <th>Paciente</th>
                </tr>
              </thead>
              <tbody>
                {docExpiring.length === 0 && !docExpiringLoading && (
                  <tr><td colSpan={4} className="relatorios-empty">Nenhum documento vencendo ou a vencer.</td></tr>
                )}
                {docExpiring.map((a) => (
                  <tr key={a.id}>
                    <td>{a.file_name}</td>
                    <td>{a.category}</td>
                    <td>{a.expires_at ? new Date(a.expires_at).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      {a.patient_id ? (
                        <Link to={`/pacientes/${a.patient_id}#arquivos`}>Prontuário</Link>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'chamados' && (
        <div className="relatorios-block">
          <div className="relatorios-filters">
            <select value={chamadosFilterStatus} onChange={(e) => setChamadosFilterStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(TICKET_STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={chamadosFilterCategory} onChange={(e) => setChamadosFilterCategory(e.target.value)}>
              <option value="">Todas as categorias</option>
              {chamadosCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" className="relatorios-btn-export" onClick={exportChamados} disabled={chamadosTickets.length === 0}>
              Exportar CSV
            </button>
          </div>
          {chamadosLoading && <p className="relatorios-loading"><span className="loading-spinner" aria-hidden /> Carregando…</p>}
          <div className="relatorios-table-wrap">
            <table className="relatorios-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Autor</th>
                </tr>
              </thead>
              <tbody>
                {chamadosTickets.length === 0 && !chamadosLoading && (
                  <tr><td colSpan={6} className="relatorios-empty">Nenhum chamado.</td></tr>
                )}
                {chamadosTickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.category?.name ?? '—'}</td>
                    <td>{t.priority}</td>
                    <td>{TICKET_STATUS_LABEL[t.status] ?? t.status}</td>
                    <td>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>{t.author_profile?.full_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'aba' && (
        <div className="relatorios-block">
          <div className="relatorios-filters">
            <button type="button" className="relatorios-btn-export" onClick={exportAba} disabled={abaRows.length === 0}>
              Exportar CSV
            </button>
          </div>
          {abaLoading && <p className="relatorios-loading"><span className="loading-spinner" aria-hidden /> Carregando…</p>}
          <div className="relatorios-table-wrap">
            <table className="relatorios-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Programa</th>
                  <th>Meta</th>
                  <th>Tipo alvo</th>
                </tr>
              </thead>
              <tbody>
                {abaRows.length === 0 && !abaLoading && (
                  <tr><td colSpan={4} className="relatorios-empty">Nenhuma meta ABA na unidade (até 25 pacientes).</td></tr>
                )}
                {abaRows.map((r, i) => (
                  <tr key={`${r.patientName}-${r.programName}-${r.goalName}-${i}`}>
                    <td>{r.patientName}</td>
                    <td>{r.programName}</td>
                    <td>{r.goalName}</td>
                    <td>{r.targetType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="relatorios-block">
          <p className="relatorios-desc">Anexos com validade vencida ou a vencer em 30 dias.</p>
          <div className="relatorios-filters">
            <button type="button" className="relatorios-btn-export" onClick={exportDocExpiring} disabled={docExpiring.length === 0}>
              Exportar CSV
            </button>
          </div>
          {docExpiringLoading && <p className="relatorios-loading"><span className="loading-spinner" aria-hidden /> Carregando…</p>}
          <div className="relatorios-table-wrap">
            <table className="relatorios-table">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Categoria</th>
                  <th>Vencimento</th>
                  <th>Paciente</th>
                </tr>
              </thead>
              <tbody>
                {docExpiring.length === 0 && !docExpiringLoading && (
                  <tr><td colSpan={4} className="relatorios-empty">Nenhum documento vencendo.</td></tr>
                )}
                {docExpiring.map((d) => (
                  <tr key={d.id}>
                    <td>{d.file_name}</td>
                    <td>{d.category}</td>
                    <td>{new Date(d.expires_at).toLocaleDateString('pt-BR')}</td>
                    <td>{d.patient_id ? <Link to={`/pacientes/${d.patient_id}`}>Prontuário</Link> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
