import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  fetchRooms,
  fetchPatientsInUnit,
  fetchProfessionalsInUnit,
} from '../lib/agenda';
import { fetchAppointmentTypesByUnit } from '../lib/appointmentTypes';
import { supabase } from '../lib/supabase';
import type { EventWithRelations } from '../lib/agenda';
import type { EventType } from '../types';
import './EventFormModal.css';

interface EventFormModalProps {
  unitId: string;
  initialEvent?: EventWithRelations | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EventFormModal({
  unitId,
  initialEvent,
  onClose,
  onSaved,
}: EventFormModalProps) {
  const [type, setType] = useState<EventType>(initialEvent?.type ?? 'atendimento');
  const [patientId, setPatientId] = useState(initialEvent?.patient_id ?? '');
  const [responsibleUserId, setResponsibleUserId] = useState(
    initialEvent?.responsible_user_id ?? ''
  );
  const [roomId, setRoomId] = useState(initialEvent?.room_id ?? '');
  const defaultStart = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const defaultEnd = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [startAt, setStartAt] = useState(
    initialEvent
      ? new Date(initialEvent.start_at).toISOString().slice(0, 16)
      : defaultStart()
  );
  const [endAt, setEndAt] = useState(
    initialEvent
      ? new Date(initialEvent.end_at).toISOString().slice(0, 16)
      : defaultEnd()
  );
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [appointmentTypeId, setAppointmentTypeId] = useState(initialEvent?.appointment_type_id ?? '');
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; full_name: string | null }[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [r, p, pr, at] = await Promise.all([
        fetchRooms(unitId),
        fetchPatientsInUnit(unitId),
        fetchProfessionalsInUnit(unitId),
        fetchAppointmentTypesByUnit(unitId),
      ]);
      setRooms(r.rooms);
      setPatients(p.patients);
      setProfessionals(pr.profiles);
      setAppointmentTypes((at.types ?? []).map((t) => ({ id: t.id, name: t.name })));
      if (!initialEvent && pr.profiles[0]) {
        setResponsibleUserId(pr.profiles[0].id);
      }
    })();
  }, [unitId, initialEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const start = startAt ? new Date(startAt).toISOString() : null;
    const end = endAt ? new Date(endAt).toISOString() : null;
    if (!start || !end || !responsibleUserId) {
      setError('Preencha data/hora e responsável.');
      setSaving(false);
      return;
    }
    if (type === 'atendimento' && !patientId) {
      setError('Selecione o paciente para atendimento.');
      setSaving(false);
      return;
    }
    if (initialEvent) {
      const { error: err } = await supabase
        .from('events')
        .update({
          type,
          appointment_type_id: type === 'atendimento' ? (appointmentTypeId || null) : null,
          patient_id: type === 'atendimento' ? patientId || null : null,
          responsible_user_id: responsibleUserId,
          room_id: roomId || null,
          start_at: start,
          end_at: end,
          title: title || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', initialEvent.id);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const eventColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
      const color_hex = eventColors[Math.floor(Math.random() * eventColors.length)];
      const { error: err } = await supabase.from('events').insert({
        unit_id: unitId,
        type,
        appointment_type_id: type === 'atendimento' ? (appointmentTypeId || null) : null,
        patient_id: type === 'atendimento' ? patientId || null : null,
        responsible_user_id: responsibleUserId,
        room_id: roomId || null,
        start_at: start,
        end_at: end,
        title: title || null,
        status: 'aberto',
        color_hex,
      });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="event-form-overlay" onClick={onClose} role="presentation">
      <div
        className="event-form-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="event-form-title"
      >
        <div className="event-form-header">
          <h2 id="event-form-title">
            {initialEvent ? 'Editar evento' : 'Novo atendimento / reunião'}
          </h2>
          <button type="button" className="event-form-close" onClick={onClose} aria-label="Fechar">
            <X size={20} aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="event-form-body">
          {error && <p className="event-form-error">{error}</p>}
          <label className="event-form-label">
            Tipo
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className="event-form-input"
            >
              <option value="atendimento">Atendimento</option>
              <option value="reuniao">Reunião</option>
            </select>
          </label>
          {type === 'atendimento' && appointmentTypes.length > 0 && (
            <label className="event-form-label">
              Tipo de atendimento
              <select
                value={appointmentTypeId}
                onChange={(e) => setAppointmentTypeId(e.target.value)}
                className="event-form-input"
              >
                <option value="">— Nenhum —</option>
                {appointmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          )}
          {type === 'atendimento' && (
            <label className="event-form-label">
              Paciente *
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="event-form-input"
                required
              >
                <option value="">Selecione</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {type === 'reuniao' && (
            <>
              <p className="event-form-hint">Para reuniões, um link de videoconferência (Jitsi) será gerado automaticamente ao abrir o evento na agenda.</p>
              <label className="event-form-label">
                Título
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="event-form-input"
                placeholder="Ex.: Reunião de equipe"
              />
            </label>
            </>
          )}
          <label className="event-form-label">
            Responsável *
            <select
              value={responsibleUserId}
              onChange={(e) => setResponsibleUserId(e.target.value)}
              className="event-form-input"
              required
            >
              <option value="">Selecione</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.id}
                </option>
              ))}
            </select>
          </label>
          <label className="event-form-label">
            Sala
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="event-form-input"
            >
              <option value="">—</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="event-form-label">
            Início *
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="event-form-input"
              required
            />
          </label>
          <label className="event-form-label">
            Fim *
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="event-form-input"
              required
            />
          </label>
          <div className="event-form-actions">
            <button type="button" className="event-form-btn event-form-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="event-form-btn event-form-btn-submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="event-form-spinner" aria-hidden />
                  Salvando…
                </>
              ) : initialEvent ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
