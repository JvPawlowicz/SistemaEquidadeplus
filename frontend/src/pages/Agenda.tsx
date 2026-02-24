import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, type View, type DateRange } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../contexts/AuthContext';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { AGENDA_DENSITY_KEY } from '../contexts/ActiveUnitContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import { fetchEvents, fetchRooms, fetchProfessionalsInUnit, fetchPatientsInUnit, updateEventStatus, updateEventResponsible, type EventWithRelations } from '../lib/agenda';
import { fetchAppointmentTypesByUnit } from '../lib/appointmentTypes';
import { setNoteDefaultAndFinalize } from '../lib/evolucoes';
import { EventDrawer } from '../components/EventDrawer';
import { EventFormModal } from '../components/EventFormModal';
import type { EventStatus } from '../types';
import './Agenda.css';

type CalendarEvent = {
  start: Date;
  end: Date;
  title: string;
  resource: EventWithRelations;
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { locale: ptBR }),
  getDay,
  locales: { 'pt-BR': ptBR },
});

const messages = {
  week: 'Semana',
  day: 'Dia',
  month: 'Mês',
  agenda: 'Lista',
  today: 'Hoje',
  previous: 'Anterior',
  next: 'Próximo',
  noEventsInRange: 'Nenhum evento neste período.',
};

const AGENDA_EVENT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

function getEventColor(event: EventWithRelations): string {
  if (event.color_hex) return event.color_hex;
  let n = 0;
  for (let i = 0; i < event.id.length; i++) n += event.id.charCodeAt(i);
  return AGENDA_EVENT_COLORS[Math.abs(n) % AGENDA_EVENT_COLORS.length];
}

function eventToCalendarEvent(e: EventWithRelations): CalendarEvent {
  const start = new Date(e.start_at);
  const end = new Date(e.end_at);
  const patient = e.patient?.full_name;
  const typeLabel = e.type === 'atendimento' ? 'Atend.' : 'Reunião';
  const title = patient ? `${typeLabel}: ${patient}` : (e.title ?? typeLabel);
  return { start, end, title, resource: e };
}

