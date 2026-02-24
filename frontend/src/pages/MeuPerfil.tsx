import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, updateProfile } from '../lib/config';
import { uploadAvatar, removeAvatar } from '../lib/avatars';
import './MeuPerfil.css';

export function MeuPerfil() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [councilType, setCouncilType] = useState('');
  const [councilNumber, setCouncilNumber] = useState('');
  const [councilUf, setCouncilUf] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(({ profile }) => {
      if (profile) {
        setFullName(profile.full_name ?? '');
        setAvatarUrl(profile.avatar_url ?? '');
        setPhone(profile.phone ?? '');
        setJobTitle(profile.job_title ?? '');
        setBio(profile.bio ?? '');
        setCouncilType(profile.council_type ?? '');
        setCouncilNumber(profile.council_number ?? '');
        setCouncilUf(profile.council_uf ?? '');
        setSpecialtiesText(Array.isArray(profile.specialties) ? profile.specialties.join(', ') : '');
      }
      setLoading(false);
    });
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
      job_title: jobTitle.trim() || null,
      bio: bio.trim() || null,
      council_type: councilType.trim() || null,
      council_number: councilNumber.trim() || null,
      council_uf: councilUf.trim() || null,
      specialties: specialtiesText.trim() ? specialtiesText.split(',').map((s) => s.trim()).filter(Boolean) : null,
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
          Cargo / função no time
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Ex.: Psicólogo, Terapeuta ABA"
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
                <img src={avatarUrl} alt="Avatar" className="meu-perfil-avatar-preview" />
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
                {uploading ? 'Enviando…' : 'Enviar foto (Supabase)'}
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
          <input
            type="text"
            value={specialtiesText}
            onChange={(e) => setSpecialtiesText(e.target.value)}
            placeholder="Especialidades (separadas por vírgula)"
            className="meu-perfil-input"
          />
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
