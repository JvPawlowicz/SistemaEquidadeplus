import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { fetchPatientsInUnitWithInsurance } from '../lib/patients';
import type { PatientWithInsurance } from '../lib/patients';
import './Avaliacoes.css';

export function Avaliacoes() {
  const navigate = useNavigate();
  const { activeUnitId } = useActiveUnit();
  const [patients, setPatients] = useState<PatientWithInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeUnitId) return;
    setLoading(true);
    fetchPatientsInUnitWithInsurance(activeUnitId).then(({ patients: list }) => {
      setPatients(list);
      setLoading(false);
    });
  }, [activeUnitId]);

  const filtered = search.trim()
    ? patients.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()))
    : patients;

  const handleOpenAvaliacoes = (patientId: string) => {
    navigate(`/pacientes/${patientId}#avaliacoes`);
  };

  return (
    <div className="avaliacoes-page">
      <h1 className="avaliacoes-title">Avaliações</h1>
      <p className="avaliacoes-desc">
        Selecione um paciente para abrir ou iniciar avaliações no prontuário.
      </p>
      <div className="avaliacoes-toolbar">
        <input
          type="search"
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="avaliacoes-search"
        />
      </div>
      {loading && <p className="avaliacoes-loading">Carregando…</p>}
      {!loading && filtered.length === 0 && (
        <div className="avaliacoes-empty">
          <ClipboardList size={48} aria-hidden />
          <p>{search.trim() ? 'Nenhum paciente encontrado.' : 'Nenhum paciente nesta unidade.'}</p>
          {!search.trim() && <Link to="/pacientes" className="avaliacoes-link">Ir para Pacientes</Link>}
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <ul className="avaliacoes-list">
          {filtered.map((p) => (
            <li key={p.id} className="avaliacoes-list-item">
              <span className="avaliacoes-list-name">{p.full_name}</span>
              <button type="button" className="avaliacoes-btn-open" onClick={() => handleOpenAvaliacoes(p.id)}>
                Abrir avaliações
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
