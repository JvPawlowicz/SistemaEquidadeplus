import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import {
  fetchMinhasPendentes,
  fetchPendentesUnidade,
  fetchCoassinaturasPendentes,
  type EvolucaoRow,
} from '../lib/evolucoes';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import './Evolucoes.css';

type ViewType = 'minhas' | 'unidade' | 'coassinaturas';

export function Evolucoes() {
  const [searchParams] = useSearchParams();
  const eventoId = searchParams.get('evento');
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const { seesUnitAgenda } = useUserRoleInUnit(activeUnitId, user?.id);
  const [view, setView] = useState<ViewType>('minhas');
  const [rows, setRows] = useState<EvolucaoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeUnitId || !user?.id) return;
    queueMicrotask(() => setLoading(true));
    if (view === 'minhas') {
      fetchMinhasPendentes(activeUnitId, user.id).then(setRows).finally(() => setLoading(false));
    } else if (view === 'unidade') {
      fetchPendentesUnidade(activeUnitId).then(setRows).finally(() => setLoading(false));
    } else {
      fetchCoassinaturasPendentes(activeUnitId).then(setRows).finally(() => setLoading(false));
    }
  }, [activeUnitId, user?.id, view]);

  return (
    <div className="evolucoes-page">
      <h1 className="evolucoes-title">Evoluções</h1>
      <div className="evolucoes-tabs">
        <button
          type="button"
          className={`evolucoes-tab ${view === 'minhas' ? 'is-active' : ''}`}
          onClick={() => setView('minhas')}
        >
          Minhas pendências
        </button>
        {seesUnitAgenda && (
          <button
            type="button"
            className={`evolucoes-tab ${view === 'unidade' ? 'is-active' : ''}`}
            onClick={() => setView('unidade')}
          >
            Pendências da unidade
          </button>
        )}
        <button
          type="button"
          className={`evolucoes-tab ${view === 'coassinaturas' ? 'is-active' : ''}`}
          onClick={() => setView('coassinaturas')}
        >
          Coassinaturas pendentes
        </button>
      </div>
      {loading && (
          <p className="evolucoes-loading">
            <span className="loading-spinner" aria-hidden />
            Carregando…
          </p>
        )}
      <div className="evolucoes-table-wrap">
        <table className="evolucoes-table">
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Paciente</th>
              <th>Profissional</th>
              <th>Status</th>
              <th>Evolução</th>
              {view === 'coassinaturas' && <th>Coassinatura</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={view === 'coassinaturas' ? 7 : 6} className="evolucoes-empty">
                  Nenhum registro.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.event_id}>
                <td>{format(new Date(r.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                <td>{r.patient_name ?? '—'}</td>
                <td>{r.responsible_name ?? '—'}</td>
                <td>
                  <span className={`evolucoes-status evolucoes-status-${r.status}`}>{r.status}</span>
                </td>
                <td>{r.evolution_ok ? 'Ok' : 'Pendente'}</td>
                {view === 'coassinaturas' && (
                  <td>{r.cosign_ok ? 'Ok' : 'Pendente'}</td>
                )}
                <td>
                  <Link
                    to={`/evolucoes/editor/${r.event_id}`}
                    className="evolucoes-btn-open"
                  >
                    Abrir evolução
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {eventoId && (
        <p className="evolucoes-hint">
          <Link to={`/evolucoes/editor/${eventoId}`}>Abrir editor do evento</Link>
        </p>
      )}
    </div>
  );
}
