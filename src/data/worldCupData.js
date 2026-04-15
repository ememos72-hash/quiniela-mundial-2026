// Datos del Mundial 2026 — 48 equipos, 12 grupos de 4

export const PHASES = {
  GROUPS: 'groups',
  ROUND_OF_32: 'round_of_32',
  ROUND_OF_16: 'round_of_16',
  QUARTERS: 'quarters',
  SEMIS: 'semis',
  FINAL: 'final',
};

export const PHASE_LABELS = {
  groups: 'Fase de Grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarters: 'Cuartos de Final',
  semis: 'Semifinales',
  final: 'Final',
};

// Reglas de puntos
export const POINTS = {
  CORRECT_RESULT: 3,      // Acertar ganador o empate
  EXACT_SCORE: 5,         // Marcador exacto (desde Octavos)
  TEAM_ADVANCES: 1,       // Equipo que avanza en grupos (desempate)
};

// Fases donde se permite marcador exacto
export const EXACT_SCORE_PHASES = [
  PHASES.ROUND_OF_16,
  PHASES.QUARTERS,
  PHASES.SEMIS,
  PHASES.FINAL,
];

export const GROUPS = {
  A: { teams: ['México', 'Polonia', 'Arabia Saudita', 'Argentina'] },
  B: { teams: ['Francia', 'Perú', 'Dinamarca', 'Túnez'] },
  C: { teams: ['España', 'Costa Rica', 'Alemania', 'Japón'] },
  D: { teams: ['Brasil', 'Serbia', 'Suiza', 'Camerún'] },
  E: { teams: ['Portugal', 'Ghana', 'Uruguay', 'Corea del Sur'] },
  F: { teams: ['Bélgica', 'Canadá', 'Marruecos', 'Croacia'] },
  G: { teams: ['Estados Unidos', 'Gales', 'Irán', 'Inglaterra'] },
  H: { teams: ['Países Bajos', 'Senegal', 'Ecuador', 'Qatar'] },
  I: { teams: ['Australia', 'Nigeria', 'Nueva Zelanda', 'Argelia'] },
  J: { teams: ['Colombia', 'Venezuela', 'Chile', 'Egipto'] },
  K: { teams: ['Turquía', 'Grecia', 'Ucrania', 'Albania'] },
  L: { teams: ['Irlanda', 'Escocia', 'Bosnia', 'Indonesia'] },
};

export const FLAGS = {
  'México': '🇲🇽', 'Polonia': '🇵🇱', 'Arabia Saudita': '🇸🇦', 'Argentina': '🇦🇷',
  'Francia': '🇫🇷', 'Perú': '🇵🇪', 'Dinamarca': '🇩🇰', 'Túnez': '🇹🇳',
  'España': '🇪🇸', 'Costa Rica': '🇨🇷', 'Alemania': '🇩🇪', 'Japón': '🇯🇵',
  'Brasil': '🇧🇷', 'Serbia': '🇷🇸', 'Suiza': '🇨🇭', 'Camerún': '🇨🇲',
  'Portugal': '🇵🇹', 'Ghana': '🇬🇭', 'Uruguay': '🇺🇾', 'Corea del Sur': '🇰🇷',
  'Bélgica': '🇧🇪', 'Canadá': '🇨🇦', 'Marruecos': '🇲🇦', 'Croacia': '🇭🇷',
  'Estados Unidos': '🇺🇸', 'Gales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Irán': '🇮🇷', 'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Países Bajos': '🇳🇱', 'Senegal': '🇸🇳', 'Ecuador': '🇪🇨', 'Qatar': '🇶🇦',
  'Australia': '🇦🇺', 'Nigeria': '🇳🇬', 'Nueva Zelanda': '🇳🇿', 'Argelia': '🇩🇿',
  'Colombia': '🇨🇴', 'Venezuela': '🇻🇪', 'Chile': '🇨🇱', 'Egipto': '🇪🇬',
  'Turquía': '🇹🇷', 'Grecia': '🇬🇷', 'Ucrania': '🇺🇦', 'Albania': '🇦🇱',
  'Irlanda': '🇮🇪', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Bosnia': '🇧🇦', 'Indonesia': '🇮🇩',
};

// Partidos de ejemplo fase de grupos — el admin crea los reales en Firebase
export const SAMPLE_MATCHES = [
  {
    id: 'match_001',
    phase: PHASES.GROUPS,
    group: 'A',
    teamA: 'México',
    teamB: 'Polonia',
    date: '2026-06-11T16:00:00',
    venue: 'SoFi Stadium, Los Angeles',
    isOpen: true,
    result: null,
  },
  {
    id: 'match_002',
    phase: PHASES.GROUPS,
    group: 'A',
    teamA: 'Argentina',
    teamB: 'Arabia Saudita',
    date: '2026-06-11T20:00:00',
    venue: 'MetLife Stadium, Nueva York',
    isOpen: true,
    result: null,
  },
  {
    id: 'match_003',
    phase: PHASES.GROUPS,
    group: 'C',
    teamA: 'España',
    teamB: 'Costa Rica',
    date: '2026-06-12T14:00:00',
    venue: 'AT&T Stadium, Dallas',
    isOpen: false,
    result: { teamAScore: 7, teamBScore: 0, winner: 'teamA' },
  },
];
