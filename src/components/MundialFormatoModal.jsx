// =============================================================================
//  FORMATO DEL MUNDIAL 2026
//  Cuando tengas la imagen del cuadro, guárdala en public/bracket.png
//  y cambia BRACKET_IMAGE a true.
// =============================================================================
const BRACKET_IMAGE = false; // ← ponlo en true cuando tengas la imagen

const FASES = [
  {
    emoji: '⚽',
    fase: 'Fase de Grupos',
    fechas: '11 Jun – 27 Jun',
    detalle: '12 grupos de 4 equipos · Los 2 mejores de cada grupo + los 8 mejores terceros clasifican',
    color: '#16a34a',
    bg: '#dcfce7',
    nuevo: false,
  },
  {
    emoji: '🔵',
    fase: 'Dieciseisavos de Final',
    fechas: '28 Jun – 3 Jul',
    detalle: '32 equipos compiten · Primera ronda eliminatoria de la historia del Mundial',
    color: '#0369a1',
    bg: '#e0f2fe',
    nuevo: true,
  },
  {
    emoji: '🟡',
    fase: 'Octavos de Final',
    fechas: '4 Jul – 7 Jul',
    detalle: '16 equipos',
    color: '#92400e',
    bg: '#fef3c7',
    nuevo: false,
  },
  {
    emoji: '🟠',
    fase: 'Cuartos de Final',
    fechas: '9 Jul – 11 Jul',
    detalle: '8 equipos',
    color: '#c2410c',
    bg: '#ffedd5',
    nuevo: false,
  },
  {
    emoji: '🔥',
    fase: 'Semifinal',
    fechas: '14 y 15 Jul',
    detalle: '4 equipos',
    color: '#9333ea',
    bg: '#f3e8ff',
    nuevo: false,
  },
  {
    emoji: '🥉',
    fase: 'Tercer Lugar',
    fechas: '18 Jul',
    detalle: 'Los dos semifinalistas eliminados',
    color: '#92400e',
    bg: '#fef3c7',
    nuevo: false,
  },
  {
    emoji: '🏆',
    fase: 'Gran Final',
    fechas: '19 Jul',
    detalle: 'MetLife Stadium · East Rutherford, Nueva Jersey',
    color: '#b45309',
    bg: '#fef9c3',
    nuevo: false,
  },
];

const MundialFormatoModal = ({ onClose }) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          maxHeight: '90vh',
          overflowY: 'auto',
          paddingBottom: 32,
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '8px 20px 12px',
        }}>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24, letterSpacing: '0.04em', color: 'var(--navy)',
              lineHeight: 1.1,
            }}>
              ¿Cómo se jugará el<br />Mundial 2026?
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              FIFA World Cup · USA · CAN · MEX
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '0 20px' }}>

          {/* Banner 48 equipos */}
          <div style={{
            background: 'var(--navy)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 20,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 40, color: 'var(--gold-light)',
              lineHeight: 1, flexShrink: 0,
            }}>
              48
            </div>
            <div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3,
              }}>
                Selecciones por primera vez en la historia
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                El torneo más grande hasta la fecha. Antes eran 32 equipos — ahora hay 16 más, lo que añade una ronda completamente nueva: los Dieciseisavos de Final.
              </div>
            </div>
          </div>

          {/* Timeline de fases */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: '0.04em',
            color: 'var(--navy)', marginBottom: 12,
          }}>
            Calendario de fases
          </div>

          <div style={{ position: 'relative' }}>
            {/* línea vertical */}
            <div style={{
              position: 'absolute', left: 19, top: 8, bottom: 8,
              width: 2, background: '#e2e8f0', borderRadius: 2,
            }} />

            {FASES.map((f, i) => (
              <div key={f.fase} style={{
                display: 'flex', gap: 12, marginBottom: 12,
                position: 'relative',
              }}>
                {/* dot */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: f.bg,
                  border: `2px solid ${f.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0, zIndex: 1,
                  boxShadow: '0 0 0 3px #fff',
                }}>
                  {i === FASES.length - 1 ? '🏆' : i + 1}
                </div>

                {/* contenido */}
                <div style={{
                  flex: 1,
                  background: '#f8fafc',
                  border: `1px solid ${f.nuevo ? f.color : '#e2e8f0'}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  boxShadow: f.nuevo ? `0 0 0 3px ${f.bg}` : 'none',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 3,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                      {f.fase}
                    </div>
                    {f.nuevo && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                        background: f.color, color: '#fff',
                        padding: '2px 7px', borderRadius: 20,
                        textTransform: 'uppercase',
                      }}>
                        ¡Nuevo!
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: f.color, marginBottom: 4,
                  }}>
                    {f.fechas}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                    {f.detalle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sección cuadro de llaves */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: '0.04em',
            color: 'var(--navy)', marginTop: 8, marginBottom: 10,
          }}>
            Cuadro de Llaves
          </div>

          {BRACKET_IMAGE ? (
            <img
              src="/bracket.png"
              alt="Cuadro de llaves Mundial 2026"
              style={{
                width: '100%', borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            />
          ) : (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 10,
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🗓️</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Disponible tras la Fase de Grupos
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                Una vez definidos los clasificados (27 Jun), publicaremos aquí el cuadro oficial con todos los cruces.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MundialFormatoModal;
