// ============================================================
//  SCRIPT: Asignar pronósticos de grupos a cuentas de prueba
//
//  1. Para cada cuenta de prueba (isTestAccount + isPaid), genera
//     2 picks aleatorios (pero consistentes) por grupo de forma
//     que haya variación — unos aciertan más, otros menos.
//  2. Guarda el resultado en groupPredictions/{userId}.
//  3. Si los partidos de grupos ya tienen resultados asignados,
//     calcula y actualiza el campo teamAdvances en cada usuario
//     (usado como criterio de desempate en el ranking).
//
//  Uso:
//    node scripts/submitGroupPredictions.mjs <password-admin>
//
//  Flags opcionales:
//    --recalc-only   Solo recalcula teamAdvances (ya existen picks)
//    --dry-run       Muestra qué haría sin escribir nada
//
//  Ejemplos:
//    node scripts/submitGroupPredictions.mjs MiPass123
//    node scripts/submitGroupPredictions.mjs MiPass123 --recalc-only
//    node scripts/submitGroupPredictions.mjs MiPass123 --dry-run
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
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
const RECALC_ONLY   = process.argv.includes('--recalc-only');
const DRY_RUN       = process.argv.includes('--dry-run');

if (!ADMIN_PASS) {
  console.error('❌ Debes pasar tu contraseña de admin como argumento.');
  console.error('   Ejemplo: node scripts/submitGroupPredictions.mjs MiPassword123');
  process.exit(1);
}

