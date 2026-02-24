import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import {
  fetchEventWithNote,
  ensureNote,
  updateNoteContent,
  finalizeNote,
  requestCosign,
  cosignNote,
  appendNoteAddendum,
  type EventWithNote,
} from '../lib/evolucoes';
import { fetchNoteTemplates } from '../lib/noteTemplates';
import { fetchCyclesByPatient, fetchGoalsByCycle, fetchNoteGoals, setNoteGoals } from '../lib/plano';
import { fetchProgramsByPatient, fetchGoalsByProgram } from '../lib/aba';
import { fetchSessionDataByNote, upsertSessionData } from '../lib/abaSessionData';
import { fetchAttachmentsByNote, uploadAttachment, deleteAttachment, getAttachmentUrl } from '../lib/attachments';
import type { TreatmentGoal, Attachment, AbaGoal, AttachmentCategory } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './EditorEvolucao.css';

const AUTOSAVE_DELAY_MS = 1500;

export function EditorEvolucao() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const { role } = useUserRoleInUnit(activeUnitId, user?.id);
  const [data, setData] = useState<EventWithNote | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>([]);
  const [treatmentGoals, setTreatmentGoals] = useState<TreatmentGoal[]>([]);
  const [noteGoalIds, setNoteGoalIds] = useState<Set<string>>(new Set());
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [addendumText, setAddendumText] = useState('');
  const [addendumSaving, setAddendumSaving] = useState(false);
  const [noteAttachments, setNoteAttachments] = useState<Attachment[]>([]);
  const [noteAttachmentUploading, setNoteAttachmentUploading] = useState(false);
  const [noteAttachmentCategory, setNoteAttachmentCategory] = useState<AttachmentCategory>('outros');
  const noteAttachmentInputRef = useRef<HTMLInputElement>(null);
  const [abaGoals, setAbaGoals] = useState<AbaGoal[]>([]);
  const [abaSessionDataMap, setAbaSessionDataMap] = useState<Record<string, { value_numeric?: number | null; value_text?: string | null }>>({});
  const [abaSessionSaving, setAbaSessionSaving] = useState(false);
  const [noteTags, setNoteTags] = useState('');
  const lastSavedTagsRef = useRef<string>('');

  const isSecretaria = role === 'secretaria';
  const canEdit = !isSecretaria && !!user && data?.note && !data.note.finalized_at;
  const isAuthor = data?.note && user?.id === data.note.author_id;
  const canCosign =
    !isSecretaria &&
    !!user &&
    data?.note?.cosign_required &&
    !data.note.cosigned_at &&
    role !== 'estagiario' &&
    (role === 'profissional' || role === 'coordenador' || role === 'admin');

  const load = useCallback(async () => {
    if (!eventId || !user?.id) return;
    setLoading(true);
    setError(null);
    const result = await fetchEventWithNote(eventId);
    if (!result) {
      setError('Evento não encontrado.');
      setLoading(false);
      return;
    }
    setData(result);
    const note = result.note;
    if (note) {
      setContent(note.content);
      lastSavedRef.current = note.content;
      setNoteTags(note.tags ?? '');
      lastSavedTagsRef.current = note.tags ?? '';
    } else {
      const created = await ensureNote(
        eventId,
        result.event.type === 'atendimento' ? 'evolucao' : 'ata',
        user.id
      );
      if (created) {
        setData((prev) => (prev ? { ...prev, note: created } : null));
        setContent(created.content);
        lastSavedRef.current = created.content;
        setNoteTags((created as { tags?: string | null }).tags ?? '');
        lastSavedTagsRef.current = (created as { tags?: string | null }).tags ?? '';
      }
    }
    setLoading(false);
  }, [eventId, user]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  useEffect(() => {
    if (!activeUnitId) return;
    fetchNoteTemplates(activeUnitId).then(({ templates: t }) => setTemplates(t ?? []));
  }, [activeUnitId]);

  useEffect(() => {
    if (!data?.event?.patient_id || data.event.type !== 'atendimento') return;
    const patientId = data.event.patient_id;
    fetchCyclesByPatient(patientId).then(({ cycles }) => {
      const all: TreatmentGoal[] = [];
      Promise.all(
        cycles.map((cy) =>
          fetchGoalsByCycle(cy.id).then(({ goals }) => {
            goals.forEach((g) => all.push(g));
          })
        )
      ).then(() => setTreatmentGoals(all));
    });
  }, [data?.event?.patient_id, data?.event?.type]);

  useEffect(() => {
    if (!data?.note?.id) return;
    fetchNoteGoals(data.note.id).then(({ goalIds }) => setNoteGoalIds(new Set(goalIds)));
  }, [data?.note?.id]);

  useEffect(() => {
    if (!data?.note?.id) return;
    fetchAttachmentsByNote(data.note.id).then(({ attachments: a }) => setNoteAttachments(a ?? []));
  }, [data?.note?.id]);

  useEffect(() => {
    if (!data?.event?.patient_id || data.event.type !== 'atendimento') return;
    const patientId = data.event.patient_id;
    fetchProgramsByPatient(patientId).then(({ programs }) => {
      const all: AbaGoal[] = [];
      Promise.all(
        programs.map((prog) =>
          fetchGoalsByProgram(prog.id).then(({ goals }) => {
            goals.forEach((g) => all.push(g));
          })
        )
      ).then(() => setAbaGoals(all));
    });
  }, [data?.event?.patient_id, data?.event?.type]);

  useEffect(() => {
    if (!data?.note?.id) return;
    fetchSessionDataByNote(data.note.id).then(({ rows }) => {
      const map: Record<string, { value_numeric?: number | null; value_text?: string | null }> = {};
      rows.forEach((r) => {
        map[r.aba_goal_id] = {
          value_numeric: r.value_numeric ?? null,
          value_text: r.value_text ?? null,
        };
      });
      setAbaSessionDataMap(map);
    });
  }, [data?.note?.id]);

  useEffect(() => {
    if (!canEdit || !data?.note) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    const contentChanged = content !== lastSavedRef.current;
    const tagsChanged = noteTags !== lastSavedTagsRef.current;
    if (!contentChanged && !tagsChanged) return;
    autosaveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      await updateNoteContent(data.note!.id, content, noteTags.trim() || null);
      lastSavedRef.current = content;
      lastSavedTagsRef.current = noteTags;
      setSaving(false);
      autosaveTimerRef.current = null;
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [content, noteTags, canEdit, data?.note]);

  const handleFinalize = async () => {
    if (!data?.note || !canEdit) return;
    setFinalizing(true);
    setError(null);
    const { error: err } = await finalizeNote(data.note.id);
    if (err) setError(err.message);
    else await load();
    setFinalizing(false);
  };

  const handleRequestCosign = async () => {
    if (!data?.note || role !== 'estagiario' || !isAuthor) return;
    setError(null);
    const { error: err } = await requestCosign(data.note.id);
    if (err) setError(err.message);
    else await load();
  };

  const handleCosign = async () => {
    if (!data?.note || !user?.id || !canCosign) return;
    setError(null);
    const { error: err } = await cosignNote(data.note.id, user.id);
    if (err) setError(err.message);
    else await load();
  };

  const toggleGoalWorked = async (goalId: string) => {
    if (!data?.note || !canEdit) return;
    const next = new Set(noteGoalIds);
    if (next.has(goalId)) next.delete(goalId);
    else next.add(goalId);
    setNoteGoalIds(next);
    setGoalsSaving(true);
    await setNoteGoals(data.note.id, Array.from(next));
    setGoalsSaving(false);
  };

  const handleAppendAddendum = async () => {
    const text = addendumText.trim();
    if (!data?.note?.id || !text || isSecretaria) return;
    setAddendumSaving(true);
    setError(null);
    const { error: err } = await appendNoteAddendum(data.note.id, text);
    if (err) setError(err.message);
    else {
      setAddendumText('');
      await load();
    }
    setAddendumSaving(false);
  };

  const handleNoteAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data?.note?.id || !user?.id) return;
    e.target.value = '';
    setNoteAttachmentUploading(true);
    const { error: err } = await uploadAttachment(file, {
      note_id: data.note.id,
      patient_id: data.event.patient_id ?? undefined,
      created_by: user.id,
      category: noteAttachmentCategory,
    });
    setNoteAttachmentUploading(false);
    if (!err) fetchAttachmentsByNote(data.note.id).then(({ attachments: a }) => setNoteAttachments(a ?? []));
  };

  const handleAbaSessionValue = async (goalId: string, value: { value_numeric?: number | null; value_text?: string | null }) => {
    if (!data?.note?.id || !canEdit) return;
    setAbaSessionSaving(true);
    await upsertSessionData(data.note.id, goalId, value);
    setAbaSessionDataMap((prev) => ({ ...prev, [goalId]: value }));
    setAbaSessionSaving(false);
  };

  if (loading || !data) {
    return (
      <div className="editor-evolucao-page">
        <p className="editor-evolucao-loading">
          {loading ? (
            <>
              <span className="loading-spinner" aria-hidden />
              Carregando…
            </>
          ) : (
            'Evento não encontrado.'
          )}
        </p>
        <button type="button" className="editor-evolucao-back" onClick={() => navigate('/evolucoes')}>
          ← Voltar
        </button>
      </div>
    );
  }

  const tipoLabel = data.event.type === 'atendimento' ? 'Evolução' : 'Ata';

  return (
    <div className="editor-evolucao-page">
      <div className="editor-evolucao-header">
        <button type="button" className="editor-evolucao-back" onClick={() => navigate('/evolucoes')}>
          ← Voltar
        </button>
        <div className="editor-evolucao-meta">
          <h1 className="editor-evolucao-title">{tipoLabel}</h1>
          <p className="editor-evolucao-datetime">
            {format(new Date(data.event.start_at), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })}
          </p>
          {data.patient && (
            <p className="editor-evolucao-patient">Paciente: {data.patient.full_name}</p>
          )}
          {data.note?.finalized_at && (
            <p className="editor-evolucao-finalized">
              Finalizada em {format(new Date(data.note.finalized_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {data.author_name && ` por ${data.author_name}`}
            </p>
          )}
          {!isSecretaria && data.note?.cosign_required && (
            <p className="editor-evolucao-cosign">
              {data.note.cosigned_at ? 'Coassinatura ok' : 'Aguardando coassinatura'}
            </p>
          )}
        </div>
      </div>

      {error && <p className="editor-evolucao-error">{error}</p>}

      {isSecretaria ? (
        <div className="editor-evolucao-secretaria">
          <p>Você não tem permissão para ver o texto desta evolução. Apenas status e metas são visíveis.</p>
          <p>Evolução: {data.note?.finalized_at ? 'Ok' : 'Pendente'}</p>
        </div>
      ) : (
        <>
          <div className="editor-evolucao-toolbar">
            {saving && <span className="editor-evolucao-saving">Salvando…</span>}
            {canEdit && templates.length > 0 && (
              <select
                className="editor-evolucao-template-select"
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const t = templates.find((x) => x.id === id);
                  if (t) setContent((prev) => (prev ? `${prev}\n\n${t.content}` : t.content));
                  e.target.value = '';
                }}
                aria-label="Inserir template"
              >
                <option value="">Inserir template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {canEdit && (
              <>
                <button
                  type="button"
                  className="editor-evolucao-btn editor-evolucao-btn-primary"
                  onClick={handleFinalize}
                  disabled={finalizing}
                >
                  {finalizing ? 'Finalizando…' : 'Finalizar'}
                </button>
                {role === 'estagiario' && isAuthor && !data.note?.cosign_required && (
                  <button
                    type="button"
                    className="editor-evolucao-btn editor-evolucao-btn-secondary"
                    onClick={handleRequestCosign}
                  >
                    Enviar para coassinatura
                  </button>
                )}
              </>
            )}
            {canCosign && (
              <button
                type="button"
                className="editor-evolucao-btn editor-evolucao-btn-success"
                onClick={handleCosign}
              >
                Coassinar
              </button>
            )}
          </div>
          <textarea
            className="editor-evolucao-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!canEdit}
            placeholder={data.event.type === 'reuniao' ? 'Participantes, decisões, ações...' : 'Texto da evolução...'}
          />
          {!isSecretaria && data.note && (
            <div className="editor-evolucao-tags">
              <label className="editor-evolucao-tags-label">Tags (separadas por vírgula)</label>
              <input
                type="text"
                className="editor-evolucao-tags-input"
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                disabled={!canEdit}
                placeholder="Ex: sessão inicial, relatório"
              />
            </div>
          )}
          {data.note?.finalized_at && !isSecretaria && (
            <div className="editor-evolucao-addendum">
              <h3 className="editor-evolucao-addendum-title">Adendo (apenas acréscimos)</h3>
              {data.note.addendum && (
                <div className="editor-evolucao-addendum-content">
                  <pre>{data.note.addendum}</pre>
                </div>
              )}
              <div className="editor-evolucao-addendum-form">
                <textarea
                  className="editor-evolucao-addendum-textarea"
                  value={addendumText}
                  onChange={(e) => setAddendumText(e.target.value)}
                  placeholder="Adicione texto ao adendo (não altera o conteúdo já finalizado)..."
                  rows={3}
                />
                <button
                  type="button"
                  className="editor-evolucao-btn editor-evolucao-btn-primary"
                  onClick={handleAppendAddendum}
                  disabled={addendumSaving || !addendumText.trim()}
                >
                  {addendumSaving ? 'Salvando…' : 'Adicionar ao adendo'}
                </button>
              </div>
            </div>
          )}
          {data.event.type === 'atendimento' && data.event.patient_id && treatmentGoals.length > 0 && (
            <div className="editor-evolucao-goals">
              <h3 className="editor-evolucao-goals-title">Metas trabalhadas nesta sessão</h3>
              {goalsSaving && <span className="editor-evolucao-saving">Salvando…</span>}
              <ul className="editor-evolucao-goals-list">
                {treatmentGoals.map((g) => (
                  <li key={g.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={noteGoalIds.has(g.id)}
                        onChange={() => toggleGoalWorked(g.id)}
                        disabled={!canEdit}
                      />
                      {g.title}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.event.type === 'atendimento' && data.event.patient_id && abaGoals.length > 0 && !isSecretaria && (
            <div className="editor-evolucao-aba-coleta">
              <h3 className="editor-evolucao-goals-title">Coleta ABA desta sessão</h3>
              {abaSessionSaving && <span className="editor-evolucao-saving">Salvando…</span>}
              <ul className="editor-evolucao-aba-coleta-list">
                {abaGoals.map((g) => {
                  const val = abaSessionDataMap[g.id];
                  const type = (g.target_type || 'contagem').toLowerCase();
                  return (
                    <li key={g.id} className="editor-evolucao-aba-coleta-item">
                      <label className="editor-evolucao-aba-coleta-label">{g.name}</label>
                      {type === 'sim_nao' || type === 'sim-não' ? (
                        <select
                          className="editor-evolucao-aba-coleta-input"
                          value={val?.value_text ?? ''}
                          onChange={(e) => handleAbaSessionValue(g.id, { value_text: e.target.value || null })}
                          disabled={!canEdit}
                        >
                          <option value="">—</option>
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                        </select>
                      ) : type === 'escala' ? (
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="editor-evolucao-aba-coleta-input"
                          value={val?.value_numeric ?? ''}
                          onChange={(e) => {
                            const n = e.target.value === '' ? null : Number(e.target.value);
                            handleAbaSessionValue(g.id, { value_numeric: n });
                          }}
                          disabled={!canEdit}
                          placeholder="1-10"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className="editor-evolucao-aba-coleta-input"
                          value={val?.value_numeric ?? ''}
                          onChange={(e) => {
                            const n = e.target.value === '' ? null : Number(e.target.value);
                            handleAbaSessionValue(g.id, { value_numeric: n });
                          }}
                          disabled={!canEdit}
                          placeholder="Contagem"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {data.note && !isSecretaria && (
            <div className="editor-evolucao-attachments">
              <h3 className="editor-evolucao-addendum-title">Anexos desta evolução/ata</h3>
              <select
                value={noteAttachmentCategory}
                onChange={(e) => setNoteAttachmentCategory(e.target.value as AttachmentCategory)}
                className="editor-evolucao-select"
                aria-label="Categoria do anexo"
              >
                <option value="laudo">Laudo</option>
                <option value="termo">Termo</option>
                <option value="relatorio">Relatório</option>
                <option value="imagem">Imagem</option>
                <option value="video">Vídeo</option>
                <option value="outros">Outros</option>
              </select>
              <input
                ref={noteAttachmentInputRef}
                type="file"
                className="editor-evolucao-file-input"
                onChange={handleNoteAttachmentUpload}
                disabled={noteAttachmentUploading}
              />
              <button
                type="button"
                className="editor-evolucao-btn editor-evolucao-btn-secondary"
                onClick={() => noteAttachmentInputRef.current?.click()}
                disabled={noteAttachmentUploading}
              >
                {noteAttachmentUploading ? 'Enviando…' : 'Anexar arquivo'}
              </button>
              {noteAttachments.length > 0 && (
                <ul className="editor-evolucao-attachments-list">
                  {noteAttachments.map((a) => (
                    <li key={a.id}>
                      <a href={getAttachmentUrl(a.file_path)} target="_blank" rel="noopener noreferrer">{a.file_name}</a>
                      <button
                        type="button"
                        className="editor-evolucao-btn editor-evolucao-btn-secondary"
                        onClick={async () => {
                          await deleteAttachment(a.id, a.file_path);
                          fetchAttachmentsByNote(data.note!.id).then(({ attachments: list }) => setNoteAttachments(list ?? []));
                        }}
                      >
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
