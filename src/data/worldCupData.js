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
  A: { teams: ['México', 'Sudáfrica', 'República de Corea', 'Chequia'] },
  B: { teams: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'] },
  C: { teams: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  D: { teams: ['EE. UU.', 'Paraguay', 'Australia', 'Turquía'] },
  E: { teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  F: { teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  G: { teams: ['Bélgica', 'Egipto', 'RI de Irán', 'Nueva Zelanda'] },
  H: { teams: ['España', 'Islas de Cabo Verde', 'Arabia Saudí', 'Uruguay'] },
  I: { teams: ['Francia', 'Senegal', 'Irak', 'Noruega'] },
  J: { teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  K: { teams: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'] },
  L: { teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
};

// Códigos ISO para imágenes de banderas (flagcdn.com)
export const COUNTRY_CODES = {
  'México': 'mx',
  'Sudáfrica': 'za',
  'República de Corea': 'kr',
  'Chequia': 'cz',
  'Canadá': 'ca',
  'Bosnia y Herzegovina': 'ba',
  'Catar': 'qa',
  'Suiza': 'ch',
  'Brasil': 'br',
  'Marruecos': 'ma',
  'Haití': 'ht',
  'Escocia': 'gb-sct',
  'EE. UU.': 'us',
  'Paraguay': 'py',
  'Australia': 'au',
  'Turquía': 'tr',
  'Alemania': 'de',
  'Curazao': 'cw',
  'Costa de Marfil': 'ci',
  'Ecuador': 'ec',
  'Países Bajos': 'nl',
  'Japón': 'jp',
  'Suecia': 'se',
  'Túnez': 'tn',
  'Bélgica': 'be',
  'Egipto': 'eg',
  'RI de Irán': 'ir',
  'Nueva Zelanda': 'nz',
  'España': 'es',
  'Islas de Cabo Verde': 'cv',
  'Arabia Saudí': 'sa',
  'Uruguay': 'uy',
  'Francia': 'fr',
  'Senegal': 'sn',
  'Irak': 'iq',
  'Noruega': 'no',
  'Argentina': 'ar',
  'Argelia': 'dz',
  'Austria': 'at',
  'Jordania': 'jo',
  'Portugal': 'pt',
  'RD Congo': 'cd',
  'Uzbekistán': 'uz',
  'Colombia': 'co',
  'Inglaterra': 'gb-eng',
  'Croacia': 'hr',
  'Ghana': 'gh',
  'Panamá': 'pa',
};

export const FLAGS = {
  'México': '🇲🇽',
  'Sudáfrica': '🇿🇦',
  'República de Corea': '🇰🇷',
  'Chequia': '🇨🇿',
  'Canadá': '🇨🇦',
  'Bosnia y Herzegovina': '🇧🇦',
  'Catar': '🇶🇦',
  'Suiza': '🇨🇭',
  'Brasil': '🇧🇷',
  'Marruecos': '🇲🇦',
  'Haití': '🇭🇹',
  'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'EE. UU.': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australia': '🇦🇺',
  'Turquía': '🇹🇷',
  'Alemania': '🇩🇪',
  'Curazao': '🇨🇼',
  'Costa de Marfil': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Países Bajos': '🇳🇱',
  'Japón': '🇯🇵',
  'Suecia': '🇸🇪',
  'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪',
  'Egipto': '🇪🇬',
  'RI de Irán': '🇮🇷',
  'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸',
  'Islas de Cabo Verde': '🇨🇻',
  'Arabia Saudí': '🇸🇦',
  'Uruguay': '🇺🇾',
  'Francia': '🇫🇷',
  'Senegal': '🇸🇳',
  'Irak': '🇮🇶',
  'Noruega': '🇳🇴',
  'Argentina': '🇦🇷',
  'Argelia': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordania': '🇯🇴',
  'Portugal': '🇵🇹',
  'RD Congo': '🇨🇩',
  'Uzbekistán': '🇺🇿',
  'Colombia': '🇨🇴',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croacia': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panamá': '🇵🇦',
};

// 72 partidos de la Fase de Grupos — Mundial 2026
export const SAMPLE_MATCHES = [
  // ── GRUPO A ──
  { id: 'match_001', phase: PHASES.GROUPS, group: 'A', teamA: 'México', teamB: 'Sudáfrica', date: '2026-06-11T13:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: true, result: null },
  { id: 'match_002', phase: PHASES.GROUPS, group: 'A', teamA: 'República de Corea', teamB: 'Chequia', date: '2026-06-11T20:00:00', venue: 'Estadio Guadalajara (Guadalajara)', isOpen: true, result: null },
  { id: 'match_025', phase: PHASES.GROUPS, group: 'A', teamA: 'Chequia', teamB: 'Sudáfrica', date: '2026-06-18T10:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: true, result: null },
  { id: 'match_028', phase: PHASES.GROUPS, group: 'A', teamA: 'México', teamB: 'República de Corea', date: '2026-06-18T19:00:00', venue: 'Estadio Guadalajara (Guadalajara)', isOpen: true, result: null },
  { id: 'match_053', phase: PHASES.GROUPS, group: 'A', teamA: 'Chequia', teamB: 'México', date: '2026-06-24T19:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: true, result: null },
  { id: 'match_054', phase: PHASES.GROUPS, group: 'A', teamA: 'Sudáfrica', teamB: 'República de Corea', date: '2026-06-24T19:00:00', venue: 'Estadio Monterrey (Monterrey)', isOpen: true, result: null },

  // ── GRUPO B ──
  { id: 'match_003', phase: PHASES.GROUPS, group: 'B', teamA: 'Canadá', teamB: 'Bosnia y Herzegovina', date: '2026-06-12T13:00:00', venue: 'Estadio de Toronto (Toronto)', isOpen: true, result: null },
  { id: 'match_008', phase: PHASES.GROUPS, group: 'B', teamA: 'Catar', teamB: 'Suiza', date: '2026-06-13T13:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: true, result: null },
  { id: 'match_026', phase: PHASES.GROUPS, group: 'B', teamA: 'Suiza', teamB: 'Bosnia y Herzegovina', date: '2026-06-18T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: true, result: null },
  { id: 'match_027', phase: PHASES.GROUPS, group: 'B', teamA: 'Canadá', teamB: 'Catar', date: '2026-06-18T16:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: true, result: null },
  { id: 'match_051', phase: PHASES.GROUPS, group: 'B', teamA: 'Suiza', teamB: 'Canadá', date: '2026-06-24T13:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: true, result: null },
  { id: 'match_052', phase: PHASES.GROUPS, group: 'B', teamA: 'Bosnia y Herzegovina', teamB: 'Catar', date: '2026-06-24T13:00:00', venue: 'Estadio de Seattle (Seattle)', isOpen: true, result: null },

  // ── GRUPO C ──
  { id: 'match_007', phase: PHASES.GROUPS, group: 'C', teamA: 'Brasil', teamB: 'Marruecos', date: '2026-06-13T16:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: true, result: null },
  { id: 'match_005', phase: PHASES.GROUPS, group: 'C', teamA: 'Haití', teamB: 'Escocia', date: '2026-06-13T19:00:00', venue: 'Estadio Boston (Boston)', isOpen: true, result: null },
  { id: 'match_030', phase: PHASES.GROUPS, group: 'C', teamA: 'Escocia', teamB: 'Marruecos', date: '2026-06-19T16:00:00', venue: 'Estadio Boston (Boston)', isOpen: true, result: null },
  { id: 'match_029', phase: PHASES.GROUPS, group: 'C', teamA: 'Brasil', teamB: 'Haití', date: '2026-06-19T18:30:00', venue: 'Estadio Filadelfia (Filadelfia)', isOpen: true, result: null },
  { id: 'match_049', phase: PHASES.GROUPS, group: 'C', teamA: 'Escocia', teamB: 'Brasil', date: '2026-06-24T16:00:00', venue: 'Estadio Miami (Miami)', isOpen: true, result: null },
  { id: 'match_050', phase: PHASES.GROUPS, group: 'C', teamA: 'Marruecos', teamB: 'Haití', date: '2026-06-24T16:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: true, result: null },

  // ── GRUPO D ──
  { id: 'match_004', phase: PHASES.GROUPS, group: 'D', teamA: 'EE. UU.', teamB: 'Paraguay', date: '2026-06-12T19:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: true, result: null },
  { id: 'match_006', phase: PHASES.GROUPS, group: 'D', teamA: 'Australia', teamB: 'Turquía', date: '2026-06-13T22:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: true, result: null },
  { id: 'match_032', phase: PHASES.GROUPS, group: 'D', teamA: 'EE. UU.', teamB: 'Australia', date: '2026-06-19T13:00:00', venue: 'Estadio de Seattle (Seattle)', isOpen: true, result: null },
  { id: 'match_031', phase: PHASES.GROUPS, group: 'D', teamA: 'Turquía', teamB: 'Paraguay', date: '2026-06-19T21:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: true, result: null },
  { id: 'match_059', phase: PHASES.GROUPS, group: 'D', teamA: 'Turquía', teamB: 'EE. UU.', date: '2026-06-25T20:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: true, result: null },
  { id: 'match_060', phase: PHASES.GROUPS, group: 'D', teamA: 'Paraguay', teamB: 'Australia', date: '2026-06-25T20:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: true, result: null },

  // ── GRUPO E ──
  { id: 'match_010', phase: PHASES.GROUPS, group: 'E', teamA: 'Alemania', teamB: 'Curazao', date: '2026-06-14T11:00:00', venue: 'Estadio Houston (Houston)', isOpen: true, result: null },
  { id: 'match_009', phase: PHASES.GROUPS, group: 'E', teamA: 'Costa de Marfil', teamB: 'Ecuador', date: '2026-06-14T17:00:00', venue: 'Estadio Filadelfia (Filadelfia)', isOpen: true, result: null },
  { id: 'match_033', phase: PHASES.GROUPS, group: 'E', teamA: 'Alemania', teamB: 'Costa de Marfil', date: '2026-06-20T14:00:00', venue: 'Estadio de Toronto (Toronto)', isOpen: true, result: null },
  { id: 'match_034', phase: PHASES.GROUPS, group: 'E', teamA: 'Ecuador', teamB: 'Curazao', date: '2026-06-20T18:00:00', venue: 'Estadio Kansas City (Kansas City)', isOpen: true, result: null },
  { id: 'match_055', phase: PHASES.GROUPS, group: 'E', teamA: 'Curazao', teamB: 'Costa de Marfil', date: '2026-06-25T14:00:00', venue: 'Estadio Filadelfia (Filadelfia)', isOpen: true, result: null },
  { id: 'match_056', phase: PHASES.GROUPS, group: 'E', teamA: 'Ecuador', teamB: 'Alemania', date: '2026-06-25T14:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: true, result: null },

  // ── GRUPO F ──
  { id: 'match_011', phase: PHASES.GROUPS, group: 'F', teamA: 'Países Bajos', teamB: 'Japón', date: '2026-06-14T14:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: true, result: null },
  { id: 'match_012', phase: PHASES.GROUPS, group: 'F', teamA: 'Suecia', teamB: 'Túnez', date: '2026-06-14T20:00:00', venue: 'Estadio Monterrey (Monterrey)', isOpen: true, result: null },
  { id: 'match_035', phase: PHASES.GROUPS, group: 'F', teamA: 'Países Bajos', teamB: 'Suecia', date: '2026-06-20T11:00:00', venue: 'Estadio Houston (Houston)', isOpen: true, result: null },
  { id: 'match_036', phase: PHASES.GROUPS, group: 'F', teamA: 'Túnez', teamB: 'Japón', date: '2026-06-20T22:00:00', venue: 'Estadio Monterrey (Monterrey)', isOpen: true, result: null },
  { id: 'match_057', phase: PHASES.GROUPS, group: 'F', teamA: 'Japón', teamB: 'Suecia', date: '2026-06-25T17:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: true, result: null },
  { id: 'match_058', phase: PHASES.GROUPS, group: 'F', teamA: 'Túnez', teamB: 'Países Bajos', date: '2026-06-25T17:00:00', venue: 'Estadio Kansas City (Kansas City)', isOpen: true, result: null },

  // ── GRUPO G ──
  { id: 'match_016', phase: PHASES.GROUPS, group: 'G', teamA: 'Bélgica', teamB: 'Egipto', date: '2026-06-15T13:00:00', venue: 'Estadio de Seattle (Seattle)', isOpen: true, result: null },
  { id: 'match_015', phase: PHASES.GROUPS, group: 'G', teamA: 'RI de Irán', teamB: 'Nueva Zelanda', date: '2026-06-15T19:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: true, result: null },
  { id: 'match_039', phase: PHASES.GROUPS, group: 'G', teamA: 'Bélgica', teamB: 'RI de Irán', date: '2026-06-21T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: true, result: null },
  { id: 'match_040', phase: PHASES.GROUPS, group: 'G', teamA: 'Nueva Zelanda', teamB: 'Egipto', date: '2026-06-21T19:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: true, result: null },
  { id: 'match_063', phase: PHASES.GROUPS, group: 'G', teamA: 'Egipto', teamB: 'RI de Irán', date: '2026-06-26T21:00:00', venue: 'Estadio de Seattle (Seattle)', isOpen: true, result: null },
  { id: 'match_064', phase: PHASES.GROUPS, group: 'G', teamA: 'Nueva Zelanda', teamB: 'Bélgica', date: '2026-06-26T21:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: true, result: null },

  // ── GRUPO H ──
  { id: 'match_014', phase: PHASES.GROUPS, group: 'H', teamA: 'España', teamB: 'Islas de Cabo Verde', date: '2026-06-15T10:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: true, result: null },
  { id: 'match_013', phase: PHASES.GROUPS, group: 'H', teamA: 'Arabia Saudí', teamB: 'Uruguay', date: '2026-06-15T16:00:00', venue: 'Estadio Miami (Miami)', isOpen: true, result: null },
  { id: 'match_038', phase: PHASES.GROUPS, group: 'H', teamA: 'España', teamB: 'Arabia Saudí', date: '2026-06-21T10:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: true, result: null },
  { id: 'match_037', phase: PHASES.GROUPS, group: 'H', teamA: 'Uruguay', teamB: 'Islas de Cabo Verde', date: '2026-06-21T16:00:00', venue: 'Estadio Miami (Miami)', isOpen: true, result: null },
  { id: 'match_065', phase: PHASES.GROUPS, group: 'H', teamA: 'Islas de Cabo Verde', teamB: 'Arabia Saudí', date: '2026-06-26T18:00:00', venue: 'Estadio Houston (Houston)', isOpen: true, result: null },
  { id: 'match_066', phase: PHASES.GROUPS, group: 'H', teamA: 'Uruguay', teamB: 'España', date: '2026-06-26T18:00:00', venue: 'Estadio Guadalajara (Guadalajara)', isOpen: true, result: null },

  // ── GRUPO I ──
  { id: 'match_017', phase: PHASES.GROUPS, group: 'I', teamA: 'Francia', teamB: 'Senegal', date: '2026-06-16T13:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: true, result: null },
  { id: 'match_018', phase: PHASES.GROUPS, group: 'I', teamA: 'Irak', teamB: 'Noruega', date: '2026-06-16T16:00:00', venue: 'Estadio Boston (Boston)', isOpen: true, result: null },
  { id: 'match_042', phase: PHASES.GROUPS, group: 'I', teamA: 'Francia', teamB: 'Irak', date: '2026-06-22T15:00:00', venue: 'Estadio Filadelfia (Filadelfia)', isOpen: true, result: null },
  { id: 'match_041', phase: PHASES.GROUPS, group: 'I', teamA: 'Noruega', teamB: 'Senegal', date: '2026-06-22T18:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: true, result: null },
  { id: 'match_061', phase: PHASES.GROUPS, group: 'I', teamA: 'Noruega', teamB: 'Francia', date: '2026-06-26T13:00:00', venue: 'Estadio Boston (Boston)', isOpen: true, result: null },
  { id: 'match_062', phase: PHASES.GROUPS, group: 'I', teamA: 'Senegal', teamB: 'Irak', date: '2026-06-26T13:00:00', venue: 'Estadio de Toronto (Toronto)', isOpen: true, result: null },

  // ── GRUPO J ──
  { id: 'match_019', phase: PHASES.GROUPS, group: 'J', teamA: 'Argentina', teamB: 'Argelia', date: '2026-06-16T19:00:00', venue: 'Estadio Kansas City (Kansas City)', isOpen: true, result: null },
  { id: 'match_020', phase: PHASES.GROUPS, group: 'J', teamA: 'Austria', teamB: 'Jordania', date: '2026-06-16T22:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: true, result: null },
  { id: 'match_043', phase: PHASES.GROUPS, group: 'J', teamA: 'Argentina', teamB: 'Austria', date: '2026-06-22T11:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: true, result: null },
  { id: 'match_044', phase: PHASES.GROUPS, group: 'J', teamA: 'Jordania', teamB: 'Argelia', date: '2026-06-22T21:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: true, result: null },
  { id: 'match_069', phase: PHASES.GROUPS, group: 'J', teamA: 'Argelia', teamB: 'Austria', date: '2026-06-27T20:00:00', venue: 'Estadio Kansas City (Kansas City)', isOpen: true, result: null },
  { id: 'match_070', phase: PHASES.GROUPS, group: 'J', teamA: 'Jordania', teamB: 'Argentina', date: '2026-06-27T20:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: true, result: null },

  // ── GRUPO K ──
  { id: 'match_023', phase: PHASES.GROUPS, group: 'K', teamA: 'Portugal', teamB: 'RD Congo', date: '2026-06-17T11:00:00', venue: 'Estadio Houston (Houston)', isOpen: true, result: null },
  { id: 'match_024', phase: PHASES.GROUPS, group: 'K', teamA: 'Uzbekistán', teamB: 'Colombia', date: '2026-06-17T20:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: true, result: null },
  { id: 'match_047', phase: PHASES.GROUPS, group: 'K', teamA: 'Portugal', teamB: 'Uzbekistán', date: '2026-06-23T11:00:00', venue: 'Estadio Houston (Houston)', isOpen: true, result: null },
  { id: 'match_048', phase: PHASES.GROUPS, group: 'K', teamA: 'Colombia', teamB: 'RD Congo', date: '2026-06-23T20:00:00', venue: 'Estadio Guadalajara (Guadalajara)', isOpen: true, result: null },
  { id: 'match_071', phase: PHASES.GROUPS, group: 'K', teamA: 'Colombia', teamB: 'Portugal', date: '2026-06-27T17:30:00', venue: 'Estadio Miami (Miami)', isOpen: true, result: null },
  { id: 'match_072', phase: PHASES.GROUPS, group: 'K', teamA: 'RD Congo', teamB: 'Uzbekistán', date: '2026-06-27T17:30:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: true, result: null },

  // ── GRUPO L ──
  { id: 'match_022', phase: PHASES.GROUPS, group: 'L', teamA: 'Inglaterra', teamB: 'Croacia', date: '2026-06-17T14:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: true, result: null },
  { id: 'match_021', phase: PHASES.GROUPS, group: 'L', teamA: 'Ghana', teamB: 'Panamá', date: '2026-06-17T17:00:00', venue: 'Estadio de Toronto (Toronto)', isOpen: true, result: null },
  { id: 'match_045', phase: PHASES.GROUPS, group: 'L', teamA: 'Inglaterra', teamB: 'Ghana', date: '2026-06-23T14:00:00', venue: 'Estadio Boston (Boston)', isOpen: true, result: null },
  { id: 'match_046', phase: PHASES.GROUPS, group: 'L', teamA: 'Panamá', teamB: 'Croacia', date: '2026-06-23T17:00:00', venue: 'Estadio de Toronto (Toronto)', isOpen: true, result: null },
  { id: 'match_067', phase: PHASES.GROUPS, group: 'L', teamA: 'Panamá', teamB: 'Inglaterra', date: '2026-06-27T15:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: true, result: null },
  { id: 'match_068', phase: PHASES.GROUPS, group: 'L', teamA: 'Croacia', teamB: 'Ghana', date: '2026-06-27T15:00:00', venue: 'Estadio Filadelfia (Filadelfia)', isOpen: true, result: null },
];
