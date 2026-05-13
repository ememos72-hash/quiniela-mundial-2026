import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, getDocs, where,
  doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, ADMIN_UID } from '../contexts/AuthContext';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { LIGA_TEAMS, LIGA_LEAGUE_LABELS } from '../data/ligaData';

// ── Helpers ──────────────────────────────────────────────────────────────────

const dateRange = (f) => {
  try {
    return `${format(parseISO(f.startDate), "d 'de' MMM", { locale: es })} — ${format(parseISO(f.endDate), "d 'de' MMM yyyy", { locale: es })}`;
  } catch { return ''; }
};

const calcRanking = async (flash, matches) => {
  let flashMatchIds;
  if (flash.mode === 'matches' && flash.matchIds?.length > 0) {
    flashMatchIds = new Set(flash.matchIds);
  } else {
    const flashStart = new Date(flash.startDate);
    const flashEnd   = new Date(flash.endDate);
    flashMatchIds = new Set(
      matches.filter(m => {
        const d = new Date(m.date);
        return d >= flashStart && d <= flashEnd;
      }).map(m => m.id)
    );
  }
  if (flashMatchIds.size === 0) return { ranking: [], matchCount: 0 };

  const matchIdArray = Array.from(flashMatchIds);
  const chunks = [];
  for (let i = 0; i < matchIdArray.length; i += 30) chunks.push(matchIdArray.slice(i, i + 30));

  const [predsSnaps, usersSnap] = await Promise.all([
    Promise.all(chunks.map(chunk =>
      getDocs(query(collection(db, 'predictions'), where('matchId', 'in', chunk)))
    )),
    getDocs(collection(db, 'users')),
  ]);
  const allPredsDocs = predsSnaps.flatMap(s => s.docs);
  const usersMap = {};
  usersSnap.docs.forEach(d => {
    if (d.id !== ADMIN_UID) usersMap[d.id] = d.data();
  });

  const byUser = {};
  allPredsDocs.forEach(d => {
    const p = d.data();
    if (!flashMatchIds.has(p.matchId)) return;
    if (!byUser[p.userId]) byUser[p.userId] = { points: 0, correct: 0 };
    const pts = p.pointsAwarded || 0;
    byUser[p.userId].points  += pts;
    if (pts >= 3) byUser[p.userId].correct++;
  });

  const ranking = Object.entries(byUser)
    .map(([uid, data]) => ({
      uid,
      name: usersMap[uid]?.displayName || usersMap[uid]?.email || 'Usuario',
      points:  data.points,
      correct: data.correct,
    }))
    .sort((a, b) => b.points - a.points || b.correct - a.correct);

  return { ranking, matchCount: flashMatchIds.size };
};

// ── Liga: team logo ───────────────────────────────────────────────────────────

const TeamLogo = ({ team, size = 44 }) => {
  const info = LIGA_TEAMS[team];
  const [err, setErr] = useState(false);
  if (!info || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: info?.color || '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, color: '#fff', fontWeight: 700,
        flexShrink: 0,
      }}>
        {team?.[0] || '?'}
      </div>
    );
  }
  return (
    <img
      src={info.logo}
      alt={team}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  );
};

// ── Liga: match card ──────────────────────────────────────────────────────────

