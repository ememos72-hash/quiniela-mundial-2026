// ============================================================
//  SCRIPT: Simular predicciones Y resultados de partidos
//
//  1. Inicia sesión como cada usuario de prueba y entrega
//     predicciones aleatorias en todos los partidos abiertos.
//  2. Asigna resultados random a esos partidos (como admin).
//  3. Recalcula puntos para todos los usuarios afectados.
//
//  Uso:
//    node scripts/submitTestPredictions.mjs <password-admin>
//
//  Flags opcionales:
//    --predictions-only   Solo entrega predicciones, no asigna resultados
//    --results-only       Solo asigna resultados (ya existen predicciones)
//    --phase groups       Solo procesa partidos de una fase específica
//                         Fases: groups, round_of_32, round_of_16,
//                                quarters, semis, third_place, final
//  Ejemplos:
//    node scripts/submitTestPredictions.mjs MiPass123
//    node scripts/submitTestPredictions.mjs MiPass123 --predictions-only
//    node scripts/submitTestPredictions.mjs MiPass123 --results-only
//    node scripts/submitTestPredictions.mjs MiPass123 --phase groups
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKRERWLV1ZX1uEGQB006c02S3chuJVSdo",
  authDomain: "quiniela---mundial-2026.firebaseapp.com",
  projectId: "quiniela---mundial-2026",
  storageBucket: "quiniela---mundial-2026.firebasestorage.app",
  messagingSenderId: "735911362707",
  appId: "1:735911362707:web:eaf12c2871b1cb09f20d66",
};

const ADMIN_EMAIL = 'ememos72@gmail.com';
const ADMIN_PASS  = process.argv[2] || '';

const ONLY_PREDICTIONS = process.argv.includes('--predictions-only');
const ONLY_RESULTS     = process.argv.includes('--results-only');
const PHASE_FLAG_IDX   = process.argv.indexOf('--phase');
const FILTER_PHASE     = PHASE_FLAG_IDX !== -1 ? process.argv[PHASE_FLAG_IDX + 1] : null;

// Fases donde cuenta marcador exacto (igual que en src/data/worldCupData.js)
const EXACT_SCORE_PHASES = ['round_of_32', 'round_of_16', 'quarters', 'semis', 'third_place', 'final'];
const POINTS_CORRECT = 3;
const POINTS_EXACT   = 5;

