import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import MundialFormatoModal from '../components/MundialFormatoModal';
import GroupPicksModal from '../components/GroupPicksModal';
import GroupRankingModal from '../components/GroupRankingModal';

// ─────────────────────────────────────────────────────────────────────────────
//  Componente: tarjeta de puntos (3 pts, 5 pts, 1 pto)
// ─────────────────────────────────────────────────────────────────────────────
const PuntosCard = ({ pts, label, descripcion, destacado, nota }) => (
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
      {nota && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 5 }}>
          * {nota}
        </div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente: ítem de Consideraciones
// ─────────────────────────────────────────────────────────────────────────────
const ConsideracionItem = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 10,
    marginBottom: 14,
  }}>
    <div style={{
      width: 6, height: 6, flexShrink: 0,
      borderRadius: '50%',
      background: 'var(--gold)',
      marginTop: 6,
    }} />
    <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
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
    {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
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
  const { user, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [showFormato, setShowFormato] = useState(false);
  const [showGroupPicks, setShowGroupPicks] = useState(false);
  const [showGroupRanking, setShowGroupRanking] = useState(false);
  const [groupPicksOpen, setGroupPicksOpen] = useState(false);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'groupPicks'), snap => {
      setGroupPicksOpen(snap.exists() ? (snap.data().groupPicksOpen === true) : false);
    });
    return unsub;
  }, []);

  // Calcular puesto del usuario en el ranking
  useEffect(() => {
    if (!user || !userProfile) return;
    const calcRank = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const pts = userProfile.totalPoints || 0;
      const above = snap.docs.filter(d => (d.data().totalPoints || 0) > pts).length;
      setUserRank(above + 1);
    };
    calcRank();
  }, [user, userProfile?.totalPoints]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page">

      {/* ── Perfil de usuario ── */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
          padding: '10px 14px',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {/* Nombre + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--navy)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.displayName}
            </div>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
          </div>

          {/* Badge ranking */}
          {userRank && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#e0f2fe', borderRadius: 20,
              padding: '4px 10px', flexShrink: 0,
            }}>
              <span style={{ fontSize: 13 }}>🏅</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>
                #{userRank} Ranking
              </span>
            </div>
          )}

          {/* Puntos */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 17, color: 'var(--navy)', lineHeight: 1,
              letterSpacing: '0.02em',
            }}>
              {userProfile?.totalPoints ?? 0}
              <span style={{ fontSize: 11, marginLeft: 2 }}>pts</span>
            </div>
            <div style={{
              fontSize: 9, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1,
            }}>
              Puntos totales
            </div>
          </div>

          {/* Badge admin */}
          {isAdmin && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'var(--gold)', color: 'var(--navy)',
              borderRadius: 20, padding: '3px 8px', flexShrink: 0,
            }}>
              Admin
            </span>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SECCIÓN 0 — FORMATO DEL MUNDIAL
      ══════════════════════════════════════════════ */}
      <button
        onClick={() => setShowFormato(true)}
        style={{
          width: '100%',
          background: 'var(--navy)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 'var(--radius)',
          padding: '14px 16px',
          marginBottom: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.15)',
          border: '1.5px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          🌍
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 15, letterSpacing: '0.06em',
            color: '#fff', marginBottom: 3,
          }}>
            ¿Cómo se jugará el Mundial 2026?
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
            48 selecciones · Nuevo formato · Fases y fechas clave
          </div>
        </div>
        <div style={{ fontSize: 16, color: 'var(--gold-light)', flexShrink: 0 }}>›</div>
      </button>

      {showFormato && <MundialFormatoModal onClose={() => setShowFormato(false)} />}

      {/* ══════════════════════════════════════════════
          SECCIÓN 1 — REGLAS Y MECÁNICA DE JUEGO
      ══════════════════════════════════════════════ */}
      <SectionHeader icon="" title="Reglas y Mecánica de Juego" />

      <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 14, lineHeight: 1.5 }}>
        A lo largo del torneo, los jugadores acumularán puntos según sus predicciones.
      </div>

      <PuntosCard
        pts={3}
        label="Resultado del partido"
        descripcion="Acertar el equipo ganador o empate otorga"
        destacado="3 puntos."
        nota="Aplica en todas las fases del torneo."
      />

      <PuntosCard
        pts={5}
        label="Marcador exacto"
        descripcion="Se podrá predecir el marcador final del partido. Cada acierto otorga"
        destacado="5 puntos."
        nota="Aplica a partir de Dieciseisavos de Final."
      />

      <PuntosCard
        pts={1}
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
            Si al finalizar la quiniela existe igualdad en el puntaje total entre dos o más jugadores, se utilizarán como criterio de desempate los aciertos obtenidos en la predicción de los equipos que avanzan de la fase de grupos.
          </div>
          <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, lineHeight: 1.5 }}>
            Será ganador quien registre la mayor cantidad de aciertos en esta etapa.
          </div>

          {/* Recuadro para enviar pronóstico — solo visible cuando el admin lo activa */}
          {groupPicksOpen && user && (
            <button
              onClick={() => setShowGroupPicks(true)}
              style={{
                width: '100%',
                background: 'var(--navy)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                marginTop: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                borderRadius: '50%',
                background: 'rgba(212,175,55,0.15)',
                border: '1.5px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🏟️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 15, letterSpacing: '0.06em',
                  color: '#fff', marginBottom: 3,
                }}>
                  Enviar Selecciones que Avanzan
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                  Selecciona los 2 clasificados por grupo · 1 punto por acierto
                </div>
              </div>
              <div style={{ fontSize: 16, color: 'var(--gold-light)', flexShrink: 0 }}>›</div>
            </button>
          )}
        </div>
      </div>

      {showGroupPicks && user && (
        <GroupPicksModal userId={user.uid} onClose={() => setShowGroupPicks(false)} />
      )}
      {showGroupRanking && (
        <GroupRankingModal currentUserId={user?.uid} onClose={() => setShowGroupRanking(false)} />
      )}

      {/* ══════════════════════════════════════════════
          SECCIÓN 4 — CONSIDERACIONES IMPORTANTES
      ══════════════════════════════════════════════ */}
      <SectionHeader icon="" title="Consideraciones Importantes" />

      <ConsideracionItem>
        <strong>Los puntos se asignan únicamente según las reglas descritas.</strong>
        <br />
        <span style={{ color: 'var(--text-muted)' }}>No existe ninguna otra forma de acumular puntos.</span>
      </ConsideracionItem>

      <ConsideracionItem>
        Un partido <strong>Abierto</strong> permite ingresar o modificar tu predicción tantas veces como quieras mientras permanezca en ese estado.
      </ConsideracionItem>

      <ConsideracionItem>
        A la hora del pitazo inicial el partido se cierra. Ninguna predicción puede modificarse — lo que guardaste es tu <strong>respuesta final</strong>.
      </ConsideracionItem>

      <ConsideracionItem>
        Una vez finalizado el partido, el administrador ingresa el marcador oficial y los puntos se calculan automáticamente en el ranking.
      </ConsideracionItem>

      <ConsideracionItem>
        Para efectos de puntuación se considera el resultado al finalizar los <strong>90 minutos reglamentarios</strong> incluyendo tiempo de reposición, y tiempos extra si los hay. Las tandas de penales <strong>no</strong> cuentan.
      </ConsideracionItem>

      <ConsideracionItem>
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


    </div>
  );
};

export default RulesPage;
