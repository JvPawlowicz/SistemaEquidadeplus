import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Search, UserPlus, ChevronRight } from 'lucide-react';
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
      <header className="avaliacoes-header">
        <div className="avaliacoes-header-text">
          <h1 className="avaliacoes-title">Avaliações</h1>
          <p className="avaliacoes-desc">
            Selecione um paciente para abrir ou iniciar avaliações no prontuário (anamnese, consentimentos, avaliações internas).
          </p>
        </div>
        <div className="avaliacoes-search-wrap">
          <Search className="avaliacoes-search-icon" size={20} aria-hidden />
          <input
            type="search"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="avaliacoes-search"
            aria-label="Buscar paciente"
          />
        </div>
      </header>

      {loading && (
        <div className="avaliacoes-loading-wrap">
          <span className="loading-spinner" aria-hidden />
          <p className="avaliacoes-loading">Carregando pacientes…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="avaliacoes-empty">
          <div className="avaliacoes-empty-icon-wrap">
            <ClipboardList className="avaliacoes-empty-icon" size={56} aria-hidden />
          </div>
          <h2 className="avaliacoes-empty-title">
            {search.trim() ? 'Nenhum paciente encontrado' : 'Nenhum paciente nesta unidade'}
          </h2>
          <p className="avaliacoes-empty-desc">
            {search.trim()
              ? 'Tente outro termo de busca.'
              : 'Cadastre pacientes na unidade para criar e preencher avaliações no prontuário.'}
          </p>
          {!search.trim() && (
            <Link to="/pacientes" className="avaliacoes-empty-cta">
              <UserPlus size={18} aria-hidden />
              <span>Ir para Pacientes</span>
            </Link>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <section className="avaliacoes-list-section" aria-label="Pacientes para avaliações">
          <p className="avaliacoes-list-count">
            {filtered.length} {filtered.length === 1 ? 'paciente' : 'pacientes'}
          </p>
          <ul className="avaliacoes-list">
            {filtered.map((p) => (
              <li key={p.id} className="avaliacoes-list-item">
                <div className="avaliacoes-list-item-main">
                  <span className="avaliacoes-list-name">{p.full_name}</span>
                  <span className="avaliacoes-list-hint">Abrir prontuário → Avaliações</span>
                </div>
                <button
                  type="button"
                  className="avaliacoes-btn-open"
                  onClick={() => handleOpenAvaliacoes(p.id)}
                  aria-label={`Abrir avaliações de ${p.full_name}`}
                >
                  <span>Abrir avaliações</span>
                  <ChevronRight size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
