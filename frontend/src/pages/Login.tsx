import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const { signIn, session } = useAuth();
  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err.message ?? 'Falha ao entrar. Verifique e-mail e senha.');
      return;
    }
    navigate('/agenda');
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-overlay" />
        <div className="login-left-content">
          <h1 className="login-brand">EquidadePlus</h1>
          <p className="login-tagline">Gestão integrada para equipes de saúde e educação</p>
          <ul className="login-features">
            <li>Agenda e prontuário em um só lugar</li>
            <li>Pacientes, evoluções e avaliações</li>
            <li>Múltiplas unidades e convênios</li>
            <li>Controle de usuários e permissões</li>
          </ul>
          <p className="login-about">
            Sistema pensado para clínicas e equipes multiprofissionais. Acesse com suas credenciais para continuar.
          </p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-logo">Entrar</h2>
          <p className="login-subtitle">Use seu e-mail e senha para acessar o sistema</p>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <p className="login-error">{error}</p>}
            <label className="login-label">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="login-label">
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
