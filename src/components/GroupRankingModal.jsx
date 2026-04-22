import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { GROUPS, COUNTRY_CODES, FLAGS } from '../data/worldCupData';

const groupKeys = Object.keys(GROUPS);

const FlagImgTiny = ({ team }) => {
  const code = COUNTRY_CODES[team];
  if (!code) return <span style={{ fontSize: 12 }}>{FLAGS[team] || '🏳'}</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
};

// Calcular puntos de pronóstico de grupos de un usuario
// advancing: { A: ['equipo1', 'equipo2'], B: [...], ... } — equipos que realmente clasificaron
const calcGroupPoints = (userPicks, advancing) => {
  if (!advancing || Object.keys(advancing).length === 0) return null;
  let pts = 0;
  for (const g of groupKeys) {
    const userSel = userPicks[g] || [];
    const adv = advancing[g] || [];
    for (const t of userSel) {
      if (adv.includes(t)) pts++;
    }
  }
  return pts;
};

const GroupRankingModal = ({ currentUserId, onClose }) => {
  const [users, setUsers]       = useState([]);
  const [allPicks, setAllPicks] = useState({}); // { userId: { picks: {...}, updatedAt } }
  const [advancing, setAdvancing] = useState({}); // { A: [t1, t2], ... }
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null); // userId que está expandido

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Usuarios
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('displayName', 'asc')));
        const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Todos los pronósticos de grupos
        const picksSnap = await getDocs(collection(db, 'groupPredictions'));
        const picksMap = {};
        picksSnap.docs.forEach(d => { picksMap[d.id] = d.data(); });

        // 3. Equipos clasificados (si el admin los cargó)
        const configSnap = await getDoc(doc(db, 'config', 'groupPicks'));
        const adv = configSnap.exists() ? (configSnap.data().advancing || {}) : {};

        setUsers(usersData);
        setAllPicks(picksMap);
        setAdvancing(adv);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const hasAdvancing = Object.keys(advancing).length > 0;

  // Construir filas del ranking
  const rows = users.map(u => {
    const pickData = allPicks[u.id];
    const picks = pickData?.picks || null;
    const submitted = picks ? groupKeys.filter(g => (picks[g] || []).length === 2).length : 0;
    const pts = picks && hasAdvancing ? calcGroupPoints(picks, advancing) : null;
    return { user: u, picks, submitted, pts };
  }).sort((a, b) => {
    // Si hay puntaje real, ordenar por pts desc luego por submitted desc
    if (hasAdvancing) {
      const pA = a.pts ?? -1;
      const pB = b.pts ?? -1;
      if (pB !== pA) return pB - pA;
    }
    // Si no hay puntaje, ordenar por grupos completados desc
    return b.submitted - a.submitted;
  });

  const medalColor = (i) => {
    if (i === 0) return { bg: '#fef9c3', border: '#fbbf24', text: '#92400e' };
    if (i === 1) return { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' };
    if (i === 2) return { bg: '#fef3ec', border: '#f97316', text: '#9a3412' };
    return null;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#fff',
          borderRadius: 20,
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
              Pronóstico de Grupos
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              {hasAdvancing
                ? 'Puntos por equipos que clasificaron'
                : 'Pronósticos enviados · resultados pendientes'}
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

        <div style={{ padding: '0 16px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Aviso si no hay resultados aún */}
              {!hasAdvancing && (
                <div style={{
                  background: '#fefce8', border: '1px solid #fcd34d',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 12, color: '#92400e', marginBottom: 16,
                  lineHeight: 1.5,
                }}>
                  ⏳ Los puntos se calcularán al finalizar la Fase de Grupos (27 Jun). Por ahora puedes ver quién ya envió sus pronósticos.
                </div>
              )}

              {/* Filas de ranking */}
              {rows.map((row, i) => {
                const { user, picks, submitted, pts } = row;
                const isMe = user.id === currentUserId;
                const medal = medalColor(i);
                const isExpanded = expanded === user.id;
                const hasPicks = submitted > 0;

                return (
                  <div
                    key={user.id}
                    style={{
                      border: `1px solid ${isMe ? 'var(--gold)' : medal ? medal.border : 'var(--border)'}`,
                      borderRadius: 10,
                      marginBottom: 6,
                      overflow: 'hidden',
                      background: isMe ? '#fefce8' : medal ? medal.bg : '#fff',
                    }}
                  >
                    {/* Fila compacta */}
                    <div
                      onClick={() => hasPicks && setExpanded(isExpanded ? null : user.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 12px',
                        cursor: hasPicks ? 'pointer' : 'default',
                      }}
                    >
                      {/* Posición */}
                      <div style={{
                        width: 26, textAlign: 'center', flexShrink: 0,
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: i < 3 ? 16 : 14,
                        color: medal ? medal.text : 'var(--text-muted)',
                      }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>

                      {/* Nombre + puntos obtenidos */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: isMe ? 700 : 500,
                          color: 'var(--navy)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
                        }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.displayName || user.email}
                          </span>
                          {isMe && (
                            <span style={{
                              fontSize: 10, flexShrink: 0,
                              background: 'var(--gold)', color: 'var(--navy)',
                              borderRadius: 10, padding: '1px 5px', fontWeight: 700,
                            }}>Tú</span>
                          )}
                          {hasAdvancing && hasPicks && pts !== null && (
                            <span style={{
                              fontSize: 10, flexShrink: 0,
                              background: pts >= 16 ? '#dcfce7' : pts >= 10 ? '#fef9c3' : '#f1f5f9',
                              color:      pts >= 16 ? '#15803d' : pts >= 10 ? '#92400e' : '#64748b',
                              borderRadius: 10, padding: '1px 7px', fontWeight: 700,
                              border: `1px solid ${pts >= 16 ? '#86efac' : pts >= 10 ? '#fcd34d' : '#e2e8f0'}`,
                            }}>
                              {pts} pts
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {!hasPicks
                            ? 'No ha enviado pronóstico'
                            : hasAdvancing && pts !== null
                              ? `Puntos obtenidos · ${submitted}/12 grupos`
                              : `${submitted}/12 grupos completados`}
                        </div>
                      </div>

                      {/* Toggle expandir */}
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        {!hasPicks ? (
                          <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>—</span>
                        ) : (
                          <>
                            {!hasAdvancing && (
                              <span style={{
                                fontSize: 11, fontWeight: 600,
                                background: submitted === 12 ? '#dcfce7' : '#f1f5f9',
                                color: submitted === 12 ? '#15803d' : '#64748b',
                                borderRadius: 20, padding: '3px 8px', display: 'block', marginBottom: 2,
                              }}>
                                {submitted === 12 ? '✓ Listo' : `${submitted * 2}/24`}
                              </span>
                            )}
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>
                              {isExpanded ? '▲ ocultar' : '▼ ver picks'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Detalle expandible — picks por grupo */}
                    {isExpanded && picks && (
                      <div style={{
                        borderTop: '1px solid var(--border)',
                        background: '#f8fafc',
                        padding: '10px 12px',
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 6,
                        }}>
                          {groupKeys.map(g => {
                            const sel = picks[g] || [];
                            const isDone = sel.length === 2;
                            const adv = advancing[g] || [];
                            const correctInGroup = hasAdvancing ? sel.filter(t => adv.includes(t)).length : 0;
                            const groupCardBg = !hasAdvancing ? '#fff'
                              : correctInGroup === 2 ? '#f0fdf4'
                              : correctInGroup === 1 ? '#fefce8'
                              : '#fff';
                            const groupCardBorder = !hasAdvancing ? 'var(--border)'
                              : correctInGroup === 2 ? '#86efac'
                              : correctInGroup === 1 ? '#fcd34d'
                              : 'var(--border)';
                            return (
                              <div
                                key={g}
                                style={{
                                  border: `1px solid ${groupCardBorder}`,
                                  borderRadius: 8, padding: '7px 8px',
                                  background: groupCardBg,
                                }}
                              >
                                <div style={{
                                  fontFamily: "'Bebas Neue', sans-serif",
                                  fontSize: 11, letterSpacing: '0.1em',
                                  color: 'var(--navy)', marginBottom: 5,
                                }}>
                                  Grupo {g}
                                </div>
                                {isDone ? sel.map(t => {
                                  const isCorrect = hasAdvancing && adv.includes(t);
                                  const isWrong   = hasAdvancing && !adv.includes(t);
                                  return (
                                    <div key={t} style={{
                                      display: 'flex', alignItems: 'center', gap: 4,
                                      marginBottom: 3,
                                      padding: '2px 4px',
                                      borderRadius: 4,
                                      background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : 'transparent',
                                    }}>
                                      <FlagImgTiny team={t} />
                                      <span style={{
                                        fontSize: 10, lineHeight: 1.2,
                                        color: isCorrect ? '#15803d' : isWrong ? '#991b1b' : '#475569',
                                        fontWeight: isCorrect ? 700 : 400,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        maxWidth: 60,
                                      }}>
                                        {t}
                                      </span>
                                      {isCorrect && (
                                        <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, flexShrink: 0 }}>✓</span>
                                      )}
                                      {isWrong && (
                                        <span style={{ fontSize: 11, color: '#991b1b', flexShrink: 0 }}>✗</span>
                                      )}
                                    </div>
                                  );
                                }) : (
                                  <div style={{ fontSize: 10, color: '#cbd5e1', fontStyle: 'italic' }}>
                                    Sin selección
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
                  Nadie ha enviado pronósticos aún
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRankingModal;
