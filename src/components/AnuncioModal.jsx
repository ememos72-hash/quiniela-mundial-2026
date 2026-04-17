import { useState } from 'react';

const AnuncioModal = ({ popup, onClose }) => {
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  if (!popup) return null;

  // Support legacy single-slide format AND new slides array
  const slides = popup.slides?.length > 0
    ? popup.slides
    : [{ title: popup.title || '', body: popup.body || '', imageUrl: popup.imageUrl || '', linkUrl: '', linkLabel: '' }];

  const total = slides.length;
  const slide = slides[current];

  const prev = () => setCurrent(i => Math.max(0, i - 1));
  const next = () => setCurrent(i => Math.min(total - 1, i + 1));

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (delta > 50) next();
    else if (delta < -50) prev();
    setTouchStartX(null);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', maxWidth: 420,
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* Image (clickable if linkUrl set) */}
        {slide.imageUrl && (
          <div style={{ width: '100%', background: '#000' }}>
            {slide.linkUrl ? (
              <a href={slide.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img
                  src={slide.imageUrl}
                  alt="Anuncio"
                  style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
                />
              </a>
            ) : (
              <img
                src={slide.imageUrl}
                alt="Anuncio"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 20px 24px' }}>

          {/* Header: title + close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24, letterSpacing: '0.04em',
              color: 'var(--navy)', lineHeight: 1.1,
              flex: 1, paddingRight: 12,
            }}>
              {slide.title}
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9', border: 'none',
                borderRadius: '50%', width: 32, height: 32,
                cursor: 'pointer', fontSize: 14, color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Body text */}
          {slide.body ? (
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
              {slide.body}
            </div>
          ) : <div style={{ marginBottom: 16 }} />}

          {/* Link button (optional) */}
          {slide.linkUrl && (
            <a
              href={slide.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', marginBottom: 10,
                padding: '11px 0', textAlign: 'center',
                background: 'var(--gold)',
                color: 'var(--navy)',
                border: 'none', borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, fontWeight: 700,
                textDecoration: 'none', cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {slide.linkLabel || 'Visitar sitio'} →
            </a>
          )}

          {/* Carousel controls */}
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
              <button
                onClick={prev}
                disabled={current === 0}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: current === 0 ? '#f8fafc' : 'var(--navy)',
                  color: current === 0 ? '#cbd5e1' : '#fff',
                  cursor: current === 0 ? 'default' : 'pointer',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ‹
              </button>

              {/* Dots */}
              <div style={{ display: 'flex', gap: 6 }}>
                {slides.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrent(i)}
                    style={{
                      width: i === current ? 18 : 8, height: 8,
                      borderRadius: 4,
                      background: i === current ? 'var(--navy)' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={current === total - 1}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: current === total - 1 ? '#f8fafc' : 'var(--navy)',
                  color: current === total - 1 ? '#cbd5e1' : '#fff',
                  cursor: current === total - 1 ? 'default' : 'pointer',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ›
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px 0',
              background: total > 1 ? '#f1f5f9' : 'var(--navy)',
              color: total > 1 ? 'var(--text-mid)' : '#fff',
              border: 'none', borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnuncioModal;