if (!ADMIN_PASS) {
  console.error('❌ Debes pasar tu contraseña de admin como argumento.');
  console.error('   Ejemplo: node scripts/submitTestPredictions.mjs MiPassword123');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Hash simple para generar variación consistente por usuario+partido
const simpleHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Genera un marcador aleatorio (0-4 goles por equipo, ponderado hacia scores reales)
const randomScore = (seed) => {
  const scores = [
    [0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1],[1,2],
    [2,2],[3,0],[0,3],[3,1],[1,3],[3,2],[2,3],[4,0],
    [0,4],[4,1],[1,4],[4,2],[2,4],[3,3],[4,3],[3,4],
  ];
  // Los marcadores más comunes tienen más peso
  const weights = [4,8,8,6,7,7,8,8,4,4,4,5,5,4,4,2,2,2,2,2,2,2,1,1];
  const total = weights.reduce((a,b) => a+b, 0);
  let r = simpleHash(seed + 'score') % total;
  for (let i = 0; i < scores.length; i++) {
    r -= weights[i];
    if (r < 0) return { teamAScore: scores[i][0], teamBScore: scores[i][1] };
  }
  return { teamAScore: 1, teamBScore: 0 };
};

// Derivar ganador del marcador
const getWinner = (a, b) => a > b ? 'teamA' : b > a ? 'teamB' : 'draw';

// Calcular puntos (replica calculatePredictionPoints de utils/points.js)
const calcPoints = (pred, match) => {
  if (!match.result || !pred) return 0;
  const realResult = getWinner(match.result.teamAScore, match.result.teamBScore);
  let pts = 0;
  if (pred.result === realResult) pts += POINTS_CORRECT;
  if (
    EXACT_SCORE_PHASES.includes(match.phase) &&
    pred.teamAScore !== undefined &&
    pred.teamBScore !== undefined &&
    pred.teamAScore === match.result.teamAScore &&
    pred.teamBScore === match.result.teamBScore
  ) pts += POINTS_EXACT;
  return pts;
};

// ── Init ──────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log('\n⚽ Script de simulación de predicciones y resultados');
if (ONLY_PREDICTIONS) console.log('   Modo: solo predicciones');
if (ONLY_RESULTS)     console.log('   Modo: solo resultados');
if (FILTER_PHASE)     console.log(`   Fase filtro: ${FILTER_PHASE}`);
console.log('\n' + '─'.repeat(55));

// ── 1. Autenticar como admin ──────────────────────────────────────────────────
console.log('\n🔐 Autenticando como admin...');
await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
console.log('✅ Autenticado\n');

// ── 2. Cargar partidos abiertos ───────────────────────────────────────────────
console.log('📋 Cargando partidos abiertos...');
const matchesSnap = await getDocs(
  query(collection(db, 'matches'), where('isOpen', '==', true))
);

let openMatches = matchesSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(m => !m.result); // Sin resultado todavía

if (FILTER_PHASE) {
  openMatches = openMatches.filter(m => m.phase === FILTER_PHASE);
}

if (openMatches.length === 0) {
  console.log('⚠️  No hay partidos abiertos sin resultado.');
  if (FILTER_PHASE) console.log(`   (Filtrando por fase: ${FILTER_PHASE})`);
  console.log('   Asegúrate de abrir partidos desde el Admin Panel primero.\n');
  process.exit(0);
}

console.log(`   Encontrados: ${openMatches.length} partido(s) abierto(s)`);
openMatches.forEach(m => console.log(`   • ${m.id}: ${m.teamA} vs ${m.teamB} [${m.phase}]`));

// ── 3. Cargar usuarios de prueba pagados ──────────────────────────────────────
console.log('\n👥 Cargando usuarios de prueba...');
const usersSnap = await getDocs(
  query(collection(db, 'users'), where('isTestAccount', '==', true))
);

const testUsers = usersSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(u => u.isPaid); // Solo los marcados como pagados

if (testUsers.length === 0) {
  console.log('⚠️  No se encontraron cuentas de prueba marcadas como Pagadas.');
  console.log('   Ve al Admin Panel → Jugadores y marca los test_* como Pagado.\n');
  process.exit(0);
}

console.log(`   Encontrados: ${testUsers.length} usuario(s) de prueba pagados`);

await signOut(auth);

// ── 4. Entregar predicciones ──────────────────────────────────────────────────
if (!ONLY_RESULTS) {
  console.log('\n' + '─'.repeat(55));
  console.log(`\n📝 Entregando predicciones (${testUsers.length} usuarios × ${openMatches.length} partidos)...\n`);

  let totalPreds = 0;
  let skippedPreds = 0;

  for (const [ui, user] of testUsers.entries()) {
    process.stdout.write(`[${String(ui+1).padStart(2)}/${testUsers.length}] ${user.displayName.padEnd(25)} `);

    try {
      // Iniciar sesión como este usuario
      await signInWithEmailAndPassword(auth, user.email, 'TestPass1234!');

      // Verificar predicciones existentes para no duplicar
      const existingPreds = new Set();
      const existSnap = await getDocs(
        query(collection(db, 'predictions'), where('userId', '==', user.id))
      );
      existSnap.docs.forEach(d => existingPreds.add(d.data().matchId));

      // Preparar predicciones en batch (máx 500 por batch)
      let batch = writeBatch(db);
      let batchCount = 0;
      let userPreds = 0;
      let userSkipped = 0;

      for (const match of openMatches) {
        if (existingPreds.has(match.id)) {
          userSkipped++;
          continue;
        }

        const seed = `${user.id}_${match.id}`;
        const score = randomScore(seed);
        const result = getWinner(score.teamAScore, score.teamBScore);

        const predData = {
          matchId:      match.id,
          userId:       user.id,
          result,                          // 'teamA' | 'teamB' | 'draw'
          teamAScore:   score.teamAScore,
          teamBScore:   score.teamBScore,
          pointsAwarded: 0,
          createdAt:    new Date().toISOString(),
        };

        const predRef = doc(db, 'predictions', `${user.id}_${match.id}`);
        batch.set(predRef, predData);
        batchCount++;
        userPreds++;

        // Firebase batch limit: 500 ops
        if (batchCount >= 490) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) await batch.commit();

      totalPreds   += userPreds;
      skippedPreds += userSkipped;

      const status = userSkipped > 0 ? `✅ ${userPreds} nuevas, ${userSkipped} ya existían` : `✅ ${userPreds} predicciones`;
      console.log(status);

    } catch (err) {
      console.log(`❌ ${err.message}`);
    }

    await signOut(auth);
  }

  console.log(`\n   Total predicciones guardadas: ${totalPreds}`);
  if (skippedPreds > 0) console.log(`   Ya existían (omitidas): ${skippedPreds}`);
}

// ── 5. Asignar resultados random ──────────────────────────────────────────────
if (!ONLY_PREDICTIONS) {
  console.log('\n' + '─'.repeat(55));
  console.log('\n🏆 Asignando resultados a los partidos...\n');

  // Volver a autenticar como admin
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);

  const affectedUsers = new Map(); // userId → { totalPoints, correctResults, exactScores }

  for (const match of openMatches) {
    const seed = `match_result_${match.id}`;
    const score = randomScore(seed);
    const winner = getWinner(score.teamAScore, score.teamBScore);
    const result = { teamAScore: score.teamAScore, teamBScore: score.teamBScore, winner };

    // Actualizar partido
    await updateDoc(doc(db, 'matches', match.id), { result, isOpen: false });
    console.log(`   ⚽ ${match.teamA} ${score.teamAScore} - ${score.teamBScore} ${match.teamB}`);

    // Recalcular puntos de todas las predicciones para este partido
    const predsSnap = await getDocs(
      query(collection(db, 'predictions'), where('matchId', '==', match.id))
    );

    const matchWithResult = { ...match, result };

    for (const predDoc of predsSnap.docs) {
      const pred = predDoc.data();
      const pts  = calcPoints(pred, matchWithResult);

      // Actualizar pointsAwarded en la predicción
      await updateDoc(doc(db, 'predictions', predDoc.id), { pointsAwarded: pts });

      // Acumular para recalcular totales del usuario
      if (!affectedUsers.has(pred.userId)) {
        affectedUsers.set(pred.userId, { delta: 0, correct: 0, exact: 0 });
      }
      const u = affectedUsers.get(pred.userId);
      u.delta   += pts;
      if (pts >= POINTS_CORRECT)                u.correct++;  // todos los aciertos de resultado
      if (pts >= POINTS_CORRECT + POINTS_EXACT) u.exact++;   // solo marcador exacto (5pts)
    }
  }

  // Recalcular totales de usuarios afectados
  if (affectedUsers.size > 0) {
    console.log(`\n📊 Recalculando puntos totales para ${affectedUsers.size} usuario(s)...`);

    // Mejor práctica: recalcular desde TODAS las predicciones (no solo el delta)
    // para evitar inconsistencias si se corre el script múltiples veces
    const allPreds = await getDocs(collection(db, 'predictions'));

    const totals = new Map();
    allPreds.docs.forEach(d => {
      const p = d.data();
      if (!totals.has(p.userId)) totals.set(p.userId, { totalPoints: 0, correctResults: 0, exactScores: 0 });
      const t = totals.get(p.userId);
      const pts = p.pointsAwarded || 0;
      t.totalPoints += pts;
      if (pts >= POINTS_CORRECT)                 t.correctResults++;  // todos los aciertos de resultado
      if (pts >= POINTS_CORRECT + POINTS_EXACT)  t.exactScores++;     // solo marcador exacto (5pts)
    });

    for (const [userId] of affectedUsers) {
      const t = totals.get(userId) || { totalPoints: 0, correctResults: 0, exactScores: 0 };
      await setDoc(doc(db, 'users', userId), {
        totalPoints:    t.totalPoints,
        correctResults: t.correctResults,
        exactScores:    t.exactScores,
      }, { merge: true });
    }

    console.log('   ✅ Puntos actualizados');
  }

  await signOut(auth);
}

// ── Resumen ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log('\n✅ SIMULACIÓN COMPLETADA\n');
console.log(`   Partidos procesados: ${openMatches.length}`);
console.log(`   Usuarios de prueba:  ${testUsers.length}`);
console.log('\n📌 QUÉ REVISAR EN LA APP:');
console.log('   • Ranking general → los usuarios de prueba deben aparecer con puntos');
console.log('   • Partidos → los resultados asignados deben mostrarse');
console.log('   • Predicciones de cada usuario → deben tener puntos calculados');
console.log('   • Quiniela Flash → si hay una activa, debe reflejar puntos del periodo');
console.log('\n   Cuando termines: node scripts/cleanupTest.mjs TuPassword\n');

process.exit(0);
