const AnuncioModal = ({ popup, onClose }) => {
  if (!popup) return null;

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
        style={{
          width: '100%', maxWidth: 420,
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Image (optional) */}
        {popup.imageUrl && (
          <div style={{ width: '100%', maxHeight: 220, overflow: 'hidden' }}>
            <img
              src={popup.imageUrl}
              alt="Anuncio"
              style={{ width: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 20px 24px' }}>
          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24, letterSpacing: '0.04em',
              color: 'var(--navy)', lineHeight: 1.1,
              flex: 1, paddingRight: 12,
            }}>
              {popup.title}
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9', border: 'none',
                borderRadius: '50%', width: 32, height: 32,
                cursor: 'pointer', fontSize: 16, color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            fontSize: 14, color: '#475569', lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {popup.body}
          </div>

          <button
            onClick={onClose}
            style={{
              marginTop: 20, width: '100%',
              padding: '11px 0',
              background: 'var(--navy)', color: '#fff',
              border: 'none', borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnuncioModal;
