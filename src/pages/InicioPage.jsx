import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// =============================================================================
//  PÁGINA DE INICIO — La Quiniela · Mundial 2026
//  Edita el contenido directamente aquí en VS Code y haz git push para publicar.
//  No necesitas tocar ningún otro archivo.
// =============================================================================

// =============================================================================
//  SECCIÓN 1: MENSAJE DE BIENVENIDA
//  Edita el título, subtítulo y el texto de bienvenida.
// =============================================================================
const BIENVENIDA = {
  titulo: 'La Quiniela del Mundial 2026',
  subtitulo: 'Compite, predice y participa por grandes premios durante todo el torneo',
  texto:
    'Participa en una competencia de predicciones basada en los partidos del Mundial 2026.\n' +
    'Acumula puntos jornada a jornada y compite contra otros jugadores por los primeros lugares.\n\n' +
    'Mientras mejores sean tus predicciones, mayores serán tus posibilidades de ganar.',
};

// =============================================================================
//  SECCIÓN 2: ANUNCIOS Y NOTICIAS
//  Agrega, edita o elimina objetos de este arreglo.
//  Cada anuncio tiene:
//    tipo     → 'noticia' | 'premio' | 'flash' | 'resultado'
//    titulo   → Título del anuncio
//    contenido → Texto del anuncio (puedes usar saltos de línea con \n)
//    imagen   → URL de imagen (deja '' si no hay imagen)
//    fecha    → Fecha que aparece al pie (texto libre, ej: '20 Jun 2026')
//
//  El primero de la lista aparece arriba. Agrega los más recientes al inicio.
// =============================================================================
const ANUNCIOS = [
  {
    tipo: 'noticia',
    titulo: '¡La Quiniela del Mundial ya llegó! Ya está aquí...',
    contenido:
      'El Mundial empieza a sentirse y aunque aún faltan algunas semanas, este es el momento ideal para ir armando un buen grupo de participantes.\n\n' +
      'Te invito a compartir esta información con tus amigos, compañeros de trabajo y todos esos futboleros de corazón. Se viene una competencia entretenida, bien organizada y con muy buenos premios.\n\n' +
      'Durante el torneo, toda la información importante se estará moviendo por el grupo oficial de WhatsApp: resultados, recordatorios de partidos, avisos y actualizaciones clave. Si no estás en el grupo, te vas a perder parte importante de la quiniela.\n\n' +
      'El grupo será únicamente informativo, por lo que solo el administrador podrá enviar mensajes. Así evitamos saturación y mantenemos la información clara y ordenada. Te recomiendo unirte desde ahora y no quedarte fuera de la conversación.\n\n' +
      'Si tienes dudas o quieres más información, con gusto te puedo ayudar.\n\n' +
      'Emerson Monge\n83871924',
    link: 'https://chat.whatsapp.com/KjNRd3vzKT2CdniFVdLG36',
    linkLabel: 'Unirme al grupo de WhatsApp',
    imagen: 'https://i.postimg.cc/fyY0Q394/Laquiniela-01.png',
    fecha: '16 Abr 2026',
  },
  // --- Agrega más anuncios aquí arriba (copia el bloque de arriba) ---
 //{
 //    tipo: 'premio',
 //    titulo: '🎁 Sorpresa para el líder de la semana',
 //    contenido: 'El jugador con más puntos al final de la Jornada 2 recibirá un premio especial.',
 //  imagen: 'https://i.postimg.cc/768NWZqj/2026-04-16-21-48-40.png',
 //    fecha: '18 Jun 2026',
 // },
//{
//tipo: 'resultado',
//   titulo: '⚽ Jornada 1 — Resumen',
// contenido: 'México 2-0 Sudáfrica\nCanadá 1-1 Catar\n¡Gran inicio del torneo!',
//  imagen: 'https://i.postimg.cc/QtJcYg4Y/2026-04-16-21-48-40.png',
// fecha: '22 Jun 2026',
//},
];

// =============================================================================
//  FIN DE LA SECCIÓN EDITABLE
//  No modifiques el código debajo de esta línea a menos que sepas lo que haces.
// =============================================================================

const MUNDIAL_START = new Date('2026-06-11T16:00:00-05:00'); // Inauguración 11 jun, 4pm hora CR

