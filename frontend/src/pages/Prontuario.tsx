import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  fetchPatient,
  fetchPatientTimeline,
  fetchPatientRelatives,
  fetchPatientUnits,
  addPatientToUnit,
  removePatientFromUnit,
  updatePatient,
  type PatientWithInsurance,
  type TimelineItem,
} from '../lib/patients';
import { uploadPatientPhoto } from '../lib/patientPhoto';
import { fetchAllUnits } from '../lib/config';
import { fetchCyclesByPatient, fetchGoalsByCycle } from '../lib/plano';
import { fetchInstancesByPatient, fetchTemplatesByUnit } from '../lib/avaliacoes';
import { fetchAttachmentsByPatient } from '../lib/attachments';
import { fetchProgramsByPatient, fetchGoalsByProgram } from '../lib/aba';
import { fetchTicketsInUnit, type TicketWithRelations } from '../lib/tickets';
import { useAuth } from '../contexts/AuthContext';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import {
  ProntuarioChamados,
  ProntuarioArquivos,
  ProntuarioAvaliacoes,
  ProntuarioPlano,
  ProntuarioAba,
  ProntuarioFamiliares,
} from '../components/ProntuarioTabs';
import type { Unit } from '../types';
import type { PatientRelative, TreatmentCycle, TreatmentGoal, Attachment, AbaProgram, AbaGoal } from '../types';
import './Prontuario.css';

type TabId = 'timeline' | 'dados' | 'familiares' | 'avaliacoes' | 'plano' | 'aba' | 'chamados' | 'arquivos';

const TABS: { id: TabId; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'dados', label: 'Dados do paciente' },
  { id: 'familiares', label: 'Familiares/Responsáveis' },
  { id: 'avaliacoes', label: 'Avaliações' },
  { id: 'plano', label: 'Plano de Atendimento' },
  { id: 'aba', label: 'ABA' },
  { id: 'chamados', label: 'Chamados' },
  { id: 'arquivos', label: 'Arquivos' },
];

type DadosUpdate = Partial<
  Pick<
    PatientWithInsurance,
    'summary' | 'alerts' | 'diagnoses' | 'medications' | 'allergies' | 'routine_notes' | 'address'
  >
>;

