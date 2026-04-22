// ============================================================
//  SCRIPT: Avanzar a la siguiente fase
//
//  Lee los resultados de la fase de grupos, calcula la tabla
//  de posiciones real (puntos, diferencia de goles, goles a favor),
//  determina quién quedó 1°, 2° y 3° en cada grupo, actualiza
//  los partidos de Dieciseisavos con los nombres reales de equipos,
//  y los abre para predicciones.
//
//  Luego puedes correr:
//    node scripts/submitTestPredictions.mjs TuPass --phase round_of_32
//
//  Uso:
//    node scripts/advancePhase.mjs <password-admin> [fase-destino]
//
//  Fases destino disponibles:
//    round_of_32   (default) — Dieciseisavos
//    round_of_16             — Octavos
//    quarters                — Cuartos
//    semis                   — Semifinales
//    third_place             — Tercer puesto
//    final                   — Final
//
//  Ejemplos:
//    node scripts/advancePhase.mjs MiPass123
//    node scripts/advancePhase.mjs MiPass123 round_of_32
//    node scripts/advancePhase.mjs MiPass123 round_of_16
//
//  Flags:
//    --dry-run   Muestra qué haría sin escribir nada
//    --open      Además de actualizar equipos, abre los partidos (isOpen: true)
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, getDocs, query, where, doc, updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKRERWLV1ZX1uEGQB006c02S3chuJVSdo",
  authDomain: "quiniela---mundial-2026.firebaseapp.com",
  projectId: "quiniela---mundial-2026",
  storageBucket: "quiniela---mundial-2026.firebasestorage.app",
  messagingSenderId: "735911362707",
  appId: "1:735911362707:web:eaf12c2871b1cb09f20d66",
};

const ADMIN_EMAIL   = 'ememos72@gmail.com';
const ADMIN_PASS    = process.argv[2] || '';
const TARGET_PHASE  = process.argv[3] || 'round_of_32';
const DRY_RUN       = process.argv.includes('--dry-run');
const OPEN_MATCHES  = process.argv.includes('--open');

if (!ADMIN_PASS) {
  console.error('❌ Uso: node scripts/advancePhase.mjs <password> [fase]');
  process.exit(1);
}

// ── Mapeo de fases → fase origen ─────────────────────────────────────────────
const SOURCE_PHASE = {
  round_of_32:  'groups',
  round_of_16:  'round_of_32',
  quarters:     'round_of_16',
  semis:        'quarters',
  third_place:  'semis',
  final:        'semis',
};

// ── Cuadro de Dieciseisavos: slots → partidos ─────────────────────────────────
// Cada entrada describe qué slot ocupa teamA y teamB en cada partido.
// Los slots "3XXXXX" indican "mejor 3ro de esos grupos".
const ROUND_OF_32_BRACKET = [
  { id: 'match_073', slotA: '1',  groupA: 'A', posA: 2,  slotB: '2',  groupB: 'B', posB: 2  }, // 2A vs 2B  → wait, teamA: '2A' = 2nd of A
  { id: 'match_076', slotA: '1',  groupA: 'C', posA: 1,  slotB: '2',  groupB: 'F', posB: 2  }, // 1C vs 2F
  { id: 'match_074', slotA: '1',  groupA: 'E', posA: 1,  slotB: '3',  groupB: 'ABCDF'       }, // 1E vs 3rd(ABCDF)
  { id: 'match_075', slotA: '1',  groupA: 'F', posA: 1,  slotB: '2',  groupB: 'C', posB: 2  }, // 1F vs 2C
  { id: 'match_077', slotA: '2',  groupA: 'E', posA: 2,  slotB: '2',  groupB: 'I', posB: 2  }, // 2E vs 2I  → wait no, let me re-read
  { id: 'match_078', slotA: '1',  groupA: 'I', posA: 1,  slotB: '3',  groupB: 'CDFGH'       }, // 1I vs 3rd(CDFGH)
  { id: 'match_079', slotA: '1',  groupA: 'A', posA: 1,  slotB: '3',  groupB: 'CEFHI'       }, // 1A vs 3rd(CEFHI)
  { id: 'match_080', slotA: '1',  groupA: 'L', posA: 1,  slotB: '3',  groupB: 'EHIJK'       }, // 1L vs 3rd(EHIJK)
  { id: 'match_081', slotA: '1',  groupA: 'G', posA: 1,  slotB: '3',  groupB: 'AEHIJ'       }, // 1G vs 3rd(AEHIJ)
  { id: 'match_082', slotA: '1',  groupA: 'D', posA: 1,  slotB: '3',  groupB: 'BEFIJ'       }, // 1D vs 3rd(BEFIJ)
  { id: 'match_083', slotA: '1',  groupA: 'H', posA: 1,  slotB: '2',  groupB: 'J', posB: 2  }, // 1H vs 2J
  { id: 'match_084', slotA: '2',  groupA: 'K', posA: 2,  slotB: '2',  groupB: 'L', posB: 2  }, // 2K vs 2L → wait
  { id: 'match_085', slotA: '1',  groupA: 'B', posA: 1,  slotB: '3',  groupB: 'EFGIJ'       }, // 1B vs 3rd(EFGIJ)
  { id: 'match_086', slotA: '2',  groupA: 'D', posA: 2,  slotB: '2',  groupB: 'G', posB: 2  }, // 2D vs 2G
  { id: 'match_087', slotA: '1',  groupA: 'J', posA: 1,  slotB: '2',  groupB: 'H', posB: 2  }, // 1J vs 2H
  { id: 'match_088', slotA: '1',  groupA: 'K', posA: 1,  slotB: '3',  groupB: 'DEIJL'       }, // 1K vs 3rd(DEIJL)
];

