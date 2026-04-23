// =============================================================================
//  PREMIACION - Edita los datos aqui en VS Code y haz git push para publicar.
// =============================================================================

// SECCION 1: RESUMEN DE LA QUINIELA
// Actualiza los montos conforme se confirmen los jugadores y el costo de entrada.
// Deja el campo en '' para que aparezca como '-' en la pantalla.
const RESUMEN = {
  jugadores:    '',   // Ej: '30 participantes'
  costoEntrada: '₡25.000',   // Ej: 'c25.000'
  bolsaBruta:   '',   // Ej: 'c600.000'
  gastosAdmin:  '',   // Ej: 'c72.000'
  bolsaNeta:    '',   // Ej: 'c528.000'
};

// SECCION 2: DISTRIBUCION DE PREMIOS
// Actualiza los montos en la columna 'monto'. El porcentaje es informativo.
const PREMIOS = [
  { emoji: '🥇', lugar: '1. Lugar', porcentaje: '40%', monto: '' },
  { emoji: '🥈', lugar: '2. Lugar', porcentaje: '25%', monto: '' },
  { emoji: '🥉', lugar: '3. Lugar', porcentaje: '15%', monto: '' },
  { emoji: '4️⃣', lugar: '4. Lugar', porcentaje: 'A definir', monto: '' },
  { emoji: '5️⃣', lugar: '5. Lugar', porcentaje: 'A definir', monto: '' },
  { emoji: '6️⃣', lugar: '6. Lugar y más — según participación', porcentaje: 'A definir', monto: '' },
];

// SECCION 3: TRANSFERENCIAS BANCARIAS
const TRANSFERENCIAS = [
  { banco: 'BCR', titular: 'Emerson Monge',  iban: 'CR29015202001091097579' },
  { banco: 'BAC', titular: 'Nicole Eduarte', iban: 'CR49010200009419357106' },
  { banco: 'BN',  titular: 'Nicole Eduarte', iban: 'CR93015118820010097181' },
];

// SECCION 4: SINPE MOVIL
const SINPE = {
  titular: 'Emerson Monge',
  numero:  '83871924',
};

// =============================================================================
//  FIN DE LA SECCION EDITABLE
// =============================================================================

const val = (v) => v || '-';

const Row = ({ label, value, highlight }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f1f5f9',
  }}>
    <span style={{ fontSize: 14, color: '#64748b' }}>{label}</span>
    <span style={{
      fontSize: 14, fontWeight: highlight ? 700 : 500,
      color: highlight ? 'var(--navy)' : '#1e293b',
    }}>
      {value}
    </span>
  </div>
);

const PremioModal = ({ onClose }) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          maxHeight: '88vh',
          overflowY: 'auto',
          paddingBottom: 32,
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 20px 16px',
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 26, letterSpacing: '0.04em', color: 'var(--navy)',
          }}>
            Premiacion
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: '0 20px' }}>

          {/* Resumen */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: '0.04em',
            color: 'var(--navy)', marginBottom: 4,
          }}>
            Resumen de La Quiniela
          </div>

          <div style={{ marginBottom: 8 }}>
            <Row label="Jugadores"              value={val(RESUMEN.jugadores)} />
            <Row label="Costo de entrada"       value={val(RESUMEN.costoEntrada)} />
            <Row label="Bolsa total bruta"      value={val(RESUMEN.bolsaBruta)} />
            <Row label="Gastos administrativos (12%)" value={val(RESUMEN.gastosAdmin)} />
            <Row label="Bolsa neta a premiar"   value={val(RESUMEN.bolsaNeta)} highlight />
          </div>

          <div style={{
            fontSize: 11, color: '#94a3b8', marginBottom: 8, fontStyle: 'italic',
          }}>
            * Un 12% de la bolsa se destinará a gastos de mantenimiento y administración.
          </div>

          <div style={{
            fontSize: 12, color: '#475569',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 20,
          }}>
            El número de posiciones premiadas se define según la participación total — aproximadamente el 10% de los jugadores entrará a premios.
          </div>

          {/* Premios */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: '0.04em',
            color: 'var(--navy)', marginBottom: 10,
          }}>
            Premios
          </div>

          {PREMIOS.map((p) => (
            <div key={p.lugar} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: 10,
              marginBottom: 8,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{p.lugar}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.porcentaje} de la bolsa neta</div>
                </div>
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20, color: 'var(--navy)', letterSpacing: '0.02em',
              }}>
                {val(p.monto)}
              </div>
            </div>
          ))}

          {/* Formas de Pago */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: '0.04em',
            color: 'var(--navy)', marginTop: 20, marginBottom: 10,
          }}>
            Formas de Pago
          </div>

          <div style={{
            fontSize: 13, fontWeight: 600, color: '#475569',
            marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Transferencia Bancaria
          </div>

          {TRANSFERENCIAS.map((t) => (
            <div key={t.iban} style={{
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                {t.banco} - {t.titular}
              </div>
              <div style={{
                fontSize: 13, color: '#2563eb',
                fontFamily: 'monospace', letterSpacing: '0.04em',
              }}>
                {t.iban}
              </div>
            </div>
          ))}

          <div style={{
            fontSize: 13, fontWeight: 600, color: '#475569',
            marginTop: 14, marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Sinpe Movil
          </div>

          <div style={{
            padding: '10px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              {SINPE.titular}
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22, color: 'var(--navy)', letterSpacing: '0.04em',
            }}>
              {SINPE.numero}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PremioModal;
