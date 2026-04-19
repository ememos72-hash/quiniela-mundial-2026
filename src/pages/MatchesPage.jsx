import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, getDoc, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { FLAGS, COUNTRY_CODES, EXACT_SCORE_PHASES, PHASE_LABELS } from '../data/worldCupData';

const FlagImg = ({ team, size = 48 }) => {
  const code = COUNTRY_CODES[team];
  if (!code) return <span style={{ fontSize: size * 0.7 }}>{FLAGS[team] || '🏳'}</span>;
  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      alt={team}
      style={{ width: size, height: size * 0.67, objectFit: 'cover', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
};
import { calculatePredictionPoints } from '../utils/points';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Tarjeta tipo recibo para "Mis Picks"
const MyPickCard = ({ pred, match }) => {
  const pts = match.result ? calculatePredictionPoints(pred, match) : null;

  const pickLabel =
    pred.result === 'teamA' ? match.teamA :
    pred.result === 'teamB' ? match.teamB : 'Empate';

  const matchDateStr = match.date
    ? format(parseISO(match.date), "d 'de' MMM · HH:mm", { locale: es })
    : '';

  const fmtTs = (iso) => {
    if (!iso) return null;
    try { return format(new Date(iso), "d MMM yyyy · HH:mm:ss", { locale: es }); }
    catch { return iso; }
  };

  const savedStr   = fmtTs(pred.savedAt);
  const updatedStr = fmtTs(pred.updatedAt);
  const wasEdited  = (pred.changeCount || 0) > 0;

  // Color del pick según resultado
  let pickBg = '#f0f9ff', pickColor = '#0369a1', pickBorder = '#bae6fd';
  if (match.result) {
    if (pts > 0) { pickBg = '#f0fdf4'; pickColor = '#15803d'; pickBorder = '#86efac'; }
    else         { pickBg = '#fef2f2'; pickColor = '#991b1b'; pickBorder = '#fca5a5'; }
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Cabecera: partido */}
      <div style={{
        background: 'var(--navy)',
        padding: '8px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
          {match.teamA} vs {match.teamB}
        </div>
        {match.result
          ? <span style={{ fontSize: 11, background: pts > 0 ? '#15803d' : '#991b1b', color: '#fff', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
              {pts > 0 ? `+${pts} pts` : '0 pts'}
            </span>
          : match.isOpen
            ? <span style={{ fontSize: 11, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>Abierto</span>
            : <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: '2px 8px' }}>Esperando</span>
        }
      </div>

      <div style={{ padding: '10px 14px' }}>
        {/* Fecha del partido */}
        {matchDateStr && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            📅 Partido: {matchDateStr}
            {match.result && (
              <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--navy)' }}>
                · Resultado: {match.result.teamAScore} - {match.result.teamBScore}
              </span>
            )}
          </div>
        )}

        {/* El pick destacado */}
        <div style={{
          background: pickBg, border: `1px solid ${pickBorder}`,
          borderRadius: 8, padding: '7px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div>
            <div style={{ fontSize: 10, color: pickColor, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>
              Tu predicción
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: pickColor }}>
              {pickLabel}
              {pred.teamAScore !== undefined && (
                <span style={{ fontSize: 13, marginLeft: 8, opacity: 0.8 }}>
                  · {pred.teamAScore}-{pred.teamBScore}
                </span>
              )}
            </div>
          </div>
          {match.result && (
            <span style={{ fontSize: 20 }}>{pts > 0 ? '✅' : '❌'}</span>
          )}
        </div>

        {/* Recibo de timestamps */}
        <div style={{
          background: '#f8fafc', borderRadius: 8, padding: '8px 12px',
          borderLeft: '3px solid var(--navy)',
          fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.8,
        }}>
          <div>🕐 <strong>Guardado:</strong> {savedStr}</div>
          {wasEdited && (
            <div style={{ color: '#92400e' }}>
              🔄 <strong>Último cambio:</strong> {updatedStr}
              <span style={{ marginLeft: 6, background: '#fef3c7', color: '#92400e', borderRadius: 10, padding: '1px 6px', fontWeight: 600 }}>
                {pred.changeCount} {pred.changeCount === 1 ? 'edición' : 'ediciones'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Picks de la comunidad (cerrados y jugados)
const CommunityPicks = ({ match, userId, allUsers, show, onToggle, preds, setPreds, loading, setLoading }) => {
  const hasResult = !!match.result;

  const loadPreds = async () => {
    if (preds.length > 0) return; // ya cargados
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'predictions'), where('matchId', '==', match.id)));
    setPreds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handleToggle = () => {
    if (!show) loadPreds();
    onToggle();
  };

  // Distribución de votos
  const countA    = preds.filter(p => p.result === 'teamA').length;
  const countDraw = preds.filter(p => p.result === 'draw').length;
  const countB    = preds.filter(p => p.result === 'teamB').length;
  const total     = preds.length;

  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

  const pickLabel = (result) => {
    if (result === 'teamA') return match.teamA;
    if (result === 'teamB') return match.teamB;
    return 'Empate';
  };

  const getPts = (pred) => {
    if (!match.result) return null;
    return calculatePredictionPoints(pred, match);
  };

  // Lista ordenada: con predicción primero (por puntos desc), luego sin
  const rows = allUsers.map(u => ({
    user: u,
    pred: preds.find(p => p.userId === u.id) || null,
  })).sort((a, b) => {
    if (!a.pred && !b.pred) return 0;
    if (!a.pred) return 1;
    if (!b.pred) return -1;
    if (hasResult) {
      const pA = getPts(a.pred) || 0;
      const pB = getPts(b.pred) || 0;
      return pB - pA;
    }
    return 0;
  });

  const correctCount = hasResult ? preds.filter(p => getPts(p) > 0).length : 0;

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
      {/* Botón toggle */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%', padding: '7px 0',
          background: show ? '#f0f9ff' : 'transparent',
          border: `1px solid ${show ? '#bae6fd' : 'var(--border)'}`,
          borderRadius: 8, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, fontWeight: 600,
          color: show ? '#0369a1' : 'var(--text-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {show ? '▲ Ocultar picks' : hasResult
          ? `👥 Ver picks de todos · ${correctCount} acertaron`
          : `📊 Ver distribución`}
      </button>

      {show && (
        <div style={{ marginTop: 10 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 12 }}><div className="spinner" /></div>
          )}

          {!loading && preds.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>
              Nadie ha predicho este partido aún
            </div>
          )}

          {!loading && preds.length > 0 && (
            <>
              {/* Barra de distribución */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 8, marginBottom: 6 }}>
                  {countA > 0 && <div style={{ flex: countA, background: '#3b82f6' }} />}
                  {countDraw > 0 && <div style={{ flex: countDraw, background: '#94a3b8' }} />}
                  {countB > 0 && <div style={{ flex: countB, background: '#f59e0b' }} />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mid)' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>{match.teamA} {pct(countA)}% ({countA})</span>
                  {countDraw > 0 && <span style={{ color: '#64748b', fontWeight: 600 }}>Empate {pct(countDraw)}% ({countDraw})</span>}
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{match.teamB} {pct(countB)}% ({countB})</span>
                </div>
              </div>

              {/* Lista completa con nombres */}
              {allUsers.length > 0 && rows.map(({ user, pred }) => {
                const pts = pred ? getPts(pred) : null;
                const isMe = user.id === userId;
                const label = pred ? pickLabel(pred.result) : null;
                let rowBg = 'transparent';
                if (hasResult && pred) rowBg = pts > 0 ? '#f0fdf4' : '#fef2f2';
                if (isMe) rowBg = '#fefce8';

                return (
                  <div key={user.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px', borderRadius: 6, background: rowBg,
                    marginBottom: 2, fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--navy)', fontWeight: isMe ? 700 : 400 }}>
                      {user.displayName || user.email}
                      {isMe && <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 10, padding: '1px 5px' }}>Tú</span>}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {pred ? (
                        <>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: hasResult ? (pts > 0 ? '#15803d' : '#991b1b') : '#0369a1',
                          }}>
                            {label}
                            {pred.teamAScore !== undefined && ` (${pred.teamAScore}-${pred.teamBScore})`}
                          </span>
                          {hasResult && (
                            <span style={{ fontWeight: 700, fontSize: 12, color: pts >= 5 ? '#7c3aed' : pts >= 3 ? '#15803d' : '#991b1b' }}>
                              {pts > 0 ? `+${pts}` : '0'}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>No predijo</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {total} de {allUsers.length} jugadores predijeron
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Countdown compacto para partidos abiertos
const MatchCountdown = ({ date }) => {
  const calc = () => {
    const diff = new Date(date) - new Date();
    if (diff <= 0) return null;
    return {
      diff,
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      totalMin: Math.floor(diff / 60000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!t) return null;

  const color = t.totalMin < 30 ? '#991b1b' : t.totalMin < 60 ? '#92400e' : '#15803d';
  const bg    = t.totalMin < 30 ? '#fee2e2' : t.totalMin < 60 ? '#fef3c7' : '#dcfce7';
  const label = t.h > 0 ? `${t.h}h ${t.m}m` : `${t.m}m ${t.s}s`;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, color, borderRadius: 20,
      padding: '3px 10px', fontSize: 12, fontWeight: 600,
      marginBottom: 8,
    }}>
      ⏱ Inicia en: {label}
    </div>
  );
};

const MatchCard = ({ match, userId, allUsers, userPrediction }) => {
  const [prediction, setPrediction] = useState(null);
  const [localPred, setLocalPred]   = useState(null);
  const [scoreA, setScoreA]         = useState('');
  const [scoreB, setScoreB]         = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [showPicks, setShowPicks]       = useState(false);
  const [matchPreds, setMatchPreds]     = useState([]);
  const [picksLoading, setPicksLoading] = useState(false);

  const allowExactScore = EXACT_SCORE_PHASES.includes(match.phase);

  // Sincronizar con la predicción que viene del query centralizado
  useEffect(() => {
    if (!userPrediction) return;
    setPrediction(userPrediction);
    setLocalPred(userPrediction.result);
    if (userPrediction.teamAScore !== undefined) setScoreA(String(userPrediction.teamAScore));
    if (userPrediction.teamBScore !== undefined) setScoreB(String(userPrediction.teamBScore));
  }, [userPrediction?.updatedAt, userPrediction?.matchId]);

  const savePrediction = async () => {
    if (!localPred || saving) return;
    setSaving(true);
    try {
      const isUpdate = !!prediction;
      const now = new Date().toISOString();
      const data = {
        userId,
        matchId: match.id,
        result: localPred,
        savedAt: prediction?.savedAt || now,
        updatedAt: now,
        changeCount: isUpdate ? (prediction.changeCount || 0) + 1 : 0,
      };
      if (allowExactScore && scoreA !== '' && scoreB !== '') {
        data.teamAScore = parseInt(scoreA);
        data.teamBScore = parseInt(scoreB);
      }
      const ref = doc(db, 'predictions', `${userId}_${match.id}`);
      await setDoc(ref, data);
      setPrediction(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const pts = match.result && prediction
    ? calculatePredictionPoints(prediction, match)
    : null;

  const dateStr = match.date
    ? format(parseISO(match.date), "d 'de' MMM · HH:mm", { locale: es })
    : '';

  const predTimestamp = prediction?.updatedAt
    ? format(new Date(prediction.updatedAt), "d MMM · HH:mm", { locale: es })
    : null;
  const wasChanged = prediction?.changeCount > 0;

  return (
    <div className="match-card">
      <div className="match-meta">
        <div className="match-meta-left">
          {match.group && <span className="match-group-badge">Grupo {match.group}</span>}
          <span>{PHASE_LABELS[match.phase] || match.phase}</span>
          {dateStr && <span> · {dateStr}</span>}
          {match.venue && (
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              📍 {match.venue}
            </span>
          )}
        </div>
        {match.result
          ? <span className="badge-played">Finalizado</span>
          : match.isOpen
            ? <span className="badge-open">Abierto</span>
            : <span className="badge-closed">Cerrado</span>
        }
      </div>

      <div className="teams-row">
        <div className="team-side">
          <FlagImg team={match.teamA} size={48} />
          <span className="team-name">{match.teamA}</span>
        </div>
        {match.result
          ? <span className="score-display">{match.result.teamAScore} - {match.result.teamBScore}</span>
          : <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 4px' }}>vs</span>
        }
        <div className="team-side">
          <FlagImg team={match.teamB} size={48} />
          <span className="team-name">{match.teamB}</span>
        </div>
      </div>

      {/* Countdown — solo partidos abiertos que aún no empiezan */}
      {match.isOpen && !match.result && match.date && (
        <div style={{ textAlign: 'center' }}>
          <MatchCountdown date={match.date} />
        </div>
      )}

      {/* Prediction buttons — only if open */}
      {match.isOpen && !match.result && (
        <>
          <div className="pred-row">
            <button
              className={`pred-btn ${localPred === 'teamA' ? 'sel-a' : ''}`}
              onClick={() => setLocalPred('teamA')}
            >
              {match.teamA}
            </button>
            <button
              className={`pred-btn ${localPred === 'draw' ? 'sel-draw' : ''}`}
              onClick={() => setLocalPred('draw')}
            >
              Empate
            </button>
            <button
              className={`pred-btn ${localPred === 'teamB' ? 'sel-b' : ''}`}
              onClick={() => setLocalPred('teamB')}
            >
              {match.teamB}
            </button>
          </div>

          {allowExactScore && localPred && (
            <div className="exact-score-section">
              <div className="exact-score-label">⭐ Marcador exacto +5 pts</div>
              <div className="exact-score-inputs">
                <input
                  className="score-input"
                  type="number"
                  min="0"
                  max="20"
                  value={scoreA}
                  onChange={e => setScoreA(e.target.value)}
                  placeholder="0"
                />
                <span className="score-dash">-</span>
                <input
                  className="score-input"
                  type="number"
                  min="0"
                  max="20"
                  value={scoreB}
                  onChange={e => setScoreB(e.target.value)}
                  placeholder="0"
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                  (opcional)
                </span>
              </div>
            </div>
          )}

          <button
            className="save-btn"
            onClick={savePrediction}
            disabled={!localPred || saving}
          >
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : prediction ? 'Actualizar predicción' : 'Guardar predicción'}
          </button>

          {predTimestamp && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 8, padding: '5px 10px',
              background: wasChanged ? '#fef3c7' : '#f0fdf4',
              borderRadius: 20, alignSelf: 'flex-start',
              border: `1px solid ${wasChanged ? '#fcd34d' : '#86efac'}`,
            }}>
              <span style={{ fontSize: 12 }}>{wasChanged ? '🔄' : '✅'}</span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: wasChanged ? '#92400e' : '#15803d',
              }}>
                {wasChanged ? `Cambiaste tu predicción · ${predTimestamp}` : `Guardado · ${predTimestamp}`}
              </span>
            </div>
          )}
        </>
      )}

      {/* Show existing prediction if closed */}
      {!match.isOpen && prediction && !match.result && (
        <div className="pred-result pending">
          <span>
            Tu predicción: {prediction.result === 'teamA' ? match.teamA : prediction.result === 'teamB' ? match.teamB : 'Empate'}
            {prediction.teamAScore !== undefined && ` · ${prediction.teamAScore}-${prediction.teamBScore}`}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span>Esperando resultado</span>
            {predTimestamp && (
              <span style={{ fontSize: 10, color: wasChanged ? '#92400e' : '#6b7280', fontWeight: 500 }}>
                {wasChanged ? `🔄 Cambiado · ${predTimestamp}` : `✅ ${predTimestamp}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Show result vs prediction */}
      {match.result && prediction && (
        <div className={`pred-result ${pts > 0 ? 'correct' : 'wrong'}`}>
          <span>
            Tu predicción: {prediction.result === 'teamA' ? match.teamA : prediction.result === 'teamB' ? match.teamB : 'Empate'}
            {prediction.teamAScore !== undefined && ` · ${prediction.teamAScore}-${prediction.teamBScore}`}
          </span>
          <span>{pts > 0 ? `+${pts} pts` : '0 pts'}</span>
        </div>
      )}

      {match.result && !prediction && (
        <div className="pred-result wrong">
          <span>No predijiste este partido</span>
          <span>0 pts</span>
        </div>
      )}

      {/* ── Picks comunitarios (solo partidos cerrados o jugados) ── */}
      {!match.isOpen && (
        <CommunityPicks
          match={match}
          userId={userId}
          allUsers={allUsers}
          show={showPicks}
          onToggle={() => setShowPicks(v => !v)}
          preds={matchPreds}
          setPreds={setMatchPreds}
          loading={picksLoading}
          setLoading={setPicksLoading}
        />
      )}
    </div>
  );
};

const PaymentGate = () => (
  <div className="page" style={{ textAlign: 'center', paddingTop: 40 }}>
    <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: 'var(--navy)', letterSpacing: '0.04em', marginBottom: 10 }}>
      Acceso Pendiente
    </div>
    <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 24px' }}>
      Tu cuenta aún no ha sido activada. Una vez confirmado tu pago de inscripción, el administrador activará tu acceso.
    </div>
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12,
      padding: '16px 20px', background: '#f8fafc',
      maxWidth: 280, margin: '0 auto',
      fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>¿Ya pagaste?</div>
      Contacta al administrador por WhatsApp para que active tu cuenta.
    </div>
  </div>
);

const MatchesPage = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [userPoints, setUserPoints] = useState({ total: 0, correct: 0, exact: 0 });
  const [userPredictions, setUserPredictions] = useState([]); // todas las predicciones del usuario — 1 sola query
  const [allUsers, setAllUsers]               = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error('Error cargando partidos:', err);
      setError('Error al cargar los partidos. Recarga la página.');
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const d = snap.data();
        setUserPoints({
          total: d.totalPoints || 0,
          correct: d.correctResults || 0,
          exact: d.exactScores || 0,
        });
      }
    });
    return unsub;
  }, [user]);

  // UNA sola query para todas las predicciones del usuario (reemplaza 78 getDoc individuales)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'predictions'), where('userId', '==', user.uid));
    return onSnapshot(q, snap => {
      setUserPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // Cargar todos los usuarios (para picks comunitarios)
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
    return onSnapshot(q, snap => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filtered = matches.filter(m => {
    if (filter === 'open') return m.isOpen && !m.result;
    if (filter === 'closed') return !m.isOpen && !m.result;
    if (filter === 'played') return !!m.result;
    return true;
  });

  // Group by phase
  const grouped = filtered.reduce((acc, m) => {
    const key = m.phase;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  if (error) return (
    <div className="page">
      <div style={{ textAlign: 'center', padding: 40, color: '#991b1b' }}>{error}</div>
    </div>
  );

  // Payment gate — admins always have access
  if (!isAdmin && userProfile && userProfile.isPaid !== true) return <PaymentGate />;

  return (
    <div className="page">
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-box-num">{userPoints.total}</div>
          <div className="stat-box-label">Mis puntos</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num">{userPoints.correct}</div>
          <div className="stat-box-label">Aciertos</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num">{userPoints.exact}</div>
          <div className="stat-box-label">Exactos</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all',      label: 'Todos' },
          { key: 'open',     label: 'Abiertos' },
          { key: 'closed',   label: 'Por jugar' },
          { key: 'played',   label: 'Jugados' },
          { key: 'mispicks', label: '🧾 Mis Picks' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: filter === f.key ? 'var(--navy)' : 'var(--bg)',
              color: filter === f.key ? '#fff' : 'var(--text-mid)',
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Vista "Mis Picks" — reutiliza userPredictions, sin query extra */}
      {filter === 'mispicks' && (
        <>
          {userPredictions.length === 0 && (
            <div className="text-center text-muted" style={{ marginTop: 40 }}>
              Aún no has guardado ninguna predicción
            </div>
          )}
          {userPredictions.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>
                {userPredictions.length} predicción{userPredictions.length !== 1 ? 'es' : ''} guardada{userPredictions.length !== 1 ? 's' : ''}
              </div>
              {userPredictions
                .map(pred => ({ pred, match: matches.find(m => m.id === pred.matchId) }))
                .filter(({ match }) => !!match)
                .sort((a, b) => (a.match.date > b.match.date ? 1 : -1))
                .map(({ pred, match }) => (
                  <MyPickCard key={pred.id} pred={pred} match={match} />
                ))
              }
            </>
          )}
        </>
      )}

      {/* Vista normal de partidos */}
      {filter !== 'mispicks' && (
        <>
          {loading && <div className="page-loading"><div className="spinner" /></div>}
          {!loading && Object.keys(grouped).length === 0 && (
            <div className="text-center text-muted" style={{ marginTop: 40 }}>
              No hay partidos disponibles aún
            </div>
          )}
          {Object.entries(grouped).map(([phase, phaseMatches]) => (
            <div key={phase}>
              <div className="section-label">{PHASE_LABELS[phase] || phase}</div>
              {phaseMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  userId={user?.uid}
                  allUsers={allUsers}
                  userPrediction={userPredictions.find(p => p.matchId === match.id) || null}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default MatchesPage;
