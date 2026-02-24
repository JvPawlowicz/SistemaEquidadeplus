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
      <div className="login-card">
        <h1 className="login-logo">EquidadePlus</h1>
        <p className="login-subtitle">Área restrita</p>
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
        <p className="login-placeholder">
          Fase 1: ativação por link manual. Admin envia o link de convite por fora.
        </p>
      </div>
    </div>
  );
}