// ── Calcular tabla de un grupo ────────────────────────────────────────────────
const calcGroupStandings = (groupMatches) => {
  const teams = {};

  const ensureTeam = (name) => {
    if (!teams[name]) teams[name] = { name, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };
  };

  for (const m of groupMatches) {
    if (!m.result) continue;
    const { teamAScore: ga, teamBScore: gb } = m.result;
    ensureTeam(m.teamA);
    ensureTeam(m.teamB);

    teams[m.teamA].played++;
    teams[m.teamB].played++;
    teams[m.teamA].gf += ga;
    teams[m.teamA].ga += gb;
    teams[m.teamB].gf += gb;
    teams[m.teamB].ga += ga;

    if (ga > gb) {
      teams[m.teamA].pts += 3;
    } else if (gb > ga) {
      teams[m.teamB].pts += 3;
    } else {
      teams[m.teamA].pts += 1;
      teams[m.teamB].pts += 1;
    }
  }

  // Calcular GD y ordenar
  return Object.values(teams)
    .map(t => ({ ...t, gd: t.gf - t.ga }))
    .sort((a, b) =>
      b.pts - a.pts ||
      b.gd  - a.gd  ||
      b.gf  - a.gf  ||
      a.name.localeCompare(b.name)
    );
};

// ── Init ──────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log(`\n🏆 Calculando clasificados para: ${TARGET_PHASE.toUpperCase()}`);
if (DRY_RUN)    console.log('   ⚠️  DRY-RUN: solo muestra, no escribe');
if (OPEN_MATCHES) console.log('   📂 --open: también abrirá los partidos para predicciones');
console.log('\n' + '─'.repeat(55));

console.log('\n🔐 Autenticando...');
await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
console.log('✅ Autenticado\n');

// ── Cargar todos los partidos ─────────────────────────────────────────────────
const allMatchesSnap = await getDocs(collection(db, 'matches'));
const allMatches = allMatchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

