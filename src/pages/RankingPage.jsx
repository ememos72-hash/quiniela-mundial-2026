import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, ADMIN_UID } from '../contexts/AuthContext';
import { getInitials } from '../utils/points';
import GroupRankingModal from '../components/GroupRankingModal';

const RankingPage = () => {
  const { user, isAdmin } = useAuth();
  const [tab, setTab]                       = useState('liga');
  const [players, setPlayers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [rankingVisible, setRankingVisible] = useState(true);
  const [showGroupRanking, setShowGroupRanking] = useState(false);
  // Liga tab
  const [ligaPlayers, setLigaPlayers]   = useState([]);
  const [ligaLoading, setLigaLoading]   = useState(false);
  const [ligaLoaded, setLigaLoaded]     = useState(false);

  // Escuchar visibilidad del ranking en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
      setRankingVisible(snap.exists() ? snap.data().rankingVisible !== false : true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.id !== ADMIN_UID && d.isPaid === true); // solo activos
      // Ordenar por teamAdvances como desempate en el cliente
      data.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return (b.teamAdvances || 0) - (a.teamAdvances || 0);
      });
      setPlayers(data);
      setLoading(false);
    }, (error) => {
      console.error('Ranking error:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loadLigaRanking = async () => {
    if (ligaLoaded) { setLigaLoaded(false); setLigaPlayers([]); return; } // refresh
    setLigaLoading(true);
    try {
      const [predsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'flashPredictions')),
        getDocs(collection(db, 'users')),
      ]);
      const usersMap = {};
      usersSnap.docs.forEach(d => {
        const data = d.data();
        if (d.id !== ADMIN_UID && data.flashAccess === true) usersMap[d.id] = data;
      });
      // Inicializar todos los usuarios con flashAccess (aunque no hayan predicho)
      const byUser = {};
      Object.keys(usersMap).forEach(uid => { byUser[uid] = { points: 0, correct: 0 }; });
      predsSnap.docs.forEach(d => {
        const p = d.data();
        if (!byUser[p.userId]) return;
        const pts = p.pointsAwarded || 0;
        byUser[p.userId].points += pts;
        if (pts >= 3) byUser[p.userId].correct++;
      });
      const rows = Object.entries(byUser)
        .map(([uid, data]) => ({
          id: uid,
          displayName: usersMap[uid]?.displayName || usersMap[uid]?.email || 'Usuario',
          totalPoints: data.points,
          correct: data.correct,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints || b.correct - a.correct);
      setLigaPlayers(rows);
      setLigaLoaded(true);
    } catch (e) { console.error(e); }
    setLigaLoading(false);
  };

  const posClass = (i) => {
    if (i === 0) return 'gold';
    if (i === 1) return 'silver';
    if (i === 2) return 'bronze';
    return '';
  };

  const posMedal = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return null;
  };

  // Jugadores normales ven pantalla de espera si el ranking está oculto
  // Si el ranking está oculto y no es admin, forzar tab a Liga (Mundial está bloqueado)
  // Se hace dentro del render para no bloquear la página completa

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.04em', color: 'var(--navy)', margin: 0 }}>
            Clasificación
          </h2>
        </div>
        {tab === 'mundial' && (
          <button
            onClick={() => setShowGroupRanking(true)}
            style={{
              padding: '7px 14px',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: 20,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Puntaje de Desempate
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'liga',    label: '🇨🇷 UNAFUT / Liga BBVA MX 🇲🇽' },
          { key: 'mundial', label: '🏆 Mundial 2026' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'liga' && !ligaLoaded) loadLigaRanking(); }}
            style={{
              flex: 1, padding: '10px 8px', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--navy)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.key ? 'var(--navy)' : 'var(--text-muted)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: 'pointer', marginBottom: -2,
              textAlign: 'center',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showGroupRanking && (
        <GroupRankingModal currentUserId={user?.uid} onClose={() => setShowGroupRanking(false)} />
      )}

      {/* ── LIGA CR/MX TAB ── */}
      {tab === 'liga' && (
        <div>

          {ligaLoading && <div className="page-loading"><div className="spinner" /></div>}

          {!ligaLoading && ligaPlayers.map((player, i) => {
            const isMe = player.id === user?.uid;
            const medal = ['🥇','🥈','🥉'][i];
            const isTop3 = i < 3;
            const topBg = i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : '#fff7ed';
            const borderLeft = i === 0 ? '4px solid #d97706' : i === 1 ? '4px solid #94a3b8' : '4px solid #c2773a';
            return (
              <div key={player.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: isTop3 ? '13px 14px' : '10px 12px',
                background: isMe && !isTop3 ? '#fef9c3' : isTop3 ? topBg : '#f8fafc',
                borderLeft: isMe ? '4px solid #d97706' : isTop3 ? borderLeft : '4px solid transparent',
                borderRadius: 12, marginBottom: 8,
                boxShadow: isTop3 ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
              }}>
                <div style={{ fontSize: isTop3 ? (i === 0 ? 28 : 22) : 16, fontFamily: !isTop3 ? "'Bebas Neue', sans-serif" : 'inherit', color: !isTop3 ? '#818cf8' : 'inherit', width: 34, textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>
                  {medal || i + 1}
                </div>
                <div style={{ width: isTop3 ? (i === 0 ? 44 : 38) : 34, height: isTop3 ? (i === 0 ? 44 : 38) : 34, borderRadius: '50%', flexShrink: 0, background: isMe ? '#d97706' : 'var(--navy)', color: isMe ? '#fff' : 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                  {getInitials(player.displayName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.displayName}
                    {isMe && <span style={{ fontSize: 9, background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 8, marginLeft: 6, fontWeight: 700 }}>TÚ</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isTop3 ? (i === 0 ? 28 : 24) : 20, color: 'var(--navy)', lineHeight: 1 }}>
                    {player.totalPoints}
                  </div>
                  <div style={{ fontSize: 9, color: '#92400e', marginTop: 2 }}>puntos</div>
                </div>
              </div>
            );
          })}

          {!ligaLoading && ligaLoaded && (
            <div className="text-muted text-center" style={{ marginTop: 16, fontSize: 12 }}>
              {ligaPlayers.length} participante{ligaPlayers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Mensaje "en actualización" solo dentro del tab Mundial */}
      {tab === 'mundial' && !isAdmin && !rankingVisible && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔄</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: 'var(--navy)', letterSpacing: '0.04em', marginBottom: 10 }}>
            Ranking en Actualización
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
            Estamos registrando los resultados de la última jornada. El ranking actualizado estará disponible en unos minutos.
          </div>
        </div>
      )}

      {tab === 'mundial' && (isAdmin || rankingVisible) && loading && <div className="page-loading"><div className="spinner" /></div>}

      {tab === 'mundial' && (isAdmin || rankingVisible) && !loading && players.length === 0 && (
        <div className="text-center text-muted" style={{ marginTop: 40 }}>
          Aún no hay jugadores registrados
        </div>
      )}

      {/* ── TOP 5 + RESTO ── */}
      {tab === 'mundial' && (isAdmin || rankingVisible) && players.length > 0 && (() => {
        const top5 = players.slice(0, 5);
        const rest = players.slice(5);

        const topStyle = (i) => {
          if (i === 0) return {
            bg: '#fffbeb',
            borderLeft: '4px solid #d97706',
            avatarBg: '#d97706', avatarColor: '#fff',
            nameColor: 'var(--navy)', ptsColor: 'var(--navy)',
            subColor: '#92400e',
            medal: '🥇', medalSize: 32,
            ptsFontSize: 28,
          };
          if (i === 1) return {
            bg: '#f8fafc',
            borderLeft: '4px solid #94a3b8',
            avatarBg: 'var(--navy)', avatarColor: 'var(--gold-light)',
            nameColor: 'var(--navy)', ptsColor: 'var(--navy)',
            subColor: '#64748b',
            medal: '🥈', medalSize: 28,
            ptsFontSize: 24,
          };
          if (i === 2) return {
            bg: '#fff7ed',
            borderLeft: '4px solid #c2773a',
            avatarBg: '#c2773a', avatarColor: '#fff',
            nameColor: 'var(--navy)', ptsColor: 'var(--navy)',
            subColor: '#9a3412',
            medal: '🥉', medalSize: 28,
            ptsFontSize: 24,
          };
          return {
            bg: '#f0f4ff',
            borderLeft: '4px solid #818cf8',
            avatarBg: 'var(--navy)', avatarColor: '#a5b4fc',
            nameColor: 'var(--navy)', ptsColor: 'var(--navy)',
            subColor: '#4f46e5',
            medal: String(i + 1), medalSize: 22,
            ptsFontSize: 22,
          };
        };

        return (
          <>
            {/* Cards Top 5 — sin header */}
            <div style={{ marginBottom: 8 }}>
              {top5.map((player, i) => {
                const s = topStyle(i);
                const isMe = player.uid === user?.uid;
                return (
                  <div key={player.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: i === 0 ? '16px 14px' : '13px 14px',
                    background: isMe && i > 0
                      ? 'linear-gradient(90deg, #fef3c7 0%, ' + s.bg + ' 60%)'
                      : s.bg,
                    borderLeft: isMe ? '4px solid #d97706' : s.borderLeft,
                    borderRadius: 12,
                    marginBottom: 8,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  }}>
                    {/* Medalla */}
                    <div style={{
                      fontSize: i < 3 ? s.medalSize : 18,
                      fontFamily: i >= 3 ? "'Bebas Neue', sans-serif" : 'inherit',
                      color: i >= 3 ? '#818cf8' : 'inherit',
                      width: 34, textAlign: 'center', flexShrink: 0,
                      lineHeight: 1,
                    }}>
                      {s.medal}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: i === 0 ? 44 : 38, height: i === 0 ? 44 : 38,
                      borderRadius: '50%', flexShrink: 0,
                      background: isMe ? '#d97706' : s.avatarBg,
                      color: isMe ? '#fff' : s.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: i === 0 ? 15 : 13, fontWeight: 600,
                    }}>
                      {getInitials(player.displayName)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: i === 0 ? 15 : 14, fontWeight: 600,
                        color: s.nameColor,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {player.displayName}
                        {isMe && (
                          <span style={{ fontSize: 9, background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 8, marginLeft: 6, fontWeight: 700 }}>
                            TÚ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Puntos */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: s.ptsFontSize, color: s.ptsColor, lineHeight: 1,
                      }}>
                        {player.totalPoints || 0}
                      </div>
                      <div style={{ fontSize: 9, color: s.subColor, marginTop: 2 }}>puntos</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Separador */}
            {rest.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 10px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    🏆 Demás participantes
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {rest.map((player, idx) => {
                  const i = idx + 5;
                  const isMe = player.uid === user?.uid;
                  return (
                    <div
                      key={player.id}
                      className="rank-item"
                      style={isMe ? { background: 'linear-gradient(90deg, #fef3c7 0%, transparent 100%)', borderRadius: 8, padding: '11px 8px', margin: '0 -8px' } : {}}
                    >
                      <div className="rank-pos">{i + 1}</div>
                      <div className="rank-avatar" style={isMe ? { background: 'var(--gold)', color: 'var(--navy)' } : {}}>
                        {getInitials(player.displayName)}
                      </div>
                      <div className="rank-info">
                        <div className="rank-name">
                          {player.displayName}
                          {isMe && (
                            <span style={{ fontSize: 10, background: 'var(--gold)', color: 'var(--navy)', padding: '1px 6px', borderRadius: 10, marginLeft: 6, fontWeight: 600 }}>
                              TÚ
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rank-pts-col">
                        <div className="rank-pts-num">{player.totalPoints || 0}</div>
                        <div className="rank-pts-label">puntos</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div className="text-muted text-center" style={{ marginTop: 20, fontSize: 12 }}>
              {players.length} participante{players.length !== 1 ? 's' : ''}
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default RankingPage;
