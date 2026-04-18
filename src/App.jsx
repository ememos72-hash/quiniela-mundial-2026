import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import InicioPage from './pages/InicioPage';
import MatchesPage from './pages/MatchesPage';
import RankingPage from './pages/RankingPage';
import FlashPage from './pages/FlashPage';
import RulesPage from './pages/RulesPage';
import AdminPage from './pages/AdminPage';
import PremioModal from './components/PremioModal';
import AnuncioModal from './components/AnuncioModal';

// Solo redirige al login si no hay sesión
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AppShell = ({ children }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const path = location.pathname;
  const [showPremio, setShowPremio] = useState(false);
  const [popup, setPopup]           = useState(null);
  const [dismissed, setDismissed]   = useState(false);

  // Popup solo para usuarios autenticados
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'config', 'popup'), (snap) => {
      setPopup(snap.exists() ? snap.data() : null);
    });
  }, [user]);

  const showPopup = !!(popup?.active && !dismissed);
  const closePopup = () => setDismissed(true);

  const tabs = [
    { path: '/inicio',   icon: '🏠', label: 'Inicio'   },
    { path: '/partidos', icon: '⚽', label: 'Partidos' },
    { path: '/ranking',  icon: '🏆', label: 'Ranking'  },
    { path: '/flash',    icon: '⚡', label: 'Flash'    },
    { path: '/info',     icon: '📋', label: 'Info'     },
  ];

  // Tabs que requieren login
  const privateTabs = ['/partidos', '/ranking', '/flash'];

  const handleTabClick = (tabPath) => {
    if (!user && privateTabs.includes(tabPath)) return; // sin acción
    navigate(tabPath);
  };

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="header-top">
          <div className="header-logo">
            <span className="header-logo-title">La Quiniela</span>
            <span className="header-logo-sub">Mundial 2026 · USA · CAN · MEX</span>
          </div>

          <div className="header-user">
            {user ? (
              // Usuario logueado: Ver Premiación + cerrar sesión
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setShowPremio(true)}
                  style={{
                    background: 'var(--gold)',
                    color: 'var(--navy)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '5px 12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🏆 Ver Premiación
                </button>
                <button
                  onClick={() => logout().then(() => navigate('/inicio'))}
                  title="Cerrar sesión"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Salir
                </button>
              </div>
            ) : (
              // Sin sesión: botón de login
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                  border: 'none',
                  borderRadius: 20,
                  padding: '5px 14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Iniciar Sesión
              </button>
            )}
          </div>

          {showPremio && <PremioModal onClose={() => setShowPremio(false)} />}
          {showPopup  && <AnuncioModal popup={popup} onClose={closePopup} />}
        </div>

        <div className="bottom-nav">
          {tabs.map(tab => {
            const locked = !user && privateTabs.includes(tab.path);
            return (
              <button
                key={tab.path}
                className={`nav-tab ${path === tab.path ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.path)}
                style={locked ? { opacity: 0.35, cursor: 'default' } : {}}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to="/inicio" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/inicio" replace /> : <RegisterPage />} />
      <Route path="/admin"    element={<PrivateRoute><AdminPage /></PrivateRoute>} />

      {/* AppShell visible para todos — sin ProtectedRoute */}
      <Route path="/*" element={
        <AppShell>
          <Routes>
            <Route path="/"         element={<Navigate to="/inicio" replace />} />
            <Route path="/inicio"   element={<InicioPage />} />
            <Route path="/info"     element={<RulesPage />} />
            {/* Estas 3 requieren login */}
            <Route path="/partidos" element={<PrivateRoute><MatchesPage /></PrivateRoute>} />
            <Route path="/ranking"  element={<PrivateRoute><RankingPage /></PrivateRoute>} />
            <Route path="/flash"    element={<PrivateRoute><FlashPage /></PrivateRoute>} />
          </Routes>
        </AppShell>
      } />
    </Routes>
  );
}

export default App;
