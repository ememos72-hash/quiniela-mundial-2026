import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GROUPS, COUNTRY_CODES, FLAGS } from '../data/worldCupData';

const FlagImg = ({ team, size = 28 }) => {
  const code = COUNTRY_CODES[team];
  if (!code) return <span style={{ fontSize: size * 0.7 }}>{FLAGS[team] || '🏳'}</span>;
  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      alt={team}
      style={{ width: size, height: size * 0.67, objectFit: 'cover', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
};

const groupKeys = Object.keys(GROUPS);

const GroupPicksModal = ({ userId, onClose }) => {
  // picks: { A: ['México', 'República de Corea'], B: [...], ... }
  const [picks, setPicks]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null); // accordion

  const completedGroups = groupKeys.filter(g => (picks[g] || []).length === 2).length;
  const allDone = completedGroups === 12;

  // Cargar picks existentes
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'groupPredictions', userId));
        if (snap.exists()) setPicks(snap.data().picks || {});
      } catch (_) {}
      setLoading(false);
      // Expandir el primer grupo incompleto por defecto
      const first = groupKeys.find(g => (picks[g] || []).length < 2) || groupKeys[0];
      setExpandedGroup(first);
    };
    load();
  }, [userId]);

  // Expande el primer grupo incompleto cuando picks cambian
  useEffect(() => {
    if (!loading && expandedGroup) return;
    const first = groupKeys.find(g => (picks[g] || []).length < 2);
    if (first) setExpandedGroup(first);
  }, [picks, loading]);

  const toggleTeam = (group, team) => {
    setPicks(prev => {
      const current = prev[group] || [];
      if (current.includes(team)) {
        // Deseleccionar
        return { ...prev, [group]: current.filter(t => t !== team) };
      }
      if (current.length >= 2) {
        // Reemplazar el primero (más antiguo) con el nuevo
        return { ...prev, [group]: [current[1], team] };
      }
      const next = [...current, team];
      return { ...prev, [group]: next };
    });
  };

  const save = async () => {
    if (!allDone || saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'groupPredictions', userId), {
        picks,
        updatedAt: new Date().toISOString(),
        totalPicks: 24,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1400);
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

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
          maxHeight: '92vh',
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
              Equipos que avanzan
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              Selecciona 2 equipos por grupo · 1 punto por acierto
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

          {/* Progreso */}
          <div style={{
            background: 'var(--navy)', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6,
              }}>
                <span>Grupos completados</span>
                <span style={{ color: allDone ? 'var(--gold-light)' : '#fff', fontWeight: 600 }}>
                  {completedGroups}/12
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(completedGroups / 12) * 100}%`,
                  background: allDone ? 'var(--gold)' : 'var(--gold-light)',
                  borderRadius: 3, transition: 'width 0.3s',
                }} />
              </div>
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 28, color: allDone ? 'var(--gold)' : 'var(--gold-light)',
              lineHeight: 1, flexShrink: 0,
            }}>
              {allDone ? '✓' : `${completedGroups * 2}/24`}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Grupos */}
              {groupKeys.map(group => {
                const teams = GROUPS[group].teams;
                const selected = picks[group] || [];
                const isDone = selected.length === 2;
                const isOpen = expandedGroup === group;

                return (
                  <div
                    key={group}
                    style={{
                      border: `1px solid ${isDone ? '#86efac' : 'var(--border)'}`,
                      borderRadius: 12, marginBottom: 8, overflow: 'hidden',
                    }}
                  >
                    {/* Cabecera del grupo */}
                    <div
                      onClick={() => setExpandedGroup(isOpen ? null : group)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: isDone ? '#f0fdf4' : isOpen ? '#f8fafc' : '#fff',
                        cursor: 'pointer', userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isDone ? '#15803d' : 'var(--navy)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 16, color: isDone ? '#fff' : 'var(--gold-light)',
                            letterSpacing: '0.04em',
                          }}>
                            {isDone ? '✓' : group}
                          </span>
                        </div>
                        <div>
                          <div style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 15, letterSpacing: '0.06em',
                            color: 'var(--navy)',
                          }}>
                            Grupo {group}
                          </div>
                          {isDone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              {selected.map(t => (
                                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <FlagImg team={t} size={16} />
                                  <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>{t}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                              {selected.length === 0 ? 'Selecciona 2 equipos' : `${selected.length}/2 seleccionados`}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </div>

                    {/* Equipos del grupo */}
                    {isOpen && (
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: 8, padding: '8px 12px 12px',
                        background: '#f8fafc',
                        borderTop: '1px solid var(--border)',
                      }}>
                        {teams.map(team => {
                          const isSelected = selected.includes(team);
                          return (
                            <button
                              key={team}
                              onClick={() => toggleTeam(group, team)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '9px 12px',
                                border: `2px solid ${isSelected ? '#15803d' : 'var(--border)'}`,
                                borderRadius: 10,
                                background: isSelected ? '#f0fdf4' : '#fff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: "'DM Sans', sans-serif",
                                transition: 'all 0.12s',
                              }}
                            >
                              <FlagImg team={team} size={24} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 12, fontWeight: isSelected ? 700 : 400,
                                  color: isSelected ? '#15803d' : '#1e293b',
                                  lineHeight: 1.2,
                                  overflow: 'hidden', textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {team}
                                </div>
                              </div>
                              {isSelected && (
                                <span style={{
                                  fontSize: 14, color: '#15803d', flexShrink: 0,
                                }}>
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mensaje de instrucciones */}
              <div style={{
                fontSize: 11, color: '#94a3b8', fontStyle: 'italic',
                textAlign: 'center', marginTop: 4, marginBottom: 16, lineHeight: 1.5,
              }}>
                Si cambias de opinión, toca otro equipo para reemplazar tu selección anterior.
              </div>

              {/* Botón guardar */}
              <button
                onClick={save}
                disabled={!allDone || saving || saved}
                style={{
                  width: '100%', padding: '14px 0',
                  background: saved
                    ? '#15803d'
                    : allDone
                      ? 'var(--gold)'
                      : '#e2e8f0',
                  color: saved
                    ? '#fff'
                    : allDone
                      ? 'var(--navy)'
                      : '#94a3b8',
                  border: 'none', borderRadius: 12,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18, letterSpacing: '0.06em',
                  cursor: allDone && !saving && !saved ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
              >
                {saved
                  ? '✓ ¡Guardado!'
                  : saving
                    ? 'Guardando...'
                    : allDone
                      ? 'Guardar pronósticos'
                      : `Completa los ${12 - completedGroups} grupos restantes`}
              </button>

              {allDone && !saved && !saving && (
                <div style={{
                  textAlign: 'center', fontSize: 11, color: '#15803d',
                  fontWeight: 600, marginTop: 8,
                }}>
                  ✓ Todos los grupos completados — listo para guardar
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupPicksModal;
