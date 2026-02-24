import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import { useAuth } from '../contexts/AuthContext';
import { fetchPatientsInUnitWithInsurance, fetchPrimaryContactsByPatientIds, type PatientWithInsurance } from '../lib/patients';
import { fetchPatientTagDefinitions } from '../lib/patientTagDefinitions';
import { PatientFormModal } from '../components/PatientFormModal';
import { PatientImportModal } from '../components/PatientImportModal';
import { EmptyState } from '../components/EmptyState';
import './Pacientes.css';

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function Pacientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const { canCreateEditPatient } = useUserRoleInUnit(activeUnitId, user?.id);
  const [patients, setPatients] = useState<PatientWithInsurance[]>([]);
  const [primaryContacts, setPrimaryContacts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientWithInsurance | null>(null);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeUnitId) return;
    queueMicrotask(() => setLoading(true));
    fetchPatientsInUnitWithInsurance(activeUnitId).then(async ({ patients: list }) => {
      setPatients(list);
      const ids = list.map((p) => p.id);
      const map = await fetchPrimaryContactsByPatientIds(ids);
      setPrimaryContacts(map);
      setLoading(false);
    });
  }, [activeUnitId]);

  useEffect(() => {
    fetchPatientTagDefinitions().then(({ definitions }) => {
      const map: Record<string, string> = {};
      (definitions ?? []).forEach((d) => { map[d.name] = d.color_hex; });
      setTagColors(map);
    });
  }, []);

  const filtered = search.trim()
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (p.document ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (primaryContacts[p.id] ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : patients;

  const handleOpenProntuario = (patientId: string) => {
    navigate(`/pacientes/${patientId}`);
  };

  return (
    <div className="pacientes-page">
      <div className="pacientes-toolbar">
        <h1 className="pacientes-title">Pacientes</h1>
        {canCreateEditPatient && (
          <>
            <button
              type="button"
              className="pacientes-btn-import"
              onClick={() => setImportModalOpen(true)}
            >
              Importar planilha
            </button>
            <button
              type="button"
              className="pacientes-btn-new"
              onClick={() => {
                setEditingPatient(null);
                setModalOpen(true);
              }}
            >
              Novo paciente
            </button>
          </>
        )}
      </div>
      <div className="pacientes-search">
        <input
          type="search"
          placeholder="Buscar por nome, documento, responsável ou tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pacientes-search-input"
        />
      </div>
      {loading && (
        <p className="pacientes-loading">
          <span className="loading-spinner" aria-hidden />
          Carregando…
        </p>
      )}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title={search.trim() ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          description={search.trim() ? 'Tente outro termo de busca.' : 'Cadastre o primeiro paciente nesta unidade.'}
          action={
            canCreateEditPatient && !search.trim() ? (
              <button
                type="button"
                className="pacientes-btn-new pacientes-btn-new-empty"
                onClick={() => { setEditingPatient(null); setModalOpen(true); }}
              >
                Novo paciente
              </button>
            ) : null
          }
        />
      ) : (
      <div className="pacientes-table-wrap">
        <table className="pacientes-table">
          <thead>
            <tr>
              <th className="pacientes-th-photo"></th>
              <th>Nome</th>
              <th>Idade</th>
              <th>Convênio</th>
              <th>Responsável</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="pacientes-row"
                onClick={() => handleOpenProntuario(p.id)}
              >
                <td className="pacientes-cell-photo">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="pacientes-photo" />
                  ) : (
                    <div className="pacientes-photo-placeholder">—</div>
                  )}
                </td>
                <td>
                  <span className="pacientes-name">{p.full_name}</span>
                </td>
                <td>{calculateAge(p.birth_date)} anos</td>
                <td>{p.insurance?.name ?? 'Particular'}</td>
                <td>{primaryContacts[p.id] ?? '—'}</td>
                <td>
                  {(p.tags ?? []).length > 0 ? (
                    <span className="pacientes-tags">
                      {(p.tags ?? []).map((t) => (
                        <span
                          key={t}
                          className="pacientes-tag"
                          style={tagColors[t] ? { backgroundColor: tagColors[t], color: '#fff', borderColor: tagColors[t] } : undefined}
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <div className="pacientes-cell-actions">
                    <button
                      type="button"
                      className="pacientes-btn-open"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProntuario(p.id);
                      }}
                    >
                      Abrir
                    </button>
                    {canCreateEditPatient && (
                      <button
                        type="button"
                        className="pacientes-btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPatient(p);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {modalOpen && activeUnitId && (
        <PatientFormModal
          unitId={activeUnitId}
          initialPatient={editingPatient}
          onClose={() => {
            setModalOpen(false);
            setEditingPatient(null);
          }}
          onSaved={() => {
            fetchPatientsInUnitWithInsurance(activeUnitId).then(({ patients: list }) =>
              setPatients(list)
            );
          }}
        />
      )}
      {importModalOpen && activeUnitId && (
        <PatientImportModal
          unitId={activeUnitId}
          onClose={() => setImportModalOpen(false)}
          onSaved={() => {
            fetchPatientsInUnitWithInsurance(activeUnitId).then(({ patients: list }) =>
              setPatients(list)
            );
          }}
        />
      )}
    </div>
  );
}
