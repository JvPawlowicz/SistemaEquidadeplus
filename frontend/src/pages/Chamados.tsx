import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import {
  fetchTicketsInUnit,
  fetchTicketsByAsset,
  fetchTicketCategories,
  fetchTicketComments,
  addTicketComment,
  updateTicketStatus,
  updateTicketAssignment,
  updateTicket,
  type TicketWithRelations,
} from '../lib/tickets';
import { fetchProfilesInUnit } from '../lib/agenda';
import { fetchAssetsInUnit } from '../lib/assets';
import { fetchAttachmentsByTicket, fetchAttachmentsByAsset, uploadAttachment, deleteAttachment, getAttachmentUrl } from '../lib/attachments';
import { useAuth } from '../contexts/AuthContext';
import type { TicketCategory, TicketPriority, AttachmentCategory } from '../types';
import './Chamados.css';

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

const PRIORITY_LABEL: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export function Chamados() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get('paciente');
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const [tab, setTab] = useState<'chamados' | 'ativos'>('chamados');
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; asset_type: string | null; status: string } | null>(null);

  const displayTickets = pacienteId ? tickets.filter((t) => t.patient_id === pacienteId) : tickets;
  const kanbanColumns: { status: string; label: string }[] = [
    { status: 'aberto', label: 'Aberto' },
    { status: 'em_andamento', label: 'Em andamento' },
    { status: 'resolvido', label: 'Resolvido' },
    { status: 'fechado', label: 'Fechado' },
  ];

  useEffect(() => {
    if (!activeUnitId) return;
    setLoading(true);
    fetchTicketCategories().then(({ categories: cat }) => setCategories(cat));
    fetchTicketsInUnit(activeUnitId, {
      status: filterStatus || undefined,
      category_id: filterCategory || undefined,
    }).then(({ tickets: t }) => {
      setTickets(t);
      setLoading(false);
    });
  }, [activeUnitId, filterStatus, filterCategory]);

  const [assets, setAssets] = useState<{ id: string; name: string; asset_type: string | null; status: string }[]>([]);
  useEffect(() => {
    if (!activeUnitId || tab !== 'ativos') return;
    fetchAssetsInUnit(activeUnitId).then(({ assets: a }) => setAssets(a));
  }, [activeUnitId, tab]);

  return (
    <div className="chamados-page">
      <div className="chamados-toolbar">
        <h1 className="chamados-title">Chamados</h1>
        {pacienteId && (
          <p className="chamados-paciente-filter">Exibindo chamados do paciente selecionado.</p>
        )}
        <div className="chamados-actions">
          <button
            type="button"
            className="chamados-btn-new"
            onClick={() => navigate('/chamados/novo')}
          >
            + Novo chamado
          </button>
        </div>
      </div>

      <div className="chamados-tabs">
        <button
          type="button"
          className={`chamados-tab ${tab === 'chamados' ? 'is-active' : ''}`}
          onClick={() => setTab('chamados')}
        >
          Chamados
        </button>
        <button
          type="button"
          className={`chamados-tab ${tab === 'ativos' ? 'is-active' : ''}`}
          onClick={() => setTab('ativos')}
        >
          Ativos
        </button>
      </div>

      {tab === 'chamados' && (
        <>
          <div className="chamados-filters">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="chamados-filter-select"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="chamados-filter-select"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="chamados-view-toggle">
              <button
                type="button"
                className={`chamados-view-btn ${viewMode === 'lista' ? 'is-active' : ''}`}
                onClick={() => setViewMode('lista')}
              >
                Lista
              </button>
              <button
                type="button"
                className={`chamados-view-btn ${viewMode === 'kanban' ? 'is-active' : ''}`}
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </button>
            </div>
          </div>
          {loading && (
          <p className="chamados-loading">
            <span className="loading-spinner" aria-hidden />
            Carregando…
          </p>
        )}
          {viewMode === 'lista' && (
            <div className="chamados-table-wrap">
              <table className="chamados-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Autor</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayTickets.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="chamados-empty">
                        {pacienteId ? 'Nenhum chamado deste paciente.' : 'Nenhum chamado encontrado.'}
                      </td>
                    </tr>
                  )}
                  {displayTickets.map((t) => (
                    <tr
                      key={t.id}
                      className="chamados-row"
                      onClick={() => setSelectedTicket(t)}
                    >
                      <td><span className="chamados-ticket-title">{t.title}</span></td>
                      <td>{t.category?.name ?? '—'}</td>
                      <td><span className={`chamados-priority chamados-priority-${t.priority}`}>{PRIORITY_LABEL[t.priority] ?? t.priority}</span></td>
                      <td>{STATUS_LABEL[t.status] ?? t.status}</td>
                      <td>{t.author_profile?.full_name ?? '—'}</td>
                      <td>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button
                          type="button"
                          className="chamados-btn-open"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {viewMode === 'kanban' && (
            <div className="chamados-kanban">
              {kanbanColumns.map((col) => {
                const colTickets = displayTickets.filter((t) => t.status === col.status);
                return (
                  <div key={col.status} className="chamados-kanban-column">
                    <h3 className="chamados-kanban-column-title">{col.label}</h3>
                    <div className="chamados-kanban-cards">
                      {colTickets.length === 0 && !loading && (
                        <p className="chamados-kanban-empty">Nenhum</p>
                      )}
                      {colTickets.map((t) => (
                        <div
                          key={t.id}
                          className="chamados-kanban-card"
                          onClick={() => setSelectedTicket(t)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedTicket(t)}
                        >
                          <span className="chamados-kanban-card-title">{t.title}</span>
                          <span className={`chamados-priority chamados-priority-${t.priority}`}>{PRIORITY_LABEL[t.priority] ?? t.priority}</span>
                          <span className="chamados-kanban-card-meta">{t.category?.name ?? '—'} · {t.author_profile?.full_name ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'ativos' && (
        <div className="chamados-table-wrap">
          <table className="chamados-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && (
                <tr>
                  <td colSpan={3} className="chamados-empty">
                    Nenhum ativo cadastrado. Cadastre em Configurações.
                  </td>
                </tr>
              )}
              {assets.map((a) => (
                <tr
                  key={a.id}
                  className="chamados-row"
                  onClick={() => setSelectedAsset(a)}
                >
                  <td><span className="chamados-ticket-title">{a.name}</span></td>
                  <td>{a.asset_type ?? '—'}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <ChamadoDrawer
          ticket={selectedTicket}
          unitId={activeUnitId}
          userId={user?.id}
          categories={categories}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            if (activeUnitId) {
              fetchTicketsInUnit(activeUnitId, { status: filterStatus || undefined, category_id: filterCategory || undefined }).then(({ tickets: t }) => {
                setTickets(t);
                const updated = t.find((x) => x.id === selectedTicket?.id);
                if (updated) setSelectedTicket(updated);
              });
            }
          }}
        />
      )}
      {selectedAsset && (
        <AssetDrawer
          asset={selectedAsset}
          unitId={activeUnitId}
          userId={user?.id}
          onClose={() => setSelectedAsset(null)}
          onOpenTicket={(t) => setSelectedTicket(t)}
        />
      )}
    </div>
  );
}

function AssetDrawer({
  asset,
  unitId: _unitId,
  userId,
  onClose,
  onOpenTicket,
}: {
  asset: { id: string; name: string; asset_type: string | null; status: string };
  unitId: string | null;
  userId: string | undefined;
  onClose: () => void;
  onOpenTicket: (t: TicketWithRelations) => void;
}) {
  const [assetTickets, setAssetTickets] = useState<TicketWithRelations[]>([]);
  const [assetAttachments, setAssetAttachments] = useState<{ id: string; file_name: string; file_path: string }[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<AttachmentCategory>('outros');
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTicketsByAsset(asset.id).then(({ tickets: t }) => setAssetTickets(t));
  }, [asset.id]);

  useEffect(() => {
    fetchAttachmentsByAsset(asset.id).then(({ attachments: a }) => setAssetAttachments(a ?? []));
  }, [asset.id]);

  const handleAssetAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = '';
    setAttachmentUploading(true);
    const { error } = await uploadAttachment(file, { asset_id: asset.id, created_by: userId, category: attachmentCategory });
    setAttachmentUploading(false);
    if (!error) fetchAttachmentsByAsset(asset.id).then(({ attachments: a }) => setAssetAttachments(a ?? []));
  };

  return (
    <div className="chamado-drawer-overlay" onClick={onClose} role="presentation">
      <div className="chamado-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="chamado-drawer-header">
          <h2 className="chamado-drawer-title">Ativo: {asset.name}</h2>
          <button type="button" className="chamado-drawer-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="chamado-drawer-body">
          <p className="chamado-drawer-meta">
            Tipo: {asset.asset_type ?? '—'} · Status: {asset.status}
          </p>
          <div className="chamado-drawer-section">
            <h3>Chamados deste ativo</h3>
            {assetTickets.length === 0 ? (
              <p className="chamados-empty">Nenhum chamado vinculado.</p>
            ) : (
              <ul className="chamado-drawer-ticket-list">
                {assetTickets.map((t) => (
                  <li key={t.id}>
                    <button type="button" className="chamado-btn-link" onClick={() => { onOpenTicket(t); onClose(); }}>
                      {t.title}
                    </button>
                    <span className="chamado-drawer-ticket-meta">
                      {STATUS_LABEL[t.status]} · {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="chamado-drawer-attachments">
            <h3>Anexos do ativo</h3>
            {userId && (
              <>
                <select
                  value={attachmentCategory}
                  onChange={(e) => setAttachmentCategory(e.target.value as AttachmentCategory)}
                  className="chamado-assign-select"
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
                  ref={assetFileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleAssetAttachmentUpload}
                  disabled={attachmentUploading}
                />
              </>
            )}
            {userId && (
              <button
                type="button"
                className="chamado-comment-btn"
                onClick={() => assetFileInputRef.current?.click()}
                disabled={attachmentUploading}
              >
                {attachmentUploading ? 'Enviando…' : '+ Anexar arquivo'}
              </button>
            )}
            {assetAttachments.length > 0 && (
              <ul className="chamado-drawer-attachments-list">
                {assetAttachments.map((a) => (
                  <li key={a.id}>
                    <a href={getAttachmentUrl(a.file_path)} target="_blank" rel="noopener noreferrer">{a.file_name}</a>
                    <button
                      type="button"
                      className="chamado-btn-link"
                      onClick={async () => {
                        await deleteAttachment(a.id, a.file_path);
                        fetchAttachmentsByAsset(asset.id).then(({ attachments: list }) => setAssetAttachments(list ?? []));
                      }}
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChamadoDrawer({
  ticket,
  unitId,
  userId,
  categories,
  onClose,
  onUpdate,
}: {
  ticket: TicketWithRelations;
  unitId: string | null;
  userId: string | undefined;
  categories: TicketCategory[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [comments, setComments] = useState<{ id: string; content: string; created_at: string; author?: { full_name: string | null } | null }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string; file_name: string; file_path: string }[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<AttachmentCategory>('outros');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title);
  const [editDescription, setEditDescription] = useState(ticket.description ?? '');
  const [editPriority, setEditPriority] = useState<TicketPriority>(ticket.priority);
  const [editCategoryId, setEditCategoryId] = useState(ticket.category_id ?? '');
  const [savingEdit, setSavingEdit] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTicketComments(ticket.id).then(({ comments: c }) => setComments(c));
  }, [ticket.id]);

  useEffect(() => {
    fetchAttachmentsByTicket(ticket.id).then(({ attachments: a }) => setAttachments(a ?? []));
  }, [ticket.id]);

  useEffect(() => {
    if (!unitId) return;
    fetchProfilesInUnit(unitId).then(({ profiles: p }) => setProfiles(p));
  }, [unitId]);

  useEffect(() => {
    setEditTitle(ticket.title);
    setEditDescription(ticket.description ?? '');
    setEditPriority(ticket.priority);
    setEditCategoryId(ticket.category_id ?? '');
  }, [ticket.id, ticket.title, ticket.description, ticket.priority, ticket.category_id]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    const { error } = await updateTicket(ticket.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      category_id: editCategoryId || null,
    });
    setSavingEdit(false);
    if (!error) {
      setEditing(false);
      onUpdate();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    const { error } = await addTicketComment(ticket.id, newComment.trim());
    setSending(false);
    if (!error) {
      setNewComment('');
      fetchTicketComments(ticket.id).then(({ comments: c }) => setComments(c));
    }
  };

  const handleStatusChange = async (status: string) => {
    const { error } = await updateTicketStatus(ticket.id, status);
    if (!error) {
      onUpdate();
      onClose();
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = '';
    setAttachmentUploading(true);
    const { error } = await uploadAttachment(file, { ticket_id: ticket.id, created_by: userId, category: attachmentCategory });
    setAttachmentUploading(false);
    if (!error) fetchAttachmentsByTicket(ticket.id).then(({ attachments: a }) => setAttachments(a ?? []));
  };

  return (
    <div className="chamado-drawer-overlay" onClick={onClose} role="presentation">
      <div className="chamado-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="chamado-drawer-header">
          <h2 className="chamado-drawer-title">{ticket.title}</h2>
          <button type="button" className="chamado-drawer-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="chamado-drawer-body">
          {editing ? (
            <div className="chamado-drawer-edit-form">
              <label className="chamado-drawer-edit-label">
                Título *
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="chamado-drawer-input"
                  placeholder="Título do chamado"
                />
              </label>
              <label className="chamado-drawer-edit-label">
                Descrição
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="chamado-drawer-input chamado-drawer-textarea"
                  rows={3}
                  placeholder="Descrição (opcional)"
                />
              </label>
              <label className="chamado-drawer-edit-label">
                Prioridade
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as TicketPriority)} className="chamado-drawer-input">
                  {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="chamado-drawer-edit-label">
                Categoria
                <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} className="chamado-drawer-input">
                  <option value="">— Nenhuma —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <div className="chamado-drawer-edit-actions">
                <button type="button" className="chamado-comment-btn" onClick={handleSaveEdit} disabled={savingEdit || !editTitle.trim()}>
                  {savingEdit ? 'Salvando…' : 'Salvar'}
                </button>
                <button type="button" className="chamado-btn-link" onClick={() => setEditing(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <p className="chamado-drawer-meta">
                {ticket.category?.name ?? '—'} · {PRIORITY_LABEL[ticket.priority]} · {STATUS_LABEL[ticket.status]}
              </p>
              {ticket.description && <p className="chamado-drawer-desc">{ticket.description}</p>}
              <p className="chamado-drawer-author">
                Aberto por {ticket.author_profile?.full_name ?? '—'} em {new Date(ticket.created_at).toLocaleString('pt-BR')}
              </p>
              <button type="button" className="chamado-btn-link chamado-drawer-btn-edit" onClick={() => setEditing(true)}>
                Editar chamado
              </button>
            </>
          )}

          <div className="chamado-drawer-assign">
            <label>Responsável:</label>
            <select
              value={ticket.assigned_to ?? ''}
              onChange={async (e) => {
                const v = e.target.value || null;
                setAssigning(true);
                const { error } = await updateTicketAssignment(ticket.id, v);
                setAssigning(false);
                if (!error) onUpdate();
              }}
              disabled={assigning}
              className="chamado-assign-select"
            >
              <option value="">— Nenhum —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.id}</option>
              ))}
            </select>
          </div>

          <div className="chamado-drawer-attachments">
            <h3>Anexos</h3>
            {userId && (
              <select
                value={attachmentCategory}
                onChange={(e) => setAttachmentCategory(e.target.value as AttachmentCategory)}
                className="chamado-assign-select"
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
              ref={ticketFileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleAttachmentUpload}
              disabled={!userId || attachmentUploading}
            />
            {userId && (
              <button
                type="button"
                className="chamado-comment-btn"
                onClick={() => ticketFileInputRef.current?.click()}
                disabled={attachmentUploading}
              >
                {attachmentUploading ? 'Enviando…' : '+ Anexar arquivo'}
              </button>
            )}
            {attachments.length > 0 && (
              <ul className="chamado-drawer-attachments-list">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <a href={getAttachmentUrl(a.file_path)} target="_blank" rel="noopener noreferrer">{a.file_name}</a>
                    <button type="button" className="chamado-btn-link" onClick={async () => { await deleteAttachment(a.id, a.file_path); fetchAttachmentsByTicket(ticket.id).then(({ attachments: list }) => setAttachments(list ?? [])); }}>Excluir</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="chamado-drawer-comments">
            <h3>Comentários</h3>
            {comments.map((c) => (
              <div key={c.id} className="chamado-comment">
                <strong>{c.author?.full_name ?? '—'}</strong>
                <span className="chamado-comment-date">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                <p>{c.content}</p>
              </div>
            ))}
            <div className="chamado-comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Novo comentário..."
                rows={2}
                className="chamado-comment-input"
              />
              <button type="button" className="chamado-comment-btn" onClick={handleAddComment} disabled={sending || !newComment.trim()}>
                Enviar
              </button>
            </div>
          </div>

          <div className="chamado-drawer-actions">
            {ticket.status === 'aberto' && (
              <button type="button" className="chamado-btn-status" onClick={() => handleStatusChange('em_andamento')}>
                Em andamento
              </button>
            )}
            {(ticket.status === 'aberto' || ticket.status === 'em_andamento') && (
              <button type="button" className="chamado-btn-status resolvido" onClick={() => handleStatusChange('resolvido')}>
                Marcar resolvido
              </button>
            )}
            {ticket.status === 'resolvido' && (
              <button type="button" className="chamado-btn-status" onClick={() => handleStatusChange('fechado')}>
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