const LigaMatchCard = ({ match, userId, displayName }) => {
  const [expanded, setExpanded]     = useState(true);
  const [localPred, setLocalPred]   = useState(null);
  const [scoreA, setScoreA]         = useState(0);
  const [scoreB, setScoreB]         = useState(0);
  const [saved, setSaved]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [prediction, setPrediction] = useState(null);
  // Ver predicciones de todos
  const [showPreds, setShowPreds]       = useState(false);
  const [allPreds, setAllPreds]         = useState(null);
  const [predsLoading, setPredsLoading] = useState(false);

  const predId = `${userId}_${match.id}`;

  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, 'flashPredictions', predId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPrediction(d);
        setLocalPred(d.result);
        setScoreA(d.teamAScore ?? 0);
        setScoreB(d.teamBScore ?? 0);
      }
    });
  }, [predId, userId]);

  const save = async () => {
    if (!localPred || saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'flashPredictions', predId), {
        userId, matchId: match.id,
        displayName: displayName || '',
        result: localPred,
        teamAScore: scoreA,
        teamBScore: scoreB,
        pointsAwarded: 0,
        savedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
      setPrediction({ result: localPred, teamAScore: scoreA, teamBScore: scoreB });
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const loadAllPreds = async () => {
    if (showPreds) { setShowPreds(false); return; }
    setShowPreds(true);
    if (allPreds !== null) return; // ya cargado
    setPredsLoading(true);
    try {
      // Solo cargamos las predicciones de este partido — el displayName ya viene guardado en cada doc
      const predsSnap = await getDocs(
        query(collection(db, 'flashPredictions'), where('matchId', '==', match.id))
      );
      const preds = predsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      preds.sort((a, b) => {
        if (match.result) return (b.pointsAwarded || 0) - (a.pointsAwarded || 0);
        return (a.displayName || '').localeCompare(b.displayName || '', 'es');
      });
      setAllPreds(preds);
    } catch (e) { console.error(e); }
    setPredsLoading(false);
  };

  const dateStr = match.date
    ? format(new Date(match.date), "EEE d MMM · HH:mm", { locale: es })
    : null;

  const leagueLabel = match.league ? LIGA_LEAGUE_LABELS[match.league] : null;

  return (
    <div className="match-card" style={{ marginBottom: 10 }}>
      {/* Header acordeón — siempre visible */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Meta */}
        <div className="match-meta">
          <div className="match-meta-left">
            {leagueLabel && <span className="match-group-badge">{leagueLabel}</span>}
            {dateStr && <span>{dateStr}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!match.isOpen && !match.result && <span className="badge-closed">Cerrado</span>}
            {match.isOpen && !match.result && <span className="badge-open">Abierto</span>}
            {match.result && <span className="badge-played">Finalizado</span>}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
        {match.stadium && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, paddingBottom: 16 }}>
            📍 {match.stadium}
          </div>
        )}

        {/* Teams */}
        <div className="teams-row">
          <div className="team-side">
            <TeamLogo team={match.teamA} size={48} />
            <span className="team-name">{match.teamA}</span>
          </div>
          {match.result
            ? <span className="score-display">{match.result.teamAScore} - {match.result.teamBScore}</span>
            : <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 4px' }}>vs</span>
          }
          <div className="team-side">
            <TeamLogo team={match.teamB} size={48} />
            <span className="team-name">{match.teamB}</span>
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      {expanded && (<>

      {/* Prediction (if open) */}
      {match.isOpen && !match.result && (
        <>
          <div className="pred-row">
            <button
              className={`pred-btn ${localPred === 'teamA' ? 'sel-a' : ''}`}
              onClick={() => setLocalPred('teamA')}
            >{match.teamA}</button>
            <button
              className={`pred-btn ${localPred === 'draw' ? 'sel-draw' : ''}`}
              onClick={() => setLocalPred('draw')}
            >Empate</button>
            <button
              className={`pred-btn ${localPred === 'teamB' ? 'sel-b' : ''}`}
              onClick={() => setLocalPred('teamB')}
            >{match.teamB}</button>
          </div>

          {/* Marcador opcional */}
          {localPred && (
            <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '10px 14px 14px', marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ background: 'rgba(201,149,10,0.18)', border: '1.5px solid var(--gold)', borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>+5 pts</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Marcador exacto</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{match.teamA}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <button className="score-step-btn" onClick={() => setScoreA(v => Math.max(0, (v ?? 0) - 1))}>−</button>
                    <span className={`score-step-num ${scoreA === null ? 'empty' : ''}`}>{scoreA !== null ? scoreA : '–'}</span>
                    <button className="score-step-btn" onClick={() => setScoreA(v => (v ?? 0) + 1)}>+</button>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: 'rgba(201,149,10,0.3)', fontWeight: 700, marginTop: 14 }}>–</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{match.teamB}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <button className="score-step-btn" onClick={() => setScoreB(v => Math.max(0, (v ?? 0) - 1))}>−</button>
                    <span className={`score-step-num ${scoreB === null ? 'empty' : ''}`}>{scoreB !== null ? scoreB : '–'}</span>
                    <button className="score-step-btn" onClick={() => setScoreB(v => (v ?? 0) + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            className="save-btn"
            onClick={save}
            disabled={!localPred || saving}
            style={{ marginTop: 10 }}
          >
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : prediction ? 'Actualizar predicción' : 'Guardar predicción'}
          </button>
        </>
      )}

      {/* Resultado del usuario si ya cerró */}
      {!match.isOpen && !match.result && prediction && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, padding: '6px', background: '#f8fafc', borderRadius: 8 }}>
          Tu predicción: <strong>{prediction.result === 'teamA' ? match.teamA : prediction.result === 'teamB' ? match.teamB : 'Empate'}</strong>
          {prediction.teamAScore !== null && prediction.teamBScore !== null && ` · ${prediction.teamAScore}-${prediction.teamBScore}`}
        </div>
      )}

      {/* Puntos ganados */}
      {match.result && prediction && prediction.pointsAwarded > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{
            background: prediction.pointsAwarded >= 8 ? '#f3e8ff' : '#dcfce7',
            color:      prediction.pointsAwarded >= 8 ? '#7c3aed' : '#15803d',
            borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
          }}>
            {prediction.pointsAwarded >= 8 ? '⭐ ' : ''}+{prediction.pointsAwarded} pts ganados
          </span>
        </div>
      )}

      {/* Ver predicciones de todos — visible en cuanto el usuario ya guardó su predicción */}
      {expanded && prediction && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={loadAllPreds}
            style={{
              width: '100%', padding: '7px 0',
              background: showPreds ? '#f1f5f9' : 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text-mid)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showPreds ? 'Ocultar predicciones' : '👥 Ver predicciones'}
          </button>

          {showPreds && (
            <div style={{ marginTop: 8 }}>
              {predsLoading && (
                <div style={{ textAlign: 'center', padding: 12 }}><div className="spinner" /></div>
              )}
              {!predsLoading && allPreds?.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                  No hay predicciones registradas.
                </div>
              )}
              {!predsLoading && allPreds?.map((p, i) => {
                const name = p.displayName || '?';
                const pick = p.result === 'teamA' ? match.teamA : p.result === 'teamB' ? match.teamB : 'Empate';
                const hasScore = p.teamAScore !== null && p.teamAScore !== undefined;
                const pts = p.pointsAwarded;
                const isMe = p.userId === userId;
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 4px',
                    borderBottom: i < allPreds.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isMe ? '#fefce8' : 'transparent',
                    borderRadius: isMe ? 6 : 0,
                  }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: isMe ? 700 : 500, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                      {isMe && <span style={{ fontSize: 9, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 8, padding: '1px 5px', marginLeft: 5, fontWeight: 700 }}>Tú</span>}
                    </span>
                    <span style={{
                      background: match.result
                        ? (pts >= 8 ? '#f3e8ff' : pts > 0 ? '#dcfce7' : '#fee2e2')
                        : '#e0f2fe',
                      color: match.result
                        ? (pts >= 8 ? '#7c3aed' : pts > 0 ? '#15803d' : '#991b1b')
                        : '#0369a1',
                      borderRadius: 20, padding: '2px 8px',
                      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {pick}{hasScore ? ` (${p.teamAScore}-${p.teamBScore})` : ''}
                    </span>
                    {match.result && pts !== undefined && (
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: 15,
                        color: pts >= 8 ? '#7c3aed' : pts > 0 ? '#15803d' : '#94a3b8',
                        minWidth: 28, textAlign: 'right',
                      }}>
                        {pts > 0 ? `+${pts}` : '0'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>)}
    </div>
  );
};

// ── Liga: ranking ─────────────────────────────────────────────────────────────

const LigaRanking = ({ currentUserId }) => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow]       = useState(false);

  const load = async () => {
    if (show) { setShow(false); return; }
    setShow(true);
    setLoading(true);
    try {
      const [predsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'flashPredictions')),
        getDocs(collection(db, 'users')),
      ]);
      const usersMap = {};
      usersSnap.docs.forEach(d => {
        if (d.id !== ADMIN_UID) usersMap[d.id] = d.data();
      });
      const byUser = {};
      predsSnap.docs.forEach(d => {
        const p = d.data();
        if (!byUser[p.userId]) byUser[p.userId] = { points: 0, correct: 0 };
        const pts = p.pointsAwarded || 0;
        byUser[p.userId].points += pts;
        if (pts >= 3) byUser[p.userId].correct++;
      });
      const rows = Object.entries(byUser)
        .map(([uid, data]) => ({
          uid,
          name: usersMap[uid]?.displayName || usersMap[uid]?.email || 'Usuario',
          points: data.points, correct: data.correct,
        }))
        .sort((a, b) => b.points - a.points || b.correct - a.correct);
      setRanking(rows);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={load}
        style={{
          width: '100%', padding: '9px 0',
          background: show ? 'var(--navy)' : '#f1f5f9',
          color: show ? '#fff' : 'var(--navy)',
          border: '1px solid var(--border)', borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {show ? 'Ocultar ranking' : '🏆 Ver ranking Liga'}
      </button>

      {show && (
        <div style={{ marginTop: 10 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>
          ) : ranking.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
              Aún no hay predicciones registradas.
            </div>
          ) : ranking.map((u, i) => (
            <div key={u.uid} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8, marginBottom: 5,
              background: u.uid === currentUserId ? '#fef9c3' : i === 0 ? '#fffbeb' : '#f8fafc',
              border: `1px solid ${u.uid === currentUserId ? 'var(--gold)' : 'var(--border)'}`,
            }}>
              <span style={{ width: 24, textAlign: 'center', fontSize: i < 3 ? 18 : 13, fontFamily: i >= 3 ? "'Bebas Neue', sans-serif" : 'inherit', color: '#64748b' }}>
                {['🥇','🥈','🥉'][i] || i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: u.uid === currentUserId ? 700 : 500, color: 'var(--navy)' }}>
                {u.name}
                {u.uid === currentUserId && <span style={{ fontSize: 10, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 10, padding: '1px 5px', marginLeft: 5, fontWeight: 700 }}>Tú</span>}
              </span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--navy)' }}>{u.points}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Liga: sección principal ───────────────────────────────────────────────────

const LigaSection = ({ userId, userProfile }) => {
  const [matches, setMatches]       = useState([]);
  const [loadingMatches, setLoading] = useState(true);
  const [accessReq, setAccessReq]   = useState(null); // null | 'pending' | 'sent'
  const [sending, setSending]        = useState(false);

  const hasAccess = userProfile?.flashAccess === true;

  // Cargar solicitud de acceso del usuario
  useEffect(() => {
    if (!userId || hasAccess) return;
    getDoc(doc(db, 'flashAccessRequests', userId)).then(snap => {
      setAccessReq(snap.exists() ? 'sent' : 'none');
    });
  }, [userId, hasAccess]);

  // Cargar partidos si tiene acceso — más reciente primero
  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    const q = query(collection(db, 'flashMatches'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [hasAccess]);

  const requestAccess = async () => {
    if (sending) return;
    setSending(true);
    try {
      await setDoc(doc(db, 'flashAccessRequests', userId), {
        userId,
        displayName: userProfile?.displayName || '',
        email: userProfile?.email || '',
        requestedAt: serverTimestamp(),
        status: 'pending',
      });
      setAccessReq('sent');
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const crMatches = matches.filter(m => m.league === 'CR');
  const mxMatches = matches.filter(m => m.league === 'MX');

  return (
    <div style={{
      border: '1.5px solid var(--gold)',
      borderRadius: 14, overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '14px 16px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold-light)', letterSpacing: '0.04em', lineHeight: 1 }}>
          Quiniela UNAFUT y Liga BBVA MX ⚽
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          Finales y Semifinales · Mayo 2025
        </div>
      </div>

      <div style={{ padding: '14px 14px 16px' }}>

        {/* Sin acceso: puerta de entrada */}
        {!hasAccess && (
          <>
            {accessReq === 'sent' ? (
              <div style={{
                background: '#fefce8', border: '1px solid #fcd34d',
                borderRadius: 10, padding: '14px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div style={{ fontWeight: 600, color: '#92400e', fontSize: 14, marginBottom: 4 }}>
                  Solicitud enviada
                </div>
                <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                  El administrador revisará tu solicitud y te dará acceso pronto.
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 15, marginBottom: 6 }}>
                  Acceso restringido
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16, maxWidth: 280, margin: '0 auto 16px' }}>
                  Esta sección contiene los partidos de finales y semis de Costa Rica y México. Solicita acceso para participar.
                </div>
                <button
                  onClick={requestAccess}
                  disabled={sending}
                  style={{
                    padding: '10px 28px',
                    background: 'var(--navy)', color: '#fff',
                    border: 'none', borderRadius: 22,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    opacity: sending ? 0.6 : 1,
                  }}
                >
                  {sending ? 'Enviando...' : '🙋 Solicitar acceso'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Con acceso: partidos */}
        {hasAccess && (
          <>
            {loadingMatches && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></div>}

            {!loadingMatches && matches.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                Los partidos se publicarán pronto. Atento!
              </div>
            )}

            {crMatches.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f0fdf4', borderRadius: '10px 10px 0 0',
                  padding: '8px 12px',
                  borderLeft: '3px solid #15803d',
                }}>
                  <span style={{ fontSize: 18 }}>🇨🇷</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#15803d', letterSpacing: '0.04em' }}>Costa Rica</span>
                  <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto' }}>{crMatches.length} partido{crMatches.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ border: '1px solid #86efac', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 10px 4px' }}>
                  {crMatches.map(m => (
                    <LigaMatchCard key={m.id} match={m} userId={userId} displayName={userProfile?.displayName} />
                  ))}
                </div>
              </div>
            )}

            {mxMatches.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fef2f2', borderRadius: '10px 10px 0 0',
                  padding: '8px 12px',
                  borderLeft: '3px solid #dc2626',
                }}>
                  <span style={{ fontSize: 18 }}>🇲🇽</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#dc2626', letterSpacing: '0.04em' }}>México</span>
                  <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 'auto' }}>{mxMatches.length} partido{mxMatches.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ border: '1px solid #fca5a5', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 10px 4px' }}>
                  {mxMatches.map(m => (
                    <LigaMatchCard key={m.id} match={m} userId={userId} displayName={userProfile?.displayName} />
                  ))}
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
};

// ── Ranking table (Flash Mundial) ─────────────────────────────────────────────

const RankingTable = ({ ranking, loading }) => {
  if (loading) return <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>;
  if (ranking.length === 0) return (
    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
      Aun no hay predicciones para esta quiniela flash.
    </div>
  );
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ marginTop: 12 }}>
      {ranking.map((u, i) => (
        <div key={u.uid} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px',
          background: i === 0 ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.06)',
          borderRadius: 8, marginBottom: 6,
        }}>
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{medals[i] || `${i + 1}`}</span>
          <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: i === 0 ? 600 : 400 }}>{u.name}</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--gold-light)' }}>{u.points} pts</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', minWidth: 40, textAlign: 'right' }}>{u.correct} ac.</span>
        </div>
      ))}
    </div>
  );
};

