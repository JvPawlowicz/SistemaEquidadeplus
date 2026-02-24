import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { AGENDA_DENSITY_KEY, type AgendaDensity } from '../contexts/ActiveUnitContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import {
  fetchAllUnits,
  createUnit,
  updateUnit,
  createRoom,
  updateRoom,
  deleteRoom,
  fetchInsurances,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  fetchTicketCategoriesConfig,
  createTicketCategory,
  updateTicketCategory,
  deleteTicketCategory,
  updateProfile,
} from '../lib/config';
import { fetchUsersForAdmin, setProfileBlocked, removeUserFromUnit, setUserUnitRole, inviteUserByEmail, generateResetPasswordLink, createUserWithPassword, adminSetPassword } from '../lib/users';
import { fetchRooms as fetchRoomsAgenda } from '../lib/agenda';
import { fetchCep, formatCep, getTimezoneFromState } from '../lib/cep';
import { fetchAssetsInUnit, createAsset, updateAsset, deleteAsset } from '../lib/assets';
import { fetchNoteTemplates, createNoteTemplate, updateNoteTemplate, deleteNoteTemplate } from '../lib/noteTemplates';
import { fetchTemplatesByUnit, createTemplate, updateTemplate, deleteTemplate, cloneTemplateAsNewVersion } from '../lib/avaliacoes';
import { fetchAbaTemplatesByUnit, createAbaTemplate, updateAbaTemplate, deleteAbaTemplate, type AbaTemplate } from '../lib/abaTemplates';
import { fetchAppointmentTypesByUnit, createAppointmentType, updateAppointmentType, deleteAppointmentType } from '../lib/appointmentTypes';
import { fetchPatientTagDefinitions, createPatientTagDefinition, updatePatientTagDefinition, deletePatientTagDefinition } from '../lib/patientTagDefinitions';
import { fetchSpecialties, createSpecialty, updateSpecialty, deleteSpecialty } from '../lib/specialties';
import { fetchJobTitles, createJobTitle, updateJobTitle, deleteJobTitle } from '../lib/jobTitles';
import type { ConfigSpecialty } from '../lib/specialties';
import type { ConfigJobTitle } from '../lib/jobTitles';
import type { Unit, Room, Insurance, TicketCategory, Asset, NoteTemplate, AppointmentType } from '../types';
import type { EvaluationTemplate, EvaluationType } from '../types';
import type { AppRole } from '../types';
import type { PatientTagDefinition } from '../types';
import type { UserWithUnits } from '../lib/users';
import './Configuracoes.css';

type ConfigTab = 'unidades' | 'tipos-atendimento' | 'convenios' | 'categorias' | 'tags-pacientes' | 'especialidades' | 'cargos' | 'usuarios' | 'ativos' | 'templates' | 'templates-avaliacao' | 'templates-aba';

