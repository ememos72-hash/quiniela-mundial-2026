import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/points';

const RankingPage = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.04em', color: 'var(--navy)' }}>
          Clasificación General
        </h2>
        <div className="text-muted mt-4">
          Desempate por equipos que avanzaron en Grupos
        </div>
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {!loading && players.length === 0 && (
        <div className="text-center text-muted" style={{ marginTop: 40 }}>
          Aún no hay jugadores registrados
        </div>
      )}

      {players.map((player, i) => {
        const isMe = player.uid === user?.uid;
        return (
          <div
            key={player.id}
            className="rank-item"
            style={isMe ? { background: 'linear-gradient(90deg, #fef3c7 0%, transparent 100%)', borderRadius: 8, padding: '11px 8px', margin: '0 -8px' } : {}}
          >
            <div className={`rank-pos ${posClass(i)}`}>
              {posMedal(i) || (i + 1)}
            </div>
            <div
              className="rank-avatar"
              style={isMe ? { background: 'var(--gold)', color: 'var(--navy)' } : {}}
            >
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
              <div className="rank-sub">
                {player.correctResults || 0} aciertos
                {(player.exactScores || 0) > 0 && ` · ${player.exactScores} exactos`}
                {(player.teamAdvances || 0) > 0 && ` · ${player.teamAdvances} desempate`}
              </div>
            </div>
            <div className="rank-pts-col">
              <div className="rank-pts-num">{player.totalPoints || 0}</div>
              <div className="rank-pts-label">puntos</div>
            </div>
          </div>
        );
      })}

      {players.length > 0 && (
        <div className="text-muted text-center" style={{ marginTop: 20, fontSize: 12 }}>
          {players.length} participante{players.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default RankingPage;
