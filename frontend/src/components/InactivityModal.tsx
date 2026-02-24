import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './InactivityModal.css';

const IDLE_MS = 15 * 60 * 1000;       // 15 min sem atividade → aviso
const WARNING_MS = 2 * 60 * 1000;     // 2 min no aviso sem clicar → logout

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetIdle = useCallback(() => {
    if (!user) return;
    setShowWarning(false);
    setCountdown(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      setShowWarning(true);
      setCountdown(Math.floor(WARNING_MS / 1000));
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      warningTimerRef.current = setTimeout(() => {
        warningTimerRef.current = null;
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setShowWarning(false);
        signOut();
      }, WARNING_MS);
    }, IDLE_MS);
  }, [user, signOut]);

  useEffect(() => {
    if (!user) return;
    resetIdle();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const onActivity = () => resetIdle();
    events.forEach((ev) => window.addEventListener(ev, onActivity));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, resetIdle]);

  const handleContinue = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
    setCountdown(0);
    resetIdle();
  };

  const handleLogout = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
    signOut();
  };

  return (
    <>
      {children}
      {showWarning && (
        <div className="inactivity-overlay" role="dialog" aria-modal="true" aria-labelledby="inactivity-title">
          <div className="inactivity-modal">
            <h2 id="inactivity-title" className="inactivity-title">Sessão expirando</h2>
            <p className="inactivity-text">
              Sua sessão será encerrada por inatividade em <strong>{countdown}</strong> segundos.
              Deseja continuar conectado?
            </p>
            <div className="inactivity-actions">
              <button type="button" className="inactivity-btn inactivity-btn-primary" onClick={handleContinue}>
                Continuar conectado
              </button>
              <button type="button" className="inactivity-btn inactivity-btn-secondary" onClick={handleLogout}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
