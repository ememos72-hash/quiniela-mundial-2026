import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TYPE_CONFIG = {
  news:  { label: 'Noticia',            icon: '📢', color: '#0369a1', bg: '#e0f2fe' },
  flash: { label: 'Quiniela Flash',     icon: '⚡', color: '#b45309', bg: '#fef3c7' },
  prize: { label: 'Premio / Sorpresa',  icon: '🎁', color: '#7c3aed', bg: '#ede9fe' },
  result:{ label: 'Resultado',          icon: '⚽', color: '#15803d', bg: '#dcfce7' },
};

const TableroPage = () => {
  const { isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ type: 'news', title: '', content: '', imageUrl: '' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const savePost = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'posts'), { ...form, createdAt: serverTimestamp() });
      setForm({ type: 'news', title: '', content: '', imageUrl: '' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id) => {
    if (window.confirm('¿Eliminar este anuncio?')) {
      await deleteDoc(doc(db, 'posts', id));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page">

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 28, letterSpacing: '0.04em',
          color: 'var(--navy)', margin: 0,
        }}>
          Tablero
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '6px 14px',
              background: showForm ? '#f1f5f9' : 'var(--gold)',
              color: showForm ? 'var(--text-mid)' : 'var(--navy)',
              border: 'none', borderRadius: 20,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancelar' : '+ Anuncio'}
          </button>
        )}
      </div>

      {/* Admin post form */}
      {isAdmin && showForm && (
        <div style={{
          border: '2px solid var(--gold)', borderRadius: 'var(--radius)',
          padding: 14, marginBottom: 16, background: '#fffbeb',
        }}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setForm(f => ({ ...f, type: k }))}
                style={{
                  padding: '4px 10px', borderRadius: 20,
                  border: '1px solid ' + v.color,
                  background: form.type === k ? v.bg : 'white',
                  color: v.color, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: form.type === k ? 600 : 400,
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              placeholder="Ej: ¡Resultados Jornada 3!"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contenido *</label>
            <textarea
              className="form-input"
              placeholder="Escribe el mensaje aquí..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL de imagen (opcional)</label>
            <input
              className="form-input"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="preview"
                style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
          </div>

          <button
            className="primary-btn gold-btn"
            onClick={savePost}
            disabled={saving || !form.title || !form.content}
          >
            {saving ? 'Publicando...' : 'Publicar anuncio'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-muted)', marginBottom: 20,
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18 }}>
            Sin anuncios aún
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            El admin publicará noticias y novedades aquí
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.map(post => {
        const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.news;
        const date = post.createdAt?.toDate
          ? format(post.createdAt.toDate(), "d 'de' MMM · HH:mm", { locale: es })
          : '';
        return (
          <div
            key={post.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.title}
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{ padding: '12px 14px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 20,
                  background: cfg.bg, color: cfg.color, fontWeight: 600,
                }}>
                  {cfg.icon} {cfg.label}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => deletePost(post.id)}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#ef4444', fontSize: 14,
                    }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 21, color: 'var(--navy)',
                letterSpacing: '0.02em', marginBottom: 6,
              }}>
                {post.title}
              </div>

              <div style={{
                fontSize: 14, color: 'var(--text-mid)',
                lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {post.content}
              </div>

              {date && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                  {date}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0 20px' }} />

      {/* User card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', background: 'var(--navy)',
        borderRadius: 'var(--radius)', marginBottom: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--gold)', color: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 500,
        }}>
          {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{user?.displayName}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user?.email}</div>
        </div>
        {isAdmin && <span className="admin-badge">Admin</span>}
      </div>

      {/* Compact rules */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 10 }}>
        Sistema de puntos
      </div>
      {[
        { pts: 3, text: 'Acertar ganador o empate', note: 'Todas las fases', gold: false },
        { pts: 5, text: 'Marcador exacto',           note: 'Octavos en adelante', gold: true },
        { pts: 1, text: 'Equipo que avanza',         note: 'Criterio de desempate', gold: false },
      ].map(r => (
        <div key={r.text} className="rules-row" style={{ marginBottom: 6 }}>
          <div className={`rules-pts${r.gold ? ' rules-pts-gold' : ''}`}>{r.pts}</div>
          <div>
            <div className="rules-text">{r.text}</div>
            <div className="rules-note">{r.note}</div>
          </div>
        </div>
      ))}

      {/* Admin button */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="primary-btn gold-btn"
          style={{ marginTop: 20, marginBottom: 10 }}
        >
          Panel de Administrador
        </button>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', padding: 12, marginTop: 8,
          background: 'transparent', color: 'var(--text-mid)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default TableroPage;
