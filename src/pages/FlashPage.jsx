import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Helpers ──────────────────────────────────────────────────────────────────

const dateRange = (f) => {
  try {
    return `${format(parseISO(f.startDate), "d 'de' MMM", { locale: es })} — ${format(parseISO(f.endDate), "d 'de' MMM yyyy", { locale: es })}`;
  } catch { return ''; }
};

// Calculate flash ranking from Firestore data
const calcRanking = async (flash, matches) => {
  let flashMatchIds;

  if (flash.mode === 'matches' && flash.matchIds?.length > 0) {
    // Mode: specific matches hand-picked by admin
    flashMatchIds = new Set(flash.matchIds);
  } else {
    // Mode: date range (default / legacy)
    const flashStart = new Date(flash.startDate);
    const flashEnd   = new Date(flash.endDate);
    flashMatchIds = new Set(
      matches
        .filter(m => {
          const d = new Date(m.date);
          return d >= flashStart && d <= flashEnd;
        })
        .map(m => m.id)
    );
  }

  if (flashMatchIds.size === 0) return { ranking: [], matchCount: 0 };

  // Load all predictions and users in parallel
  const [predsSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'predictions')),
    getDocs(collection(db, 'users')),
  ]);

  const usersMap = {};
  usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });

  // Sum points per user for flash matches only
  const byUser = {};
  predsSnap.docs.forEach(d => {
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

// ── Ranking table ─────────────────────────────────────────────────────────────

const RankingTable = ({ ranking, loading }) => {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div className="spinner" />
    </div>
  );

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
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>
            {medals[i] || `${i + 1}`}
          </span>
          <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: i === 0 ? 600 : 400 }}>
            {u.name}
          </span>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20, color: 'var(--gold-light)',
          }}>
            {u.points} pts
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', minWidth: 40, textAlign: 'right' }}>
            {u.correct} ac.
          </span>
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
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: 'var(--navy)' }}>
              {flash.name}
            </div>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: badgeBg, color: badgeColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {badgeLabel}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {dateRange(flash)}
            {matchCount !== null && ` · ${matchCount} partidos`}
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
        >
          {showRanking ? 'Cerrar' : 'Ver ranking'}
        </button>
      </div>

      {showRanking && (
        <div style={{ padding: '0 14px 14px' }}>
          {rankLoading ? (
            <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" /></div>
          ) : ranking.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
              Sin predicciones en este periodo.
            </div>
          ) : (
            <>
              {/* Winner highlight */}
              {winner && (
                <div style={{
                  background: 'var(--navy)', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 22 }}>🏆</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ganador</div>
                    <div style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: 15 }}>{winner.name}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold-light)' }}>
                    {winner.points} pts
                  </div>
                </div>
              )}
              {/* Full table */}
              {ranking.map((u, i) => (
                <div key={u.uid} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>
                    {['🥇','🥈','🥉'][i] || `${i+1}`}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--navy)', fontWeight: i === 0 ? 600 : 400 }}>
                    {u.name}
                  </span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: 'var(--navy)' }}>
                    {u.points} pts
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>
                    {u.correct} ac.
                  </span>
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
    return onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const now = new Date();
  const active   = flashes.filter(f => isBefore(parseISO(f.startDate), now) && isAfter(parseISO(f.endDate), now));
  const upcoming = flashes.filter(f => isAfter(parseISO(f.startDate), now));
  const past     = flashes.filter(f => isBefore(parseISO(f.endDate), now));

  return (
    <div className="page">
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 28, letterSpacing: '0.04em',
        color: 'var(--navy)', marginBottom: 16,
      }}>
        Quiniela Flash ⚡
      </h2>

      {/* ── ¿Qué es la Quiniela Flash? ── */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
            La <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>Quiniela Flash</span> se desarrolla durante un período específico definido por el administrador (por ejemplo, una jornada completa).{' '}
            Se aplican las mismas reglas de puntuación.{' '}
            Al finalizar el período, se definirá uno o varios ganadores para esa etapa.
          </div>
        </div>
        <div style={{ fontSize: 48, opacity: 0.2, flexShrink: 0, lineHeight: 1, transform: 'rotate(15deg)' }}>
          ⚽
        </div>
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {/* Active */}
      {active.map(f => (
        <ActiveFlashCard key={f.id} flash={f} matches={matches} />
      ))}

      {active.length === 0 && !loading && (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
          padding: 24, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-muted)' }}>
            Sin quiniela flash activa
          </div>
          <div className="text-muted mt-4" style={{ fontSize: 13 }}>El admin activara una pronto</div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="section-label">Proximas</div>
          {upcoming.map(f => (
            <PastFlashCard key={f.id} flash={f} matches={matches} badgeLabel="Proxima" badgeColor="#0369a1" badgeBg="#e0f2fe" />
          ))}
        </>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <div className="section-label">Historial</div>
          {past.map(f => (
            <PastFlashCard key={f.id} flash={f} matches={matches} />
          ))}
        </>
      )}
    </div>
  );
};

export default FlashPage;