// ── Flash card (active) ───────────────────────────────────────────────────────

const ActiveFlashCard = ({ flash, matches }) => {
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking]         = useState([]);
  const [matchCount, setMatchCount]   = useState(null);
  const [rankLoading, setRankLoading] = useState(false);

  const loadRanking = async () => {
    if (showRanking) { setShowRanking(false); return; }
    setShowRanking(true);
    setRankLoading(true);
    const result = await calcRanking(flash, matches);
    setRanking(result.ranking);
    setMatchCount(result.matchCount);
    setRankLoading(false);
  };

  return (
    <div className="flash-hero" style={{ marginBottom: 16 }}>
      <div className="flash-hero-header">
        <div className="flash-bolt">⚡</div>
        <div>
          <div className="flash-hero-title">{flash.name}</div>
          <div className="flash-hero-dates">{dateRange(flash)}</div>
        </div>
      </div>
      <div className="flash-hero-desc">
        {flash.description || 'Mismas reglas de puntos. El mejor de este periodo gana.'}
      </div>
      {matchCount !== null && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {matchCount} partidos en este periodo
        </div>
      )}
      <button
        onClick={loadRanking}
        style={{
          marginTop: 12, width: '100%', padding: '8px 0',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, color: '#fff',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {showRanking ? 'Ocultar ranking' : '🏆 Ver ranking en vivo'}
      </button>
      {showRanking && <RankingTable ranking={ranking} loading={rankLoading} />}
    </div>
  );
};

