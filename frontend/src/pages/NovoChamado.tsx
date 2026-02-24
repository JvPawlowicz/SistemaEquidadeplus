import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { createTicket } from '../lib/tickets';
import { fetchTicketCategories } from '../lib/tickets';
import { fetchAllAssetsForUnits } from '../lib/assets';
import { fetchRooms } from '../lib/agenda';
import { fetchPatientsInUnitWithInsurance } from '../lib/patients';
import type { TicketCategory } from '../types';
import type { Asset } from '../types';
import type { Room } from '../types';
import type { PatientWithInsurance } from '../lib/patients';
import './NovoChamado.css';

const PRIORITIES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
] as const;

export function NovoChamado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromQuery = searchParams.get('paciente') ?? '';
  const { activeUnitId, units } = useActiveUnit();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<PatientWithInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<string>('media');
  const [assetId, setAssetId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [patientId, setPatientId] = useState<string>(patientIdFromQuery);

  useEffect(() => {
    if (patientIdFromQuery) queueMicrotask(() => setPatientId(patientIdFromQuery));
  }, [patientIdFromQuery]);

  const unitIds = units.map((u) => u.id);

  useEffect(() => {
    let done = false;
    fetchTicketCategories().then(({ categories: c }) => { if (!done) setCategories(c); });
    fetchAllAssetsForUnits(unitIds).then(({ assets: a }) => { if (!done) setAssets(a); });
    if (activeUnitId) {
      Promise.all([
        fetchRooms(activeUnitId).then(({ rooms: r }) => r),
        fetchPatientsInUnitWithInsurance(activeUnitId).then(({ patients: p }) => p),
      ]).then(([r, p]) => {
        if (!done) {
          setRooms(r);
          setPatients(p);
        }
      });
    }
    queueMicrotask(() => setLoading(false));
    return () => { done = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- unitIds.join(',') evita referência instável
  }, [activeUnitId, unitIds.join(',')]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnitId || !title.trim()) return;
    setSaving(true);
    setError(null);
    const { ticket, error: err } = await createTicket({
      unit_id: activeUnitId,
      title: title.trim(),
      description: description.trim() || undefined,
      category_id: categoryId || undefined,
      priority,
      asset_id: assetId || undefined,
      room_id: roomId || undefined,
      patient_id: patientId || undefined,
    });
    setSaving(false);
    if (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar chamado');
      return;
    }
    if (ticket) navigate('/chamados');
  };

  if (!activeUnitId) {
    return (
      <div className="novo-chamado-page">
        <p>Selecione uma unidade para abrir um chamado.</p>
        <button type="button" onClick={() => navigate('/chamados')}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="novo-chamado-page">
      <div className="novo-chamado-header">
        <h1 className="novo-chamado-title">Novo Chamado</h1>
        <button type="button" className="novo-chamado-back" onClick={() => navigate('/chamados')}>
          ← Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="novo-chamado-form">
        {error && <p className="novo-chamado-error">{error}</p>}

        <label className="novo-chamado-label">
          Título *
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Ex: Computador da sala 2 não liga"
            className="novo-chamado-input"
          />
        </label>

        <label className="novo-chamado-label">
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes do problema..."
            rows={4}
            className="novo-chamado-textarea"
          />
        </label>

        <div className="novo-chamado-row">
          <label className="novo-chamado-label">
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="novo-chamado-select"
            >
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="novo-chamado-label">
            Prioridade
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="novo-chamado-select"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="novo-chamado-label">
          Ativo / Equipamento (opcional)
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="novo-chamado-select"
          >
            <option value="">Nenhum</option>
            {assets.filter((a) => !activeUnitId || a.unit_id === activeUnitId).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>

        <label className="novo-chamado-label">
          Sala (opcional)
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="novo-chamado-select"
          >
            <option value="">Nenhuma</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>

        <label className="novo-chamado-label">
          Paciente (opcional)
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="novo-chamado-select"
          >
            <option value="">Nenhum</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </label>

        <div className="novo-chamado-actions">
          <button type="button" className="novo-chamado-btn-cancel" onClick={() => navigate('/chamados')}>
            Cancelar
          </button>
          <button type="submit" className="novo-chamado-btn-submit" disabled={saving || loading || !title.trim()}>
            {saving ? 'Salvando…' : 'Abrir chamado'}
          </button>
        </div>
      </form>
    </div>
  );
}