// ── Grupos del Mundial 2026 (12 grupos de 4 equipos) ─────────────────────────
const GROUPS = {
  A: ['México', 'Sudáfrica', 'República de Corea', 'Chequia'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['EE. UU.', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'RI de Irán', 'Nueva Zelanda'],
  H: ['España', 'Islas de Cabo Verde', 'Arabia Saudí', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

const GROUP_KEYS = Object.keys(GROUPS);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Hash simple para variación consistente por usuario+grupo
const simpleHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Selecciona 2 equipos pseudo-aleatorios de un grupo para un usuario dado.
// Usa el índice del usuario para crear más variación natural en el pool.
const pickTeamsForGroup = (userId, group, teams) => {
  const n = teams.length; // 4
  const seed = `${userId}_group_${group}`;
  const h = simpleHash(seed);

  // Índice del primer equipo
  const i1 = h % n;
  // Índice del segundo equipo (diferente al primero)
  const i2 = (h + simpleHash(seed + '_2')) % (n - 1);
  const j2 = i2 >= i1 ? i2 + 1 : i2;

  return [teams[i1], teams[j2]];
};

// Calcula tabla de posiciones de un grupo a partir de sus partidos
const calcGroupStandings = (groupMatches) => {
  const teams = {};
  const ensure = (name) => {
    if (!teams[name]) teams[name] = { name, pts: 0, gf: 0, ga: 0, gd: 0 };
  };
  for (const m of groupMatches) {
    if (!m.result) continue;
    const { teamAScore: ga, teamBScore: gb } = m.result;
    ensure(m.teamA); ensure(m.teamB);
    teams[m.teamA].gf += ga; teams[m.teamA].ga += gb;
    teams[m.teamB].gf += gb; teams[m.teamB].ga += ga;
    if (ga > gb)       { teams[m.teamA].pts += 3; }
    else if (gb > ga)  { teams[m.teamB].pts += 3; }
    else               { teams[m.teamA].pts += 1; teams[m.teamB].pts += 1; }
  }
  return Object.values(teams)
    .map(t => ({ ...t, gd: t.gf - t.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
};

// ── Init ──────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log('\n🏟️  Script de pronósticos de grupos');
if (RECALC_ONLY) console.log('   Modo: solo recalcular teamAdvances');
if (DRY_RUN)     console.log('   ⚠️  DRY-RUN: muestra sin guardar');
console.log('\n' + '─'.repeat(55));

// ── 1. Autenticar ─────────────────────────────────────────────────────────────
console.log('\n🔐 Autenticando como admin...');
await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
console.log('✅ Autenticado\n');

// ── 2. Cargar usuarios de prueba ──────────────────────────────────────────────
console.log('👥 Cargando cuentas de prueba...');
const usersSnap = await getDocs(
  query(collection(db, 'users'), where('isTestAccount', '==', true))
);
const testUsers = usersSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(u => u.isPaid);

if (testUsers.length === 0) {
  console.log('⚠️  No se encontraron cuentas de prueba pagadas.\n');
  process.exit(0);
}
console.log(`   Encontrados: ${testUsers.length} usuario(s) de prueba\n`);

// ── 3. Asignar picks de grupos ────────────────────────────────────────────────
if (!RECALC_ONLY) {
  console.log('─'.repeat(55));
  console.log(`\n📝 Asignando picks de grupos (${GROUP_KEYS.length} grupos × 2 equipos cada uno)...\n`);

  let savedCount = 0;
  let skippedCount = 0;

  for (const [ui, user] of testUsers.entries()) {
    process.stdout.write(`[${String(ui+1).padStart(2)}/${testUsers.length}] ${user.displayName.padEnd(25)} `);

    // Generar picks para los 12 grupos
    const picks = {};
    for (const group of GROUP_KEYS) {
      const teams = GROUPS[group];
      picks[group] = pickTeamsForGroup(user.id, group, teams);
    }

    if (DRY_RUN) {
      console.log(`⏭  (dry-run) picks generados`);
      continue;
    }

    try {
      await setDoc(doc(db, 'groupPredictions', user.id), {
        picks,
        updatedAt: new Date().toISOString(),
        totalPicks: 24,
      });
      savedCount++;
      console.log(`✅ 24 picks guardados`);
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  if (!DRY_RUN) {
    console.log(`\n   Total guardados: ${savedCount} usuarios`);
  }
}

// ── 4. Calcular teamAdvances si hay resultados de grupos ──────────────────────
console.log('\n' + '─'.repeat(55));
console.log('\n📊 Calculando teamAdvances con base en resultados de grupos...\n');

// Cargar partidos de grupos con resultado
const groupMatchesSnap = await getDocs(
  query(collection(db, 'matches'), where('phase', '==', 'groups'))
);
const groupMatches = groupMatchesSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(m => m.result);

if (groupMatches.length === 0) {
  console.log('⚠️  Aún no hay partidos de grupos con resultado.');
  console.log('   Corre primero: node scripts/submitTestPredictions.mjs TuPass --phase groups');
  console.log('\n   Los picks de grupos fueron guardados y teamAdvances se actualizará');
  console.log('   cuando corras este script nuevamente después de asignar resultados.\n');
  process.exit(0);
}

// Calcular qué equipos avanzaron realmente (1° y 2° de cada grupo)
const advancedTeams   = new Set();
const advancingByGroup = {}; // { A: ['team1','team2'], B: [...], ... }

for (const group of GROUP_KEYS) {
  const gMatches = groupMatches.filter(m => m.group === group);
  if (gMatches.length === 0) continue;

  const table = calcGroupStandings(gMatches);

  const first  = table[0]?.name;
  const second = table[1]?.name;

  advancingByGroup[group] = [first, second].filter(Boolean);
  if (first)  advancedTeams.add(first);
  if (second) advancedTeams.add(second);
}

console.log(`   Partidos con resultado: ${groupMatches.length}`);
console.log(`   Equipos clasificados detectados: ${advancedTeams.size}`);
if (advancedTeams.size > 0) {
  console.log(`   → ${[...advancedTeams].slice(0, 8).join(', ')}${advancedTeams.size > 8 ? ` ... (+${advancedTeams.size - 8} más)` : ''}`);
}
console.log('');

if (advancedTeams.size === 0) {
  console.log('⚠️  No se pudieron determinar equipos clasificados todavía.\n');
  process.exit(0);
}

// ── 4b. Guardar advancing en config/groupPicks para que el modal lo lea ───────
if (!DRY_RUN) {
  await setDoc(doc(db, 'config', 'groupPicks'), {
    advancing: advancingByGroup,
    advancingUpdatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('✅ Clasificados guardados en config/groupPicks.advancing\n');
} else {
  console.log('⏭  (dry-run) config/groupPicks.advancing no modificado\n');
}

// ── 4c. Cargar todos los groupPredictions en una sola query ──────────────────
console.log('🔢 Calculando aciertos de desempate por usuario...\n');

const gpSnap = await getDocs(collection(db, 'groupPredictions'));
const gpMap  = {};
gpSnap.docs.forEach(d => { gpMap[d.id] = d.data().picks || {}; });

let updatedUsers = 0;
const results = [];

for (const user of testUsers) {
  const userPicks = gpMap[user.id] || null;

  if (!userPicks) {
    results.push({ name: user.displayName, advances: 0, note: 'sin picks' });
    continue;
  }

  let advances = 0;
  for (const group of GROUP_KEYS) {
    for (const pickedTeam of (userPicks[group] || [])) {
      if (advancedTeams.has(pickedTeam)) advances++;
    }
  }

  results.push({ name: user.displayName, id: user.id, advances });

  if (!DRY_RUN) {
    await setDoc(doc(db, 'users', user.id), { teamAdvances: advances }, { merge: true });
    updatedUsers++;
  }
}

// Mostrar tabla de resultados
results.sort((a, b) => b.advances - a.advances);
console.log('   Pos  Jugador                      Desempate');
console.log('   ───  ───────────────────────────  ─────────');
results.forEach((r, i) => {
  const bar = '█'.repeat(r.advances) + '░'.repeat(Math.max(0, 24 - r.advances));
  console.log(`   ${String(i+1).padStart(3)}  ${r.name.padEnd(29)}  ${String(r.advances).padStart(2)}/24  ${r.note || ''}`);
});

if (!DRY_RUN) {
  console.log(`\n✅ teamAdvances actualizado para ${updatedUsers} usuario(s)`);
}

// ── Resumen ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log('\n✅ COMPLETADO\n');
console.log('📌 QUÉ REVISAR EN LA APP:');
console.log('   • Ranking → cuando haya empate en puntos, el orden debe');
console.log('     cambiar según teamAdvances (más aciertos de grupos = mejor posición)');
console.log('   • Botón "Números para Desempatar" → muestra el pronóstico de cada jugador');
console.log('\n   Para volver a calcular después de nuevos resultados:');
console.log('   node scripts/submitGroupPredictions.mjs TuPass --recalc-only\n');

process.exit(0);
