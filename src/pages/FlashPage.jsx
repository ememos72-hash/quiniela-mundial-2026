import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

const FlashPage = () => {
  const [flashes, setFlashes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'flashes'), orderBy('startDate', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setFlashes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const now = new Date();

  const active = flashes.filter(f => {
    const start = parseISO(f.startDate);
    const end = parseISO(f.endDate);
    return isBefore(start, now) && isAfter(end, now);
  });

  const upcoming = flashes.filter(f => isAfter(parseISO(f.startDate), now));
  const past = flashes.filter(f => isBefore(parseISO(f.endDate), now));

  const dateRange = (f) =>
    `${format(parseISO(f.startDate), "d 'de' MMM", { locale: es })} — ${format(parseISO(f.endDate), "d 'de' MMM yyyy", { locale: es })}`;

  return (
    <div className="page">
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.04em', color: 'var(--navy)', marginBottom: 16 }}>
        Quiniela Flash ⚡
      </h2>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {/* Active flash */}
      {active.map(f => (
        <div key={f.id} className="flash-hero">
          <div className="flash-hero-header">
            <div className="flash-bolt">⚡</div>
            <div>
              <div className="flash-hero-title">{f.name}</div>
              <div className="flash-hero-dates">{dateRange(f)}</div>
            </div>
          </div>
          <div className="flash-hero-desc">{f.description || 'Mismas reglas de puntos. Ganador de la jornada.'}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Partidos</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold-light)' }}>{f.matchCount || '—'}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Participantes</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold-light)' }}>{f.participants || '—'}</div>
            </div>
          </div>
        </div>
      ))}

      {active.length === 0 && !loading && (
        <div style={{
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius)',
          padding: 24,
          textAlign: 'center',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-muted)' }}>
            Sin quiniela flash activa
          </div>
          <div className="text-muted mt-4">El admin activará una pronto</div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="section-label">Próximas</div>
          {upcoming.map(f => (
            <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--navy)' }}>{f.name}</div>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{dateRange(f)}</div>
                </div>
                <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                  Próxima
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <div className="section-label">Historial</div>
          {past.map(f => (
            <div key={f.id} className="flash-history-card">
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: 'var(--navy)' }}>{f.name}</div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{dateRange(f)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {f.winner && (
                  <>
                    <div className="flash-winner-badge">🏆 {f.winner}</div>
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 3 }}>{f.winnerPoints} pts</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default FlashPage;
