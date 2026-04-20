import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
//  Componente: tarjeta de puntos (3 pts, 5 pts, 1 pto)
// ─────────────────────────────────────────────────────────────────────────────
const PuntosCard = ({ pts, label, icon, descripcion, destacado }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px 14px',
    marginBottom: 10,
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }}>
    {/* Número de puntos */}
    <div style={{
      minWidth: 52, height: 58,
      background: 'var(--navy)',
      borderRadius: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 28, color: 'var(--gold-light)',
        lineHeight: 1,
      }}>{pts}</span>
      <span style={{
        fontSize: 8, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: 2,
      }}>
        {pts === 1 ? 'punto' : 'puntos'}
      </span>
    </div>

    {/* Ícono circular */}
    <div style={{
      width: 44, height: 44,
      borderRadius: '50%',
      background: 'var(--navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, flexShrink: 0,
    }}>
      {icon}
    </div>

    {/* Texto */}
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 14, letterSpacing: '0.06em',
        color: 'var(--navy)', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.55 }}>
        {descripcion}{' '}
        {destacado && (
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{destacado}</span>
        )}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente: ítem de Consideraciones
// ─────────────────────────────────────────────────────────────────────────────
const ConsideracionItem = ({ icon, children }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 12,
    marginBottom: 14,
  }}>
    <div style={{
      width: 36, height: 36, flexShrink: 0,
      borderRadius: '50%',
      background: 'var(--navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18,
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, paddingTop: 4 }}>
      {children}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente: encabezado de sección
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 14,
  }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 22, letterSpacing: '0.06em',
      color: 'var(--navy)',
    }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 2, background: 'var(--gold)', opacity: 0.35, borderRadius: 2 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────────────────────
const RulesPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page">

      {/* ── Perfil de usuario (solo si está logueado) ── */}
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
            fontSize: 16, fontWeight: 600,
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

      {/* ══════════════════════════════════════════════
          SECCIÓN 1 — SISTEMA DE PUNTOS
      ══════════════════════════════════════════════ */}
      <SectionHeader icon="🏆" title="Sistema de Puntos" />

      <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 14, lineHeight: 1.5 }}>
        A lo largo del torneo, los jugadores acumularán puntos según sus predicciones.
      </div>

      <PuntosCard
        pts={3}
        icon="⚽"
        label="Resultado del partido"
        descripcion="Acertar el equipo ganador o empate otorga"
        destacado="3 puntos."
      />
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: -6, marginBottom: 12, paddingLeft: 4 }}>
        * Aplica en todas las fases del torneo.
      </div>

      <PuntosCard
        pts={5}
        icon="🥅"
        label="Marcador exacto"
        descripcion="Se podrá predecir el marcador final del partido. Cada acierto otorga"
        destacado="5 puntos."
      />
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: -6, marginBottom: 12, paddingLeft: 4 }}>
        * Aplica a partir de Dieciseisavos de Final.
      </div>

      <PuntosCard
        pts={1}
        icon="👥"
        label="Equipos que avanzan de Fase de Grupos"
        descripcion="Antes del inicio del torneo, cada jugador deberá seleccionar los dos equipos que avanzan por grupo (sin importar el orden). Cada acierto otorga"
        destacado="1 punto."
      />

      {/* ══════════════════════════════════════════════
          SECCIÓN 2 — CRITERIO DE DESEMPATE
      ══════════════════════════════════════════════ */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        marginBottom: 20,
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          borderRadius: '50%', background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          ⚖️
        </div>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 15, letterSpacing: '0.06em',
            color: 'var(--navy)', marginBottom: 6,
          }}>
            Criterio de desempate
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 6 }}>
            En caso de empate en el puntaje total, se utilizarán como criterio de desempate los puntos obtenidos por la selección de equipos que avanzan de la fase de grupos.
          </div>
          <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, lineHeight: 1.5 }}>
            Ganará quien haya acertado mayor cantidad de equipos clasificados.
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SECCIÓN 4 — CONSIDERACIONES IMPORTANTES
      ══════════════════════════════════════════════ */}
      <SectionHeader icon="📋" title="Consideraciones Importantes" />

      <ConsideracionItem icon="⭐">
        <strong>Los puntos se asignan únicamente según las reglas descritas.</strong>
        <br />
        <span style={{ color: 'var(--text-muted)' }}>No existe ninguna otra forma de acumular puntos.</span>
      </ConsideracionItem>

      <ConsideracionItem icon="⏰">
        Para efectos de puntuación, se considera el resultado al finalizar los{' '}
        <strong>90 minutos reglamentarios</strong>, incluyendo el tiempo de reposición,
        y los <strong>tiempos extra</strong> en caso de existir.
      </ConsideracionItem>

      <ConsideracionItem icon="🥅">
        Las tandas de penales <strong>no se consideran</strong> para efectos de puntuación.
      </ConsideracionItem>

      <ConsideracionItem icon="🛡️">
        La organización se reserva el derecho de aclarar cualquier situación
        no contemplada en estas reglas.
      </ConsideracionItem>

      {/* ── Botón Admin (solo admin) ── */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="primary-btn gold-btn"
          style={{ marginBottom: 12 }}
        >
          Panel de Administrador
        </button>
      )}

      {/* ── Cerrar sesión (solo si está logueado) ── */}
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
