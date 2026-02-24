import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchInstanceById, updateInstance, signInstance } from '../lib/avaliacoes';
import { fetchAttachmentsByEvaluationInstance, uploadAttachment, deleteAttachment, getAttachmentUrl } from '../lib/attachments';
import { useAuth } from '../contexts/AuthContext';
import type { AttachmentCategory } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import './AvaliacaoInstance.css';

export function AvaliacaoInstance() {
  const { patientId, instanceId } = useParams<{ patientId: string; instanceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instance, setInstance] = useState<{
    id: string;
    patient_id: string;
    template_id: string;
    data_json: Record<string, unknown>;
    signed_at: string | null;
    created_at: string;
    template?: { id: string; name: string; type: string; schema_json?: unknown } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<{ id: string; file_name: string; file_path: string }[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<AttachmentCategory>('outros');

  useEffect(() => {
    if (!instanceId) return;
    fetchAttachmentsByEvaluationInstance(instanceId).then(({ attachments: a }) => setAttachments(a ?? []));
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId) return;
    fetchInstanceById(instanceId).then(({ instance: i }) => {
      setInstance(i ?? null);
      if (i?.data_json && typeof i.data_json === 'object') {
        setJsonText(JSON.stringify(i.data_json, null, 2));
      } else {
        setJsonText('{}');
      }
      setLoading(false);
    });
  }, [instanceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceId || instance?.signed_at) return;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonText);
    } catch {
      alert('JSON inválido.');
      return;
    }
    setSaving(true);
    const { error } = await updateInstance(instanceId, data);
    setSaving(false);
    if (!error) {
      setInstance((prev) => (prev ? { ...prev, data_json: data } : null));
    } else {
      alert('Erro ao salvar.');
    }
  };

  const handleSign = async () => {
    if (!instanceId || instance?.signed_at) return;
    if (!confirm('Assinar esta avaliação? Não será mais possível editar.')) return;
    setSaving(true);
    const { error } = await signInstance(instanceId);
    setSaving(false);
    if (!error) {
      setInstance((prev) => (prev ? { ...prev, signed_at: new Date().toISOString() } : null));
    } else {
      alert('Erro ao assinar.');
    }
  };

  const handleExportPdf = () => {
    if (!instance) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 14;
    const pageW = 210;
    const pageH = 297;
    const maxW = pageW - margin * 2;
    let y = margin;
    const lineHeight = 6;
    const pushLine = (text: string, opts?: { bold?: boolean }) => {
      if (opts?.bold) doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(text, maxW);
      for (const line of lines) {
        if (y > pageH - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      if (opts?.bold) doc.setFont('helvetica', 'normal');
    };

    doc.setFontSize(14);
    pushLine(instance.template?.name ?? 'Avaliação', { bold: true });
    y += 2;
    doc.setFontSize(10);
    const meta = [
      instance.template?.type ?? '',
      `Criada em ${format(new Date(instance.created_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}`,
      instance.signed_at ? `Assinada em ${format(new Date(instance.signed_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}` : null,
    ].filter(Boolean).join(' · ');
    pushLine(meta);
    y += 4;

    doc.setFontSize(11);
    const data = instance.data_json && typeof instance.data_json === 'object' && !Array.isArray(instance.data_json)
      ? instance.data_json as Record<string, unknown>
      : { 'Dados': instance.data_json };
    for (const [key, value] of Object.entries(data)) {
      const valueStr = value === null || value === undefined
        ? '—'
        : typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value);
      pushLine(`${key}:`, { bold: true });
      pushLine(valueStr);
      y += 2;
    }

    doc.save(`${(instance.template?.name ?? 'avaliacao').replace(/\s+/g, '-')}-${instanceId?.slice(0, 8) ?? 'export'}.pdf`);
  };

  if (loading) {
    return (
      <div className="avaliacao-instance-page">
        <p className="avaliacao-instance-loading">Carregando…</p>
      </div>
    );
  }
  if (!instance) {
    return (
      <div className="avaliacao-instance-page">
        <p className="avaliacao-instance-error">Avaliação não encontrada.</p>
        <button type="button" className="avaliacao-instance-back" onClick={() => navigate(`/pacientes/${patientId}`)}>
          ← Voltar ao prontuário
        </button>
      </div>
    );
  }

  const isSigned = !!instance.signed_at;

  return (
    <div className="avaliacao-instance-page">
      <div className="avaliacao-instance-header">
        <button type="button" className="avaliacao-instance-back" onClick={() => navigate(`/pacientes/${patientId}`)}>
          ← Voltar ao prontuário
        </button>
        <div className="avaliacao-instance-header-right">
          <h1 className="avaliacao-instance-title">{instance.template?.name ?? 'Avaliação'}</h1>
          <p className="avaliacao-instance-meta">
            {instance.template?.type ?? ''} · Criada em {format(new Date(instance.created_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
            {isSigned && instance.signed_at && ` · Assinada em ${format(new Date(instance.signed_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}`}
          </p>
          <button type="button" className="avaliacao-instance-btn-export" onClick={handleExportPdf}>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="avaliacao-instance-attachments">
        <h3>Anexos</h3>
        {user && (
          <select
            value={attachmentCategory}
            onChange={(e) => setAttachmentCategory(e.target.value as AttachmentCategory)}
            className="avaliacao-instance-select"
            aria-label="Categoria do anexo"
          >
            <option value="laudo">Laudo</option>
            <option value="termo">Termo</option>
            <option value="relatorio">Relatório</option>
            <option value="imagem">Imagem</option>
            <option value="video">Vídeo</option>
            <option value="outros">Outros</option>
          </select>
        )}
        <input
          id="avaliacao-instance-file"
          type="file"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !instanceId || !user?.id) return;
            e.target.value = '';
            setAttachmentUploading(true);
            const { error } = await uploadAttachment(file, { evaluation_instance_id: instanceId, created_by: user.id, category: attachmentCategory });
            setAttachmentUploading(false);
            if (!error) fetchAttachmentsByEvaluationInstance(instanceId).then(({ attachments: a }) => setAttachments(a ?? []));
          }}
          disabled={!user || attachmentUploading}
        />
        {user && (
          <button
            type="button"
            className="avaliacao-instance-btn-export"
            onClick={() => document.getElementById('avaliacao-instance-file')?.click()}
            disabled={attachmentUploading}
          >
            {attachmentUploading ? 'Enviando…' : '+ Anexar arquivo'}
          </button>
        )}
        {attachments.length > 0 && (
          <ul className="avaliacao-instance-attachments-list">
            {attachments.map((a) => (
              <li key={a.id}>
                <a href={getAttachmentUrl(a.file_path)} target="_blank" rel="noopener noreferrer">{a.file_name}</a>
                <button type="button" className="avaliacao-instance-btn-link" onClick={async () => { await deleteAttachment(a.id, a.file_path); fetchAttachmentsByEvaluationInstance(instanceId!).then(({ attachments: list }) => setAttachments(list ?? [])); }}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isSigned && (
        <form onSubmit={handleSave} className="avaliacao-instance-form">
          <label className="avaliacao-instance-label">Dados (JSON)</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={16}
            className="avaliacao-instance-textarea"
            spellCheck={false}
          />
          <div className="avaliacao-instance-actions">
            <button type="submit" className="avaliacao-instance-btn-save" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="avaliacao-instance-btn-sign" onClick={handleSign} disabled={saving}>
              Assinar avaliação
            </button>
          </div>
        </form>
      )}

      {isSigned && (
        <div className="avaliacao-instance-readonly" ref={printRef}>
          <h1>{instance.template?.name ?? 'Avaliação'}</h1>
          <p className="avaliacao-instance-print-meta">
            {instance.template?.type ?? ''} · Criada em {format(new Date(instance.created_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
            {instance.signed_at && ` · Assinada em ${format(new Date(instance.signed_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}`}
          </p>
          <pre className="avaliacao-instance-json">{JSON.stringify(instance.data_json, null, 2)}</pre>
        </div>
      )}
      {!isSigned && (
        <div ref={printRef} style={{ display: 'none' }}>
          <h1>{instance.template?.name ?? 'Avaliação'}</h1>
          <p className="avaliacao-instance-print-meta">Criada em {format(new Date(instance.created_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <pre>{jsonText}</pre>
        </div>
      )}
    </div>
  );
}
