import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, updateProfile } from '../lib/config';
import { fetchSpecialties } from '../lib/specialties';
import { uploadAvatar, removeAvatar } from '../lib/avatars';
import { supabase } from '../lib/supabase';
import './MeuPerfil.css';

export function MeuPerfil() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [councilType, setCouncilType] = useState('');
  const [councilNumber, setCouncilNumber] = useState('');
  const [councilUf, setCouncilUf] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(({ profile }) => {
      if (profile) {
        setFullName(profile.full_name ?? '');
        setAvatarUrl(profile.avatar_url ?? '');
        setPhone(profile.phone ?? '');
        setBio(profile.bio ?? '');
        setCouncilType(profile.council_type ?? '');
        setCouncilNumber(profile.council_number ?? '');
        setCouncilUf(profile.council_uf ?? '');
        setSelectedSpecialties(Array.isArray(profile.specialties) ? profile.specialties : []);
      }
      setLoading(false);
    });
    fetchSpecialties().then(({ list }) => setSpecialtiesList(list));
  }, [user?.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMessage(null);
    const { url, error } = await uploadAvatar(user.id, file);
    setUploading(false);
    e.target.value = '';
    if (error) {
      setMessage(error.message);
      return;
    }
    if (url) {
      setAvatarUrl(url);
      setShowUrlInput(false);
      setAvatarUrlInput('');
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setMessage(null);
    await removeAvatar(user.id, avatarUrl || null);
    setAvatarUrl('');
    setAvatarUrlInput('');
  };

  const handleUseUrl = () => {
    if (avatarUrlInput.trim()) setAvatarUrl(avatarUrlInput.trim());
    setShowUrlInput(false);
    setAvatarUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await updateProfile(user.id, {
      full_name: fullName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
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
    setMessage('Perfil atualizado.');
  };

  if (!user) return null;
  if (loading) return <div className="meu-perfil-page"><p>Carregando…</p></div>;

  return (
    <div className="meu-perfil-page">
      <div className="meu-perfil-header">
        <h1 className="meu-perfil-title">Meu Perfil</h1>
        <button type="button" className="meu-perfil-back" onClick={() => navigate('/configuracoes')}>
          ← Voltar
        </button>
      </div>
      <form onSubmit={handleSubmit} className="meu-perfil-form">
        {message && (
          <p className={`meu-perfil-message ${message.startsWith('Erro') ? 'meu-perfil-message-error' : ''}`}>
            {message}
          </p>
        )}
        <label className="meu-perfil-label">
          Nome completo
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
            className="meu-perfil-input"
          />
        </label>
        <label className="meu-perfil-label">
          Telefone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
            className="meu-perfil-input"
          />
        </label>
        <label className="meu-perfil-label">
          Breve descrição
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Observações ou descrição do perfil"
            className="meu-perfil-input"
            rows={3}
          />
        </label>

        <div className="meu-perfil-avatar-section">
          <span className="meu-perfil-label">Foto de perfil</span>
          <div className="meu-perfil-avatar-row">
            {avatarUrl ? (
              <div className="meu-perfil-avatar-preview-wrap">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="meu-perfil-avatar-preview"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const wrap = e.currentTarget.closest('.meu-perfil-avatar-preview-wrap');
                    const placeholder = wrap?.querySelector('.meu-perfil-avatar-placeholder');
                    if (placeholder instanceof HTMLElement) placeholder.style.display = 'flex';
                  }}
                />
                <div className="meu-perfil-avatar-placeholder" style={{ display: 'none' }}>Sem foto</div>
                <button
                  type="button"
                  className="meu-perfil-avatar-remove"
                  onClick={handleRemovePhoto}
                  title="Remover foto"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="meu-perfil-avatar-placeholder">Sem foto</div>
            )}
            <div className="meu-perfil-avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="meu-perfil-file-input"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <button
                type="button"
                className="meu-perfil-btn-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Enviando…' : 'Enviar foto'}
              </button>
              {!showUrlInput ? (
                <button
                  type="button"
                  className="meu-perfil-btn-link"
                  onClick={() => setShowUrlInput(true)}
                >
                  Ou usar uma URL
                </button>
              ) : (
                <div className="meu-perfil-url-row">
                  <input
                    type="url"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="meu-perfil-input meu-perfil-input-inline"
                  />
                  <button type="button" className="meu-perfil-btn-small" onClick={handleUseUrl}>
                    Usar
                  </button>
                  <button type="button" className="meu-perfil-btn-link" onClick={() => { setShowUrlInput(false); setAvatarUrlInput(''); }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="meu-perfil-professional">
          <span className="meu-perfil-label">Dados profissionais</span>
          <div className="meu-perfil-professional-row">
            <input
              type="text"
              value={councilType}
              onChange={(e) => setCouncilType(e.target.value)}
              placeholder="Conselho (ex: CRP, CREFITO)"
              className="meu-perfil-input"
            />
            <input
              type="text"
              value={councilNumber}
              onChange={(e) => setCouncilNumber(e.target.value)}
              placeholder="Número"
              className="meu-perfil-input meu-perfil-input-short"
            />
            <input
              type="text"
              value={councilUf}
              onChange={(e) => setCouncilUf(e.target.value)}
              placeholder="UF"
              className="meu-perfil-input meu-perfil-input-uf"
              maxLength={2}
            />
          </div>
          <div className="meu-perfil-specialties">
            <span className="meu-perfil-label">Especialidades</span>
            <div className="meu-perfil-specialties-chips">
              {specialtiesList.map((s) => (
                <label key={s.id} className="meu-perfil-specialty-chip">
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
            {specialtiesList.length === 0 && <p className="meu-perfil-muted">Nenhuma especialidade cadastrada. O admin pode cadastrar em Configurações → Especialidades.</p>}
          </div>
        </div>

        <div className="meu-perfil-section-divider" />
        <h3 className="meu-perfil-section-title">Alterar senha</h3>
        <div className="meu-perfil-password-section">
          {passwordMessage && (
            <p className={`meu-perfil-message ${passwordMessage.startsWith('Erro') ? 'meu-perfil-message-error' : ''}`}>{passwordMessage}</p>
          )}
          <label className="meu-perfil-label">
            Senha atual
            <input
              type="password"
              value={passwordCurrent}
              onChange={(e) => setPasswordCurrent(e.target.value)}
              placeholder="••••••••"
              className="meu-perfil-input"
              autoComplete="current-password"
            />
          </label>
          <label className="meu-perfil-label">
            Nova senha
            <input
              type="password"
              value={passwordNew}
              onChange={(e) => setPasswordNew(e.target.value)}
              placeholder="••••••••"
              className="meu-perfil-input"
              autoComplete="new-password"
            />
          </label>
          <label className="meu-perfil-label">
            Confirmar nova senha
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="meu-perfil-input"
              autoComplete="new-password"
            />
          </label>
          <button
            type="button"
            className="meu-perfil-btn-password"
            disabled={passwordChanging || !passwordCurrent || !passwordNew || passwordNew !== passwordConfirm}
            onClick={async () => {
              if (!passwordCurrent || !passwordNew || passwordNew !== passwordConfirm) return;
              setPasswordChanging(true);
              setPasswordMessage(null);
              const { error: err } = await supabase.auth.updateUser({ password: passwordNew });
              setPasswordChanging(false);
              if (err) {
                setPasswordMessage(err.message ?? 'Erro ao alterar senha.');
                return;
              }
              setPasswordMessage('Senha alterada com sucesso.');
              setPasswordCurrent('');
              setPasswordNew('');
              setPasswordConfirm('');
            }}
          >
            {passwordChanging ? 'Alterando…' : 'Alterar senha'}
          </button>
        </div>

        <div className="meu-perfil-actions">
          <button type="submit" className="meu-perfil-btn-submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
