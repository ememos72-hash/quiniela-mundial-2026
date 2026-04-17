import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import InicioPage from './pages/InicioPage';
import MatchesPage from './pages/MatchesPage';
import RankingPage from './pages/RankingPage';
import FlashPage from './pages/FlashPage';
import RulesPage from './pages/RulesPage';
import AdminPage from './pages/AdminPage';
import PremioModal from './components/PremioModal';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AppShell = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const path = location.pathname;
  const [showPremio, setShowPremio] = useState(false);

  const tabs = [
    { path: '/inicio',   icon: '🏠', label: 'Inicio'   },
    { path: '/partidos', icon: '⚽', label: 'Partidos' },
    { path: '/ranking',  icon: '🏆', label: 'Ranking'  },
    { path: '/flash',    icon: '⚡', label: 'Flash'    },
    { path: '/info',     icon: '📋', label: 'Info'     },
  ];

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="header-top">
          <div className="header-logo">
            <span className="header-logo-title">La Quiniela</span>
            <span className="header-logo-sub">Mundial 2026 · USA · CAN · MEX</span>
          </div>
          {user && (
            <div className="header-user">
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
            </div>
          )}
          {showPremio && <PremioModal onClose={() => setShowPremio(false)} />}
        </div>
        <div className="bottom-nav">
          {tabs.map(tab => (
            <button
              key={tab.path}
              className={`nav-tab ${path === tab.path ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
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
      <Route path="/admin"    element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="/"          element={<Navigate to="/inicio" replace />} />
              <Route path="/inicio"    element={<InicioPage />} />
              <Route path="/partidos"  element={<MatchesPage />} />
              <Route path="/ranking"   element={<RankingPage />} />
              <Route path="/flash"     element={<FlashPage />} />
              <Route path="/info"      element={<RulesPage />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
