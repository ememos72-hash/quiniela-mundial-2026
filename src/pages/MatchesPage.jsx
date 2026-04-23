import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, getDoc, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, ADMIN_UID } from '../contexts/AuthContext';
import { FLAGS, COUNTRY_CODES, EXACT_SCORE_PHASES, PHASE_LABELS } from '../data/worldCupData';
import GroupPicksModal from '../components/GroupPicksModal';
import GroupRankingModal from '../components/GroupRankingModal';

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

// Niveles visuales compartidos (Mis Picks + Community)
const TIER_CONFIG = {
  perfect: { bg: '#E3A20A', color: '#fff', icon: '⭐', label: 'Predicción perfecta', ptsLabel: '+8 pts',
             pickBg: '#fffbeb', pickColor: '#E3A20A', pickBorder: '#fcd34d' },
  exact:   { bg: '#1046AE', color: '#fff', icon: '🎯', label: 'Marcador exacto',     ptsLabel: '+5 pts',
             pickBg: '#eff6ff', pickColor: '#1046AE', pickBorder: '#93c5fd' },
  correct: { bg: '#1a6b3c', color: '#fff', icon: '✅', label: 'Resultado correcto',  ptsLabel: '+3 pts',
             pickBg: '#eef6f0', pickColor: '#1a6b3c', pickBorder: '#a3c4b0' },
  wrong:   { bg: '#e2e8f0', color: '#64748b', icon: '✗',  label: 'Incorrecto',       ptsLabel: '0 pts',
             pickBg: '#fef2f2', pickColor: '#991b1b', pickBorder: '#fca5a5' },
};
const getTierConfig = (pts) => {
  if (pts === null || pts === undefined) return null;
  if (pts >= 8) return TIER_CONFIG.perfect;
  if (pts >= 5) return TIER_CONFIG.exact;
  if (pts >= 3) return TIER_CONFIG.correct;
  return TIER_CONFIG.wrong;
};

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

  // Color del pick según nivel de logro
  const tier = match.result ? getTierConfig(pts) : null;
  const pickBg     = tier ? tier.pickBg     : '#f0f9ff';
  const pickColor  = tier ? tier.pickColor  : '#0369a1';
  const pickBorder = tier ? tier.pickBorder : '#bae6fd';

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
          ? <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: '2px 8px' }}>Finalizado</span>
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
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          {/* Izquierda: label + pick */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: pickColor, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 3 }}>
              Tu predicción
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: pickColor }}>
              {pickLabel}
              {pred.teamAScore !== undefined && (
                <span style={{ fontSize: 14, marginLeft: 8, opacity: 0.85 }}>
                  · {pred.teamAScore}-{pred.teamBScore}
                </span>
              )}
            </div>
          </div>

          {/* Derecha: ícono | pts */}
          {match.result && tier && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>{tier.icon}</span>
              {pts > 0 && (
                <>
                  <div style={{ width: 1, height: 28, background: pickBorder, margin: '0 10px' }} />
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 30, color: pickColor, lineHeight: 1,
                  }}>
                    +{pts}
                  </span>
                </>
              )}
            </div>
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
  const allowExact = EXACT_SCORE_PHASES.includes(match.phase);

  const loadPreds = async () => {
    if (preds.length > 0) return;
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'predictions'), where('matchId', '==', match.id)));
    setPreds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handleToggle = () => {
    if (!show) loadPreds();
    onToggle();
  };

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

  const getInits = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const rows = allUsers.map(u => ({
    user: u,
    pred: preds.find(p => p.userId === u.id) || null,
  })).sort((a, b) => {
    if (!a.pred && !b.pred) return 0;
    if (!a.pred) return 1;
    if (!b.pred) return -1;
    if (hasResult) {
      return (getPts(b.pred) ?? 0) - (getPts(a.pred) ?? 0);
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
        {show ? '▲ Ocultar Predicciones' : hasResult
          ? `👥 Ver picks de todos · ${correctCount} acertaron`
          : `📊 Ver Predicciones`}
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

              {/* ── Lista de picks por jugador ── */}
              {allUsers.length > 0 && rows.map(({ user, pred }, rowIdx) => {
                const pts  = pred ? getPts(pred) : null;
                const isMe = user.id === userId;
                const label = pred ? pickLabel(pred.result) : null;
                const tier = (hasResult && pred) ? getTierConfig(pts) : null;

                return (
                  <div key={user.id} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 6px', borderRadius: 8,
                    background: isMe ? '#fefce8' : 'transparent',
                    border: isMe ? '1px solid #fcd34d' : '1px solid transparent',
                    marginBottom: 3,
                  }}>
                    {/* Nombre + pick */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: isMe ? 700 : 500,
                        color: 'var(--navy)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {user.displayName || user.email}
                        {isMe && (
                          <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 10, padding: '1px 5px', fontWeight: 700 }}>
                            TÚ
                          </span>
                        )}
                      </div>
                      {pred ? (
                        <div style={{
                          fontSize: 11, fontWeight: 500,
                          color: hasResult ? (pts > 0 ? '#15803d' : '#94a3b8') : '#0369a1',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {label}{pred.teamAScore !== undefined ? ` (${pred.teamAScore}-${pred.teamBScore})` : ''}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>No predijo</div>
                      )}
                    </div>

                    {/* Badge de nivel */}
                    {tier && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        background: tier.bg, color: tier.color,
                        borderRadius: 20, padding: '4px 8px',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ fontSize: 11 }}>{tier.icon}</span>
                        <span>{tier.label} {tier.ptsLabel}</span>
                      </div>
                    )}
                    {!hasResult && pred && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>— pts</span>
                    )}
                  </div>
                );
              })}

              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
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

