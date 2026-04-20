// Datos del Mundial 2026 — 48 equipos, 12 grupos de 4

export const PHASES = {
  GROUPS: 'groups',
  ROUND_OF_32: 'round_of_32',
  ROUND_OF_16: 'round_of_16',
  QUARTERS: 'quarters',
  SEMIS: 'semis',
  THIRD_PLACE: 'third_place',
  FINAL: 'final',
};

export const PHASE_LABELS = {
  groups: 'Fase de Grupos',
  round_of_32: 'Dieciseisavos de Final',
  round_of_16: 'Octavos de Final',
  quarters: 'Cuartos de Final',
  semis: 'Semifinales',
  third_place: 'Tercer Puesto',
  final: 'Final',
};

// Reglas de puntos
export const POINTS = {
  CORRECT_RESULT: 3,      // Acertar ganador o empate
  EXACT_SCORE: 5,         // Marcador exacto (desde Octavos)
  TEAM_ADVANCES: 1,       // Equipo que avanza en grupos (desempate)
};

// Fases donde se permite marcador exacto (desde Dieciseisavos en adelante)
export const EXACT_SCORE_PHASES = [
  PHASES.ROUND_OF_32,
  PHASES.ROUND_OF_16,
  PHASES.QUARTERS,
  PHASES.SEMIS,
  PHASES.THIRD_PLACE,
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

  // ── DIECISEISAVOS DE FINAL (P73–P88) ──
  { id: 'match_073', phase: PHASES.ROUND_OF_32, group: null, teamA: '2A', teamB: '2B', date: '2026-06-28T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: false, result: null },
  { id: 'match_076', phase: PHASES.ROUND_OF_32, group: null, teamA: '1C', teamB: '2F', date: '2026-06-29T11:00:00', venue: 'Estadio Houston (Houston)', isOpen: false, result: null },
  { id: 'match_074', phase: PHASES.ROUND_OF_32, group: null, teamA: '1E', teamB: '3ABCDF', date: '2026-06-29T14:30:00', venue: 'Estadio Boston (Boston)', isOpen: false, result: null },
  { id: 'match_075', phase: PHASES.ROUND_OF_32, group: null, teamA: '1F', teamB: '2C', date: '2026-06-29T19:00:00', venue: 'Estadio Monterrey (Monterrey)', isOpen: false, result: null },
  { id: 'match_077', phase: PHASES.ROUND_OF_32, group: null, teamA: '2E', teamB: '2I', date: '2026-06-30T11:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: false, result: null },
  { id: 'match_078', phase: PHASES.ROUND_OF_32, group: null, teamA: '1I', teamB: '3CDFGH', date: '2026-06-30T15:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: false, result: null },
  { id: 'match_079', phase: PHASES.ROUND_OF_32, group: null, teamA: '1A', teamB: '3CEFHI', date: '2026-06-30T19:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: false, result: null },
  { id: 'match_080', phase: PHASES.ROUND_OF_32, group: null, teamA: '1L', teamB: '3EHIJK', date: '2026-07-01T10:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: false, result: null },
  { id: 'match_081', phase: PHASES.ROUND_OF_32, group: null, teamA: '1G', teamB: '3AEHIJ', date: '2026-07-01T14:00:00', venue: 'Estadio de Seattle (Seattle)', isOpen: false, result: null },
  { id: 'match_082', phase: PHASES.ROUND_OF_32, group: null, teamA: '1D', teamB: '3BEFIJ', date: '2026-07-01T18:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },
  { id: 'match_083', phase: PHASES.ROUND_OF_32, group: null, teamA: '1H', teamB: '2J', date: '2026-07-02T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: false, result: null },
  { id: 'match_084', phase: PHASES.ROUND_OF_32, group: null, teamA: '2K', teamB: '2L', date: '2026-07-02T17:00:00', venue: 'Estadio de Toronto (Toronto)', isOpen: false, result: null },
  { id: 'match_085', phase: PHASES.ROUND_OF_32, group: null, teamA: '1B', teamB: '3EFGIJ', date: '2026-07-02T21:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: false, result: null },
  { id: 'match_086', phase: PHASES.ROUND_OF_32, group: null, teamA: '2D', teamB: '2G', date: '2026-07-03T12:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: false, result: null },
  { id: 'match_087', phase: PHASES.ROUND_OF_32, group: null, teamA: '1J', teamB: '2H', date: '2026-07-03T16:00:00', venue: 'Estadio Miami (Miami)', isOpen: false, result: null },
  { id: 'match_088', phase: PHASES.ROUND_OF_32, group: null, teamA: '1K', teamB: '3DEIJL', date: '2026-07-03T19:30:00', venue: 'Estadio Kansas City (Kansas City)', isOpen: false, result: null },

  // ── OCTAVOS DE FINAL (P89–P96) ──
  { id: 'match_089', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W74', teamB: 'W77', date: '2026-07-04T11:00:00', venue: 'Estadio Houston (Houston)', isOpen: false, result: null },
  { id: 'match_090', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W73', teamB: 'W75', date: '2026-07-04T15:00:00', venue: 'Estadio Filadelfia (Filadelfia)', isOpen: false, result: null },
  { id: 'match_091', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W76', teamB: 'W78', date: '2026-07-05T14:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: false, result: null },
  { id: 'match_092', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W79', teamB: 'W80', date: '2026-07-05T18:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: false, result: null },
  { id: 'match_093', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W83', teamB: 'W84', date: '2026-07-06T13:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: false, result: null },
  { id: 'match_094', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W81', teamB: 'W82', date: '2026-07-06T18:00:00', venue: 'Estadio de Seattle (Seattle)', isOpen: false, result: null },
  { id: 'match_095', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W86', teamB: 'W88', date: '2026-07-07T10:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: false, result: null },
  { id: 'match_096', phase: PHASES.ROUND_OF_16, group: null, teamA: 'W85', teamB: 'W87', date: '2026-07-07T14:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)', isOpen: false, result: null },

  // ── CUARTOS DE FINAL (P97–P100) ──
  { id: 'match_097', phase: PHASES.QUARTERS, group: null, teamA: 'W89', teamB: 'W90', date: '2026-07-09T14:00:00', venue: 'Estadio Boston (Boston)', isOpen: false, result: null },
  { id: 'match_098', phase: PHASES.QUARTERS, group: null, teamA: 'W93', teamB: 'W94', date: '2026-07-10T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)', isOpen: false, result: null },
  { id: 'match_099', phase: PHASES.QUARTERS, group: null, teamA: 'W91', teamB: 'W92', date: '2026-07-11T15:00:00', venue: 'Estadio Miami (Miami)', isOpen: false, result: null },
  { id: 'match_100', phase: PHASES.QUARTERS, group: null, teamA: 'W95', teamB: 'W96', date: '2026-07-11T19:00:00', venue: 'Estadio Kansas City (Kansas City)', isOpen: false, result: null },

  // ── SEMIFINALES (P101–P102) ──
  { id: 'match_101', phase: PHASES.SEMIS, group: null, teamA: 'W97', teamB: 'W98', date: '2026-07-14T13:00:00', venue: 'Estadio Dallas (Dallas)', isOpen: false, result: null },
  { id: 'match_102', phase: PHASES.SEMIS, group: null, teamA: 'W99', teamB: 'W100', date: '2026-07-15T13:00:00', venue: 'Estadio Atlanta (Atlanta)', isOpen: false, result: null },

  // ── TERCER PUESTO (P103) ──
  { id: 'match_103', phase: PHASES.THIRD_PLACE, group: null, teamA: 'RU101', teamB: 'RU102', date: '2026-07-18T15:00:00', venue: 'Estadio Miami (Miami)', isOpen: false, result: null },

  // ── FINAL (P104) ──
  { id: 'match_104', phase: PHASES.FINAL, group: null, teamA: 'W101', teamB: 'W102', date: '2026-07-19T13:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)', isOpen: false, result: null },
];
