import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  Headphones,
  Settings,
  PlusCircle,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useActiveUnit } from '../contexts/ActiveUnitContext';
import { useUserRoleInUnit } from '../hooks/useUserRoleInUnit';
import './Navbar.css';

export function Navbar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { units, activeUnit, setActiveUnitId, loading: unitsLoading, activeUnitId } = useActiveUnit();
  const { isTi } = useUserRoleInUnit(activeUnitId, user?.id);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        unitDropdownRef.current &&
        !unitDropdownRef.current.contains(event.target as Node)
      ) {
        setUnitDropdownOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const handleSelectUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    setUnitDropdownOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/agenda" className="navbar-logo">
          EquidadePlus
        </Link>

        <div className="navbar-unit" ref={unitDropdownRef}>
          <button
            type="button"
            className="navbar-unit-trigger"
            onClick={() => setUnitDropdownOpen((o) => !o)}
            aria-expanded={unitDropdownOpen}
            aria-haspopup="listbox"
          >
            {unitsLoading
              ? 'Carregando…'
              : activeUnit
                ? activeUnit.name
                : units.length === 0
                  ? 'Nenhuma unidade'
                  : 'Selecione a unidade'}
            <ChevronDown className="navbar-unit-chevron" size={14} aria-hidden />
          </button>
          {unitDropdownOpen && (
            <div className="navbar-unit-dropdown" role="listbox">
              {units.length === 0 ? (
                <div className="navbar-unit-dropdown-placeholder">
                  Nenhuma unidade atribuída. Peça ao admin.
                </div>
              ) : (
                units.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    role="option"
                    aria-selected={unit.id === activeUnit?.id}
                    className={`navbar-unit-option ${unit.id === activeUnit?.id ? 'is-active' : ''}`}
                    onClick={() => handleSelectUnit(unit.id)}
                  >
                    {unit.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <nav className="navbar-menu">
          {!isTi && (
            <>
              <NavLink to="/agenda" className="navbar-link" end>
                <Calendar size={18} aria-hidden />
                <span>Agenda</span>
              </NavLink>
              <NavLink to="/pacientes" className="navbar-link">
                <Users size={18} aria-hidden />
                <span>Pacientes</span>
              </NavLink>
              <NavLink to="/evolucoes" className="navbar-link">
                <FileText size={18} aria-hidden />
                <span>Evoluções</span>
              </NavLink>
              <NavLink to="/avaliacoes" className="navbar-link">
                <ClipboardList size={18} aria-hidden />
                <span>Avaliações</span>
              </NavLink>
            </>
          )}
          <NavLink to="/relatorios" className="navbar-link">
            <BarChart3 size={18} aria-hidden />
            <span>Relatórios</span>
          </NavLink>
          <NavLink to="/chamados" className="navbar-link">
            <Headphones size={18} aria-hidden />
            <span>Chamados</span>
          </NavLink>
          {!isTi && (
            <NavLink to="/configuracoes" className="navbar-link">
              <Settings size={18} aria-hidden />
              <span>Configurações</span>
            </NavLink>
          )}
        </nav>

        <Link to="/chamados/novo" className="navbar-btn-chamado">
          <PlusCircle size={18} aria-hidden />
          <span>Novo Chamado</span>
        </Link>
      </div>

      <div className="navbar-right" ref={userMenuRef}>
        <button
          type="button"
          className="navbar-user-trigger"
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <User size={18} aria-hidden />
          <span>Meu Perfil</span>
          <ChevronDown className="navbar-user-chevron" size={14} aria-hidden />
        </button>
        {userMenuOpen && (
          <div className="navbar-user-menu" role="menu">
            <Link
              to="/configuracoes/perfil"
              className="navbar-user-item"
              onClick={() => setUserMenuOpen(false)}
            >
              <User size={16} aria-hidden />
              <span>Meu Perfil</span>
            </Link>
            <button
              type="button"
              className="navbar-user-item navbar-user-item-sair"
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