function DadosEditaveis({
  patient,
  canEdit,
  onUpdate,
}: {
  patient: PatientWithInsurance;
  canEdit: boolean;
  onUpdate: (u: DadosUpdate) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DadosUpdate>({
    summary: patient.summary ?? '',
    alerts: patient.alerts ?? '',
    diagnoses: patient.diagnoses ?? '',
    medications: patient.medications ?? '',
    allergies: patient.allergies ?? '',
    routine_notes: patient.routine_notes ?? '',
    address: patient.address ?? '',
  });

  useEffect(() => {
    setForm({
      summary: patient.summary ?? '',
      alerts: patient.alerts ?? '',
      diagnoses: patient.diagnoses ?? '',
      medications: patient.medications ?? '',
      allergies: patient.allergies ?? '',
      routine_notes: patient.routine_notes ?? '',
      address: patient.address ?? '',
    });
  }, [patient]);

  const handleSave = async () => {
    setSaving(true);
    await Promise.resolve(onUpdate(form));
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      summary: patient.summary ?? '',
      alerts: patient.alerts ?? '',
      diagnoses: patient.diagnoses ?? '',
      medications: patient.medications ?? '',
      allergies: patient.allergies ?? '',
      routine_notes: patient.routine_notes ?? '',
      address: patient.address ?? '',
    });
    setEditing(false);
  };

  const fields: { key: keyof DadosUpdate; label: string; rows?: number }[] = [
    { key: 'summary', label: 'Resumo do caso', rows: 4 },
    { key: 'alerts', label: 'Alertas', rows: 2 },
    { key: 'diagnoses', label: 'Diagnósticos', rows: 3 },
    { key: 'medications', label: 'Medicamentos', rows: 3 },
    { key: 'allergies', label: 'Alergias', rows: 2 },
    { key: 'routine_notes', label: 'Rotina e observações', rows: 3 },
    { key: 'address', label: 'Endereço', rows: 2 },
  ];

  return (
    <>
      {canEdit && !editing && (
        <div className="prontuario-dados-actions">
          <button type="button" className="prontuario-action-btn" onClick={() => setEditing(true)}>
            Editar dados
          </button>
        </div>
      )}
      {fields.map(({ key, label, rows = 2 }) => (
        <div key={key} className="prontuario-field">
          <label>{label}</label>
          {editing ? (
            <textarea
              className="prontuario-textarea prontuario-textarea-edit"
              value={form[key] ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={rows}
            />
          ) : (
            <pre className="prontuario-text">{(patient[key] as string) || '—'}</pre>
          )}
        </div>
      ))}
      {editing && (
        <div className="prontuario-dados-actions">
          <button
            type="button"
            className="prontuario-action-btn prontuario-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" className="prontuario-action-btn" onClick={handleCancel} disabled={saving}>
            Cancelar
          </button>
        </div>
      )}
    </>
  );
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function Prontuario() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const { role } = useUserRoleInUnit(activeUnitId, user?.id);
  const canEditPatient = role === 'admin' || role === 'coordenador' || role === 'secretaria';
  const canManagePatientUnits = role === 'admin' || role === 'coordenador';

  const handlePatientPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId || !patient) return;
    setPhotoUploading(true);
    const { url, error } = await uploadPatientPhoto(patientId, file);
    e.target.value = '';
    if (error || !url) {
      setPhotoUploading(false);
      return;
    }
    const { error: updateErr } = await updatePatient(patientId, { photo_url: url });
    if (!updateErr) setPatient((p) => (p ? { ...p, photo_url: url } : null));
    setPhotoUploading(false);
  };

  const [patient, setPatient] = useState<PatientWithInsurance | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [relatives, setRelatives] = useState<PatientRelative[]>([]);
  const [patientUnitIds, setPatientUnitIds] = useState<string[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const [cycles, setCycles] = useState<TreatmentCycle[]>([]);
  const [goalsByCycle, setGoalsByCycle] = useState<Record<string, TreatmentGoal[]>>({});
  const [evaluationInstances, setEvaluationInstances] = useState<Array<{ id: string; created_at: string; template?: { id: string; name: string; type: string } | null }>>([]);
  const [evaluationTemplates, setEvaluationTemplates] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [patientTickets, setPatientTickets] = useState<TicketWithRelations[]>([]);
  const [abaPrograms, setAbaPrograms] = useState<AbaProgram[]>([]);
  const [abaGoalsByProgram, setAbaGoalsByProgram] = useState<Record<string, AbaGoal[]>>({});
  const [photoUploading, setPhotoUploading] = useState(false);
  const patientPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.location.hash === '#avaliacoes') setActiveTab('avaliacoes');
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([
      fetchPatient(patientId),
      fetchPatientTimeline(patientId),
      fetchPatientRelatives(patientId),
    ]).then(([p, tl, rel]) => {
      setPatient(p.patient ?? null);
      setTimeline(tl);
      setRelatives(rel.relatives ?? []);
      setLoading(false);
    });
  }, [patientId]);

  useEffect(() => {
    if (!patientId || !canManagePatientUnits || activeTab !== 'dados') return;
    setUnitsLoading(true);
    Promise.all([fetchPatientUnits(patientId), fetchAllUnits()]).then(([pu, u]) => {
      setPatientUnitIds(pu.unitIds);
      setAllUnits(u.units ?? []);
      setUnitsLoading(false);
    });
  }, [patientId, canManagePatientUnits, activeTab]);

  useEffect(() => {
    if (!patientId || activeTab !== 'plano') return;
    fetchCyclesByPatient(patientId).then(({ cycles: c }) => {
      setCycles(c);
      c.forEach((cy) => {
        fetchGoalsByCycle(cy.id).then(({ goals: g }) =>
          setGoalsByCycle((prev) => ({ ...prev, [cy.id]: g }))
        );
      });
    });
  }, [patientId, activeTab]);

  useEffect(() => {
    if (!patientId || activeTab !== 'avaliacoes') return;
    fetchInstancesByPatient(patientId).then(({ instances: i }) =>
      setEvaluationInstances(i as Array<{ id: string; created_at: string; template?: { id: string; name: string; type: string } | null }>)
    );
    if (activeUnitId) fetchTemplatesByUnit(activeUnitId).then(({ templates: t }) => setEvaluationTemplates(t));
  }, [patientId, activeUnitId, activeTab]);

  useEffect(() => {
    if (!patientId || activeTab !== 'arquivos') return;
    fetchAttachmentsByPatient(patientId).then(({ attachments: a }) => setAttachments(a));
  }, [patientId, activeTab]);

  useEffect(() => {
    if (!activeUnitId || !patientId || activeTab !== 'chamados') return;
    fetchTicketsInUnit(activeUnitId, { patient_id: patientId }).then(({ tickets: t }) => setPatientTickets(t));
  }, [activeUnitId, patientId, activeTab]);

  useEffect(() => {
    if (!patientId || activeTab !== 'aba') return;
    fetchProgramsByPatient(patientId).then(({ programs: p }) => {
      setAbaPrograms(p);
      p.forEach((prog) => {
        fetchGoalsByProgram(prog.id).then(({ goals: g }) =>
          setAbaGoalsByProgram((prev) => ({ ...prev, [prog.id]: g }))
        );
      });
    });
  }, [patientId, activeTab]);

  const refreshPlano = useCallback(() => {
    if (!patientId) return;
    fetchCyclesByPatient(patientId).then(({ cycles: c }) => {
      setCycles(c);
      if (c.length === 0) {
        setGoalsByCycle({});
        return;
      }
      const next: Record<string, TreatmentGoal[]> = {};
      let pending = c.length;
      c.forEach((cy) => {
        fetchGoalsByCycle(cy.id).then(({ goals: g }) => {
          next[cy.id] = g;
          pending -= 1;
          if (pending === 0) setGoalsByCycle((prev) => ({ ...prev, ...next }));
        });
      });
    });
  }, [patientId]);

  const refreshAvaliacoes = useCallback(() => {
    if (!patientId) return;
    fetchInstancesByPatient(patientId).then(({ instances: i }) =>
      setEvaluationInstances(i as Array<{ id: string; created_at: string; template?: { id: string; name: string; type: string } | null }>)
    );
    if (activeUnitId) fetchTemplatesByUnit(activeUnitId).then(({ templates: t }) => setEvaluationTemplates(t));
  }, [patientId, activeUnitId]);

  const refreshArquivos = useCallback(() => {
    if (!patientId) return;
    fetchAttachmentsByPatient(patientId).then(({ attachments: a }) => setAttachments(a));
  }, [patientId]);

  const refreshChamados = useCallback(() => {
    if (!activeUnitId || !patientId) return;
    fetchTicketsInUnit(activeUnitId, { patient_id: patientId }).then(({ tickets: t }) => setPatientTickets(t));
  }, [activeUnitId, patientId]);

  const refreshRelatives = useCallback(() => {
    if (!patientId) return;
    fetchPatientRelatives(patientId).then(({ relatives: r }) => setRelatives(r ?? []));
  }, [patientId]);

  const refreshAba = useCallback(() => {
    if (!patientId) return;
    fetchProgramsByPatient(patientId).then(({ programs: p }) => {
      setAbaPrograms(p);
      if (p.length === 0) {
        setAbaGoalsByProgram({});
        return;
      }
      p.forEach((prog) => {
        fetchGoalsByProgram(prog.id).then(({ goals: g }) =>
          setAbaGoalsByProgram((prev) => ({ ...prev, [prog.id]: g }))
        );
      });
    });
  }, [patientId]);

  const handlePatientUnitToggle = async (unitId: string, enabled: boolean) => {
    if (!patientId) return;
    if (enabled) {
      const { error } = await addPatientToUnit(patientId, unitId);
      if (!error) setPatientUnitIds((prev) => [...prev, unitId]);
    } else {
      const { error } = await removePatientFromUnit(patientId, unitId);
      if (!error) setPatientUnitIds((prev) => prev.filter((id) => id !== unitId));
    }
  };

  if (loading || !patient) {
    return (
      <div className="prontuario-page">
        <p className="prontuario-loading">
          {loading ? (
            <>
              <span className="loading-spinner" aria-hidden />
              Carregando…
            </>
          ) : (
            'Paciente não encontrado.'
          )}
        </p>
        <button type="button" className="prontuario-back" onClick={() => navigate('/pacientes')}>
          ← Voltar
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.birth_date);
  const insuranceName = patient.insurance?.name ?? 'Particular';

  return (
    <div className="prontuario-page">
      <div className="prontuario-header">
        <button type="button" className="prontuario-back" onClick={() => navigate('/pacientes')}>
          ← Voltar
        </button>
        <div className="prontuario-header-info">
          <div className="prontuario-header-photo-wrap">
            {patient.photo_url ? (
              <img src={patient.photo_url} alt="" className="prontuario-header-photo" />
            ) : (
              <div className="prontuario-header-photo-placeholder">Foto</div>
            )}
            {canEditPatient && (
              <>
                <input
                  ref={patientPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="prontuario-header-photo-input"
                  onChange={handlePatientPhotoChange}
                  disabled={photoUploading}
                />
                <button
                  type="button"
                  className="prontuario-header-photo-btn"
                  onClick={() => patientPhotoInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  {photoUploading ? 'Enviando…' : 'Alterar foto'}
                </button>
              </>
            )}
          </div>
          <div>
            <h1 className="prontuario-name">{patient.full_name}</h1>
          <p className="prontuario-meta">
            {age} anos · {insuranceName}
          </p>
          {(() => {
            const principais = relatives.filter((r) => r.is_primary_contact || r.is_legal_guardian);
            if (principais.length > 0) {
              return (
                <p className="prontuario-meta prontuario-responsaveis">
                  Responsáveis: {principais.map((r) => r.name).join(', ')}
                </p>
              );
            }
            return null;
          })()}
          <div className="prontuario-actions">
            <Link to={`/agenda?novo=&paciente=${patient.id}`} className="prontuario-action-btn">
              Criar atendimento
            </Link>
            <Link to={`/evolucoes?paciente=${patient.id}`} className="prontuario-action-btn">
              Abrir evolução
            </Link>
            {timeline.length > 0 && (
                <Link to={`/evolucoes/editor/${timeline[0].event_id}`} className="prontuario-action-btn">
                  Abrir última evolução
                </Link>
              )}
            <button
              type="button"
              className="prontuario-action-btn"
              onClick={() => setActiveTab('avaliacoes')}
            >
              Criar avaliação
            </button>
            <button
              type="button"
              className="prontuario-action-btn"
              onClick={() => setActiveTab('aba')}
            >
              Abrir ABA
            </button>
            <Link to={`/chamados?paciente=${patient.id}`} className="prontuario-action-btn">
              Abrir chamados
            </Link>
          </div>
          </div>
        </div>
      </div>

      <div className="prontuario-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`prontuario-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="prontuario-content">
        {activeTab === 'timeline' && (
          <div className="prontuario-timeline">
            {timeline.length === 0 ? (
              <p className="prontuario-empty">Nenhum atendimento ou evento ainda.</p>
            ) : (
              <ul className="prontuario-timeline-list">
                {timeline.map((item) => (
                  <li key={item.id} className="prontuario-timeline-item">
                    <span className="prontuario-timeline-date">
                      {format(new Date(item.start_at), "d MMM yyyy · HH:mm", { locale: ptBR })}
                    </span>
                    <span className="prontuario-timeline-title">{item.title}</span>
                    <span className="prontuario-timeline-status">{item.status}</span>
                    {item.note_finalized !== null && (
                      <span className="prontuario-timeline-note">
                        {item.note_finalized ? 'Evolução ok' : 'Evolução pendente'}
                      </span>
                    )}
                    <Link to={`/evolucoes/editor/${item.event_id}`} className="prontuario-timeline-link">
                      Abrir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'dados' && (
          <div className="prontuario-dados">
            {canManagePatientUnits && (
              <div className="prontuario-field prontuario-unidades">
                <label>Habilitado nas unidades</label>
                {unitsLoading ? (
                  <p className="prontuario-text">Carregando…</p>
                ) : (
                  <ul className="prontuario-unidades-list">
                    {allUnits.map((unit) => (
                      <li key={unit.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={patientUnitIds.includes(unit.id)}
                            onChange={(e) => handlePatientUnitToggle(unit.id, e.target.checked)}
                          />
                          {unit.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <DadosEditaveis
              patient={patient}
              canEdit={canEditPatient}
              onUpdate={async (updates) => {
                if (!patientId) return;
                const { error } = await updatePatient(patientId, updates);
                if (!error && patient) setPatient((p) => (p ? { ...p, ...updates } : null));
              }}
            />
          </div>
        )}

        {activeTab === 'familiares' && (
          <ProntuarioFamiliares
            patientId={patient.id}
            relatives={relatives}
            canEdit={canEditPatient}
            onRefresh={refreshRelatives}
          />
        )}

        {activeTab === 'avaliacoes' && (
          <ProntuarioAvaliacoes
            patientId={patient.id}
            unitId={activeUnitId}
            instances={evaluationInstances}
            templates={evaluationTemplates}
            userId={user?.id}
            onRefresh={refreshAvaliacoes}
          />
        )}
        {activeTab === 'plano' && (
          <ProntuarioPlano
            patientId={patient.id}
            cycles={cycles}
            goalsByCycle={goalsByCycle}
            onRefresh={refreshPlano}
            canEdit={!!(role === 'admin' || role === 'coordenador' || role === 'profissional')}
          />
        )}
        {activeTab === 'aba' && (
          <ProntuarioAba
            patientId={patient.id}
            unitId={activeUnitId}
            programs={abaPrograms}
            goalsByProgram={abaGoalsByProgram}
            onRefresh={refreshAba}
            canEdit={!!(role === 'admin' || role === 'coordenador' || role === 'profissional')}
          />
        )}
        {activeTab === 'chamados' && (
          <ProntuarioChamados
            patientId={patient.id}
            unitId={activeUnitId}
            tickets={patientTickets}
            onRefresh={refreshChamados}
          />
        )}
        {activeTab === 'arquivos' && (
          <ProntuarioArquivos
            patientId={patient.id}
            attachments={attachments}
            userId={user?.id}
            onRefresh={refreshArquivos}
          />
        )}
      </div>
    </div>
  );
}
