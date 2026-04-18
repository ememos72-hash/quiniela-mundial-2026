import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RulesPage = () => {
  const { user, userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page">
      {/* User info — solo si hay sesión */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          background: 'var(--navy)',
          borderRadius: 'var(--radius)',
          marginBottom: 20,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--gold)', color: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 500,
          }}>
            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>{user?.displayName}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user?.email}</div>
          </div>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      )}

      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.04em', color: 'var(--navy)', marginBottom: 16 }}>
        Reglas y Puntos
      </h2>

      {/* Points system */}
      <div style={{ marginBottom: 24 }}>
        <div className="rules-row">
          <div className="rules-pts">3</div>
          <div>
            <div className="rules-text">Acertar ganador o empate</div>
            <div className="rules-note">Aplica en todas las fases del torneo</div>
          </div>
        </div>
        <div className="rules-row">
          <div className="rules-pts rules-pts-gold">5</div>
          <div>
            <div className="rules-text">Marcador exacto</div>
            <div className="rules-note">Solo desde Octavos de Final en adelante</div>
          </div>
        </div>
        <div className="rules-row">
          <div className="rules-pts" style={{ fontSize: 28 }}>1</div>
          <div>
            <div className="rules-text">Equipo que avanza de Grupos</div>
            <div className="rules-note">Por cada equipo que predijiste que pasa. Sirve de desempate.</div>
          </div>
        </div>
      </div>

      {/* Flash rules */}
      <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#fff', letterSpacing: '0.04em' }}>Quiniela Flash</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          Corre durante un período definido por el administrador (por ejemplo, toda la Jornada 2). Se aplican las mismas reglas de puntos. Al terminar se declara un ganador o ganadores para ese período.
        </div>
      </div>

      {/* Tiebreaker */}
      <div style={{ background: '#f8f7f3', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 24, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)', marginBottom: 4 }}>Criterio de desempate</div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
          Si dos o más jugadores terminan con el mismo puntaje total, gana quien haya acertado más equipos que avanzaron en la Fase de Grupos.
        </div>
      </div>

      {/* Admin link */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="primary-btn gold-btn"
          style={{ marginBottom: 12 }}
        >
          Panel de Administrador
        </button>
      )}

      {/* Logout — solo si hay sesión */}
      {user && (
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: 12,
            background: 'transparent',
            color: 'var(--text-mid)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      )}
    </div>
  );
};

export default RulesPage;