// ── FASE DE GRUPOS → DIECISEISAVOS ────────────────────────────────────────────
if (TARGET_PHASE === 'round_of_32') {

  const groupMatches = allMatches.filter(m => m.phase === 'groups');
  const matchesWithResult = groupMatches.filter(m => m.result);

  if (matchesWithResult.length === 0) {
    console.log('❌ No hay partidos de grupos con resultado todavía.');
    console.log('   Corre primero: node scripts/submitTestPredictions.mjs --phase groups');
    process.exit(1);
  }

  // Calcular tabla por grupo
  console.log('📊 Tabla de posiciones por grupo:\n');
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const standings = {}; // groupLetter → [1°, 2°, 3°, 4°]

  for (const g of GROUPS) {
    const gMatches = groupMatches.filter(m => m.group === g);
    const table = calcGroupStandings(gMatches);
    standings[g] = table;

    if (table.length > 0) {
      console.log(`  Grupo ${g}:`);
      table.forEach((t, i) => {
        const medal = ['🥇','🥈','🥉','  '][i] || '  ';
        console.log(`    ${medal} ${t.name.padEnd(22)} ${t.pts}pts  GD:${String(t.gd).padStart(3)}  GF:${t.gf}`);
      });
    } else {
      console.log(`  Grupo ${g}: sin resultados todavía`);
    }
    console.log('');
  }

  // Recopilar 3ros clasificados (para los slots 3XXXXX)
  const thirdPlaceTeams = GROUPS
    .map(g => standings[g]?.[2] ? { ...standings[g][2], group: g } : null)
    .filter(Boolean)
    .sort((a, b) =>
      b.pts - a.pts ||
      b.gd  - a.gd  ||
      b.gf  - a.gf  ||
      a.name.localeCompare(b.name)
    );

  console.log('🥉 Mejores 3ros clasificados (ranking):');
  thirdPlaceTeams.forEach((t, i) => {
    console.log(`   ${i+1}. ${t.name} (Grupo ${t.group}) — ${t.pts}pts GD:${t.gd} GF:${t.gf}`);
  });

  // Asignar 3ros a los slots
  // Para cada slot "3XXXXX", selecciona el mejor 3ro disponible de esos grupos
  const assignThirdPlace = (groupLetters) => {
    const eligible = thirdPlaceTeams.filter(t => groupLetters.includes(t.group));
    // Toma el mejor que aún no fue asignado
    const pick = eligible.find(t => !t._assigned);
    if (pick) {
      pick._assigned = true;
      return pick.name;
    }
    // Fallback: devuelve el mejor disponible globalmente
    const fallback = thirdPlaceTeams.find(t => !t._assigned);
    if (fallback) { fallback._assigned = true; return fallback.name; }
    return '???';
  };

  // Construir el mapeo real de cada partido
  console.log('\n' + '─'.repeat(55));
  console.log('\n🔄 Cuadro de Dieciseisavos:\n');

  const round32Matches = allMatches.filter(m => m.phase === 'round_of_32');
  const updates = [];

  // Mapa slot → nombre real
  const resolveSlot = (originalSlot) => {
    // Formato "1X" → 1er lugar grupo X
    const m1 = originalSlot.match(/^1([A-L])$/);
    if (m1) return standings[m1[1]]?.[0]?.name || originalSlot;

    // Formato "2X" → 2do lugar grupo X
    const m2 = originalSlot.match(/^2([A-L])$/);
    if (m2) return standings[m2[1]]?.[1]?.name || originalSlot;

    // Formato "3XXXXX" → mejor 3ro de esos grupos
    const m3 = originalSlot.match(/^3([A-L]+)$/);
    if (m3) return assignThirdPlace(m3[1].split(''));

    return originalSlot; // si no matchea, dejar como está
  };

  for (const match of round32Matches) {
    const newTeamA = resolveSlot(match.teamA);
    const newTeamB = resolveSlot(match.teamB);
    const changed = newTeamA !== match.teamA || newTeamB !== match.teamB;

    console.log(`   ${match.id}: ${newTeamA.padEnd(22)} vs ${newTeamB}`);
    if (changed) updates.push({ id: match.id, teamA: newTeamA, teamB: newTeamB });
  }

  // Escribir cambios
  if (!DRY_RUN && updates.length > 0) {
    console.log(`\n💾 Guardando ${updates.length} actualizaciones...`);
    for (const u of updates) {
      const updateData = { teamA: u.teamA, teamB: u.teamB };
      if (OPEN_MATCHES) updateData.isOpen = true;
      await updateDoc(doc(db, 'matches', u.id), updateData);
    }
    console.log('✅ Partidos actualizados con equipos reales');
    if (OPEN_MATCHES) console.log('📂 Partidos abiertos para predicciones');
  } else if (DRY_RUN) {
    console.log('\n   (DRY-RUN: no se guardó nada)');
  }

} else {
  // ── FASES DE ELIMINACIÓN DIRECTA ─────────────────────────────────────────
  // Para octavos en adelante: el ganador de cada partido (WXX) avanza al siguiente

  const sourcePhase = SOURCE_PHASE[TARGET_PHASE];
  if (!sourcePhase) {
    console.error(`❌ Fase no reconocida: ${TARGET_PHASE}`);
    process.exit(1);
  }

  const sourceMatches = allMatches.filter(m => m.phase === sourcePhase && m.result);
  const targetMatches = allMatches.filter(m => m.phase === TARGET_PHASE);

  if (sourceMatches.length === 0) {
    console.log(`❌ No hay partidos de ${sourcePhase} con resultado.`);
    process.exit(1);
  }

  // Mapa: matchId → ganador
  const winners = {};
  for (const m of sourceMatches) {
    const { teamAScore: a, teamBScore: b } = m.result;
    // En eliminación no hay empate — si hay empate en el resultado simulado, teamA gana
    winners[m.id] = a >= b ? m.teamA : m.teamB;
  }

  console.log(`\n🏆 Ganadores de ${sourcePhase}:\n`);
  Object.entries(winners).forEach(([id, winner]) => {
    console.log(`   ${id} → ${winner}`);
  });

  // Resolver slots "WXX" y "RUXX" (perdedor, para 3er puesto)
  const resolveKnockoutSlot = (slot) => {
    const mW  = slot.match(/^W(\d+)$/);
    if (mW) {
      const matchId = `match_${mW[1].padStart(3, '0')}`;
      return winners[matchId] || slot;
    }
    const mRU = slot.match(/^RU(\d+)$/);
    if (mRU) {
      // Perdedor de ese partido
      const matchId = `match_${mRU[1].padStart(3, '0')}`;
      const m = sourceMatches.find(x => x.id === matchId);
      if (m) {
        const { teamAScore: a, teamBScore: b } = m.result;
        return a >= b ? m.teamB : m.teamA;
      }
      return slot;
    }
    return slot;
  };

  console.log(`\n🔄 Cuadro de ${TARGET_PHASE}:\n`);
  const updates = [];

  for (const match of targetMatches) {
    const newTeamA = resolveKnockoutSlot(match.teamA);
    const newTeamB = resolveKnockoutSlot(match.teamB);
    const changed = newTeamA !== match.teamA || newTeamB !== match.teamB;

    console.log(`   ${match.id}: ${newTeamA.padEnd(22)} vs ${newTeamB}`);
    if (changed) updates.push({ id: match.id, teamA: newTeamA, teamB: newTeamB });
  }

  if (!DRY_RUN && updates.length > 0) {
    console.log(`\n💾 Guardando ${updates.length} actualizaciones...`);
    for (const u of updates) {
      const updateData = { teamA: u.teamA, teamB: u.teamB };
      if (OPEN_MATCHES) updateData.isOpen = true;
      await updateDoc(doc(db, 'matches', u.id), updateData);
    }
    console.log('✅ Partidos actualizados');
    if (OPEN_MATCHES) console.log('📂 Partidos abiertos para predicciones');
  } else if (DRY_RUN) {
    console.log('\n   (DRY-RUN: no se guardó nada)');
  }
}

// ── Resumen final ─────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log('\n📌 PRÓXIMOS PASOS:\n');
if (!OPEN_MATCHES) {
  console.log(`   1. Revisa el cuadro arriba y si se ve bien, abre los partidos:`);
  console.log(`      node scripts/advancePhase.mjs TuPass ${TARGET_PHASE} --open`);
  console.log(`      O ábrelos manualmente desde el Admin Panel`);
} else {
  console.log(`   Los partidos de ${TARGET_PHASE} ya están abiertos.`);
}
console.log(`\n   2. Simula predicciones y resultados:`);
console.log(`      node scripts/submitTestPredictions.mjs TuPass --phase ${TARGET_PHASE}`);
console.log('');

process.exit(0);