const MatchCard = ({ match, userId, allUsers, userPrediction, hideCommunityPicks = false, hideStatus = false }) => {
  const [prediction, setPrediction] = useState(null);
  const [localPred, setLocalPred]   = useState(null);
  const [scoreA, setScoreA]         = useState(null);
  const [scoreB, setScoreB]         = useState(null);
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
    if (userPrediction.teamAScore !== undefined) setScoreA(userPrediction.teamAScore);
    if (userPrediction.teamBScore !== undefined) setScoreB(userPrediction.teamBScore);
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
      if (allowExactScore && scoreA !== null && scoreB !== null) {
        data.teamAScore = scoreA;
        data.teamBScore = scoreB;
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
        {!hideStatus && (match.result
          ? <span className="badge-played">Finalizado</span>
          : match.isOpen
            ? <span className="badge-open">Abierto</span>
            : <span className="badge-closed">Cerrado</span>
        )}
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

          {/* ── Marcador exacto: steppers obligatorios para fases knockout ── */}
          {allowExactScore && (
            <div className="score-stepper-section">
              <div className="score-stepper-header">
                <span className="score-pts-pill">+5 pts</span>
                <span className="score-stepper-title">Marcador exacto</span>
                {(scoreA === null || scoreB === null)
                  ? <span className="score-stepper-required">* obligatorio</span>
                  : <span className="score-stepper-ready">✓ listo</span>
                }
              </div>

              <div className="score-steppers-wrap">
                {/* Equipo A */}
                <div className="score-stepper-col">
                  <span className="score-stepper-team">{match.teamA}</span>
                  <div className="score-stepper-controls">
                    <button className="score-step-btn" onClick={() => {
                      const next = Math.max(0, (scoreA ?? 0) - 1);
                      setScoreA(next);
                      const b = scoreB ?? 0;
                      if (next > b) setLocalPred('teamA');
                      else if (next < b) setLocalPred('teamB');
                      else setLocalPred('draw');
                    }}>−</button>
                    <span className={`score-step-num ${scoreA === null ? 'empty' : ''}`}>
                      {scoreA !== null ? scoreA : '–'}
                    </span>
                    <button className="score-step-btn" onClick={() => {
                      const next = (scoreA ?? 0) + 1;
                      setScoreA(next);
                      const b = scoreB ?? 0;
                      if (next > b) setLocalPred('teamA');
                      else if (next < b) setLocalPred('teamB');
                      else setLocalPred('draw');
                    }}>+</button>
                  </div>
                </div>

                <span className="score-stepper-dash">–</span>

                {/* Equipo B */}
                <div className="score-stepper-col">
                  <span className="score-stepper-team">{match.teamB}</span>
                  <div className="score-stepper-controls">
                    <button className="score-step-btn" onClick={() => {
                      const next = Math.max(0, (scoreB ?? 0) - 1);
                      setScoreB(next);
                      const a = scoreA ?? 0;
                      if (a > next) setLocalPred('teamA');
                      else if (a < next) setLocalPred('teamB');
                      else setLocalPred('draw');
                    }}>−</button>
                    <span className={`score-step-num ${scoreB === null ? 'empty' : ''}`}>
                      {scoreB !== null ? scoreB : '–'}
                    </span>
                    <button className="score-step-btn" onClick={() => {
                      const next = (scoreB ?? 0) + 1;
                      setScoreB(next);
                      const a = scoreA ?? 0;
                      if (a > next) setLocalPred('teamA');
                      else if (a < next) setLocalPred('teamB');
                      else setLocalPred('draw');
                    }}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            className="save-btn"
            onClick={savePrediction}
            disabled={!localPred || saving || (allowExactScore && (scoreA === null || scoreB === null))}
          >
            {saved
              ? '✓ Guardado'
              : saving
                ? 'Guardando...'
                : allowExactScore && (scoreA === null || scoreB === null)
                  ? 'Ingresa el marcador para guardar'
                  : prediction
                    ? (allowExactScore ? 'Actualizar marcador' : 'Actualizar predicción')
                    : (allowExactScore ? 'Guardar marcador' : 'Guardar predicción')
            }
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

      {/* ── Picks comunitarios (abiertos, en vivo y jugados — no en Ver Calendario) ── */}
      {!hideCommunityPicks && (
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

// Acordeón de Mis Picks por fase
const PicksAccordion = ({ picksByPhase, totalPicks }) => {
  const [openPhases, setOpenPhases] = useState({});
  const togglePhase = (phase) => setOpenPhases(prev => ({ ...prev, [phase]: !prev[phase] }));

  return (
    <>

      {Object.entries(picksByPhase).map(([phase, picks]) => {
        const isOpen = openPhases[phase] === true;
        const pts = picks.reduce((sum, { pred, match }) =>
          sum + (match.result ? calculatePredictionPoints(pred, match) : 0), 0);
        const jugados = picks.filter(({ match }) => !!match.result).length;

        return (
          <div key={phase} style={{ marginBottom: 8 }}>
            {/* Cabecera acordeón de fase */}
            <div
              onClick={() => togglePhase(phase)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: isOpen ? '10px 10px 0 0' : 10,
                background: 'var(--navy)', cursor: 'pointer', userSelect: 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {PHASE_LABELS[phase] || phase}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                  {picks.length} predicción{picks.length !== 1 ? 'es' : ''}
                  {jugados > 0 && (
                    <span style={{ marginLeft: 6, color: 'var(--gold-light)', fontWeight: 600 }}>
                      · {pts} pts
                    </span>
                  )}
                </div>
              </div>
              <span style={{ color: 'var(--gold-light)', fontSize: 18 }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Cards de picks */}
            {isOpen && (
              <div style={{
                border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 10px 10px', padding: '10px 10px 4px',
              }}>
                {picks.map(({ pred, match }) => (
                  <MyPickCard key={pred.id} pred={pred} match={match} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
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
  const [filter, setFilter] = useState('open');
  const [openDays, setOpenDays]     = useState({});
  const [openPhases, setOpenPhases] = useState({});

  const toggleDay   = (key) => setOpenDays(prev => ({ ...prev, [key]: !prev[key] }));
  const togglePhase = (key) => setOpenPhases(prev => ({ ...prev, [key]: !prev[key] }));
  const [userPoints, setUserPoints] = useState({ total: 0, correct: 0, exact: 0 });
  const [userPredictions, setUserPredictions] = useState([]); // todas las predicciones del usuario — 1 sola query
  const [allUsers, setAllUsers]               = useState([]);
  const [groupPicksOpen, setGroupPicksOpen]   = useState(false);
  const [showGroupPicks, setShowGroupPicks]   = useState(false);
  const [showGroupRanking, setShowGroupRanking] = useState(false);

  useEffect(() => {
    // ⚡ getDocs (lectura única) — los partidos solo cambian cuando el admin actúa
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
    getDocs(q)
      .then(snap => {
        setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando partidos:', err);
        setError('Error al cargar los partidos. Recarga la página.');
        setLoading(false);
      });
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

  // Cargar todos los usuarios (para picks comunitarios) — lectura única
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
    getDocs(q).then(snap => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.id !== ADMIN_UID));
    });
  }, []);

  // Config: pronóstico de grupos abierto
  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'groupPicks'), snap => {
      setGroupPicksOpen(snap.exists() ? (snap.data().groupPicksOpen === true) : false);
    });
  }, []);

  const filtered = matches.filter(m => {
    if (filter === 'open') return m.isOpen && !m.result;
    if (filter === 'live') return !m.isOpen && !m.result && userPredictions.some(p => p.matchId === m.id);
    if (filter === 'played') return !!m.result;
    return true;
  });

  // Agrupar por fase → por fecha
  const PHASE_ORDER = ['groups', 'round_of_32', 'round_of_16', 'quarters', 'semis', 'third_place', 'final'];

  const groupedByPhase = PHASE_ORDER.reduce((acc, phase) => {
    const phaseMatches = filtered.filter(m => m.phase === phase);
    if (phaseMatches.length === 0) return acc;
    const byDate = phaseMatches.reduce((dAcc, m) => {
      const day = m.date ? m.date.slice(0, 10) : 'Sin fecha';
      if (!dAcc[day]) dAcc[day] = [];
      dAcc[day].push(m);
      return dAcc;
    }, {});
    acc[phase] = byDate;
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
          <div className="stat-box-label">Puntaje Total</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num">{userPoints.correct}</div>
          <div className="stat-box-label">Aciertos de 3pts</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num">{userPoints.exact}</div>
          <div className="stat-box-label">Aciertos de 5pts</div>
        </div>
      </div>


      {/* Fila 1: segmented control — Abiertos / En Vivo / Jugados */}
      <div style={{
        display: 'flex', width: '100%',
        background: '#f1f5f9', borderRadius: 14,
        padding: 4, marginBottom: 7, gap: 0,
      }}>
        {[
          { key: 'open',   label: 'Abiertos', icon: '⏰' },
          { key: 'live',   label: 'En Vivo',   icon: '🔴' },
          { key: 'played', label: 'Jugados',   icon: '✅' },
        ].map((f, i, arr) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setOpenDays({}); setOpenPhases({}); }}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 10,
              border: 'none',
              background: filter === f.key ? 'var(--navy)' : 'transparent',
              color: filter === f.key ? '#fff' : 'var(--text-mid)',
              fontSize: 12, fontWeight: filter === f.key ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'background 0.15s',
              boxShadow: filter === f.key ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
            }}
          >
            <span style={{ fontSize: 13 }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Fila 2: Ver Calendario + Mis Predicciones */}
      <div style={{ display: 'flex', width: '100%', gap: 8, marginBottom: 7 }}>
        {[
          { key: 'all',      label: 'Ver Calendario',    icon: '📆' },
          { key: 'mispicks', label: 'Mis Predicciones',  icon: '🧾' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setOpenDays({}); setOpenPhases({}); }}
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: 12,
              border: `1.5px solid ${filter === f.key ? 'var(--navy)' : 'var(--border)'}`,
              background: filter === f.key ? 'var(--navy)' : '#fff',
              color: filter === f.key ? '#fff' : 'var(--text-mid)',
              fontSize: 12, fontWeight: filter === f.key ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 7 }} />

      {/* Vista "Mis Picks" — acordeón por fase */}
      {filter === 'mispicks' && (() => {
        const validPicks = userPredictions
          .map(pred => ({ pred, match: matches.find(m => m.id === pred.matchId) }))
          .filter(({ match }) => !!match)
          .sort((a, b) => (a.match.date > b.match.date ? 1 : -1));

        if (validPicks.length === 0) return (
          <div className="text-center text-muted" style={{ marginTop: 40 }}>
            Aún no has guardado ninguna predicción
          </div>
        );

        const PHASE_ORDER = ['groups', 'round_of_32', 'round_of_16', 'quarters', 'semis', 'third_place', 'final'];
        const picksByPhase = PHASE_ORDER.reduce((acc, phase) => {
          const picks = validPicks.filter(({ match }) => match.phase === phase);
          if (picks.length > 0) acc[phase] = picks;
          return acc;
        }, {});

        return (
          <PicksAccordion
            picksByPhase={picksByPhase}
            totalPicks={validPicks.length}
          />
        );
      })()}

      {/* Vista En Vivo — lista plana, solo partidos cerrados con predicción del jugador */}
      {filter === 'live' && !loading && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center text-muted" style={{ marginTop: 40 }}>
              No hay partidos jugándose en este momento
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered
                .sort((a, b) => (a.date > b.date ? 1 : -1))
                .map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    userId={user?.uid}
                    allUsers={allUsers}
                    userPrediction={userPredictions.find(p => p.matchId === match.id) || null}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {/* Vista normal de partidos — por fase → acordeón por fecha */}
      {filter !== 'mispicks' && filter !== 'live' && (
        <>
          {loading && <div className="page-loading"><div className="spinner" /></div>}
          {!loading && Object.keys(groupedByPhase).length === 0 && (
            <div className="text-center text-muted" style={{ marginTop: 40 }}>
              No hay partidos disponibles aún
            </div>
          )}
          {!loading && Object.entries(groupedByPhase).map(([phase, byDate]) => {
            const phaseOpen = openPhases[phase] === true;
            const totalMatches = Object.values(byDate).flat().length;
            const fmtDay = (d) => {
              try {
                return new Date(d + 'T12:00:00').toLocaleDateString('es-CR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                });
              } catch { return d; }
            };

            return (
              <div key={phase} style={{ marginBottom: 8 }}>
                {/* Cabecera de fase — acordeón */}
                <div
                  onClick={() => togglePhase(phase)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: phaseOpen ? '10px 10px 0 0' : 10,
                    background: 'var(--navy)', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                      {PHASE_LABELS[phase] || phase}
                    </span>
                    <span style={{ fontSize: 11, marginLeft: 8, color: 'rgba(255,255,255,0.5)' }}>
                      {totalMatches} partido{totalMatches !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={{ color: 'var(--gold-light)', fontSize: 18 }}>
                    {phaseOpen ? '▲' : '▼'}
                  </span>
                </div>

                {/* Fechas dentro de la fase */}
                {phaseOpen && (
                  <div style={{
                    border: '1px solid var(--border)', borderTop: 'none',
                    borderRadius: '0 0 10px 10px', padding: '8px 8px 4px',
                  }}>
                    {Object.entries(byDate).map(([day, dayMatches]) => {
                      const key = `${phase}_${day}`;
                      const dayOpen = openDays[key] === true;
                      return (
                        <div key={key} style={{ marginBottom: 6 }}>
                          {/* Cabecera del día */}
                          <div
                            onClick={() => toggleDay(key)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: dayOpen ? '#1e3a5f' : '#f1f5f9',
                              borderRadius: dayOpen ? '8px 8px 0 0' : 8,
                              cursor: 'pointer', userSelect: 'none',
                            }}
                          >
                            <div>
                              <span style={{
                                fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                                color: dayOpen ? '#fff' : 'var(--navy)',
                              }}>
                                {fmtDay(day)}
                              </span>
                              <span style={{
                                fontSize: 11, marginLeft: 8,
                                color: dayOpen ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)',
                              }}>
                                {dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: dayOpen ? 'var(--gold-light)' : 'var(--text-muted)' }}>
                              {dayOpen ? '▲' : '▼'}
                            </span>
                          </div>

                          {/* Partidos del día */}
                          {dayOpen && (
                            <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '8px 0 4px' }}>
                              {dayMatches.map(match => (
                                <MatchCard
                                  key={match.id}
                                  match={match}
                                  userId={user?.uid}
                                  allUsers={allUsers}
                                  userPrediction={userPredictions.find(p => p.matchId === match.id) || null}
                                  hideCommunityPicks={filter === 'all'}
                                  hideStatus={filter === 'all'}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default MatchesPage;
