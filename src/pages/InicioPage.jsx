import { useState, useEffect } from 'react';

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
  titulo: '¡Bienvenidos a La Quiniela!',
  subtitulo: 'Mundial 2026 · 🇺🇸 · 🇨🇦 · 🇲🇽',
  texto:
    'El torneo de predicciones más emocionante del año ya comenzó! ' +
    'Predice los resultados, acumula puntos y demuestra que tienes el ojo para el fútbol. ' +
    'Mucha suerte a todos!',
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
    titulo: '¡La Quiniela está activa!',
    contenido:
    'Ya puedes registrar tus predicciones para todos los partidos de la fase de grupos. ' +
    'Recuerda que los partidos se cierran cuando inician, ¡no te quedes sin predecir! Tendremos premios semanales para los líderes de cada jornada y un gran premio final para el campeón de la quiniela.',
    imagen: 'https://i.postimg.cc/SKkNxPbM/Whats-App-Image-2026-04-17-at-2-42-43-PM.jpg',
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
        ⏱ Faltan para el Mundial
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
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 14,
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

export default Inic