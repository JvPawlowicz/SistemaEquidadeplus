import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, updateProfile } from '../lib/config';
import { fetchJobTitles } from '../lib/jobTitles';
import { fetchSpecialties } from '../lib/specialties';
import './CompletarPerfil.css';

export function CompletarPerfil() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [councilType, setCouncilType] = useState('');
  const [councilNumber, setCouncilNumber] = useState('');
  const [councilUf, setCouncilUf] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [jobTitlesList, setJobTitlesList] = useState<{ id: string; name: string }[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(({ profile }) => {
      if (profile) {
        setFullName(profile.full_name ?? '');
        setPhone(profile.phone ?? '');
        setJobTitle(profile.job_title ?? '');
        setCouncilType(profile.council_type ?? '');
        setCouncilNumber(profile.council_number ?? '');
        setCouncilUf(profile.council_uf ?? '');
        setSelectedSpecialties(Array.isArray(profile.specialties) ? profile.specialties : []);
      }
      setLoading(false);
    });
    fetchJobTitles().then(({ list }) => setJobTitlesList(list));
    fetchSpecialties().then(({ list }) => setSpecialtiesList(list));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- user?.id suficiente para evitar loop
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const name = fullName.trim();
    if (!name) {
      setMessage('Preencha seu nome completo.');
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await updateProfile(user.id, {
      full_name: name,
      phone: phone.trim() || null,
      job_title: jobTitle.trim() || null,
      council_type: councilType.trim() || null,
      council_number: councilNumber.trim() || null,
      council_uf: councilUf.trim() || null,
      specialties: selectedSpecialties.length ? selectedSpecialties : null,
    });
    setSaving(false);
    if (error) {
      setMessage('Erro ao salvar.');
      return;
    }
    navigate('/agenda', { replace: true });
  };

  if (!user) return null;
  if (loading) return <div className="completar-perfil-page"><p>Carregando…</p></div>;

  return (
    <div className="completar-perfil-page">
      <div className="completar-perfil-card">
        <h1 className="completar-perfil-title">Completar perfil</h1>
        <p className="completar-perfil-desc">Preencha seus dados para continuar. Você poderá alterá-los depois em Configurações → Meu Perfil.</p>
        <form onSubmit={handleSubmit} className="completar-perfil-form">
          <label className="completar-perfil-label">
            Nome completo *
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="completar-perfil-input"
              placeholder="Seu nome"
              required
            />
          </label>
          <label className="completar-perfil-label">
            Telefone
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="completar-perfil-input"
              placeholder="(00) 00000-0000"
            />
          </label>
          <label className="completar-perfil-label">
            Cargo / função no time
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="completar-perfil-input"
            >
              <option value="">Selecione...</option>
              {jobTitlesList.map((j) => (
                <option key={j.id} value={j.name}>{j.name}</option>
              ))}
            </select>
          </label>
          <label className="completar-perfil-label">
            Conselho profissional
            <input
              type="text"
              value={councilType}
              onChange={(e) => setCouncilType(e.target.value)}
              className="completar-perfil-input"
              placeholder="Ex.: CRP, CRM"
            />
          </label>
          <label className="completar-perfil-label">
            Número do conselho
            <input
              type="text"
              value={councilNumber}
              onChange={(e) => setCouncilNumber(e.target.value)}
              className="completar-perfil-input"
              placeholder="Número"
            />
          </label>
          <label className="completar-perfil-label">
            UF do conselho
            <input
              type="text"
              value={councilUf}
              onChange={(e) => setCouncilUf(e.target.value)}
              className="completar-perfil-input"
              placeholder="UF"
              maxLength={2}
            />
          </label>
          <div className="completar-perfil-specialties">
            <span className="completar-perfil-label">Especialidades</span>
            <div className="completar-perfil-specialties-chips">
              {specialtiesList.map((s) => (
                <label key={s.id} className="completar-perfil-specialty-chip">
                  <input
                    type="checkbox"
                    checked={selectedSpecialties.includes(s.name)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSpecialties((prev) => [...prev, s.name]);
                      else setSelectedSpecialties((prev) => prev.filter((n) => n !== s.name));
                    }}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          {message && <p className="completar-perfil-message">{message}</p>}
          <button type="submit" className="completar-perfil-submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Continuar para a Agenda'}
          </button>
        </form>
      </div>
    </div>
  );
}
