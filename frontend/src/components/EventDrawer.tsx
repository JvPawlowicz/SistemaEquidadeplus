import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Video } from 'lucide-react';
import type { EventWithRelations } from '../lib/agenda';
import type { EventStatus, AttachmentCategory } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { uploadAttachment } from '../lib/attachments';
import './EventDrawer.css';

const JITSI_BASE = 'https://meet.jit.si';
/** Gera o link da sala Jitsi para o evento (sala única por evento). */
function getJitsiMeetingUrl(eventId: string): string {
  const room = `EquidadePlus-${eventId}`.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${JITSI_BASE}/${room}`;
}

interface EventDrawerProps {
  event: EventWithRelations | null;
  onClose: () => void;
  canEdit: boolean;
  userId?: string | null;
  professionals?: { id: string; full_name: string | null }[];
  onStatusChange?: (eventId: string, status: EventStatus, motivo?: string) => void;
  onReopen?: (eventId: string, motivo: string) => void;
  onTransferResponsible?: (eventId: string, responsibleUserId: string) => void;
}

const statusLabel: Record<EventStatus, string> = {
  aberto: 'Aberto',
  realizado: 'Realizado',
  faltou: 'Faltou',
  cancelado: 'Cancelado',
};

export function EventDrawer({
  event,
  onClose,
  canEdit,
  userId,
  professionals = [],
  onStatusChange,
  onReopen,
  onTransferResponsible,
}: EventDrawerProps) {
  const [askingMotivo, setAskingMotivo] = useState<EventStatus | null>(null);
  const [motivoInput, setMotivoInput] = useState('');
  const [reopenMotivo, setReopenMotivo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachMessage, setAttachMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<AttachmentCategory>('outros');
  const [transferResponsibleId, setTransferResponsibleId] = useState<string>('');
  const [transferring, setTransferring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (event) queueMicrotask(() => setTransferResponsibleId(event.responsible_user_id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: só re-sinc quando id/responsible mudam
  }, [event?.id, event?.responsible_user_id]);
  if (!event) return null;

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const patientName = event.patient?.full_name ?? '—';
  const roomName = event.room?.name ?? '—';
  const responsibleName =
    event.responsibleProfile?.full_name ?? event.responsible_user_id;
  const hasNote = !!event.note;
  const noteFinalized = !!event.note?.finalized_at;
  const isAtendimento = event.type === 'atendimento';

  return (
    <div className="event-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="event-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Detalhes do evento"
      >
        <div className="event-drawer-header">
          <h2 className="event-drawer-title">
            {isAtendimento ? 'Atendimento' : 'Reunião'}
          </h2>
          <button
            type="button"
            className="event-drawer-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="event-drawer-body">
          <p className="event-drawer-datetime">
            {format(start, "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })} –{' '}
            {format(end, 'HH:mm', { locale: ptBR })}
          </p>
          <p className="event-drawer-meta">
            <strong>Status:</strong> {statusLabel[event.status]}
          </p>
          {isAtendimento && (
            <p className="event-drawer-meta">
              <strong>Paciente:</strong> {patientName}
            </p>
          )}
          <p className="event-drawer-meta">
            <strong>Sala:</strong> {roomName}
          </p>
          <p className="event-drawer-meta">
            <strong>Responsável:</strong> {responsibleName}
          </p>
          {canEdit && professionals.length > 0 && onTransferResponsible && (
            <div className="event-drawer-transfer">
              <label className="event-drawer-label">Transferir responsável:</label>
              <select
                value={transferResponsibleId}
                onChange={(e) => setTransferResponsibleId(e.target.value)}
                className="event-drawer-select"
                aria-label="Novo responsável"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name ?? p.id}</option>
                ))}
              </select>
              <button
                type="button"
                className="event-drawer-btn event-drawer-btn-secondary"
                disabled={transferring || transferResponsibleId === event.responsible_user_id}
                onClick={async () => {
                  if (transferResponsibleId === event.responsible_user_id) return;
                  setTransferring(true);
                  await Promise.resolve(onTransferResponsible(event.id, transferResponsibleId));
                  setTransferring(false);
                }}
              >
                {transferring ? 'Transferindo…' : 'Transferir responsável'}
              </button>
            </div>
          )}
          {event.title && (
            <p className="event-drawer-meta">
              <strong>Título:</strong> {event.title}
            </p>
          )}

          <p className="event-drawer-meta">
            <strong>Evolução/Ata:</strong>{' '}
            {hasNote ? (noteFinalized ? 'Ok' : 'Pendente') : 'Pendente'}
          </p>
          {event.status !== 'aberto' && event.reopen_reason && (
            <p className="event-drawer-meta">
              <strong>Motivo reabertura:</strong> {event.reopen_reason}
            </p>
          )}

          <div className="event-drawer-actions">
            {isAtendimento && event.patient_id && (
              <Link
                to={`/pacientes/${event.patient_id}`}
                className="event-drawer-btn"
              >
                Abrir prontuário
              </Link>
            )}
            <Link
              to={`/evolucoes/editor/${event.id}`}
              className="event-drawer-btn"
            >
              Abrir evolução/ata
            </Link>
            <a
              href={getJitsiMeetingUrl(event.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="event-drawer-btn event-drawer-btn-secondary"
            >
              <Video size={16} aria-hidden />
              Entrar na videoconferência (Jitsi)
            </a>
            <button
              type="button"
              className="event-drawer-btn event-drawer-btn-secondary"
              onClick={() => {
                const url = getJitsiMeetingUrl(event.id);
                navigator.clipboard.writeText(url).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
            >
              {linkCopied ? 'Link copiado!' : 'Copiar link da reunião'}
            </button>
            {event.patient_id && (
              <Link
                to={`/pacientes/${event.patient_id}#arquivos`}
                className="event-drawer-btn event-drawer-btn-secondary"
              >
                Arquivos do paciente
              </Link>
            )}
            {userId && (
              <>
                <select
                  value={attachmentCategory}
                  onChange={(e) => setAttachmentCategory(e.target.value as AttachmentCategory)}
                  className="event-drawer-select"
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
                  ref={fileInputRef}
                  type="file"
                  className="event-drawer-file-hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    setAttachMessage(null);
                    const { error } = await uploadAttachment(file, {
                      event_id: event.id,
                      patient_id: event.patient_id ?? undefined,
                      created_by: userId,
                      category: attachmentCategory,
                    });
                    setUploading(false);
                    e.target.value = '';
                    setAttachMessage(error ? 'Erro ao anexar.' : 'Arquivo anexado.');
                  }}
                />
                <button
                  type="button"
                  className="event-drawer-btn event-drawer-btn-secondary"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Enviando…' : 'Anexar arquivo'}
                </button>
                {attachMessage && (
                  <span className="event-drawer-attach-msg">{attachMessage}</span>
                )}
              </>
            )}
            {canEdit && (
              <>
                <Link
                  to={`/agenda?editar=${event.id}`}
                  className="event-drawer-btn event-drawer-btn-secondary"
                >
                  Editar
                </Link>
              </>
            )}
            {onStatusChange && event.status === 'aberto' && (
              <div className="event-drawer-status-actions">
                <button
                  type="button"
                  className="event-drawer-btn event-drawer-btn-success"
                  onClick={() => onStatusChange(event.id, 'realizado')}
                >
                  Realizado
                </button>
                <button
                  type="button"
                  className="event-drawer-btn event-drawer-btn-warning"
                  onClick={() => setAskingMotivo('faltou')}
                >
                  Faltou
                </button>
                <button
                  type="button"
                  className="event-drawer-btn event-drawer-btn-danger"
                  onClick={() => setAskingMotivo('cancelado')}
                >
                  Cancelado
                </button>
              </div>
            )}
            {askingMotivo === 'faltou' && (
              <div className="event-drawer-motivo">
                <label>
                  Motivo (opcional):{' '}
                  <input
                    type="text"
                    placeholder="Ex: Paciente não compareceu"
                    value={motivoInput}
                    onChange={(e) => setMotivoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (() => { onStatusChange?.(event.id, 'faltou', motivoInput); setAskingMotivo(null); setMotivoInput(''); })()}
                    autoFocus
                  />
                </label>
                <div className="event-drawer-motivo-btns">
                  <button type="button" className="event-drawer-btn" onClick={() => { setAskingMotivo(null); setMotivoInput(''); }}>Cancelar</button>
                  <button
                    type="button"
                    className="event-drawer-btn event-drawer-btn-warning"
                    onClick={() => {
                      onStatusChange?.(event.id, 'faltou', motivoInput);
                      setAskingMotivo(null);
                      setMotivoInput('');
                    }}
                  >
                    Confirmar Faltou
                  </button>
                </div>
              </div>
            )}
            {askingMotivo === 'cancelado' && (
              <div className="event-drawer-motivo">
                <label>
                  Motivo (opcional):{' '}
                  <input
                    type="text"
                    placeholder="Ex: Remarcado"
                    value={motivoInput}
                    onChange={(e) => setMotivoInput(e.target.value)}
                    autoFocus
                  />
                </label>
                <div className="event-drawer-motivo-btns">
                  <button type="button" className="event-drawer-btn" onClick={() => { setAskingMotivo(null); setMotivoInput(''); }}>Cancelar</button>
                  <button
                    type="button"
                    className="event-drawer-btn event-drawer-btn-danger"
                    onClick={() => {
                      onStatusChange?.(event.id, 'cancelado', motivoInput);
                      setAskingMotivo(null);
                      setMotivoInput('');
                    }}
                  >
                    Confirmar Cancelado
                  </button>
                </div>
              </div>
            )}
            {canEdit && onReopen && event.status !== 'aberto' && (
              <div className="event-drawer-reopen">
                <input
                  type="text"
                  className="event-drawer-reopen-input"
                  placeholder="Motivo da reabertura (obrigatório)"
                  value={reopenMotivo}
                  onChange={(e) => setReopenMotivo(e.target.value)}
                />
                <button
                  type="button"
                  className="event-drawer-btn event-drawer-btn-secondary"
                  disabled={!reopenMotivo.trim()}
                  onClick={() => {
                    onReopen(event.id, reopenMotivo.trim());
                    setReopenMotivo('');
                  }}
                >
                  Reabrir evento
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