export function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editEventId = searchParams.get('editar');
  const { user } = useAuth();
  const { activeUnitId } = useActiveUnit();
  const { canCreateEditEvents, seesUnitAgenda } = useUserRoleInUnit(activeUnitId, user?.id);
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithRelations | null>(null);
  const [density, setDensity] = useState<'normal' | 'compacta'>(() =>
    (localStorage.getItem(AGENDA_DENSITY_KEY) as 'normal' | 'compacta') || 'normal'
  );
  const [filterStatus, setFilterStatus] = useState<string>('aberto');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRoom, setFilterRoom] = useState<string>('');
  const [filterProfessional, setFilterProfessional] = useState<string>('');
  const [filterPatient, setFilterPatient] = useState<string>('');
  const [filterAppointmentType, setFilterAppointmentType] = useState<string>('');
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; full_name: string | null }[]>([]);
  const [patients, setPatients] = useState<{ id: string; full_name: string | null }[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<{ id: string; name: string }[]>([]);
  const refetchRef = useRef<() => void>(() => {});

  useEffect(() => {
    const onDensity = () => setDensity((localStorage.getItem(AGENDA_DENSITY_KEY) as 'normal' | 'compacta') || 'normal');
    window.addEventListener('equidadeplus_agenda_density', onDensity);
    return () => window.removeEventListener('equidadeplus_agenda_density', onDensity);
  }, []);

  useEffect(() => {
    if (!activeUnitId) return;
    fetchRooms(activeUnitId).then(({ rooms: r }) => setRooms(r ?? []));
    fetchProfessionalsInUnit(activeUnitId).then(({ profiles: p }) => setProfessionals(p ?? []));
    fetchPatientsInUnit(activeUnitId).then(({ patients: p }) => setPatients(p ?? []));
    fetchAppointmentTypesByUnit(activeUnitId).then(({ types: t }) => setAppointmentTypes((t ?? []).map((x) => ({ id: x.id, name: x.name }))));
  }, [activeUnitId]);

  const loadEvents = useCallback(
    async (range: DateRange | undefined) => {
      if (!activeUnitId || !range) return;
      let start: Date;
      let end: Date;
      if (Array.isArray(range)) {
        start = range[0];
        end = range[range.length - 1];
      } else {
        start = range.start;
        end = range.end;
      }
      setLoading(true);
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<{ events: EventWithRelations[] }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      );
      try {
        const onlyMine = !seesUnitAgenda;
        const result = await Promise.race([
          fetchEvents(activeUnitId, start, end, onlyMine ? user?.id : undefined),
          timeoutPromise,
        ]);
        setEvents(result?.events ?? []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [activeUnitId, user?.id, seesUnitAgenda]
  );

  useEffect(() => {
    if (!activeUnitId) return;
    const start = view === 'month' ? startOfMonth(date) : view === 'day' ? startOfDay(date) : startOfWeek(date, { locale: ptBR });
    const end = view === 'month' ? endOfMonth(date) : view === 'day' ? endOfDay(date) : endOfWeek(date, { locale: ptBR });
    refetchRef.current = () => loadEvents({ start, end });
    loadEvents({ start, end });
  }, [activeUnitId, date, view, loadEvents]);

  const handleRealtimeEventChange = useCallback(() => {
    refetchRef.current?.();
  }, []);

  useRealtimeEvents(activeUnitId, handleRealtimeEventChange);

  useEffect(() => {
    if (!editEventId || events.length === 0) return;
    const ev = events.find((e) => e.id === editEventId);
    if (ev) {
      setEditingEvent(ev);
      setModalOpen(true);
      setSearchParams((prev) => {
        prev.delete('editar');
        return prev;
      });
    }
  }, [editEventId, events, setSearchParams]);

  const filteredEvents = events.filter((e) => {
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterType && e.type !== filterType) return false;
    if (filterAppointmentType && e.appointment_type_id !== filterAppointmentType) return false;
    if (filterRoom && e.room_id !== filterRoom) return false;
    if (filterProfessional && e.responsible_user_id !== filterProfessional) return false;
    if (filterPatient && e.patient_id !== filterPatient) return false;
    return true;
  });

  const handleSelectEvent = (calEvent: CalendarEvent) => {
    setSelectedEvent(calEvent.resource);
    setDrawerOpen(true);
  };

  const handleStatusChange = async (eventId: string, status: EventStatus, motivo?: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (status === 'realizado') {
      if (!ev?.note?.finalized_at) {
        alert('Finalize a evolução/ata antes de marcar como Realizado.');
        return;
      }
    }
    if (status === 'faltou' || status === 'cancelado') {
      const noteType = ev?.type === 'reuniao' ? 'ata' : 'evolucao';
      const defaultContent = status === 'faltou' ? `Faltou: ${motivo || '(sem motivo)'}` : `Cancelado: ${motivo || '(sem motivo)'}`;
      if (!user?.id) return;
      const { error } = await setNoteDefaultAndFinalize(eventId, noteType, user.id, defaultContent);
      if (error) return;
    }
    const { error } = await updateEventStatus(eventId, status);
    if (error) return;
    setDrawerOpen(false);
    setSelectedEvent(null);
    if (activeUnitId) {
      const start = view === 'month' ? startOfMonth(date) : view === 'day' ? startOfDay(date) : startOfWeek(date, { locale: ptBR });
      const end = view === 'month' ? endOfMonth(date) : view === 'day' ? endOfDay(date) : endOfWeek(date, { locale: ptBR });
      const onlyMine = !seesUnitAgenda;
      const { events: data } = await fetchEvents(activeUnitId, start, end, onlyMine ? user?.id : undefined);
      setEvents(data);
    }
  };

  const handleReopen = async (eventId: string, motivo: string) => {
    const { error } = await updateEventStatus(eventId, 'aberto', motivo);
    if (error) return;
    setDrawerOpen(false);
    setSelectedEvent(null);
    if (activeUnitId) {
      const start = view === 'month' ? startOfMonth(date) : view === 'day' ? startOfDay(date) : startOfWeek(date, { locale: ptBR });
      const end = view === 'month' ? endOfMonth(date) : view === 'day' ? endOfDay(date) : endOfWeek(date, { locale: ptBR });
      const onlyMine = !seesUnitAgenda;
      const { events: data } = await fetchEvents(activeUnitId, start, end, onlyMine ? user?.id : undefined);
      setEvents(data);
    }
  };

  const handleTransferResponsible = async (eventId: string, responsibleUserId: string) => {
    const { error } = await updateEventResponsible(eventId, responsibleUserId);
    if (error) return;
    const newProfile = professionals.find((p) => p.id === responsibleUserId);
    setSelectedEvent((prev) =>
      prev && prev.id === eventId
        ? { ...prev, responsible_user_id: responsibleUserId, responsibleProfile: newProfile ? { id: newProfile.id, full_name: newProfile.full_name } : null }
        : prev
    );
    if (activeUnitId) {
      const start = view === 'month' ? startOfMonth(date) : view === 'day' ? startOfDay(date) : startOfWeek(date, { locale: ptBR });
      const end = view === 'month' ? endOfMonth(date) : view === 'day' ? endOfDay(date) : endOfWeek(date, { locale: ptBR });
      const onlyMine = !seesUnitAgenda;
      const { events: data } = await fetchEvents(activeUnitId, start, end, onlyMine ? user?.id : undefined);
      setEvents(data);
    }
  };

  const calendarEvents = filteredEvents.map(eventToCalendarEvent);

  return (
    <div className="agenda-page">
      <div className="agenda-toolbar">
        <h1 className="agenda-title">Agenda</h1>
        {canCreateEditEvents && (
          <button
            type="button"
            className="agenda-btn-new"
            onClick={() => {
              setEditingEvent(null);
              setModalOpen(true);
            }}
          >
            + Novo atendimento / reunião
          </button>
        )}
      </div>
      <div className="agenda-filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="agenda-filter-select" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="realizado">Realizado</option>
          <option value="faltou">Faltou</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="agenda-filter-select" aria-label="Filtrar por tipo">
          <option value="">Tipo</option>
          <option value="atendimento">Atendimento</option>
          <option value="reuniao">Reunião</option>
        </select>
        {appointmentTypes.length > 0 && (
          <select value={filterAppointmentType} onChange={(e) => setFilterAppointmentType(e.target.value)} className="agenda-filter-select" aria-label="Filtrar por tipo de atendimento">
            <option value="">Tipo de atendimento</option>
            {appointmentTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="agenda-filter-select" aria-label="Filtrar por sala">
          <option value="">Sala</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {seesUnitAgenda && (
          <>
            <select value={filterProfessional} onChange={(e) => setFilterProfessional(e.target.value)} className="agenda-filter-select" aria-label="Filtrar por profissional">
              <option value="">Profissional</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.id}</option>
              ))}
            </select>
            <select value={filterPatient} onChange={(e) => setFilterPatient(e.target.value)} className="agenda-filter-select" aria-label="Filtrar por paciente">
              <option value="">Paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.id}</option>
              ))}
            </select>
          </>
        )}
      </div>
      {loading && (
          <p className="agenda-loading">
            <span className="loading-spinner" aria-hidden />
            Carregando…
          </p>
        )}
      <div className={`agenda-calendar-wrap ${density === 'compacta' ? 'agenda-density-compacta' : ''}`}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          messages={messages}
          culture="pt-BR"
          popup
          eventPropGetter={(event) => ({
            style: { backgroundColor: getEventColor(event.resource), color: '#fff', border: 'none' },
          })}
        />
      </div>

      {drawerOpen && selectedEvent && (
        <EventDrawer
          event={selectedEvent}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedEvent(null);
          }}
          canEdit={canCreateEditEvents}
          userId={user?.id}
          professionals={professionals}
          onStatusChange={handleStatusChange}
          onReopen={handleReopen}
          onTransferResponsible={handleTransferResponsible}
        />
      )}

      {modalOpen && activeUnitId && (
        <EventFormModal
          unitId={activeUnitId}
          initialEvent={editingEvent}
          onClose={() => {
            setModalOpen(false);
            setEditingEvent(null);
            setSearchParams((prev) => {
              prev.delete('editar');
              return prev;
            });
          }}
          onSaved={() => {
            if (activeUnitId) {
              const start = view === 'month' ? startOfMonth(date) : view === 'day' ? startOfDay(date) : startOfWeek(date, { locale: ptBR });
              const end = view === 'month' ? endOfMonth(date) : view === 'day' ? endOfDay(date) : endOfWeek(date, { locale: ptBR });
              const onlyMine = !seesUnitAgenda;
              fetchEvents(activeUnitId, start, end, onlyMine ? user?.id : undefined).then(
                ({ events: data }) => setEvents(data)
              );
            }
          }}
        />
      )}
    </div>
  );
}