// ── Past flash card ────────────────────────────────────────────────────────────

const PastFlashCard = ({ flash, matches, badgeLabel = 'Finalizada', badgeColor = '#15803d', badgeBg = '#dcfce7' }) => {
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking]         = useState([]);
  const [matchCount, setMatchCount]   = useState(null);
  const [rankLoading, setRankLoading] = useState(false);

  const loadRanking = async () => {
    if (showRanking) { setShowRanking(false); return; }
    setShowRanking(true);
    setRankLoading(true);
    const result = await calcRanking(flash, matches);
    setRanking(result.ranking);
    setMatchCount(result.matchCount);
    setRankLoading(false);
  };

  const winner = ranking[0];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: 'var(--navy)' }}>{flash.name}</div>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: badgeBg, color: badgeColor, fontWeight: 600, whiteSpace: 'nowrap' }}>{badgeLabel}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {dateRange(flash)}{matchCount !== null && ` · ${matchCount} partidos`}
          </div>
        </div>
        <button
          onClick={loadRanking}
          style={{
            padding: '4px 12px', borderRadius: 20,
            border: '1px solid var(--border)',
            background: showRanking ? 'var(--navy)' : '#f8fafc',
            color: showRanking ? '#fff' : 'var(--text-mid)',
            fontSize: 12, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        >{showRanking ? 'Cerrar' : 'Ver ranking'}</button>
      </div>

      {showRanking && (
        <div style={{ padding: '0 14px 14px' }}>
          {rankLoading ? (
            <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" /></div>
          ) : ranking.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Sin predicciones en este periodo.</div>
          ) : (
            <>
              {winner && (
                <div style={{ background: 'var(--navy)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🏆</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ganador</div>
                    <div style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: 15 }}>{winner.name}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold-light)' }}>{winner.points} pts</div>
                </div>
              )}
              {ranking.map((u, i) => (
                <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>{['🥇','🥈','🥉'][i] || `${i+1}`}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--navy)', fontWeight: i === 0 ? 600 : 400 }}>{u.name}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: 'var(--navy)' }}>{u.points} pts</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>{u.correct} ac.</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const FlashPage = () => {
  const { user, userProfile } = useAuth();
  const [flashes, setFlashes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'flashes'), orderBy('startDate', 'desc'));
    return onSnapshot(q, snap => {
      setFlashes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
    getDocs(q).then(snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const now = new Date();
  const active   = flashes.filter(f => isBefore(parseISO(f.startDate), now) && isAfter(parseISO(f.endDate), now));
  const upcoming = flashes.filter(f => isAfter(parseISO(f.startDate), now));
  const past     = flashes.filter(f => isBefore(parseISO(f.endDate), now));

  return (
    <div className="page">
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.04em', color: 'var(--navy)', marginBottom: 16 }}>
        Flash ⚡
      </h2>

      {/* ── LIGA CR/MX ── */}
      <LigaSection userId={user?.uid} userProfile={userProfile} />

      {/* ── QUINIELA FLASH MUNDIAL ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 16px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, padding: '0 8px' }}>Quiniela Flash · Mundial</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 10px' }}>
              La <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>Quiniela Flash</span> se desarrolla durante un período específico definido por el administrador.
            </p>
            <p style={{ margin: '0 0 10px' }}>Se aplican las mismas reglas de puntuación.</p>
            <p style={{ margin: 0 }}>Al finalizar el período, se definirán uno o varios ganadores para esa etapa.</p>
          </div>
        </div>
        <div style={{ fontSize: 48, opacity: 0.2, flexShrink: 0, lineHeight: 1, transform: 'rotate(15deg)' }}>⚽</div>
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {active.map(f => <ActiveFlashCard key={f.id} flash={f} matches={matches} />)}

      {active.length === 0 && !loading && (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-muted)' }}>Sin Quiniela Flash Activa</div>
          <div className="text-muted mt-4" style={{ fontSize: 13 }}>Muy pronto se activará una nueva Quiniela Flash.</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="section-label">Proximas</div>
          {upcoming.map(f => <PastFlashCard key={f.id} flash={f} matches={matches} badgeLabel="Proxima" badgeColor="#0369a1" badgeBg="#e0f2fe" />)}
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="section-label">Historial</div>
          {past.map(f => <PastFlashCard key={f.id} flash={f} matches={matches} />)}
        </>
      )}
    </div>
  );
};

export default FlashPage;
