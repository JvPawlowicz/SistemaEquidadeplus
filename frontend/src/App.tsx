import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InactivityProvider } from './components/InactivityModal';
import { ActiveUnitProvider, useActiveUnit } from './contexts/ActiveUnitContext';
import { useUserRoleInUnit } from './hooks/useUserRoleInUnit';
import { Layout } from './components/Layout';
import { fetchProfile } from './lib/config';
import { Login } from './pages/Login';
import { Agenda } from './pages/Agenda';
import { Pacientes } from './pages/Pacientes';
import { Prontuario } from './pages/Prontuario';
import { AvaliacaoInstance } from './pages/AvaliacaoInstance';
import { Avaliacoes } from './pages/Avaliacoes';
import { Evolucoes } from './pages/Evolucoes';
import { EditorEvolucao } from './pages/EditorEvolucao';
import { Relatorios } from './pages/Relatorios';
import { Configuracoes } from './pages/Configuracoes';
import { Chamados } from './pages/Chamados';
import { NovoChamado } from './pages/NovoChamado';
import { MeuPerfil } from './pages/MeuPerfil';
import { CompletarPerfil } from './pages/CompletarPerfil';
import { Outlet } from 'react-router-dom';

function HomeRedirect() {
  const { activeUnitId } = useActiveUnit();
  const { user } = useAuth();
  const { isTi } = useUserRoleInUnit(activeUnitId, user?.id);
  return <Navigate to={isTi ? '/chamados' : '/agenda'} replace />;
}

/** Redireciona para Completar perfil quando o perfil não tem nome (novo usuário). */
function RequireProfileComplete({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setChecked(true);
      return;
    }
    fetchProfile(user.id)
      .then(({ profile }) => {
        if (profile && !profile.full_name?.trim()) setShouldRedirect(true);
      })
      .finally(() => setChecked(true));
  }, [user?.id]);

  if (!checked) return <>{children}</>;
  if (shouldRedirect) return <Navigate to="/completar-perfil" replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Carregando…
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <InactivityProvider>
      {children}
    </InactivityProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="completar-perfil" element={<CompletarPerfil />} />
        <Route
          path="/*"
          element={
            <ActiveUnitProvider>
              <RequireProfileComplete>
                <Layout />
              </RequireProfileComplete>
            </ActiveUnitProvider>
          }
        >
          <Route index element={<HomeRedirect />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/:patientId" element={<Prontuario />} />
          <Route path="pacientes/:patientId/avaliacao/:instanceId" element={<AvaliacaoInstance />} />
          <Route path="avaliacoes" element={<Avaliacoes />} />
          <Route path="evolucoes" element={<Evolucoes />} />
          <Route path="evolucoes/editor/:eventId" element={<EditorEvolucao />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="configuracoes/perfil" element={<MeuPerfil />} />
          <Route path="chamados" element={<Chamados />} />
          <Route path="chamados/novo" element={<NovoChamado />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
