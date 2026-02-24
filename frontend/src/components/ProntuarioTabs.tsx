import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type TicketWithRelations } from '../lib/tickets';
import { createCycle, updateCycle, deleteCycle, createGoal, updateGoal, deleteGoal } from '../lib/plano';
import { createInstance } from '../lib/avaliacoes';
import { uploadAttachment, deleteAttachment, getAttachmentUrl } from '../lib/attachments';
import { createProgram, createGoal as createAbaGoal, deleteProgram, deleteGoal as deleteAbaGoal } from '../lib/aba';
import { fetchSessionDataByGoal } from '../lib/abaSessionData';
import { fetchAbaTemplatesByUnit, type AbaTemplate } from '../lib/abaTemplates';
import { createRelative, updateRelative, deleteRelative, type CreateRelativePayload } from '../lib/patients';
import { fetchCep, formatCep } from '../lib/cep';
import type { TreatmentCycle, TreatmentGoal, Attachment, AbaProgram, AbaGoal, PatientRelative } from '../types';

const GOAL_STATUS_LABEL: Record<string, string> = { ativa: 'Ativa', pausada: 'Pausada', concluida: 'Concluída' };

const STATUS_LABEL: Record<string, string> = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado' };

export function ProntuarioFamiliares({
  patientId,
  relatives,
  canEdit,
  onRefresh,
}: {
  patientId: string;
  relatives: PatientRelative[];
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState<PatientRelative | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [relativeCepInput, setRelativeCepInput] = useState('');
  const [relativeCepLoading, setRelativeCepLoading] = useState(false);
  const [relativeCepError, setRelativeCepError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRelativePayload>({
    name: '',
    relationship: null,
    is_legal_guardian: false,
    is_primary_contact: false,
    phone: null,
    email: null,
    document: null,
    address: null,
    notes: null,
  });

  const openAdd = () => {
    setEditing(null);
    setAdding(true);
    setForm({
      name: '',
      relationship: null,
      is_legal_guardian: false,
      is_primary_contact: false,
      phone: null,
      email: null,
      document: null,
      address: null,
      notes: null,
    });
  };

  const openEdit = (r: PatientRelative) => {
    setAdding(false);
    setEditing(r);
    setForm({
      name: r.name,
      relationship: r.relationship ?? null,
      is_legal_guardian: r.is_legal_guardian,
      is_primary_contact: r.is_primary_contact,
      phone: r.phone ?? null,
      email: r.email ?? null,
      document: r.document ?? null,
      address: r.address ?? null,
      notes: r.notes ?? null,
    });
  };

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      const { error } = await updateRelative(editing.id, form);
      if (!error) { closeForm(); onRefresh(); }
    } else {
      const { error } = await createRelative(patientId, form);
      if (!error) { closeForm(); onRefresh(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este familiar/responsável?')) return;
    const { error } = await deleteRelative(id);
    if (!error) onRefresh();
  };

  const showForm = adding || editing;

  return (
    <div className="prontuario-familiares">
      {canEdit && !showForm && (
        <p className="prontuario-section-actions">
          <button type="button" className="prontuario-btn-primary" onClick={openAdd}>+ Adicionar familiar/responsável</button>
        </p>
      )}
      {showForm && (
        <form onSubmit={handleSave} className="prontuario-form prontuario-relative-form">
          <h3 className="prontuario-form-title">{editing ? 'Editar' : 'Novo'} familiar/responsável</h3>
          <label className="prontuario-form-label">Nome *</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="prontuario-input" required />
          <label className="prontuario-form-label">Parentesco</label>
          <input value={form.relationship ?? ''} onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value || null }))} className="prontuario-input" placeholder="Ex: pai, mãe, avô" />
          <label className="prontuario-form-label">
            <input type="checkbox" checked={form.is_legal_guardian} onChange={(e) => setForm((p) => ({ ...p, is_legal_guardian: e.target.checked }))} />
            Responsável legal
          </label>
          <label className="prontuario-form-label">
            <input type="checkbox" checked={form.is_primary_contact} onChange={(e) => setForm((p) => ({ ...p, is_primary_contact: e.target.checked }))} />
            Contato principal
          </label>
          <label className="prontuario-form-label">Telefone</label>
          <input value={form.phone ?? ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value || null }))} className="prontuario-input" type="tel" />
          <label className="prontuario-form-label">E-mail</label>
          <input value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value || null }))} className="prontuario-input" type="email" />
          <label className="prontuario-form-label">Documento</label>
          <input value={form.document ?? ''} onChange={(e) => setForm((p) => ({ ...p, document: e.target.value || null }))} className="prontuario-input" />
          <label className="prontuario-form-label">CEP</label>
          <div className="prontuario-form-cep-row">
            <input
              type="text"
              value={relativeCepInput}
              onChange={(e) => { setRelativeCepInput(e.target.value.replace(/\D/g, '').slice(0, 8)); setRelativeCepError(null); }}
              placeholder="00000000"
              maxLength={8}
              className="prontuario-input prontuario-input-cep"
            />
            <button
              type="button"
              className="prontuario-btn-secondary"
              onClick={async () => {
                if (relativeCepInput.replace(/\D/g, '').length !== 8) { setRelativeCepError('CEP deve ter 8 dígitos.'); return; }
                setRelativeCepError(null);
                setRelativeCepLoading(true);
                const { data, error: err } = await fetchCep(relativeCepInput);
                setRelativeCepLoading(false);
                if (err) { setRelativeCepError(err); return; }
                if (data) { setForm((p) => ({ ...p, address: data.formattedAddress })); setRelativeCepInput(formatCep(data.cep)); }
              }}
              disabled={relativeCepLoading}
            >
              {relativeCepLoading ? 'Buscando…' : 'Buscar CEP'}
            </button>
          </div>
          {relativeCepError && <span className="prontuario-form-cep-error">{relativeCepError}</span>}
          <label className="prontuario-form-label">Endereço</label>
          <input value={form.address ?? ''} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value || null }))} className="prontuario-input" placeholder="Use Buscar CEP ou digite manualmente" />
          <label className="prontuario-form-label">Observações</label>
          <textarea value={form.notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))} className="prontuario-input prontuario-textarea" rows={3} />
          <div className="prontuario-form-actions">
            <button type="submit" className="prontuario-btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="prontuario-btn-secondary" onClick={closeForm} disabled={saving}>Cancelar</button>
          </div>
        </form>
      )}
      {relatives.length === 0 && !showForm && (
        <p className="prontuario-empty">Nenhum familiar/responsável cadastrado.</p>
      )}
      {relatives.length > 0 && (
        <ul className="prontuario-relatives-list">
          {relatives.map((r) => (
            <li key={r.id} className="prontuario-relative-item">
              <div className="prontuario-relative-info">
                <strong>{r.name}</strong>
                {r.relationship && ` · ${r.relationship}`}
                {r.is_legal_guardian && ' · Responsável legal'}
                {r.is_primary_contact && ' · Contato principal'}
                {r.phone && ` · ${r.phone}`}
                {r.email && ` · ${r.email}`}
                {r.document && ` · Doc: ${r.document}`}
                {r.address && ` · ${r.address}`}
                {r.notes && <div className="prontuario-relative-notes">{r.notes}</div>}
              </div>
              {canEdit && (
                <div className="prontuario-relative-actions">
                  <button type="button" className="prontuario-btn-link" onClick={() => openEdit(r)}>Editar</button>
                  <button type="button" className="prontuario-btn-danger" onClick={() => handleDelete(r.id)}>Excluir</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProntuarioChamados({ patientId, tickets }: { patientId: string; unitId: string | null; tickets: TicketWithRelations[]; onRefresh: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="prontuario-chamados">
      <p className="prontuario-section-actions">
        <Link to={`/chamados/novo?paciente=${patientId}`} className="prontuario-btn-link">+ Novo chamado</Link>
      </p>
      {tickets.length === 0 ? (
        <p className="prontuario-empty">Nenhum chamado deste paciente.</p>
      ) : (
        <ul className="prontuario-list">
          {tickets.map((t) => (
            <li key={t.id} className="prontuario-list-item">
              <span className="prontuario-list-title">{t.title}</span>
              <span className="prontuario-list-meta">{STATUS_LABEL[t.status] ?? t.status}</span>
              <button type="button" className="prontuario-btn-link" onClick={() => navigate(`/chamados?paciente=${patientId}`)}>Abrir</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProntuarioArquivos({ patientId, attachments, userId, onRefresh }: { patientId: string; attachments: Attachment[]; userId: string | undefined; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<Attachment['category']>('outros');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const { error } = await uploadAttachment(file, { patient_id: patientId, category, created_by: userId });
    setUploading(false);
    e.target.value = '';
    if (!error) onRefresh();
  };

  return (
    <div className="prontuario-arquivos">
      <div className="prontuario-section-actions">
        <select value={category} onChange={(e) => setCategory(e.target.value as Attachment['category'])} className="prontuario-select">
          <option value="laudo">Laudo</option>
          <option value="termo">Termo</option>
          <option value="relatorio">Relatório</option>
          <option value="imagem">Imagem</option>
          <option value="video">Vídeo</option>
          <option value="outros">Outros</option>
        </select>
        <input ref={fileInputRef} type="file" className="prontuario-file-input" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        <button type="button" className="prontuario-btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Enviando…' : '+ Anexar arquivo'}
        </button>
      </div>
      {attachments.length === 0 ? (
        <p className="prontuario-empty">Nenhum arquivo anexado. Crie o bucket &quot;attachments&quot; no Storage do Supabase.</p>
      ) : (
        <ul className="prontuario-list">
          {attachments.map((a) => (
            <li key={a.id} className="prontuario-list-item">
              <a href={getAttachmentUrl(a.file_path)} target="_blank" rel="noopener noreferrer" className="prontuario-list-title">{a.file_name}</a>
              <span className="prontuario-list-meta">{a.category}</span>
              <span className="prontuario-list-meta">{format(new Date(a.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              <button type="button" className="prontuario-btn-danger" onClick={async () => { await deleteAttachment(a.id, a.file_path); onRefresh(); }}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProntuarioAvaliacoes({
  patientId,
  unitId: _unitId,
  instances,
  templates,
  userId,
  onRefresh,
}: {
  patientId: string;
  unitId: string | null;
  instances: Array<{ id: string; created_at: string; template?: { id: string; name: string; type: string } | null }>;
  templates: Array<{ id: string; name: string; type: string }>;
  userId: string | undefined;
  onRefresh: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const handleCreate = async () => {
    if (!selectedTemplateId || !userId) return;
    const { error } = await createInstance(patientId, selectedTemplateId, userId);
    if (!error) { setCreating(false); setSelectedTemplateId(''); onRefresh(); }
  };

  return (
    <div className="prontuario-avaliacoes">
      <div className="prontuario-section-actions">
        {!creating && templates.length > 0 && (
          <button type="button" className="prontuario-btn-primary" onClick={() => setCreating(true)}>+ Nova avaliação</button>
        )}
        {creating && (
          <>
            <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="prontuario-select">
              <option value="">Selecionar template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
            <button type="button" className="prontuario-btn-primary" onClick={handleCreate} disabled={!selectedTemplateId}>Criar</button>
            <button type="button" className="prontuario-btn-secondary" onClick={() => { setCreating(false); setSelectedTemplateId(''); }}>Cancelar</button>
          </>
        )}
      </div>
      {instances.length === 0 ? (
        <p className="prontuario-empty">Nenhuma avaliação preenchida. Crie templates em Configurações (admin).</p>
      ) : (
        <ul className="prontuario-list">
          {instances.map((i) => (
            <li key={i.id} className="prontuario-list-item">
              <span className="prontuario-list-title">{i.template?.name ?? 'Avaliação'}</span>
              <span className="prontuario-list-meta">{format(new Date(i.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              <Link to={`/pacientes/${patientId}/avaliacao/${i.id}`} className="prontuario-btn-link">Abrir</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProntuarioPlano({
  patientId,
  cycles,
  goalsByCycle,
  onRefresh,
  canEdit,
}: {
  patientId: string;
  cycles: TreatmentCycle[];
  goalsByCycle: Record<string, TreatmentGoal[]>;
  onRefresh: () => void;
  canEdit: boolean;
}) {
  const [addingCycle, setAddingCycle] = useState(false);
  const [editingCycle, setEditingCycle] = useState<TreatmentCycle | null>(null);
  const [cycleName, setCycleName] = useState('');
  const [cycleMonths, setCycleMonths] = useState(6);
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');
  const [cycleIsActive, setCycleIsActive] = useState(true);
  const [addingGoalCycleId, setAddingGoalCycleId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalStatus, setGoalStatus] = useState<'ativa' | 'pausada' | 'concluida'>('ativa');
  const [editingGoal, setEditingGoal] = useState<TreatmentGoal | null>(null);

  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName.trim() || !cycleStart || !cycleEnd) return;
    if (cycleIsActive && cycles.length > 0) {
      for (const c of cycles) {
        if (editingCycle && c.id === editingCycle.id) continue;
        await updateCycle(c.id, { is_active: false });
      }
    }
    if (editingCycle) {
      const { error } = await updateCycle(editingCycle.id, { name: cycleName, months: cycleMonths, start_date: cycleStart, end_date: cycleEnd, is_active: cycleIsActive });
      if (!error) { setEditingCycle(null); resetCycleForm(); onRefresh(); }
    } else {
      const { error } = await createCycle(patientId, { name: cycleName, months: cycleMonths, start_date: cycleStart, end_date: cycleEnd, is_active: cycleIsActive });
      if (!error) { setAddingCycle(false); resetCycleForm(); onRefresh(); }
    }
  };

  const resetCycleForm = () => {
    setCycleName('');
    setCycleMonths(6);
    setCycleStart('');
    setCycleEnd('');
    setCycleIsActive(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !addingGoalCycleId) return;
    const { error } = await createGoal(addingGoalCycleId, {
      title: goalTitle,
      description: goalDescription.trim() || undefined,
      category: goalCategory.trim() || undefined,
      status: goalStatus,
    });
    if (!error) {
      setAddingGoalCycleId(null);
      setGoalTitle('');
      setGoalDescription('');
      setGoalCategory('');
      setGoalStatus('ativa');
      onRefresh();
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !goalTitle.trim()) return;
    const { error } = await updateGoal(editingGoal.id, {
      title: goalTitle,
      description: goalDescription.trim() || null,
      category: goalCategory.trim() || null,
      status: goalStatus,
    });
    if (!error) {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalDescription('');
      setGoalCategory('');
      setGoalStatus('ativa');
      onRefresh();
    }
  };

  return (
    <div className="prontuario-plano">
      {canEdit && !addingCycle && !editingCycle && (
        <button type="button" className="prontuario-btn-primary" onClick={() => { setAddingCycle(true); resetCycleForm(); }}>+ Novo ciclo</button>
      )}
      {(addingCycle || editingCycle) && (
        <form onSubmit={handleSaveCycle} className="prontuario-form">
          <input value={cycleName} onChange={(e) => setCycleName(e.target.value)} placeholder="Nome do ciclo" required className="prontuario-input" />
          <input type="number" value={cycleMonths} onChange={(e) => setCycleMonths(Number(e.target.value))} min={1} max={24} className="prontuario-input" style={{ width: 80 }} />
          <span>meses</span>
          <input type="date" value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} required className="prontuario-input" />
          <input type="date" value={cycleEnd} onChange={(e) => setCycleEnd(e.target.value)} required className="prontuario-input" />
          <label className="prontuario-form-label">
            <input type="checkbox" checked={cycleIsActive} onChange={(e) => setCycleIsActive(e.target.checked)} />
            Ciclo ativo (recomendado um por vez)
          </label>
          <button type="submit" className="prontuario-btn-primary">{editingCycle ? 'Salvar' : 'Criar'}</button>
          <button type="button" className="prontuario-btn-secondary" onClick={() => { setAddingCycle(false); setEditingCycle(null); resetCycleForm(); }}>Cancelar</button>
        </form>
      )}
      {cycles.length === 0 && !addingCycle && !editingCycle && <p className="prontuario-empty">Nenhum ciclo cadastrado.</p>}
      {cycles.map((cy) => (
        <div key={cy.id} className="prontuario-plano-cycle">
          <div className="prontuario-plano-cycle-header">
            <strong>{cy.name}</strong>
            {cy.is_active && <span className="prontuario-plano-cycle-badge">Ciclo ativo</span>}
            <span>{cy.start_date} a {cy.end_date}</span>
            {canEdit && (
              <>
                <button type="button" className="prontuario-btn-link" onClick={() => { setEditingCycle(cy); setCycleName(cy.name); setCycleMonths(cy.months); setCycleStart(cy.start_date); setCycleEnd(cy.end_date); setCycleIsActive(cy.is_active); setAddingCycle(false); }}>Editar</button>
                <button type="button" className="prontuario-btn-danger" onClick={async () => { if (confirm('Excluir ciclo e metas?')) { await deleteCycle(cy.id); onRefresh(); } }}>Excluir</button>
              </>
            )}
          </div>
          <ul className="prontuario-list">
            {(goalsByCycle[cy.id] ?? []).map((g) => (
              <li key={g.id} className="prontuario-list-item">
                {editingGoal?.id === g.id ? (
                  <form onSubmit={handleUpdateGoal} className="prontuario-form prontuario-form-inline">
                    <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Título" className="prontuario-input" required />
                    <input value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Descrição" className="prontuario-input" />
                    <input value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} placeholder="Categoria" className="prontuario-input" />
                    <select value={goalStatus} onChange={(e) => setGoalStatus(e.target.value as 'ativa' | 'pausada' | 'concluida')} className="prontuario-input">
                      {(['ativa', 'pausada', 'concluida'] as const).map((s) => (
                        <option key={s} value={s}>{GOAL_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <button type="submit" className="prontuario-btn-primary">Salvar</button>
                    <button type="button" className="prontuario-btn-secondary" onClick={() => { setEditingGoal(null); setGoalTitle(''); setGoalDescription(''); setGoalCategory(''); setGoalStatus('ativa'); }}>Cancelar</button>
                  </form>
                ) : (
                  <>
                    <span className="prontuario-list-title">{g.title}</span>
                    {g.category && <span className="prontuario-list-meta">{g.category}</span>}
                    <span className="prontuario-list-meta">{GOAL_STATUS_LABEL[g.status] ?? g.status}</span>
                    {canEdit && (
                      <>
                        <button type="button" className="prontuario-btn-link" onClick={() => { setEditingGoal(g); setGoalTitle(g.title); setGoalDescription(g.description ?? ''); setGoalCategory(g.category ?? ''); setGoalStatus(g.status); }}>Editar</button>
                        <button type="button" className="prontuario-btn-danger" onClick={async () => { await deleteGoal(g.id); onRefresh(); }}>Excluir</button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {canEdit && !editingGoal && (addingGoalCycleId !== cy.id ? (
            <button type="button" className="prontuario-btn-link" onClick={() => setAddingGoalCycleId(cy.id)}>+ Meta</button>
          ) : (
            <form onSubmit={handleSaveGoal} className="prontuario-form">
              <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Título da meta" className="prontuario-input" required />
              <input value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Descrição (opcional)" className="prontuario-input" />
              <input value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} placeholder="Categoria (opcional)" className="prontuario-input" />
              <select value={goalStatus} onChange={(e) => setGoalStatus(e.target.value as 'ativa' | 'pausada' | 'concluida')} className="prontuario-input">
                {(['ativa', 'pausada', 'concluida'] as const).map((s) => (
                  <option key={s} value={s}>{GOAL_STATUS_LABEL[s]}</option>
                ))}
              </select>
              <button type="submit" className="prontuario-btn-primary">Adicionar</button>
              <button type="button" className="prontuario-btn-secondary" onClick={() => { setAddingGoalCycleId(null); setGoalTitle(''); setGoalDescription(''); setGoalCategory(''); setGoalStatus('ativa'); }}>Cancelar</button>
            </form>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProntuarioAba({
  patientId,
  unitId,
  programs,
  goalsByProgram,
  onRefresh,
  canEdit,
}: {
  patientId: string;
  unitId: string | null;
  programs: AbaProgram[];
  goalsByProgram: Record<string, AbaGoal[]>;
  onRefresh: () => void;
  canEdit: boolean;
}) {
  const allAbaGoals = programs.flatMap((p) => goalsByProgram[p.id] ?? []);
  const [addingProgram, setAddingProgram] = useState(false);
  const [programName, setProgramName] = useState('');
  const [addingGoalProgramId, setAddingGoalProgramId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [abaTemplates, setAbaTemplates] = useState<AbaTemplate[]>([]);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [chartGoalId, setChartGoalId] = useState('');
  const [chartStart, setChartStart] = useState(() => format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [chartEnd, setChartEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [chartData, setChartData] = useState<{ date: string; value_numeric: number | null; value_text: string | null }[]>([]);

  useEffect(() => {
    if (!chartGoalId || !chartStart || !chartEnd) return;
    fetchSessionDataByGoal(chartGoalId, chartStart, chartEnd).then(setChartData);
  }, [chartGoalId, chartStart, chartEnd]);

  useEffect(() => {
    if (unitId && canEdit) fetchAbaTemplatesByUnit(unitId).then(({ templates: t }) => setAbaTemplates(t ?? []));
  }, [unitId, canEdit]);

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) return;
    const { error } = await createProgram(patientId, { name: programName });
    if (!error) { setAddingProgram(false); setProgramName(''); onRefresh(); }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !addingGoalProgramId) return;
    const { error } = await createAbaGoal(addingGoalProgramId, { name: goalName });
    if (!error) { setAddingGoalProgramId(null); setGoalName(''); onRefresh(); }
  };

  return (
    <div className="prontuario-aba">
      {allAbaGoals.length > 0 && (
        <div className="prontuario-aba-graficos">
          <h3 className="prontuario-aba-graficos-title">Gráficos por meta</h3>
          <div className="prontuario-aba-graficos-controls">
            <select
              className="prontuario-select"
              value={chartGoalId}
              onChange={(e) => setChartGoalId(e.target.value)}
              aria-label="Meta ABA"
            >
              <option value="">Selecione a meta</option>
              {allAbaGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <input
              type="date"
              className="prontuario-input"
              value={chartStart}
              onChange={(e) => setChartStart(e.target.value)}
              aria-label="Data inicial"
            />
            <input
              type="date"
              className="prontuario-input"
              value={chartEnd}
              onChange={(e) => setChartEnd(e.target.value)}
              aria-label="Data final"
            />
          </div>
          {chartData.length > 0 && (
            <div className="prontuario-aba-chart">
              <div className="prontuario-aba-chart-bars">
                {chartData.map((d, i) => {
                  const num = d.value_numeric ?? 0;
                  const max = Math.max(...chartData.map((x) => x.value_numeric ?? 0), 1);
                  const label = d.value_text ?? (d.value_numeric != null ? String(d.value_numeric) : '—');
                  return (
                    <div key={i} className="prontuario-aba-chart-bar-wrap" title={`${d.date}: ${label}`}>
                      <div
                        className="prontuario-aba-chart-bar"
                        style={{ height: max ? `${(num / max) * 100}%` : '0%' }}
                      />
                      <span className="prontuario-aba-chart-label">{format(new Date(d.date), 'dd/MM')}</span>
                    </div>
                  );
                })}
              </div>
              <div className="prontuario-aba-chart-legend">
                {chartData.map((d, i) => (
                  <span key={i} className="prontuario-aba-chart-legend-item">
                    {d.date}: {d.value_text ?? d.value_numeric ?? '—'}
                  </span>
                ))}
              </div>
            </div>
          )}
          {chartGoalId && chartData.length === 0 && chartStart && chartEnd && (
            <p className="prontuario-empty">Nenhum dado de coleta no período.</p>
          )}
        </div>
      )}
      {canEdit && !addingProgram && (
        <>
          <button type="button" className="prontuario-btn-primary" onClick={() => setAddingProgram(true)}>+ Novo programa</button>
          {abaTemplates.length > 0 && (
            <select
              className="prontuario-select"
              value=""
              onChange={async (e) => {
                const id = e.target.value;
                if (!id) return;
                const t = abaTemplates.find((x) => x.id === id);
                if (!t) return;
                setCreatingFromTemplate(true);
                const { error } = await createProgram(patientId, { name: t.name, description: t.description ?? undefined });
                setCreatingFromTemplate(false);
                e.target.value = '';
                if (!error) onRefresh();
              }}
              disabled={creatingFromTemplate}
            >
              <option value="">Criar a partir de template</option>
              {abaTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </>
      )}
      {addingProgram && (
        <form onSubmit={handleSaveProgram} className="prontuario-form">
          <input value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="Nome do programa" className="prontuario-input" />
          <button type="submit" className="prontuario-btn-primary">Criar</button>
          <button type="button" className="prontuario-btn-secondary" onClick={() => { setAddingProgram(false); setProgramName(''); }}>Cancelar</button>
        </form>
      )}
      {programs.length === 0 && !addingProgram && <p className="prontuario-empty">Nenhum programa ABA cadastrado.</p>}
      {programs.map((prog) => (
        <div key={prog.id} className="prontuario-plano-cycle">
          <div className="prontuario-plano-cycle-header">
            <strong>{prog.name}</strong>
            {canEdit && (
              <button type="button" className="prontuario-btn-danger" onClick={async () => { if (confirm('Excluir programa?')) { await deleteProgram(prog.id); onRefresh(); } }}>Excluir</button>
            )}
          </div>
          <ul className="prontuario-list">
            {(goalsByProgram[prog.id] ?? []).map((g) => (
              <li key={g.id} className="prontuario-list-item">
                <span className="prontuario-list-title">{g.name}</span>
                {canEdit && <button type="button" className="prontuario-btn-danger" onClick={async () => { await deleteAbaGoal(g.id); onRefresh(); }}>Excluir</button>}
              </li>
            ))}
          </ul>
          {canEdit && (addingGoalProgramId !== prog.id ? (
            <button type="button" className="prontuario-btn-link" onClick={() => setAddingGoalProgramId(prog.id)}>+ Meta</button>
          ) : (
            <form onSubmit={handleSaveGoal} className="prontuario-form">
              <input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Nome da meta" className="prontuario-input" />
              <button type="submit" className="prontuario-btn-primary">Adicionar</button>
              <button type="button" className="prontuario-btn-secondary" onClick={() => { setAddingGoalProgramId(null); setGoalName(''); }}>Cancelar</button>
            </form>
          ))}
        </div>
      ))}
    </div>
  );
}
