// ============================================================
//  SCRIPT DE IMPORTACIÓN — 104 partidos del Mundial 2026
//  Ejecutar desde la carpeta del proyecto:
//    node scripts/importMatches.mjs
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ── Config de Firebase (copiada de src/firebaseConfig.js) ──
const firebaseConfig = {
  apiKey: "AIzaSyCKRERWLV1ZX1uEGQB006c02S3chuJVSdo",
  authDomain: "quiniela---mundial-2026.firebaseapp.com",
  projectId: "quiniela---mundial-2026",
  storageBucket: "quiniela---mundial-2026.firebasestorage.app",
  messagingSenderId: "735911362707",
  appId: "1:735911362707:web:eaf12c2871b1cb09f20d66",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Autenticación como admin ────────────────────────────────
console.log('🔐 Autenticando...');
await signInWithEmailAndPassword(auth, 'ememos72@gmail.com', process.argv[2] || '');
console.log('✅ Autenticado como admin\n');

// ── Todos los partidos ──────────────────────────────────────
const MATCHES = [
  // ── GRUPO A ──
  { id: 'match_001', phase: 'groups', group: 'A', teamA: 'México',              teamB: 'Sudáfrica',           date: '2026-06-11T13:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: false, result: null },
  { id: 'match_002', phase: 'groups', group: 'A', teamA: 'República de Corea',  teamB: 'Chequia',             date: '2026-06-11T20:00:00', venue: 'Estadio Guadalajara (Guadalajara)',            isOpen: false, result: null },
  { id: 'match_025', phase: 'groups', group: 'A', teamA: 'Chequia',             teamB: 'Sudáfrica',           date: '2026-06-18T10:00:00', venue: 'Estadio Atlanta (Atlanta)',                   isOpen: false, result: null },
  { id: 'match_028', phase: 'groups', group: 'A', teamA: 'México',              teamB: 'República de Corea',  date: '2026-06-18T19:00:00', venue: 'Estadio Guadalajara (Guadalajara)',            isOpen: false, result: null },
  { id: 'match_053', phase: 'groups', group: 'A', teamA: 'Chequia',             teamB: 'México',              date: '2026-06-24T19:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: false, result: null },
  { id: 'match_054', phase: 'groups', group: 'A', teamA: 'Sudáfrica',           teamB: 'República de Corea',  date: '2026-06-24T19:00:00', venue: 'Estadio Monterrey (Monterrey)',               isOpen: false, result: null },

  // ── GRUPO B ──
  { id: 'match_003', phase: 'groups', group: 'B', teamA: 'Canadá',              teamB: 'Bosnia y Herzegovina',date: '2026-06-12T13:00:00', venue: 'Estadio de Toronto (Toronto)',                isOpen: false, result: null },
  { id: 'match_008', phase: 'groups', group: 'B', teamA: 'Catar',               teamB: 'Suiza',               date: '2026-06-13T13:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },
  { id: 'match_026', phase: 'groups', group: 'B', teamA: 'Suiza',               teamB: 'Bosnia y Herzegovina',date: '2026-06-18T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',           isOpen: false, result: null },
  { id: 'match_027', phase: 'groups', group: 'B', teamA: 'Canadá',              teamB: 'Catar',               date: '2026-06-18T16:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',      isOpen: false, result: null },
  { id: 'match_051', phase: 'groups', group: 'B', teamA: 'Suiza',               teamB: 'Canadá',              date: '2026-06-24T13:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',      isOpen: false, result: null },
  { id: 'match_052', phase: 'groups', group: 'B', teamA: 'Bosnia y Herzegovina',teamB: 'Catar',               date: '2026-06-24T13:00:00', venue: 'Estadio de Seattle (Seattle)',                isOpen: false, result: null },

  // ── GRUPO C ──
  { id: 'match_007', phase: 'groups', group: 'C', teamA: 'Brasil',              teamB: 'Marruecos',           date: '2026-06-13T16:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',isOpen: false, result: null },
  { id: 'match_005', phase: 'groups', group: 'C', teamA: 'Haití',               teamB: 'Escocia',             date: '2026-06-13T19:00:00', venue: 'Estadio Boston (Boston)',                     isOpen: false, result: null },
  { id: 'match_030', phase: 'groups', group: 'C', teamA: 'Escocia',             teamB: 'Marruecos',           date: '2026-06-19T16:00:00', venue: 'Estadio Boston (Boston)',                     isOpen: false, result: null },
  { id: 'match_029', phase: 'groups', group: 'C', teamA: 'Brasil',              teamB: 'Haití',               date: '2026-06-19T18:30:00', venue: 'Estadio Filadelfia (Filadelfia)',              isOpen: false, result: null },
  { id: 'match_049', phase: 'groups', group: 'C', teamA: 'Escocia',             teamB: 'Brasil',              date: '2026-06-24T16:00:00', venue: 'Estadio Miami (Miami)',                       isOpen: false, result: null },
  { id: 'match_050', phase: 'groups', group: 'C', teamA: 'Marruecos',           teamB: 'Haití',               date: '2026-06-24T16:00:00', venue: 'Estadio Atlanta (Atlanta)',                   isOpen: false, result: null },

  // ── GRUPO D ──
  { id: 'match_004', phase: 'groups', group: 'D', teamA: 'EE. UU.',             teamB: 'Paraguay',            date: '2026-06-12T19:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',           isOpen: false, result: null },
  { id: 'match_006', phase: 'groups', group: 'D', teamA: 'Australia',           teamB: 'Turquía',             date: '2026-06-13T22:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',      isOpen: false, result: null },
  { id: 'match_032', phase: 'groups', group: 'D', teamA: 'EE. UU.',             teamB: 'Australia',           date: '2026-06-19T13:00:00', venue: 'Estadio de Seattle (Seattle)',                isOpen: false, result: null },
  { id: 'match_031', phase: 'groups', group: 'D', teamA: 'Turquía',             teamB: 'Paraguay',            date: '2026-06-19T21:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },
  { id: 'match_059', phase: 'groups', group: 'D', teamA: 'Turquía',             teamB: 'EE. UU.',             date: '2026-06-25T20:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',           isOpen: false, result: null },
  { id: 'match_060', phase: 'groups', group: 'D', teamA: 'Paraguay',            teamB: 'Australia',           date: '2026-06-25T20:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },

  // ── GRUPO E ──
  { id: 'match_010', phase: 'groups', group: 'E', teamA: 'Alemania',            teamB: 'Curazao',             date: '2026-06-14T11:00:00', venue: 'Estadio Houston (Houston)',                   isOpen: false, result: null },
  { id: 'match_009', phase: 'groups', group: 'E', teamA: 'Costa de Marfil',     teamB: 'Ecuador',             date: '2026-06-14T17:00:00', venue: 'Estadio Filadelfia (Filadelfia)',              isOpen: false, result: null },
  { id: 'match_033', phase: 'groups', group: 'E', teamA: 'Alemania',            teamB: 'Costa de Marfil',     date: '2026-06-20T14:00:00', venue: 'Estadio de Toronto (Toronto)',                isOpen: false, result: null },
  { id: 'match_034', phase: 'groups', group: 'E', teamA: 'Ecuador',             teamB: 'Curazao',             date: '2026-06-20T18:00:00', venue: 'Estadio Kansas City (Kansas City)',           isOpen: false, result: null },
  { id: 'match_055', phase: 'groups', group: 'E', teamA: 'Curazao',             teamB: 'Costa de Marfil',     date: '2026-06-25T14:00:00', venue: 'Estadio Filadelfia (Filadelfia)',              isOpen: false, result: null },
  { id: 'match_056', phase: 'groups', group: 'E', teamA: 'Ecuador',             teamB: 'Alemania',            date: '2026-06-25T14:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',isOpen: false, result: null },

  // ── GRUPO F ──
  { id: 'match_011', phase: 'groups', group: 'F', teamA: 'Países Bajos',        teamB: 'Japón',               date: '2026-06-14T14:00:00', venue: 'Estadio Dallas (Dallas)',                     isOpen: false, result: null },
  { id: 'match_012', phase: 'groups', group: 'F', teamA: 'Suecia',              teamB: 'Túnez',               date: '2026-06-14T20:00:00', venue: 'Estadio Monterrey (Monterrey)',               isOpen: false, result: null },
  { id: 'match_035', phase: 'groups', group: 'F', teamA: 'Países Bajos',        teamB: 'Suecia',              date: '2026-06-20T11:00:00', venue: 'Estadio Houston (Houston)',                   isOpen: false, result: null },
  { id: 'match_036', phase: 'groups', group: 'F', teamA: 'Túnez',               teamB: 'Japón',               date: '2026-06-20T22:00:00', venue: 'Estadio Monterrey (Monterrey)',               isOpen: false, result: null },
  { id: 'match_057', phase: 'groups', group: 'F', teamA: 'Japón',               teamB: 'Suecia',              date: '2026-06-25T17:00:00', venue: 'Estadio Dallas (Dallas)',                     isOpen: false, result: null },
  { id: 'match_058', phase: 'groups', group: 'F', teamA: 'Túnez',               teamB: 'Países Bajos',        date: '2026-06-25T17:00:00', venue: 'Estadio Kansas City (Kansas City)',           isOpen: false, result: null },

  // ── GRUPO G ──
  { id: 'match_016', phase: 'groups', group: 'G', teamA: 'Bélgica',             teamB: 'Egipto',              date: '2026-06-15T13:00:00', venue: 'Estadio de Seattle (Seattle)',                isOpen: false, result: null },
  { id: 'match_015', phase: 'groups', group: 'G', teamA: 'RI de Irán',          teamB: 'Nueva Zelanda',       date: '2026-06-15T19:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',           isOpen: false, result: null },
  { id: 'match_039', phase: 'groups', group: 'G', teamA: 'Bélgica',             teamB: 'RI de Irán',          date: '2026-06-21T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',           isOpen: false, result: null },
  { id: 'match_040', phase: 'groups', group: 'G', teamA: 'Nueva Zelanda',       teamB: 'Egipto',              date: '2026-06-21T19:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',      isOpen: false, result: null },
  { id: 'match_063', phase: 'groups', group: 'G', teamA: 'Egipto',              teamB: 'RI de Irán',          date: '2026-06-26T21:00:00', venue: 'Estadio de Seattle (Seattle)',                isOpen: false, result: null },
  { id: 'match_064', phase: 'groups', group: 'G', teamA: 'Nueva Zelanda',       teamB: 'Bélgica',             date: '2026-06-26T21:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',      isOpen: false, result: null },

  // ── GRUPO H ──
  { id: 'match_014', phase: 'groups', group: 'H', teamA: 'España',              teamB: 'Islas de Cabo Verde', date: '2026-06-15T10:00:00', venue: 'Estadio Atlanta (Atlanta)',                   isOpen: false, result: null },
  { id: 'match_013', phase: 'groups', group: 'H', teamA: 'Arabia Saudí',        teamB: 'Uruguay',             date: '2026-06-15T16:00:00', venue: 'Estadio Miami (Miami)',                       isOpen: false, result: null },
  { id: 'match_038', phase: 'groups', group: 'H', teamA: 'España',              teamB: 'Arabia Saudí',        date: '2026-06-21T10:00:00', venue: 'Estadio Atlanta (Atlanta)',                   isOpen: false, result: null },
  { id: 'match_037', phase: 'groups', group: 'H', teamA: 'Uruguay',             teamB: 'Islas de Cabo Verde', date: '2026-06-21T16:00:00', venue: 'Estadio Miami (Miami)',                       isOpen: false, result: null },
  { id: 'match_065', phase: 'groups', group: 'H', teamA: 'Islas de Cabo Verde', teamB: 'Arabia Saudí',        date: '2026-06-26T18:00:00', venue: 'Estadio Houston (Houston)',                   isOpen: false, result: null },
  { id: 'match_066', phase: 'groups', group: 'H', teamA: 'Uruguay',             teamB: 'España',              date: '2026-06-26T18:00:00', venue: 'Estadio Guadalajara (Guadalajara)',            isOpen: false, result: null },

  // ── GRUPO I ──
  { id: 'match_017', phase: 'groups', group: 'I', teamA: 'Francia',             teamB: 'Senegal',             date: '2026-06-16T13:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',isOpen: false, result: null },
  { id: 'match_018', phase: 'groups', group: 'I', teamA: 'Irak',                teamB: 'Noruega',             date: '2026-06-16T16:00:00', venue: 'Estadio Boston (Boston)',                     isOpen: false, result: null },
  { id: 'match_042', phase: 'groups', group: 'I', teamA: 'Francia',             teamB: 'Irak',                date: '2026-06-22T15:00:00', venue: 'Estadio Filadelfia (Filadelfia)',              isOpen: false, result: null },
  { id: 'match_041', phase: 'groups', group: 'I', teamA: 'Noruega',             teamB: 'Senegal',             date: '2026-06-22T18:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',isOpen: false, result: null },
  { id: 'match_061', phase: 'groups', group: 'I', teamA: 'Noruega',             teamB: 'Francia',             date: '2026-06-26T13:00:00', venue: 'Estadio Boston (Boston)',                     isOpen: false, result: null },
  { id: 'match_062', phase: 'groups', group: 'I', teamA: 'Senegal',             teamB: 'Irak',                date: '2026-06-26T13:00:00', venue: 'Estadio de Toronto (Toronto)',                isOpen: false, result: null },

  // ── GRUPO J ──
  { id: 'match_019', phase: 'groups', group: 'J', teamA: 'Argentina',           teamB: 'Argelia',             date: '2026-06-16T19:00:00', venue: 'Estadio Kansas City (Kansas City)',           isOpen: false, result: null },
  { id: 'match_020', phase: 'groups', group: 'J', teamA: 'Austria',             teamB: 'Jordania',            date: '2026-06-16T22:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },
  { id: 'match_043', phase: 'groups', group: 'J', teamA: 'Argentina',           teamB: 'Austria',             date: '2026-06-22T11:00:00', venue: 'Estadio Dallas (Dallas)',                     isOpen: false, result: null },
  { id: 'match_044', phase: 'groups', group: 'J', teamA: 'Jordania',            teamB: 'Argelia',             date: '2026-06-22T21:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },
  { id: 'match_069', phase: 'groups', group: 'J', teamA: 'Argelia',             teamB: 'Austria',             date: '2026-06-27T20:00:00', venue: 'Estadio Kansas City (Kansas City)',           isOpen: false, result: null },
  { id: 'match_070', phase: 'groups', group: 'J', teamA: 'Jordania',            teamB: 'Argentina',           date: '2026-06-27T20:00:00', venue: 'Estadio Dallas (Dallas)',                     isOpen: false, result: null },

  // ── GRUPO K ──
  { id: 'match_023', phase: 'groups', group: 'K', teamA: 'Portugal',            teamB: 'RD Congo',            date: '2026-06-17T11:00:00', venue: 'Estadio Houston (Houston)',                   isOpen: false, result: null },
  { id: 'match_024', phase: 'groups', group: 'K', teamA: 'Uzbekistán',          teamB: 'Colombia',            date: '2026-06-17T20:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)', isOpen: false, result: null },
  { id: 'match_047', phase: 'groups', group: 'K', teamA: 'Portugal',            teamB: 'Uzbekistán',          date: '2026-06-23T11:00:00', venue: 'Estadio Houston (Houston)',                   isOpen: false, result: null },
  { id: 'match_048', phase: 'groups', group: 'K', teamA: 'Colombia',            teamB: 'RD Congo',            date: '2026-06-23T20:00:00', venue: 'Estadio Guadalajara (Guadalajara)',            isOpen: false, result: null },
  { id: 'match_071', phase: 'groups', group: 'K', teamA: 'Colombia',            teamB: 'Portugal',            date: '2026-06-27T17:30:00', venue: 'Estadio Miami (Miami)',                       isOpen: false, result: null },
  { id: 'match_072', phase: 'groups', group: 'K', teamA: 'RD Congo',            teamB: 'Uzbekistán',          date: '2026-06-27T17:30:00', venue: 'Estadio Atlanta (Atlanta)',                   isOpen: false, result: null },

  // ── GRUPO L ──
  { id: 'match_022', phase: 'groups', group: 'L', teamA: 'Inglaterra',          teamB: 'Croacia',             date: '2026-06-17T14:00:00', venue: 'Estadio Dallas (Dallas)',                     isOpen: false, result: null },
  { id: 'match_021', phase: 'groups', group: 'L', teamA: 'Ghana',               teamB: 'Panamá',              date: '2026-06-17T17:00:00', venue: 'Estadio de Toronto (Toronto)',                isOpen: false, result: null },
  { id: 'match_045', phase: 'groups', group: 'L', teamA: 'Inglaterra',          teamB: 'Ghana',               date: '2026-06-23T14:00:00', venue: 'Estadio Boston (Boston)',                     isOpen: false, result: null },
  { id: 'match_046', phase: 'groups', group: 'L', teamA: 'Panamá',              teamB: 'Croacia',             date: '2026-06-23T17:00:00', venue: 'Estadio de Toronto (Toronto)',                isOpen: false, result: null },
  { id: 'match_067', phase: 'groups', group: 'L', teamA: 'Panamá',              teamB: 'Inglaterra',          date: '2026-06-27T15:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',isOpen: false, result: null },
  { id: 'match_068', phase: 'groups', group: 'L', teamA: 'Croacia',             teamB: 'Ghana',               date: '2026-06-27T15:00:00', venue: 'Estadio Filadelfia (Filadelfia)',              isOpen: false, result: null },

  // ── DIECISEISAVOS DE FINAL (P73–P88) ──
  { id: 'match_073', phase: 'round_of_32', group: null, teamA: '2A',      teamB: '2B',      date: '2026-06-28T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',              isOpen: false, result: null },
  { id: 'match_076', phase: 'round_of_32', group: null, teamA: '1C',      teamB: '2F',      date: '2026-06-29T11:00:00', venue: 'Estadio Houston (Houston)',                      isOpen: false, result: null },
  { id: 'match_074', phase: 'round_of_32', group: null, teamA: '1E',      teamB: '3ABCDF',  date: '2026-06-29T14:30:00', venue: 'Estadio Boston (Boston)',                        isOpen: false, result: null },
  { id: 'match_075', phase: 'round_of_32', group: null, teamA: '1F',      teamB: '2C',      date: '2026-06-29T19:00:00', venue: 'Estadio Monterrey (Monterrey)',                  isOpen: false, result: null },
  { id: 'match_077', phase: 'round_of_32', group: null, teamA: '2E',      teamB: '2I',      date: '2026-06-30T11:00:00', venue: 'Estadio Dallas (Dallas)',                        isOpen: false, result: null },
  { id: 'match_078', phase: 'round_of_32', group: null, teamA: '1I',      teamB: '3CDFGH',  date: '2026-06-30T15:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',   isOpen: false, result: null },
  { id: 'match_079', phase: 'round_of_32', group: null, teamA: '1A',      teamB: '3CEFHI',  date: '2026-06-30T19:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)',    isOpen: false, result: null },
  { id: 'match_080', phase: 'round_of_32', group: null, teamA: '1L',      teamB: '3EHIJK',  date: '2026-07-01T10:00:00', venue: 'Estadio Atlanta (Atlanta)',                      isOpen: false, result: null },
  { id: 'match_081', phase: 'round_of_32', group: null, teamA: '1G',      teamB: '3AEHIJ',  date: '2026-07-01T14:00:00', venue: 'Estadio de Seattle (Seattle)',                   isOpen: false, result: null },
  { id: 'match_082', phase: 'round_of_32', group: null, teamA: '1D',      teamB: '3BEFIJ',  date: '2026-07-01T18:00:00', venue: 'Estadio de la Bahía de San Francisco (San Francisco)', isOpen: false, result: null },
  { id: 'match_083', phase: 'round_of_32', group: null, teamA: '1H',      teamB: '2J',      date: '2026-07-02T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',              isOpen: false, result: null },
  { id: 'match_084', phase: 'round_of_32', group: null, teamA: '2K',      teamB: '2L',      date: '2026-07-02T17:00:00', venue: 'Estadio de Toronto (Toronto)',                   isOpen: false, result: null },
  { id: 'match_085', phase: 'round_of_32', group: null, teamA: '1B',      teamB: '3EFGIJ',  date: '2026-07-02T21:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',         isOpen: false, result: null },
  { id: 'match_086', phase: 'round_of_32', group: null, teamA: '2D',      teamB: '2G',      date: '2026-07-03T12:00:00', venue: 'Estadio Dallas (Dallas)',                        isOpen: false, result: null },
  { id: 'match_087', phase: 'round_of_32', group: null, teamA: '1J',      teamB: '2H',      date: '2026-07-03T16:00:00', venue: 'Estadio Miami (Miami)',                          isOpen: false, result: null },
  { id: 'match_088', phase: 'round_of_32', group: null, teamA: '1K',      teamB: '3DEIJL',  date: '2026-07-03T19:30:00', venue: 'Estadio Kansas City (Kansas City)',              isOpen: false, result: null },

  // ── OCTAVOS DE FINAL (P89–P96) ──
  { id: 'match_089', phase: 'round_of_16', group: null, teamA: 'W74',     teamB: 'W77',     date: '2026-07-04T11:00:00', venue: 'Estadio Houston (Houston)',                      isOpen: false, result: null },
  { id: 'match_090', phase: 'round_of_16', group: null, teamA: 'W73',     teamB: 'W75',     date: '2026-07-04T15:00:00', venue: 'Estadio Filadelfia (Filadelfia)',                isOpen: false, result: null },
  { id: 'match_091', phase: 'round_of_16', group: null, teamA: 'W76',     teamB: 'W78',     date: '2026-07-05T14:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',   isOpen: false, result: null },
  { id: 'match_092', phase: 'round_of_16', group: null, teamA: 'W79',     teamB: 'W80',     date: '2026-07-05T18:00:00', venue: 'Estadio Ciudad de México (Ciudad de México)',    isOpen: false, result: null },
  { id: 'match_093', phase: 'round_of_16', group: null, teamA: 'W83',     teamB: 'W84',     date: '2026-07-06T13:00:00', venue: 'Estadio Dallas (Dallas)',                        isOpen: false, result: null },
  { id: 'match_094', phase: 'round_of_16', group: null, teamA: 'W81',     teamB: 'W82',     date: '2026-07-06T18:00:00', venue: 'Estadio de Seattle (Seattle)',                   isOpen: false, result: null },
  { id: 'match_095', phase: 'round_of_16', group: null, teamA: 'W86',     teamB: 'W88',     date: '2026-07-07T10:00:00', venue: 'Estadio Atlanta (Atlanta)',                      isOpen: false, result: null },
  { id: 'match_096', phase: 'round_of_16', group: null, teamA: 'W85',     teamB: 'W87',     date: '2026-07-07T14:00:00', venue: 'Estadio BC Place Vancouver (Vancouver)',         isOpen: false, result: null },

  // ── CUARTOS DE FINAL (P97–P100) ──
  { id: 'match_097', phase: 'quarters',    group: null, teamA: 'W89',     teamB: 'W90',     date: '2026-07-09T14:00:00', venue: 'Estadio Boston (Boston)',                        isOpen: false, result: null },
  { id: 'match_098', phase: 'quarters',    group: null, teamA: 'W93',     teamB: 'W94',     date: '2026-07-10T13:00:00', venue: 'Estadio Los Angeles (Los Ángeles)',              isOpen: false, result: null },
  { id: 'match_099', phase: 'quarters',    group: null, teamA: 'W91',     teamB: 'W92',     date: '2026-07-11T15:00:00', venue: 'Estadio Miami (Miami)',                          isOpen: false, result: null },
  { id: 'match_100', phase: 'quarters',    group: null, teamA: 'W95',     teamB: 'W96',     date: '2026-07-11T19:00:00', venue: 'Estadio Kansas City (Kansas City)',              isOpen: false, result: null },

  // ── SEMIFINALES (P101–P102) ──
  { id: 'match_101', phase: 'semis',       group: null, teamA: 'W97',     teamB: 'W98',     date: '2026-07-14T13:00:00', venue: 'Estadio Dallas (Dallas)',                        isOpen: false, result: null },
  { id: 'match_102', phase: 'semis',       group: null, teamA: 'W99',     teamB: 'W100',    date: '2026-07-15T13:00:00', venue: 'Estadio Atlanta (Atlanta)',                      isOpen: false, result: null },

  // ── TERCER PUESTO (P103) ──
  { id: 'match_103', phase: 'third_place', group: null, teamA: 'RU101',   teamB: 'RU102',   date: '2026-07-18T15:00:00', venue: 'Estadio Miami (Miami)',                          isOpen: false, result: null },

  // ── FINAL (P104) ──
  { id: 'match_104', phase: 'final',       group: null, teamA: 'W101',    teamB: 'W102',    date: '2026-07-19T13:00:00', venue: 'Estadio Nueva York/Nueva Jersey (Nueva York)',   isOpen: false, result: null },
];

// ── Importar ────────────────────────────────────────────────
let imported = 0;
let skipped  = 0;

console.log(`\n🌍 Importando ${MATCHES.length} partidos del Mundial 2026...\n`);

for (const match of MATCHES) {
  const ref = doc(db, 'matches', match.id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    console.log(`  ⏭  Ya existe: ${match.id} (${match.teamA} vs ${match.teamB})`);
    skipped++;
  } else {
    await setDoc(ref, match);
    console.log(`  ✅ Importado: ${match.id} — ${match.teamA} vs ${match.teamB} (${match.date.slice(0,10)})`);
    imported++;
  }
}

console.log(`\n✅ Importación completa.`);
console.log(`   Importados: ${imported}`);
console.log(`   Ya existían: ${skipped}`);
console.log(`   Total: ${MATCHES.length}\n`);

process.exit(0);
