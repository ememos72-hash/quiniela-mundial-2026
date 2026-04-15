import { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PHASES, PHASE_LABELS, FLAGS, GROUPS } from '../data/worldCupData';
import { calculatePredictionPoints } from '../utils/points';

// --- Add Match Form ---
const AddMatchForm = ({ onSaved }) => {
  const phases = Object.entries(PHASE_LABELS);
  const [form, setForm] = useState({
    phase: PHASES.GROUPS,
    group: 'A',
    teamA: '',
    teamB: '',
    date: '',
    venue: '',
    isOpen: true,
  });
  const [saving, setSaving] = useState(false);

  const groupTeams = GROUPS[form.group]?.teams || [];

  const save = async () => {
    if (!form.teamA || !form.teamB || !form.date) return alert('Completa todos los campos requeridos');
    setSaving(true);
    try {
      await addDoc(collection(db, 'matches'), {
        ...form,
        result: null,
        createdAt: serverTimestamp(),
      });
      setForm(f => ({ ...f, teamA: '', teamB: '', date: '', venue: '' }));
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-title">➕ Agregar Partido</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Fase</label>
          <select className="form-input" value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}>
            {phases.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {form.phase === PHASES.GROUPS && (
          <div className="form-group">
            <label className="form-label">Grupo</label>
            <select className="form-input" value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value, teamA: '', teamB: '' }))}>
              {Object.keys(GROUPS).map(g => <option key={g} value={g}>Grupo {g}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Equipo A</label>
          {form.phase === PHASES.GROUPS ? (
            <select className="form-input" value={form.teamA} onChange={e => setForm(f => ({ ...f, teamA: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {groupTeams.map(t => <option key={t} value={t}>{FLAGS[t] || ''} {t}</option>)}
            </select>
          ) : (
            <input className="form-input" value={form.teamA} onChange={e => setForm(f => ({ ...f, teamA: e.target.value }))} placeholder="Ej: Brasil" />
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Equipo B</label>
          {form.phase === PHASES.GROUPS ? (
            <select className="form-input" value={form.teamB} onChange={e => setForm(f => ({ ...f, teamB: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {groupTeams.filter(t => t !== form.teamA).map(t => <option key={t} value={t}>{FLAGS[t] || ''} {t}</option>)}
            </select>
          ) : (
            <input className="form-input" value={form.teamB} onChange={e => setForm(f => ({ ...f, teamB: e.target.value }))} placeholder="Ej: Argentina" />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Fecha y hora</label>
          <input className="form-input" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Sede (opcional)</label>
          <input className="form-input" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Estadio, Ciudad" />
        </div>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isOpen} onChange={e => setForm(f => ({ ...f, isOpen: e.target.checked }))} />
          <span className="form-label" style={{ margin: 0 }}>Abierto para predicciones</span>
        </label>
      </div>

      <button className="primary-btn gold-btn" onClick={save} disabled={saving}>
        {saving ? 'Guardando...' : 'Agregar Partido'}
      </button>
    </div>
  );
};

// --- Match Result Entry ---
const MatchResultEntry = ({ match }) => {
  const [scoreA, setScoreA] = useState(match.result?.teamAScore ?? '');
  const [scoreB, setScoreB] = useState(match.result?.teamBScore ?? '');
  const [isOpen, setIsOpen] = useState(match.isOpen);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const getWinner = (a, b) => {
    if (a > b) return 'teamA';
    if (b > a) return 'teamB';
    return 'draw';
  };

  const saveResult = async () => {
    if (scoreA === '' || scoreB === '') return;
    setSaving(true);
    setMsg('');
    try {
      const a = parseInt(scoreA);
      const b = parseInt(scoreB);
      const result = { teamAScore: a, teamBScore: b, winner: getWinner(a, b) };

      // Update match
      await updateDoc(doc(db, 'matches', match.id), { result, isOpen: false });

      // Recalculate points for all predictions of this match
      const predsSnap = await getDocs(
        query(collection(db, 'predictions'))
      );
      const batch = writeBatch(db);
      const matchWithResult = { ...match, result };

      // Get all predictions for this match
      const matchPreds = predsSnap.docs.filter(d => d.data().matchId === match.id);

      for (const predDoc of matchPreds) {
        const pred = predDoc.data();
        const pts = calculatePredictionPoints(pred, matchWithResult);
        const userRef = doc(db, 'users', pred.userId);

        // We store points per prediction then sum — simplified: just track total
        const prevPts = pred.pointsAwarded || 0;
        const diff = pts - prevPts;

        // Update prediction doc with points
        batch.update(predDoc.ref, { pointsAwarded: pts });

        // Update user totals — increment diff
        if (diff !== 0) {
          const isExact = pts >= 5 && pts > prevPts;
          batch.update(userRef, {
            totalPoints: (await getDocs(collection(db, 'users'))).docs // simplified
              .find(d => d.id === pred.userId)?.data()?.totalPoints || 0,
          });
        }
      }

      // Simpler approach: recalculate all predictions for this match and update users
      for (const predDoc of matchPreds) {
        const pred = predDoc.data();
        const pts = calculatePredictionPoints(pred, matchWithResult);
        const prevPts = pred.pointsAwarded || 0;
        const diff = pts - prevPts;
        if (diff !== 0) {
          batch.update(predDoc.ref, { pointsAwarded: pts });
        }
      }

      await batch.commit();

      // Update user totals by recalculating from all their predictions
      for (const predDoc of matchPreds) {
        const pred = predDoc.data();
        const pts = calculatePredictionPoints(pred, matchWithResult);
        const prevPts = pred.pointsAwarded || 0;
        const diff = pts - prevPts;
        if (diff !== 0) {
          const allUserPreds = predsSnap.docs.filter(d => d.data().userId === pred.userId);
          let total = 0, correct = 0, exact = 0;
          for (const up of allUserPreds) {
            const upData = up.data();
            const awarded = up.id === predDoc.id ? pts : (upData.pointsAwarded || 0);
            total += awarded;
            if (awarded >= 3) correct++;
            if (awarded >= 5) exact++;
          }
          await updateDoc(doc(db, 'users', pred.userId), { totalPoints: total, correctResults: correct, exactScores: exact });
        }
      }

      setMsg('✓ Resultado guardado y puntos actualizados');
    } catch (e) {
      setMsg('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async () => {
    const newVal = !isOpen;
    setIsOpen(newVal);
    await updateDoc(doc(db, 'matches', match.id), { isOpen: newVal });
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>
          {FLAGS[match.teamA] || ''} {match.teamA} vs {FLAGS[match.teamB] || ''} {match.teamB}
        </div>
        <button
          onClick={toggleOpen}
          style={{
            fontSize: 11, padding: '2px 10px', borderRadius: 20, cursor: 'pointer', border: 'none',
            background: isOpen ? 'var(--green-pale)' : '#fee2e2',
            color: isOpen ? '#15803d' : '#991b1b',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isOpen ? 'Abierto' : 'Cerrado'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          className="score-input"
          type="number" min="0" max="20"
          value={scoreA}
          onChange={e => setScoreA(e.target.value)}
          placeholder="0"
        />
        <span className="score-dash">-</span>
        <input
          className="score-input"
          type="number" min="0" max="20"
          value={scoreB}
          onChange={e => setScoreB(e.target.value)}
          placeholder="0"
        />
        <button
          onClick={saveResult}
          disabled={saving || scoreA === '' || scoreB === ''}
          style={{
            flex: 1, padding: '8px 12px',
            background: 'var(--navy)', color: '#fff',
            border: 'none', borderRadius: 8,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
      {msg && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 6, fontWeight: 500 }}>{msg}</div>}
    </div>
  );
};

// --- Add Flash Form ---
const AddFlashForm = () => {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'flashes'), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setForm({ name: '', startDate: '', endDate: '', description: '' });
      setMsg('✓ Quiniela flash creada');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-title">⚡ Nueva Quiniela Flash</div>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Flash Jornada 2" />
      </div>
      <div className="form-group">
        <label className="form-label">Descripción (opcional)</label>
        <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Los 6 partidos del día..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Fecha inicio</label>
          <input className="form-input" type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha fin</label>
          <input className="form-input" type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
        </div>
      </div>
      {msg && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8, fontWeight: 500 }}>{msg}</div>}
      <button className="primary-btn" onClick={save} disabled={saving || !form.name || !form.startDate || !form.endDate}>
        {saving ? 'Creando...' : 'Crear Quiniela Flash'}
      </button>
    </div>
  );
};

// --- Main Admin Page ---
const AdminPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState('results');

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin]);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
    return onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const openMatches = matches.filter(m => !m.result);
  const tabs = [
    { key: 'results', label: 'Resultados' },
    { key: 'add', label: 'Agregar Partido' },
    { key: 'flash', label: 'Flash ⚡' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--surface)' }}>
      <div style={{ background: 'var(--navy)', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 20 }}>←</button>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#fff', letterSpacing: '0.04em' }}>Panel Admin</div>
            <div style={{ fontSize: 11, color: 'var(--gold-light)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>La Quiniela · Mundial 2026</div>
          </div>
          <span className="admin-badge" style={{ marginLeft: 'auto' }}>Admin</span>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`nav-tab ${tab === t.key ? 'active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page">
        {tab === 'results' && (
          <>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--navy)', marginBottom: 12 }}>
              Ingresar Resultados
            </div>
            {openMatches.length === 0 && (
              <div className="text-center text-muted" style={{ marginTop: 20 }}>
                No hay partidos sin resultado aún
              </div>
            )}
            {openMatches.map(m => <MatchResultEntry key={m.id} match={m} />)}

            {matches.filter(m => m.result).length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 16 }}>Ya con resultado</div>
                {matches.filter(m => m.result).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{FLAGS[m.teamA] || ''} {m.teamA} vs {FLAGS[m.teamB] || ''} {m.teamB}</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--navy)' }}>
                      {m.result.teamAScore} - {m.result.teamBScore}
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'add' && <AddMatchForm />}
        {tab === 'flash' && <AddFlashForm />}
      </div>
    </div>
  );
};

export default AdminPage;
