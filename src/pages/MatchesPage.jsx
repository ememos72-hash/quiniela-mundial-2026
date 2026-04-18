import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, getDoc
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

const MatchCard = ({ match, userId }) => {
  const [prediction, setPrediction] = useState(null);
  const [localPred, setLocalPred] = useState(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const allowExactScore = EXACT_SCORE_PHASES.includes(match.phase);

  useEffect(() => {
    if (!userId || !match.id) return;
    const ref = doc(db, 'predictions', `${userId}_${match.id}`);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setPrediction(data);
        setLocalPred(data.result);
        if (data.teamAScore !== undefined) setScoreA(String(data.teamAScore));
        if (data.teamBScore !== undefined) setScoreB(String(data.teamBScore));
      }
    });
  }, [userId, match.id]);

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
          { key: 'all', label: 'Todos' },
          { key: 'open', label: 'Abiertos' },
          { key: 'closed', label: 'Por jugar' },
          { key: 'played', label: 'Jugados' },
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
            <MatchCard key={match.id} match={match} userId={user?.uid} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MatchesPage;
