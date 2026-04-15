import { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, where, orderBy, serverTimestamp, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PHASES, PHASE_LABELS, FLAGS, GROUPS } from '../data/worldCupData';
import { calculatePredictionPoints } from '../utils/points';

// --- Helper: recalcular puntos de usuarios afectados por un partido ---
const recalcularPuntos = async (matchId, matchConResultado) => {
  // 1. Obtener predicciones de este partido usando query específico
  const predsPartidoSnap = await getDocs(
    query(collection(db, 'predictions'), where('matchId', '==', matchId))
  );
  const predsPartido = predsPartidoSnap.docs;

  if (predsPartido.length === 0) return;

  // 2. Actualizar pointsAwarded en cada predicción
  const batch = writeBatch(db);
  const puntosNuevos = {};
  for (const predDoc of predsPartido) {
    const pts = calculatePredictionPoints(predDoc.data(), matchConResultado);
    batch.update(predDoc.ref, { pointsAwarded: pts });
    puntosNuevos[predDoc.id] = pts;
  }
  await batch.commit();

  // 3. Recalcular totales de cada usuario afectado
  const usuariosAfectados = [...new Set(predsPartido.map(d => d.data().userId))];
  for (const userId of usuariosAfectados) {
    // Obtener TODAS las predicciones de este usuario
    const predsUsuarioSnap = await getDocs(
      query(collection(db, 'predictions'), where('userId', '==', userId))
    );
    let total = 0, correct = 0, exact = 0;
    for (const up of predsUsuarioSnap.docs) {
      // Usar el valor recién calculado si es de este partido
      const awarded = puntosNuevos[up.id] !== undefined
        ? puntosNuevos[up.id]
        : (up.data().pointsAwarded || 0);
      total += awarded;
      if (awarded >= 3) correct++;
      if (awarded >= 5) exact++;
    }
    await updateDoc(doc(db, 'users', userId), {
      totalPoints: total,
      correctResults: correct,
      exactScores: exact,
    });
  }
};

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
      await updateDoc(doc(db, 'matches', match.id), { result, isOpen: false });
      await recalcularPuntos(match.id, { ...match, result });
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
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
          <button
            onClick={async () => {
              if (window.confirm(`¿Eliminar el partido ${match.teamA} vs ${match.teamB}? Esta acción no se puede deshacer.`)) {
                await deleteDoc(doc(db, 'matches', match.id));
              }
            }}
            style={{
              fontSize: 14, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', border: 'none',
              background: '#fee2e2', color: '#991b1b', fontFamily: "'DM Sans', sans-serif",
            }}
            title="Eliminar partido"
          >
            🗑️
          </button>
        </div>
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

// --- Completed Match Row (with edit) ---
const CompletedMatchRow = ({ match }) => {
  const [editing, setEditing] = useState(false);
  const [scoreA, setScoreA] = useState(match.result?.teamAScore ?? '');
  const [scoreB, setScoreB] = useState(match.result?.teamBScore ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const getWinner = (a, b) => {
    if (a > b) return 'teamA';
    if (b > a) return 'teamB';
    return 'draw';
  };

  const saveEdit = async () => {
    if (scoreA === '' || scoreB === '') return;
    setSaving(true);
    setMsg('');
    try {
      const a = parseInt(scoreA);
      const b = parseInt(scoreB);
      const result = { teamAScore: a, teamBScore: b, winner: getWinner(a, b) };
      await updateDoc(doc(db, 'matches', match.id), { result });
      await recalcularPuntos(match.id, { ...match, result });
      setMsg('✓ Marcador corregido y puntos recalculados');
      setEditing(false);
    } catch (e) {
      setMsg('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMatch = async () => {
    if (!window.confirm(`¿Eliminar ${match.teamA} vs ${match.teamB}? Se quitarán los puntos ganados a todos los jugadores.`)) return;
    try {
      // Get all predictions for this match
      const predsSnap = await getDocs(query(collection(db, 'predictions')));
      const matchPreds = predsSnap.docs.filter(d => d.data().matchId === match.id);
      const batch = writeBatch(db);

      // Delete each prediction and recalculate user totals
      for (const predDoc of matchPreds) {
        batch.delete(predDoc.ref);
      }
      await batch.commit();

      // Recalculate user totals without this match's points
      const affectedUsers = [...new Set(matchPreds.map(d => d.data().userId))];
      const allPreds = predsSnap.docs.filter(d => d.data().matchId !== match.id);
      for (const userId of affectedUsers) {
        const userPreds = allPreds.filter(d => d.data().userId === userId);
        let total = 0, correct = 0, exact = 0;
        for (const up of userPreds) {
          const awarded = up.data().pointsAwarded || 0;
          total += awarded;
          if (awarded >= 3) correct++;
          if (awarded >= 5) exact++;
        }
        await updateDoc(doc(db, 'users', userId), { totalPoints: total, correctResults: correct, exactScores: exact });
      }

      // Delete the match
      await deleteDoc(doc(db, 'matches', match.id));
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  };

  if (!editing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
        <span>{FLAGS[match.teamA] || ''} {match.teamA} vs {FLAGS[match.teamB] || ''} {match.teamB}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--navy)' }}>
            {match.result.teamAScore} - {match.result.teamBScore}
          </span>
          <button
            onClick={() => setEditing(true)}
            style={{ fontSize: 14, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', border: 'none', background: '#e0e7ff', color: '#3730a3' }}
            title="Editar marcador"
          >
            ✏️
          </button>
          <button
            onClick={deleteMatch}
            style={{ fontSize: 14, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#991b1b' }}
            title="Eliminar partido"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e0e7ff', borderRadius: 10, padding: 12, marginBottom: 8, background: '#f8f9ff' }}>
      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>
        ✏️ Corregir: {FLAGS[match.teamA] || ''} {match.teamA} vs {FLAGS[match.teamB] || ''} {match.teamB}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input className="score-input" type="number" min="0" max="20" value={scoreA} onChange={e => setScoreA(e.target.value)} />
        <span className="score-dash">-</span>
        <input className="score-input" type="number" min="0" max="20" value={scoreB} onChange={e => setScoreB(e.target.value)} />
        <button onClick={saveEdit} disabled={saving} style={{ flex: 1, padding: '8px 12px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, cursor: 'pointer' }}>
          {saving ? '...' : 'Guardar'}
        </button>
        <button onClick={() => setEditing(false)} style={{ padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Cancelar
        </button>
      </div>
      {msg && <div style={{ fontSize: 12, color: 'green', marginTop: 6, fontWeight: 500 }}>{msg}</div>}
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
                  <CompletedMatchRow key={m.id} match={m} />
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