export function Configuracoes() {
  const { user } = useAuth();
  const { activeUnitId, units: myUnits, setActiveUnitId } = useActiveUnit();
  const { isAdminInAnyUnit } = useUserRoleInUnit(activeUnitId, user?.id);
  const [tab, setTab] = useState<ConfigTab>('unidades');
  const [density, setDensity] = useState<AgendaDensity>(() =>
    (localStorage.getItem(AGENDA_DENSITY_KEY) as AgendaDensity) || 'normal'
  );

  const [units, setUnits] = useState<Unit[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [users, setUsers] = useState<UserWithUnits[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [evalTemplates, setEvalTemplates] = useState<EvaluationTemplate[]>([]);
  const [abaTemplates, setAbaTemplates] = useState<AbaTemplate[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [tagDefinitions, setTagDefinitions] = useState<PatientTagDefinition[]>([]);
  const [specialties, setSpecialties] = useState<ConfigSpecialty[]>([]);
  const [jobTitles, setJobTitles] = useState<ConfigJobTitle[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTagDefinitions = () => fetchPatientTagDefinitions().then(({ definitions: d }) => setTagDefinitions(d ?? []));
  const loadUnits = () => fetchAllUnits().then(({ units: u }) => setUnits(u));
  const loadInsurances = () => fetchInsurances().then(({ insurances: i }) => setInsurances(i));
  const loadCategories = () => fetchTicketCategoriesConfig().then(({ categories: c }) => setCategories(c));
  const loadUsers = () => fetchUsersForAdmin().then(({ users: u }) => setUsers(u));
  const loadAssets = () => activeUnitId && fetchAssetsInUnit(activeUnitId).then(({ assets: a }) => setAssets(a ?? []));
  const loadTemplates = () => activeUnitId && fetchNoteTemplates(activeUnitId).then(({ templates: t }) => setTemplates(t ?? []));
  const loadEvalTemplates = () => activeUnitId && fetchTemplatesByUnit(activeUnitId).then(({ templates: t }) => setEvalTemplates(t ?? []));
  const loadAbaTemplates = () => activeUnitId && fetchAbaTemplatesByUnit(activeUnitId).then(({ templates: t }) => setAbaTemplates(t ?? []));
  const loadAppointmentTypes = () => activeUnitId && fetchAppointmentTypesByUnit(activeUnitId).then(({ types: t }) => setAppointmentTypes(t ?? []));
  const loadSpecialties = () => fetchSpecialties().then(({ list }) => setSpecialties(list));
  const loadJobTitles = () => fetchJobTitles().then(({ list }) => setJobTitles(list ?? []));

  useEffect(() => { loadUnits(); }, []);
  useEffect(() => { if (tab === 'convenios') loadInsurances(); }, [tab]);
  useEffect(() => { if (tab === 'categorias') loadCategories(); }, [tab]);
  useEffect(() => { if (tab === 'tags-pacientes') loadTagDefinitions(); }, [tab]);
  useEffect(() => { if (tab === 'especialidades') loadSpecialties(); }, [tab]);
  useEffect(() => { if (tab === 'cargos') loadJobTitles(); }, [tab]);
  useEffect(() => { if (tab === 'usuarios') loadUsers(); }, [tab]);
  useEffect(() => { if (tab === 'ativos' && activeUnitId) loadAssets(); }, [tab, activeUnitId]);
  useEffect(() => { if (tab === 'templates' && activeUnitId) loadTemplates(); }, [tab, activeUnitId]);
  useEffect(() => { if (tab === 'templates-avaliacao' && activeUnitId) loadEvalTemplates(); }, [tab, activeUnitId]);
  useEffect(() => { if (tab === 'templates-aba' && activeUnitId) loadAbaTemplates(); }, [tab, activeUnitId]);
  useEffect(() => { if (tab === 'tipos-atendimento' && activeUnitId) loadAppointmentTypes(); }, [tab, activeUnitId]);

  return (
    <div className="configuracoes-page">
      <h1 className="configuracoes-title">Configurações</h1>
      <div className="config-preferencias config-preferencias-minimal">
        <select
          value={activeUnitId ?? ''}
          onChange={async (e) => {
            const value = e.target.value;
            if (!value || !user?.id) return;
            setActiveUnitId(value);
            await updateProfile(user.id, { default_unit_id: value || null });
          }}
          className="config-input"
          title="Unidade padrão"
        >
          {myUnits.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={density}
          onChange={(e) => {
            const v = e.target.value as AgendaDensity;
            setDensity(v);
            localStorage.setItem(AGENDA_DENSITY_KEY, v);
            window.dispatchEvent(new Event('equidadeplus_agenda_density'));
          }}
          className="config-input"
          title="Densidade da agenda"
        >
          <option value="normal">Normal</option>
          <option value="compacta">Compacta</option>
        </select>
        <Link to="/configuracoes/perfil" className="config-btn-link">Meu Perfil</Link>
      </div>
      {!isAdminInAnyUnit && (
        <p className="configuracoes-no-admin">Apenas administradores podem gerenciar unidades, salas, convênios e categorias.</p>
      )}
      {isAdminInAnyUnit && (
        <>
          <div className="configuracoes-tabs">
            {(['unidades', 'tipos-atendimento', 'convenios', 'categorias', 'tags-pacientes', 'especialidades', 'cargos', 'usuarios', 'ativos', 'templates', 'templates-avaliacao', 'templates-aba'] as ConfigTab[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`configuracoes-tab ${tab === t ? 'is-active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'unidades' && 'Unidades'}
                {t === 'tipos-atendimento' && 'Tipos de atendimento'}
                {t === 'convenios' && 'Convênios'}
                {t === 'categorias' && 'Categorias de chamados'}
                {t === 'tags-pacientes' && 'Tags de pacientes'}
                {t === 'especialidades' && 'Especialidades'}
                {t === 'cargos' && 'Cargos'}
                {t === 'usuarios' && 'Usuários'}
                {t === 'ativos' && 'Ativos'}
                {t === 'templates' && 'Templates de texto'}
                {t === 'templates-avaliacao' && 'Templates de avaliação'}
                {t === 'templates-aba' && 'Templates ABA'}
              </button>
            ))}
          </div>

          {tab === 'unidades' && (
            <ConfigUnidades units={units} onSaved={loadUnits} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'tipos-atendimento' && activeUnitId && (
            <ConfigTiposAtendimento unitId={activeUnitId} units={units} types={appointmentTypes} onSaved={loadAppointmentTypes} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'convenios' && (
            <ConfigConvenios insurances={insurances} onSaved={loadInsurances} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'categorias' && (
            <ConfigCategorias categories={categories} onSaved={loadCategories} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'tags-pacientes' && (
            <ConfigTagsPacientes definitions={tagDefinitions} onSaved={loadTagDefinitions} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'especialidades' && (
            <ConfigEspecialidades items={specialties} onSaved={loadSpecialties} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'cargos' && (
            <ConfigCargos items={jobTitles} onSaved={loadJobTitles} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'usuarios' && (
            <ConfigUsuarios users={users} units={units} onSaved={loadUsers} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'ativos' && activeUnitId && (
            <ConfigAtivos unitId={activeUnitId} units={units} assets={assets} onSaved={loadAssets} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'templates' && activeUnitId && (
            <ConfigTemplates unitId={activeUnitId} units={units} templates={templates} onSaved={loadTemplates} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'templates-avaliacao' && activeUnitId && (
            <ConfigTemplatesAvaliacao unitId={activeUnitId} units={units} templates={evalTemplates} onSaved={loadEvalTemplates} loading={loading} setLoading={setLoading} />
          )}
          {tab === 'templates-aba' && activeUnitId && (
            <ConfigTemplatesAba unitId={activeUnitId} units={units} templates={abaTemplates} onSaved={loadAbaTemplates} loading={loading} setLoading={setLoading} />
          )}
        </>
      )}
    </div>
  );
}

function ConfigUnidades({
  units,
  onSaved,
  loading,
  setLoading,
}: {
  units: Unit[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<Unit | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [unitRooms, setUnitRooms] = useState<Room[]>([]);
  const [roomEditing, setRoomEditing] = useState<Room | null>(null);
  const [roomAdding, setRoomAdding] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const loadRoomsForUnit = (unitId: string) => {
    fetchRoomsAgenda(unitId).then(({ rooms: r }) => setUnitRooms(r ?? []));
  };

  useEffect(() => {
    if (editing?.id) loadRoomsForUnit(editing.id);
    else setUnitRooms([]);
  }, [editing?.id]);

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
    setTimezone('America/Sao_Paulo');
    setAddress('');
    setCep('');
    setCnpj('');
    setPhone('');
    setEmail('');
    setRoomEditing(null);
    setRoomAdding(false);
    setRoomName('');
    setCepError(null);
  };

  const openNewForm = () => {
    setEditing(null);
    setName('');
    setTimezone('America/Sao_Paulo');
    setAddress('');
    setCep('');
    setCnpj('');
    setPhone('');
    setEmail('');
    setRoomAdding(false);
    setRoomEditing(null);
    setRoomName('');
    setCepError(null);
    setAdding(true);
  };

  const handleBuscarCep = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepError('CEP deve ter 8 dígitos.');
      return;
    }
    setCepError(null);
    setCepLoading(true);
    const { data, error } = await fetchCep(cep);
    setCepLoading(false);
    if (error) {
      setCepError(error);
      return;
    }
    if (data) {
      setAddress(data.formattedAddress);
      setTimezone(getTimezoneFromState(data.state));
      setCep(data.cep ?? cep);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createUnit(name.trim(), timezone, {
      address: address.trim() || undefined,
      cep: cep.trim() || undefined,
      cnpj: cnpj.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });
    setLoading(false);
    if (!error) {
      resetForm();
      onSaved();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateUnit(editing.id, {
      name: name.trim(),
      timezone,
      address: address.trim() || null,
      cep: cep.trim() || null,
      cnpj: cnpj.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setLoading(false);
    if (!error) {
      setEditing(null);
      onSaved();
    }
  };

  const handleRoomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !roomName.trim()) return;
    setLoading(true);
    const { error } = await createRoom(editing.id, roomName.trim());
    setLoading(false);
    if (!error) {
      setRoomAdding(false);
      setRoomName('');
      loadRoomsForUnit(editing.id);
    }
  };

  const handleRoomEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomEditing) return;
    setLoading(true);
    const { error } = await updateRoom(roomEditing.id, roomName.trim());
    setLoading(false);
    if (!error) {
      setRoomEditing(null);
      setRoomName('');
      if (editing) loadRoomsForUnit(editing.id);
    }
  };

  const handleRoomDelete = async (id: string) => {
    if (!confirm('Excluir esta sala?')) return;
    setLoading(true);
    const { error } = await deleteRoom(id);
    setLoading(false);
    if (!error && editing) loadRoomsForUnit(editing.id);
  };

  return (
    <div className="config-block">
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={openNewForm}>
            + Nova unidade
          </button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar unidade' : 'Nova unidade'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Unidade Centro" required className="config-input" />
          </label>
          <div className="config-form-label-block config-form-cep-row">
            <label style={{ flex: 1 }}>
              <span>CEP</span>
              <input
                type="text"
                value={formatCep(cep)}
                onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="00000-000"
                className="config-input"
              />
            </label>
            <button type="button" className="config-btn-add config-btn-buscar-cep" onClick={handleBuscarCep} disabled={cepLoading}>
              {cepLoading ? 'Buscando…' : 'Buscar CEP'}
            </button>
          </div>
          {cepError && <p className="config-cep-error">{cepError}</p>}
          <label className="config-form-label-block">
            <span>Endereço</span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço completo (ou use Buscar CEP)" className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>CNPJ</span>
            <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="CNPJ" className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Telefone</span>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail da unidade" className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Fuso horário</span>
            <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/Sao_Paulo (preenchido ao buscar CEP)" className="config-input" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {editing && (
        <div className="config-unidades-salas">
          <h4 className="config-unidades-salas-title">Salas desta unidade</h4>
          <div className="config-toolbar">
            {!roomAdding && !roomEditing && (
              <button type="button" className="config-btn-add" onClick={() => { setRoomAdding(true); setRoomName(''); }}>+ Nova sala</button>
            )}
          </div>
          {(roomAdding || roomEditing) && (
            <form onSubmit={roomEditing ? handleRoomEdit : handleRoomAdd} className="config-form config-form-labeled config-form-inline">
            <label className="config-form-label-block">
              <span>Nome da sala *</span>
              <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ex.: Sala 1" required className="config-input" />
            </label>
            <div className="config-form-actions">
              <button type="submit" className="config-btn-save" disabled={loading}>{roomEditing ? 'Salvar' : 'Criar'}</button>
              <button type="button" className="config-btn-cancel" onClick={() => { setRoomAdding(false); setRoomEditing(null); setRoomName(''); }}>Cancelar</button>
            </div>
          </form>
          )}
          {unitRooms.length === 0 && !roomAdding && !roomEditing ? (
            <p className="config-empty-inline">Nenhuma sala. Adicione acima.</p>
          ) : (
            <table className="config-table">
              <thead><tr><th>Nome</th><th></th></tr></thead>
              <tbody>
                {unitRooms.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>
                      <button type="button" className="config-btn-edit" onClick={() => { setRoomEditing(r); setRoomName(r.name); setRoomAdding(false); }}>Editar</button>
                      <button type="button" className="config-btn-delete" onClick={() => handleRoomDelete(r.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {units.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhuma unidade cadastrada.</p>
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Criar primeira unidade</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th>Endereço / CNPJ</th><th></th></tr></thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="config-template-preview">{(u.address ?? '') || (u.cnpj ? `CNPJ ${u.cnpj}` : '—')}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(u); setName(u.name); setTimezone(u.timezone); setAddress(u.address ?? ''); setCep(u.cep ?? ''); setCnpj(u.cnpj ?? ''); setPhone(u.phone ?? ''); setEmail(u.email ?? ''); setAdding(false); setCepError(null); }}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigTiposAtendimento({
  unitId,
  units,
  types,
  onSaved,
  loading,
  setLoading,
}: {
  unitId: string;
  units: Unit[];
  types: AppointmentType[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<AppointmentType | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createAppointmentType(unitId, name.trim());
    setLoading(false);
    if (!error) { setAdding(false); setName(''); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateAppointmentType(editing.id, name.trim());
    setLoading(false);
    if (!error) { setEditing(null); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este tipo de atendimento?')) return;
    setLoading(true);
    const { error } = await deleteAppointmentType(id);
    setLoading(false);
    if (!error) onSaved();
  };

  return (
    <div className="config-block">
      <p className="config-unit-note">Unidade ativa: <strong>{units.find((u) => u.id === unitId)?.name ?? unitId}</strong>.</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Novo tipo de atendimento</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar tipo' : 'Novo tipo de atendimento'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Consulta, Retorno, Avaliação" required className="config-input" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={() => { setAdding(false); setEditing(null); }}>Cancelar</button>
          </div>
        </form>
      )}
      {types.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum tipo de atendimento nesta unidade.</p>
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Criar primeiro tipo</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th></th></tr></thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(t); setName(t.name); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(t.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigConvenios({
  insurances,
  onSaved,
  loading,
  setLoading,
}: {
  insurances: Insurance[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<Insurance | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createInsurance(name.trim());
    setLoading(false);
    if (!error) { setAdding(false); setName(''); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateInsurance(editing.id, name.trim());
    setLoading(false);
    if (!error) { setEditing(null); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este convênio?')) return;
    setLoading(true);
    const { error } = await deleteInsurance(id);
    setLoading(false);
    if (!error) onSaved();
  };

  return (
    <div className="config-block">
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Novo convênio</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar convênio' : 'Novo convênio'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Particular, Unimed" required className="config-input" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={() => { setAdding(false); setEditing(null); }}>Cancelar</button>
          </div>
        </form>
      )}
      {insurances.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum convênio cadastrado.</p>
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Criar primeiro convênio</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th></th></tr></thead>
        <tbody>
          {insurances.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(i); setName(i.name); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(i.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigCategorias({
  categories,
  onSaved,
  loading,
  setLoading,
}: {
  categories: TicketCategory[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<TicketCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createTicketCategory(name.trim());
    setLoading(false);
    if (!error) { setAdding(false); setName(''); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateTicketCategory(editing.id, name.trim());
    setLoading(false);
    if (!error) { setEditing(null); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    setLoading(true);
    const { error } = await deleteTicketCategory(id);
    setLoading(false);
    if (!error) onSaved();
  };

  return (
    <div className="config-block">
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Nova categoria de chamado</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar categoria' : 'Nova categoria de chamados'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Suporte, Infraestrutura" required className="config-input" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={() => { setAdding(false); setEditing(null); }}>Cancelar</button>
          </div>
        </form>
      )}
      {categories.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhuma categoria de chamados.</p>
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Criar primeira categoria</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th></th></tr></thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(c); setName(c.name); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigAtivos({
  unitId,
  units,
  assets,
  onSaved,
  loading,
  setLoading,
}: {
  unitId: string;
  units: Unit[];
  assets: Asset[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<Asset | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [status, setStatus] = useState('ativo');

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
    setAssetType('');
    setStatus('ativo');
  };

  const openNewForm = () => {
    setEditing(null);
    setName('');
    setAssetType('');
    setStatus('ativo');
    setAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createAsset({ unit_id: unitId, name: name.trim(), asset_type: assetType.trim() || undefined, status });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateAsset(editing.id, { name: name.trim(), asset_type: assetType.trim() || null, status });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este ativo?')) return;
    setLoading(true);
    const { error } = await deleteAsset(id);
    setLoading(false);
    if (!error) onSaved();
  };

  const unitName = units.find((u) => u.id === unitId)?.name ?? unitId;

  return (
    <div className="config-block">
      <p className="config-unit-note">Unidade ativa: <strong>{unitName}</strong>. Ativos listados desta unidade.</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Novo ativo</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar ativo' : 'Novo ativo'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Computador 01" required className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Tipo</span>
            <input type="text" value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="Ex.: Computador, Impressora" className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="config-input">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="manutencao">Manutenção</option>
            </select>
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {assets.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum ativo nesta unidade.</p>
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Criar primeiro ativo</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th>Tipo</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.asset_type ?? '—'}</td>
              <td>{a.status}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(a); setName(a.name); setAssetType(a.asset_type ?? ''); setStatus(a.status); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(a.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigTemplates({
  unitId,
  units,
  templates,
  onSaved,
  loading,
  setLoading,
}: {
  unitId: string;
  units: Unit[];
  templates: NoteTemplate[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<NoteTemplate | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
    setContent('');
  };

  const openNewForm = () => {
    setEditing(null);
    setName('');
    setContent('');
    setAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createNoteTemplate(unitId, name.trim(), content);
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateNoteTemplate(editing.id, name.trim(), content);
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    setLoading(true);
    const { error } = await deleteNoteTemplate(id);
    setLoading(false);
    if (!error) onSaved();
  };

  const unitName = units.find((u) => u.id === unitId)?.name ?? unitId;

  return (
    <div className="config-block">
      <p className="config-unit-note">Unidade ativa: <strong>{unitName}</strong>. Templates disponíveis no editor de evolução/ata.</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Novo template de texto</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-template config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar template' : 'Novo template de texto'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Evolução padrão" required className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Conteúdo</span>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto que será inserido no editor de evolução/ata" rows={4} className="config-input config-textarea" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {templates.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum template de texto nesta unidade.</p>
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Criar primeiro template</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th>Conteúdo (resumo)</th><th></th></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td className="config-template-preview">{t.content.slice(0, 60)}{t.content.length > 60 ? '…' : ''}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(t); setName(t.name); setContent(t.content); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(t.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

const EVAL_TYPES: { value: EvaluationType; label: string }[] = [
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'consentimento', label: 'Consentimento' },
  { value: 'avaliacao_interna', label: 'Avaliação interna' },
];

function ConfigTemplatesAvaliacao({
  unitId,
  units,
  templates,
  onSaved,
  loading,
  setLoading,
}: {
  unitId: string;
  units: Unit[];
  templates: EvaluationTemplate[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<EvaluationTemplate | null>(null);
  const [adding, setAdding] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<EvaluationType>('avaliacao_interna');
  const [schemaJson, setSchemaJson] = useState('[]');

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
    setType('avaliacao_interna');
    setSchemaJson('[]');
  };

  const openNewForm = () => {
    setEditing(null);
    setName('');
    setType('avaliacao_interna');
    setSchemaJson('[]');
    setAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    let schema: unknown = [];
    try {
      schema = JSON.parse(schemaJson || '[]');
    } catch {
      alert('Schema JSON inválido.');
      return;
    }
    setLoading(true);
    const { error } = await createTemplate(unitId, { name: name.trim(), type, schema_json: schema });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    let schema: unknown = [];
    try {
      schema = JSON.parse(schemaJson || '[]');
    } catch {
      alert('Schema JSON inválido.');
      return;
    }
    setLoading(true);
    const { error } = await updateTemplate(editing.id, { name: name.trim(), type, schema_json: schema });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template de avaliação?')) return;
    setLoading(true);
    const { error } = await deleteTemplate(id);
    setLoading(false);
    if (!error) onSaved();
  };

  const handleNewVersion = async (id: string) => {
    setCloningId(id);
    const { error } = await cloneTemplateAsNewVersion(id);
    setCloningId(null);
    if (!error) onSaved();
    else alert('Erro ao criar nova versão.');
  };

  const unitName = units.find((u) => u.id === unitId)?.name ?? unitId;

  return (
    <div className="config-block">
      <p className="config-unit-note">Unidade ativa: <strong>{unitName}</strong>. Templates usados nas avaliações do prontuário (anamnese, consentimento, etc.).</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Novo template de avaliação</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-template config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar template de avaliação' : 'Novo template de avaliação'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Anamnese inicial" required className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Tipo</span>
            <select value={type} onChange={(e) => setType(e.target.value as EvaluationType)} className="config-input">
              {EVAL_TYPES.map((ev) => (
                <option key={ev.value} value={ev.value}>{ev.label}</option>
              ))}
            </select>
          </label>
          <label className="config-form-label-block">
            <span>Schema JSON (campos do formulário)</span>
            <textarea value={schemaJson} onChange={(e) => setSchemaJson(e.target.value)} placeholder='[{"id":"campo1","label":"Campo 1","type":"text"}]' rows={3} className="config-input config-textarea" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {templates.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum template de avaliação nesta unidade.</p>
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Criar primeiro template</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th>Tipo</th><th>Versão</th><th></th></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{EVAL_TYPES.find((e) => e.value === t.type)?.label ?? t.type}</td>
              <td>{t.version ?? 1}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(t); setName(t.name); setType(t.type); setSchemaJson(JSON.stringify(t.schema_json ?? [], null, 2)); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-edit" onClick={() => handleNewVersion(t.id)} disabled={cloningId === t.id}>{cloningId === t.id ? 'Criando…' : 'Nova versão'}</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(t.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigTemplatesAba({
  unitId,
  units,
  templates,
  onSaved,
  loading,
  setLoading,
}: {
  unitId: string;
  units: Unit[];
  templates: AbaTemplate[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<AbaTemplate | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
    setDescription('');
  };

  const openNewForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createAbaTemplate(unitId, { name: name.trim(), description: description.trim() || null });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateAbaTemplate(editing.id, { name: name.trim(), description: description.trim() || null });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template ABA?')) return;
    setLoading(true);
    const { error } = await deleteAbaTemplate(id);
    setLoading(false);
    if (!error) onSaved();
  };

  const unitName = units.find((u) => u.id === unitId)?.name ?? unitId;

  return (
    <div className="config-block">
      <p className="config-unit-note">Unidade ativa: <strong>{unitName}</strong>. Templates para criar programa ABA a partir de template no prontuário.</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Novo template ABA</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-template config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar template ABA' : 'Novo template ABA'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Programa comunicação" required className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Descrição (opcional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do template" rows={2} className="config-input config-textarea" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {templates.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum template ABA nesta unidade.</p>
          <button type="button" className="config-btn-add" onClick={openNewForm}>+ Criar primeiro template</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th>Descrição</th><th></th></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td className="config-template-preview">{t.description?.slice(0, 50) ?? '—'}{t.description && t.description.length > 50 ? '…' : ''}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(t); setName(t.name); setDescription(t.description ?? ''); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(t.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigEspecialidades({
  items,
  onSaved,
  loading,
  setLoading,
}: {
  items: ConfigSpecialty[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<ConfigSpecialty | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createSpecialty(name.trim());
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateSpecialty(editing.id, name.trim());
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta especialidade? Usuários que a usam continuarão com o valor salvo no perfil.')) return;
    setLoading(true);
    const { error } = await deleteSpecialty(id);
    setLoading(false);
    if (!error) onSaved();
  };

  return (
    <div className="config-block">
      <p className="config-unit-note">Especialidades. Os usuários escolhem uma ou mais na tela Meu Perfil.</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Nova especialidade</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar especialidade' : 'Nova especialidade'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Psicologia clínica, ABA" required className="config-input" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {items.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhuma especialidade cadastrada.</p>
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Criar primeira especialidade</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th></th></tr></thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(s); setName(s.name); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(s.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigCargos({
  items,
  onSaved,
  loading,
  setLoading,
}: {
  items: ConfigJobTitle[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<ConfigJobTitle | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createJobTitle(name.trim());
    setLoading(false);
    if (!error) { setAdding(false); setName(''); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updateJobTitle(editing.id, name.trim());
    setLoading(false);
    if (!error) { setEditing(null); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cargo? Perfis que usam continuarão com o nome no texto.')) return;
    setLoading(true);
    const { error } = await deleteJobTitle(id);
    setLoading(false);
    if (!error) onSaved();
  };

  return (
    <div className="config-block">
      <p className="config-unit-note">Cargos/funções que o admin cadastra. Usados em Meu Perfil para definir a função do usuário.</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Novo cargo</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar cargo' : 'Novo cargo'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Terapeuta, Coordenador" required className="config-input" />
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={() => { setAdding(false); setEditing(null); }}>Cancelar</button>
          </div>
        </form>
      )}
      {items.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhum cargo cadastrado.</p>
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); setName(''); }}>+ Criar primeiro cargo</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th></th></tr></thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(c); setName(c.name); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

function ConfigTagsPacientes({
  definitions,
  onSaved,
  loading,
  setLoading,
}: {
  definitions: PatientTagDefinition[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<PatientTagDefinition | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('#6b7280');

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setName('');
    setColorHex('#6b7280');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createPatientTagDefinition(name.trim(), colorHex);
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const { error } = await updatePatientTagDefinition(editing.id, { name: name.trim(), color_hex: colorHex });
    setLoading(false);
    if (!error) { resetForm(); onSaved(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tag? Pacientes que a usam continuarão com o nome da tag no texto.')) return;
    setLoading(true);
    const { error } = await deletePatientTagDefinition(id);
    setLoading(false);
    if (!error) onSaved();
  };

  return (
    <div className="config-block">
      <p className="config-unit-note">Tags que o admin pode criar para classificar pacientes. Cada tag tem uma cor. Use no cadastro do paciente (campo tags).</p>
      <div className="config-toolbar">
        {!adding && !editing && (
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); resetForm(); }}>+ Nova tag</button>
        )}
      </div>
      {(adding || editing) && (
        <form onSubmit={editing ? handleEdit : handleAdd} className="config-form config-form-labeled">
          <h3 className="config-form-title">{editing ? 'Editar tag' : 'Nova tag de paciente'}</h3>
          <label className="config-form-label-block">
            <span>Nome *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Prioridade, Acompanhamento" required className="config-input" />
          </label>
          <label className="config-form-label-block">
            <span>Cor</span>
            <div className="config-color-row">
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="config-input-color" title="Cor" />
              <input type="text" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="config-input config-input-hex" placeholder="#6b7280" />
            </div>
          </label>
          <div className="config-form-actions">
            <button type="submit" className="config-btn-save" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</button>
            <button type="button" className="config-btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}
      {definitions.length === 0 && !adding && !editing ? (
        <div className="config-empty">
          <p>Nenhuma tag de paciente cadastrada.</p>
          <button type="button" className="config-btn-add" onClick={() => { setAdding(true); resetForm(); }}>+ Criar primeira tag</button>
        </div>
      ) : (
      <table className="config-table">
        <thead><tr><th>Nome</th><th>Cor</th><th></th></tr></thead>
        <tbody>
          {definitions.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>
                <span className="config-tag-color-preview" style={{ backgroundColor: d.color_hex }} aria-hidden />
                <span className="config-tag-color-hex">{d.color_hex}</span>
              </td>
              <td>
                <button type="button" className="config-btn-edit" onClick={() => { setEditing(d); setName(d.name); setColorHex(d.color_hex); setAdding(false); }}>Editar</button>
                <button type="button" className="config-btn-delete" onClick={() => handleDelete(d.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

const ROLES: AppRole[] = ['admin', 'coordenador', 'secretaria', 'profissional', 'estagiario', 'ti'];

function ConfigUsuarios({
  users,
  units,
  onSaved,
  loading,
  setLoading,
}: {
  users: UserWithUnits[];
  units: Unit[];
  onSaved: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [setPasswordModal, setSetPasswordModal] = useState<{ userId: string; userName: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ message?: string; link?: string } | null>(null);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createUnitId, setCreateUnitId] = useState('');
  const [createRole, setCreateRole] = useState<AppRole>('profissional');
  const [createSending, setCreateSending] = useState(false);
  const [createResult, setCreateResult] = useState<{ message?: string; error?: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [setPasswordSending, setSetPasswordSending] = useState(false);
  const [setPasswordResult, setSetPasswordResult] = useState<string | null>(null);
  const [resetLinkModal, setResetLinkModal] = useState<{ email: string; link: string } | null>(null);
  const [resetLinkLoadingUserId, setResetLinkLoadingUserId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const handleBlock = async (u: UserWithUnits) => {
    if (u.id === currentUser?.id) { alert('Você não pode bloquear a si mesmo.'); return; }
    if (!confirm(u.is_blocked ? 'Desbloquear este usuário?' : 'Bloquear este usuário? Ele será deslogado.')) return;
    setLoading(true);
    const { error } = await setProfileBlocked(u.id, !u.is_blocked);
    setLoading(false);
    if (!error) onSaved();
  };

  const handleRemoveUnit = async (userId: string, unitId: string) => {
    if (!confirm('Remover este usuário da unidade?')) return;
    setLoading(true);
    const { error } = await removeUserFromUnit(userId, unitId);
    setLoading(false);
    if (!error) onSaved();
  };

  const handleRoleChange = async (userId: string, unitId: string, role: AppRole) => {
    setLoading(true);
    const { error } = await setUserUnitRole(userId, unitId, role);
    setLoading(false);
    if (!error) onSaved();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    setInviteResult(null);
    const result = await inviteUserByEmail(inviteEmail.trim());
    setInviteSending(false);
    if (result.error) setInviteResult({ message: result.error });
    else setInviteResult({ message: result.message, link: result.link });
  };

  const handleRequestResetLink = async (userId: string, email: string | null) => {
    if (!email?.trim()) { alert('Usuário não possui e-mail cadastrado.'); return; }
    setResetLinkLoadingUserId(userId);
    const result = await generateResetPasswordLink(email.trim());
    setResetLinkLoadingUserId(null);
    if (result.error) alert(result.error);
    else if (result.link) setResetLinkModal({ email, link: result.link });
    else alert(result.message ?? 'Link gerado.');
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword || !createUnitId.trim()) return;
    setCreateSending(true);
    setCreateResult(null);
    const result = await createUserWithPassword({
      email: createEmail.trim(),
      password: createPassword,
      full_name: createFullName.trim() || undefined,
      unit_id: createUnitId.trim(),
      role: createRole,
    });
    setCreateSending(false);
    if (result.error) setCreateResult({ error: result.error });
    else {
      setCreateResult({ message: result.message });
      setCreateModalOpen(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateUnitId('');
      setCreateRole('profissional');
      onSaved();
    }
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setPasswordModal || !newPassword.trim()) return;
    setSetPasswordSending(true);
    setSetPasswordResult(null);
    const result = await adminSetPassword(setPasswordModal.userId, newPassword.trim());
    setSetPasswordSending(false);
    if (result.error) setSetPasswordResult(result.error);
    else {
      setSetPasswordResult('Senha alterada com sucesso.');
      setSetPasswordModal(null);
      setNewPassword('');
      setTimeout(() => setSetPasswordResult(null), 3000);
    }
  };

  return (
    <div className="config-block">
      <div className="config-toolbar config-toolbar-usuarios">
        <button type="button" className="config-btn-add" onClick={() => { setCreateModalOpen(true); setCreateResult(null); }}>
          + Criar usuário
        </button>
        <button type="button" className="config-btn-add config-btn-add-secondary" onClick={() => setInviteModalOpen(true)}>
          Convidar por e-mail
        </button>
        <button type="button" className="config-btn-link" onClick={() => setLinkModalOpen(true)}>
          Instruções
        </button>
      </div>
      {linkModalOpen && (
        <div className="config-modal-overlay" onClick={() => setLinkModalOpen(false)}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Convite e redefinição de senha</h3>
            <p>
              <strong>Criar usuário:</strong> define e-mail e senha; o usuário já pode entrar. Opcionalmente associe a uma unidade e papel.
              <br /><strong>Convidar por e-mail:</strong> envia link para o usuário definir a senha (requer Edge Function invite-user e SMTP opcional).
              <br /><strong>Redefinir senha:</strong> o admin define uma nova senha diretamente para o usuário.
            </p>
            <button type="button" className="config-btn-save" onClick={() => setLinkModalOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
      {createModalOpen && (
        <div className="config-modal-overlay" onClick={() => { setCreateModalOpen(false); setCreateResult(null); }}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Criar usuário</h3>
            <p className="config-modal-desc">O usuário poderá entrar com o e-mail e a senha definidos. Defina a unidade e o papel (role) que ele terá.</p>
            <form onSubmit={handleCreateUserSubmit}>
              <label className="config-form-label-block">
                <span>E-mail *</span>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="config-input" placeholder="email@exemplo.com" required />
              </label>
              <label className="config-form-label-block">
                <span>Senha *</span>
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className="config-input" placeholder="••••••••" required minLength={6} />
              </label>
              <label className="config-form-label-block">
                <span>Nome completo</span>
                <input type="text" value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} className="config-input" placeholder="Nome do usuário" />
              </label>
              <label className="config-form-label-block">
                <span>Unidade *</span>
                <select value={createUnitId} onChange={(e) => setCreateUnitId(e.target.value)} className="config-input" required>
                  <option value="">— Selecione a unidade —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </label>
              <label className="config-form-label-block">
                <span>Papel (role) na unidade *</span>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value as AppRole)} className="config-input">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="config-form-actions">
                <button type="submit" className="config-btn-save" disabled={createSending}>{createSending ? 'Criando…' : 'Criar usuário'}</button>
                <button type="button" className="config-btn-cancel" onClick={() => { setCreateModalOpen(false); setCreateResult(null); }}>Cancelar</button>
              </div>
            </form>
            {createResult && (
              <div className={`config-usuarios-result ${createResult.error ? 'config-usuarios-result-error' : ''}`}>
                <p>{createResult.error ?? createResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {setPasswordModal && (
        <div className="config-modal-overlay" onClick={() => { setSetPasswordModal(null); setNewPassword(''); setSetPasswordResult(null); }}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Redefinir senha</h3>
            <p className="config-modal-desc">Nova senha para <strong>{setPasswordModal.userName}</strong></p>
            <form onSubmit={handleSetPasswordSubmit}>
              <label className="config-form-label-block">
                <span>Nova senha *</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="config-input" placeholder="••••••••" required minLength={6} />
              </label>
              <div className="config-form-actions">
                <button type="submit" className="config-btn-save" disabled={setPasswordSending}>{setPasswordSending ? 'Salvando…' : 'Definir senha'}</button>
                <button type="button" className="config-btn-cancel" onClick={() => { setSetPasswordModal(null); setNewPassword(''); }}>Cancelar</button>
              </div>
            </form>
            {setPasswordResult && <p className={setPasswordResult.startsWith('Senha') ? 'config-usuarios-result' : 'config-usuarios-result-error'}>{setPasswordResult}</p>}
          </div>
        </div>
      )}
      {inviteModalOpen && (
        <div className="config-modal-overlay" onClick={() => { setInviteModalOpen(false); setInviteResult(null); setInviteEmail(''); }}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Criar / Convidar usuário</h3>
            <p className="config-modal-desc">Informe o e-mail para enviar o convite. O usuário receberá um link para definir a senha (requer Edge Function <code>invite-user</code> e SMTP opcional).</p>
            <form onSubmit={handleInviteSubmit}>
              <label>
                E-mail do novo usuário:
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="config-input" placeholder="email@exemplo.com" required />
              </label>
              <button type="submit" className="config-btn-save" disabled={inviteSending}>{inviteSending ? 'Enviando…' : 'Enviar convite'}</button>
              <button type="button" className="config-btn-cancel" onClick={() => { setInviteModalOpen(false); setInviteResult(null); setInviteEmail(''); }}>Cancelar</button>
            </form>
            {inviteResult && (
              <div className="config-usuarios-result">
                <p>{inviteResult.message}</p>
                {inviteResult.link && <p><strong>Link:</strong> <a href={inviteResult.link} target="_blank" rel="noopener noreferrer">{inviteResult.link}</a></p>}
              </div>
            )}
          </div>
        </div>
      )}
      {resetLinkModal && (
        <div className="config-modal-overlay" onClick={() => setResetLinkModal(null)}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Link de redefinição de senha</h3>
            <p>Envie este link para <strong>{resetLinkModal.email}</strong>:</p>
            <p className="config-usuarios-link-wrap"><a href={resetLinkModal.link} target="_blank" rel="noopener noreferrer">{resetLinkModal.link}</a></p>
            <button type="button" className="config-btn-save" onClick={() => setResetLinkModal(null)}>Fechar</button>
          </div>
        </div>
      )}
      <table className="config-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Unidades / Papel</th>
            <th>Bloqueado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={u.is_blocked ? 'config-user-blocked' : ''}>
              <td>{u.full_name ?? '—'}</td>
              <td>{u.email ?? '—'}</td>
              <td>
                <ul className="config-user-units">
                  {u.units.map((uv) => (
                    <li key={uv.unit_id}>
                      <span>{uv.unit_name}</span>
                      <select
                        value={uv.role}
                        onChange={(e) => handleRoleChange(u.id, uv.unit_id, e.target.value as AppRole)}
                        className="config-role-select"
                        disabled={loading}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="config-btn-delete config-btn-small"
                        onClick={() => handleRemoveUnit(u.id, uv.unit_id)}
                        disabled={u.units.length <= 1 || loading}
                        title="Remover da unidade"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </td>
              <td>{u.is_blocked ? 'Sim' : 'Não'}</td>
              <td>
                <button
                  type="button"
                  className="config-btn-edit config-btn-small"
                  onClick={() => setSetPasswordModal({ userId: u.id, userName: u.full_name || u.email || 'Usuário' })}
                  disabled={loading}
                  title="Redefinir senha"
                >
                  Redefinir senha
                </button>
                <button
                  type="button"
                  className="config-btn-edit config-btn-small"
                  onClick={() => handleRequestResetLink(u.id, u.email)}
                  disabled={!u.email?.trim() || resetLinkLoadingUserId !== null || loading}
                  title="Gerar link de redefinição"
                >
                  {resetLinkLoadingUserId === u.id ? '…' : 'Link de redefinição'}
                </button>
                <button
                  type="button"
                  className={u.is_blocked ? 'config-btn-edit' : 'config-btn-warning'}
                  onClick={() => handleBlock(u)}
                  disabled={u.id === currentUser?.id || loading}
                >
                  {u.is_blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