const useCountdown = (target) => {
  const calc = () => {
    const diff = target - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
      started: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
};

// ── Countdown compacto (va dentro del hero) ──────────────────────────────────
// Para quitar el countdown cuando empiece el mundial, elimina <CountdownCompact />
// del hero de bienvenida y este componente completo.
const CountdownCompact = () => {
  const { days, hours, minutes, seconds, started } = useCountdown(MUNDIAL_START);
  if (started) return null;

  const num = (v) => (
    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold-light)', letterSpacing: '0.02em' }}>
      {String(v).padStart(2, '0')}
    </span>
  );
  const lbl = (t) => (
    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {t}
    </span>
  );
  const sep = (
    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'rgba(255,255,255,0.25)', margin: '0 2px' }}>:</span>
  );

  return (
    <div style={{
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
        ⏱ Faltan para el inicio del Mundial
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>{num(days)}{lbl('días')}</div>
        {sep}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>{num(hours)}{lbl('horas')}</div>
        {sep}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>{num(minutes)}{lbl('min')}</div>
        {sep}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>{num(seconds)}{lbl('seg')}</div>
      </div>
    </div>
  );
};

const TIPO_CONFIG = {
  noticia:   { label: 'Noticia',           icon: '📢', color: '#0369a1', bg: '#e0f2fe' },
  premio:    { label: 'Premio / Sorpresa', icon: '🎁', color: '#7c3aed', bg: '#ede9fe' },
  flash:     { label: 'Quiniela Flash ⚡', icon: '⚡', color: '#b45309', bg: '#fef3c7' },
  resultado: { label: 'Resultado',         icon: '⚽', color: '#15803d', bg: '#dcfce7' },
};

const InicioPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page">

      {/* ── Hero de bienvenida ── */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 'var(--radius)',
        padding: '20px 18px',
        marginBottom: 20,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 30,
          color: 'var(--gold-light)',
          letterSpacing: '0.04em',
          lineHeight: 1.1,
          marginBottom: 4,
        }}>
          {BIENVENIDA.titulo}
        </div>
        <div style={{
          fontSize: 10.5,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.01em',
          marginBottom: 14,
          lineHeight: 1.4,
        }}>
          {BIENVENIDA.subtitulo}
        </div>
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.65,
        }}>
          {BIENVENIDA.texto}
        </div>

        {/* ── Countdown dentro del hero — quitar cuando empiece el mundial ── */}
        <CountdownCompact />

        {/* ── Botón de registro solo si no está logueado ── */}
        {!user && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                width: '100%', padding: '12px 0',
                background: 'var(--gold)', color: 'var(--navy)',
                border: 'none', borderRadius: 10,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 18, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              ⚽ Unirme a la Quiniela
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '9px 0',
                background: 'transparent', color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Ya tengo cuenta — Iniciar sesión
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, lineHeight: 1.5 }}>
              ¿No tienes claro cómo funciona La Quiniela?{' '}
              <span
                onClick={() => navigate('/info')}
                style={{
                  color: 'var(--gold)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(212,175,55,0.4)',
                }}
              >
                En "Info" encontrarás todos los detalles
              </span>
            </div>
          </div>
        )}

      </div>

      {/* ── Anuncios ── */}
      {ANUNCIOS.length > 0 && (
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 20,
          color: 'var(--navy)',
          letterSpacing: '0.04em',
          marginBottom: 12,
        }}>
          Anuncios
        </div>
      )}

      {ANUNCIOS.map((anuncio, idx) => {
        const cfg = TIPO_CONFIG[anuncio.tipo] || TIPO_CONFIG.noticia;
        return (
          <div
            key={idx}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            {anuncio.imagen ? (
              <img
                src={anuncio.imagen}
                alt={anuncio.titulo}
                style={{ width: '100%', maxHeight: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : null}

            <div style={{ padding: '12px 14px' }}>
              <span style={{
                display: 'inline-block',
                fontSize: 11,
                padding: '2px 10px',
                borderRadius: 20,
                background: cfg.bg,
                color: cfg.color,
                fontWeight: 600,
                marginBottom: 8,
              }}>
                {cfg.icon} {cfg.label}
              </span>

              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 21,
                color: 'var(--navy)',
                letterSpacing: '0.02em',
                marginBottom: 6,
              }}>
                {anuncio.titulo}
              </div>

              <div style={{
                fontSize: 14,
                color: 'var(--text-mid)',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}>
                {anuncio.contenido}
              </div>

              {anuncio.link && (
                <a
                  href={anuncio.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 14,
                    padding: '11px 16px',
                    background: '#25D366',
                    color: '#fff',
                    borderRadius: 10,
                    fontSize: 14, fontWeight: 700,
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {anuncio.linkLabel || 'Abrir enlace'}
                </a>
              )}

              {anuncio.fecha && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                  {anuncio.fecha}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {ANUNCIOS.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14 }}>Próximamente habrá anuncios y noticias aquí</div>
        </div>
      )}

    </div>
  );
};

export default InicioPage;