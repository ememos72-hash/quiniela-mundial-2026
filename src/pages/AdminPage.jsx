import { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, setDoc, doc, onSnapshot,
  query, where, orderBy, serverTimestamp, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PHASES, PHASE_LABELS, FLAGS, GROUPS } from '../data/worldCupData';
import { calculatePredictionPoints } from '../utils/points';

// --- Helper: recalcular puntos de usuarios afectados por un partido ---
const recalcularPuntos = async (matchId, matchConResultado) => {
  // 1. Obtener predicciones de este partido
  const predsPartidoSnap = await getDocs(
    query(collection(db, 'predictions'), where('matchId', '==', matchId))
  );
  const predsPartido = predsPartidoSnap.docs;
  if (predsPartido.length === 0) return;

  // 2. Actualizar pointsAwarded para predicciones de este partido
  const batch = writeBatch(db);
  for (const predDoc of predsPartido) {
    const pts = calculatePredictionPoints(predDoc.data(), matchConResultado);
    batch.update(predDoc.ref, { pointsAwarded: pts });
  }
  await batch.commit();

  // 3. Recalcular totales de cada usuario afectado desde cero
  const usuariosAfectados = [...new Set(predsPartido.map(d => d.data().userId))];
  // Obtener todos los partidos con resultado para recalcular correctamente
  const todosPartidosSnap = await getDocs(
    query(collection(db, 'matches'))
  );
  const partidos = {};
  todosPartidosSnap.docs.forEach(d => { partidos[d.id] = { id: d.id, ...d.data() }; });

  for (const userId of usuariosAfectados) {
    const predsUsuarioSnap = await getDocs(
      query(collection(db, 'predictions'), where('userId', '==', userId))
    );
    let total = 0, correct = 0, exact = 0;
    for (const up of predsUsuarioSnap.docs) {
      const pred = up.data();
      const matchDelPred = pred.matchId === matchId
        ? matchConResultado
        : partidos[pred.matchId];
      // Recalcular en vivo si hay resultado, si no usar lo guardado
      const awarded = matchDelPred?.result
        ? calculatePredictionPoints(pred, matchDelPred)
        : (pred.pointsAwarded || 0);
      total += awarded;
      if (awarded >= 3) correct++;
      if (awarded >= 5) exact++;
    }
    await setDoc(doc(db, 'users', userId), {
      totalPoints: total,
      correctResults: correct,
      exactScores: exact,
    }, { merge: true });
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
        await setDoc(doc(db, 'users', userId), { totalPoints: total, correctResults: correct, exactScores: exact }, { merge: true });
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

// --- Flash Manager (list + create) ---
const AddFlashForm = ({ matches }) => {
  const [flashes, setFlashes] = useState([]);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', description: '' });
  const [mode, setMode] = useState('dateRange'); // 'dateRange' | 'matches'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'flashes'), orderBy('startDate', 'desc'));
    return onSnapshot(q, snap => setFlashes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const toggleMatch = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!form.name) return;
    if (mode === 'dateRange' && (!form.startDate || !form.endDate)) return;
    if (mode === 'matches' && selectedIds.size === 0) return;
    setSaving(true);
    try {
      let data = { name: form.name, description: form.description, mode, createdAt: serverTimestamp() };
      if (mode === 'dateRange') {
        data.startDate = form.startDate;
        data.endDate   = form.endDate;
        data.matchIds  = [];
      } else {
        // Auto-compute startDate / endDate from selected matches for display purposes
        const sel = matches.filter(m => selectedIds.has(m.id));
        const dates = sel.map(m => m.date).sort();
        data.startDate = dates[0];
        data.endDate   = dates[dates.length - 1];
        data.matchIds  = [...selectedIds];
      }
      await addDoc(collection(db, 'flashes'), data);
      setForm({ name: '', startDate: '', endDate: '', description: '' });
      setSelectedIds(new Set());
      setMsg('✓ Quiniela flash creada');
    } finally {
      setSaving(false);
    }
  };

  const deleteFlash = async (f) => {
    if (!window.confirm(`¿Eliminar "${f.name}"?`)) return;
    await deleteDoc(doc(db, 'flashes', f.id));
  };

  const fmtDate = (s) => {
    try { return s.slice(0, 10); } catch { return s; }
  };

  // Group matches by date for the picker
  const matchesByDate = matches.reduce((acc, m) => {
    const day = m.date ? m.date.slice(0, 10) : 'Sin fecha';
    if (!acc[day]) acc[day] = [];
    acc[day].push(m);
    return acc;
  }, {});

  const canSave = form.name &&
    (mode === 'dateRange' ? (form.startDate && form.endDate) : selectedIds.size > 0);

  return (
    <div>
      {/* Existing flashes */}
      {flashes.length > 0 && (
        <div className="admin-section" style={{ marginBottom: 16 }}>
          <div className="admin-section-title">⚡ Quinielas Flash existentes</div>
          {flashes.map(f => (
            <div key={f.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {f.mode === 'matches'
                    ? `${f.matchIds?.length || 0} partidos seleccionados`
                    : `${fmtDate(f.startDate)} — ${fmtDate(f.endDate)}`}
                </div>
              </div>
              <button
                onClick={() => deleteFlash(f)}
                style={{ fontSize: 14, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#991b1b' }}
                title="Eliminar flash"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create new */}
      <div className="admin-section">
        <div className="admin-section-title">➕ Nueva Quiniela Flash</div>

        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Flash Cuartos de Final" />
        </div>
        <div className="form-group">
          <label className="form-label">Descripcion (opcional)</label>
          <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Partidos del 11 al 27 de junio" />
        </div>

        {/* Mode toggle */}
        <div className="form-group">
          <label className="form-label">Tipo de flash</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'dateRange', label: '📅 Por fechas' },
              { key: 'matches',   label: '⚽ Partidos específicos' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setMode(opt.key)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${mode === opt.key ? 'var(--navy)' : 'var(--border)'}`,
                  background: mode === opt.key ? 'var(--navy)' : '#f8fafc',
                  color: mode === opt.key ? '#fff' : 'var(--text-mid)',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range fields */}
        {mode === 'dateRange' && (
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
        )}

        {/* Match picker */}
        {mode === 'matches' && (
          <div className="form-group">
            <label className="form-label">
              Seleccionar partidos
              {selectedIds.size > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--navy)', fontWeight: 600 }}>
                  ({selectedIds.size} seleccionados)
                </span>
              )}
            </label>
            {matches.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                No hay partidos cargados aun.
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                {Object.entries(matchesByDate).map(([day, dayMatches]) => (
                  <div key={day}>
                    <div style={{
                      padding: '6px 12px', background: '#f1f5f9',
                      fontSize: 11, fontWeight: 700, color: 'var(--text-mid)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      position: 'sticky', top: 0,
                    }}>
                      {day}
                    </div>
                    {dayMatches.map(m => (
                      <label key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background: selectedIds.has(m.id) ? '#eff6ff' : '#fff',
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleMatch(m.id)}
                          style={{ accentColor: 'var(--navy)', width: 16, height: 16, flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--navy)', fontWeight: selectedIds.has(m.id) ? 600 : 400 }}>
                          {m.teamA} vs {m.teamB}
                        </span>
                        {m.result && (
                          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                            {m.result.teamAScore}-{m.result.teamBScore}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {msg && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8, fontWeight: 500 }}>{msg}</div>}
        <button className="primary-btn" onClick={save} disabled={saving || !canSave}>
          {saving ? 'Creando...' : 'Crear Quiniela Flash'}
        </button>
      </div>
    </div>
  );
};

// --- Slide editor (one card per slide) ---
const emptySlide = () => ({ title: '', body: '', imageUrl: '', linkUrl: '', linkLabel: '' });

const SlideEditor = ({ slide, index, total, onChange, onDelete }) => {
  const [open, setOpen] = useState(index === 0);
  const upd = (field, val) => onChange({ ...slide, [field]: val });

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', cursor: 'pointer',
          background: open ? 'var(--navy)' : '#f8fafc',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: open ? '#fff' : 'var(--navy)' }}>
          Anuncio {index + 1}{slide.title ? ` — ${slide.title.slice(0, 28)}${slide.title.length > 28 ? '...' : ''}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {total > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: '#fee2e2', border: 'none', borderRadius: 20, padding: '2px 8px', cursor: 'pointer', fontSize: 13, color: '#991b1b' }}
            >
              🗑️
            </button>
          )}
          <span style={{ fontSize: 12, color: open ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Fields */}
      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Titulo</label>
            <input className="form-input" value={slide.title} onChange={e => upd('title', e.target.value)} placeholder="Ej: Tenemos patrocinador!" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mensaje</label>
            <textarea
              className="form-input"
              value={slide.body}
              onChange={e => upd('body', e.target.value)}
              placeholder="Ej: Gracias a nuestro patrocinador todos los jugadores reciben un bonus."
              rows={3}
              style={{ resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Imagen (URL, opcional)</label>
            <input className="form-input" value={slide.imageUrl} onChange={e => upd('imageUrl', e.target.value)} placeholder="https://i.imgur.com/ejemplo.jpg" />
            {slide.imageUrl && (
              <img src={slide.imageUrl} alt="Preview"
                style={{ marginTop: 6, width: '100%', borderRadius: 8, maxHeight: 130, objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Link (URL, opcional)</label>
              <input className="form-input" value={slide.linkUrl} onChange={e => upd('linkUrl', e.target.value)} placeholder="https://www.ejemplo.com" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Texto del boton</label>
              <input className="form-input" value={slide.linkLabel} onChange={e => upd('linkLabel', e.target.value)} placeholder="Visitar sitio" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Anuncio / Popup Manager ---
const AnuncioForm = () => {
  const [active, setActive]   = useState(false);
  const [slides, setSlides]   = useState([emptySlide()]);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'popup'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setActive(d.active || false);
        // Support legacy single-slide format
        if (d.slides?.length > 0) {
          setSlides(d.slides);
        } else if (d.title) {
          setSlides([{ title: d.title || '', body: d.body || '', imageUrl: d.imageUrl || '', linkUrl: '', linkLabel: '' }]);
        }
      }
      setLoaded(true);
    });
    return unsub;
  }, []);

  const updateSlide = (i, updated) => setSlides(s => s.map((sl, idx) => idx === i ? updated : sl));
  const deleteSlide = (i) => setSlides(s => s.filter((_, idx) => idx !== i));
  const addSlide    = () => setSlides(s => [...s, emptySlide()]);

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await setDoc(doc(db, 'config', 'popup'), { active, slides, updatedAt: serverTimestamp() });
      setMsg('✓ Guardado');
    } catch (e) {
      setMsg('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="admin-section">
        <div className="admin-section-title">📢 Popup de Anuncio</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Si hay varios anuncios, los jugadores pueden deslizar entre ellos. La imagen es clickable si tiene link.
        </div>

        {/* Active toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          background: active ? 'rgba(21,128,61,0.08)' : '#f8fafc',
          border: `2px solid ${active ? '#15803d' : 'var(--border)'}`,
          borderRadius: 10, marginBottom: 16, cursor: 'pointer',
        }} onClick={() => setActive(a => !a)}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: active ? '#15803d' : 'var(--text-mid)' }}>
              {active ? '🟢 Popup activo' : '⚫ Popup desactivado'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {active ? 'Los jugadores lo ven al entrar' : 'Nadie lo ve ahora'}
            </div>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: active ? '#15803d' : '#cbd5e1', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* Slides */}
        {slides.map((sl, i) => (
          <SlideEditor
            key={i}
            slide={sl}
            index={i}
            total={slides.length}
            onChange={updated => updateSlide(i, updated)}
            onDelete={() => deleteSlide(i)}
          />
        ))}

        <button
          onClick={addSlide}
          style={{
            width: '100%', padding: '9px 0', marginBottom: 14,
            border: '2px dashed var(--border)', borderRadius: 10,
            background: 'transparent', color: 'var(--text-mid)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Agregar otro anuncio
        </button>

        {msg && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8, fontWeight: 500 }}>{msg}</div>}
        <button className="primary-btn" onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

// --- Jugadores Manager ---
const JugadoresTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const togglePaid = async (u) => {
    await setDoc(doc(db, 'users', u.id), { isPaid: !u.isPaid }, { merge: true });
  };

  const unpaidCount = users.filter(u => !u.isPaid).length;

  if (loading) return <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" /></div>;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--navy)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--gold-light)' }}>{users.length}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registrados</div>
        </div>
        <div style={{ flex: 1, background: unpaidCount > 0 ? '#fee2e2' : '#dcfce7', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: unpaidCount > 0 ? '#991b1b' : '#15803d' }}>{unpaidCount}</div>
          <div style={{ fontSize: 11, color: unpaidCount > 0 ? '#991b1b' : '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pendientes</div>
        </div>
        <div style={{ flex: 1, background: '#dcfce7', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#15803d' }}>{users.filter(u => u.isPaid).length}</div>
          <div style={{ fontSize: 11, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activos</div>
        </div>
      </div>

      {/* User list */}
      {users.map(u => (
        <div key={u.id} style={{
          border: '1px solid var(--border)', borderRadius: 10,
          padding: '12px 14px', marginBottom: 8,
          background: u.isPaid ? '#f0fdf4' : '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>
                {u.displayName || 'Sin nombre'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </div>
              {u.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>📱 {u.phone}</span>
                  <a
                    href={`https://wa.me/506${u.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: '#dcfce7', color: '#15803d',
                      textDecoration: 'none', fontWeight: 600,
                    }}
                  >
                    WhatsApp
                  </a>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Registro: {u.createdAt ? u.createdAt.slice(0, 10) : '—'}
              </div>
            </div>

            {/* Paid toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div
                onClick={() => togglePaid(u)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: u.isPaid ? '#15803d' : '#cbd5e1',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  left: u.isPaid ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: 10, color: u.isPaid ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                {u.isPaid ? 'Activo' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>
      ))}

      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 14 }}>
          Aún no hay jugadores registrados.
        </div>
      )}
    </div>
  );
};

// --- Main Admin Page ---
const AdminPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('results');

  useEffect(() => {
    if (!isAdmin) navigate('/inicio');
  }, [isAdmin]);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
    return onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const openMatches = matches.filter(m => !m.result);
  const pendingCount = users.filter(u => !u.isPaid).length;

  const tabs = [
    { key: 'results',  label: 'Resultados' },
    { key: 'add',      label: 'Agregar Partido' },
    { key: 'flash',    label: 'Flash ⚡' },
    { key: 'jugadores', label: pendingCount > 0 ? `Jugadores 🔴${pendingCount}` : 'Jugadores' },
    { key: 'anuncios', label: 'Anuncios 📢' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--surface)' }}>
      <div style={{ background: 'var(--navy)', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={() => navigate('/inicio')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 20 }}>←</button>
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
        {tab === 'flash' && <AddFlashForm matches={matches} />}
        {tab === 'jugadores' && <JugadoresTab />}
        {tab === 'anuncios' && <AnuncioForm />}
      </div>
    </div>
  );
};

export default AdminPage;
