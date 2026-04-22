// ============================================================
//  SCRIPT: Resetear predicciones y puntos de la cuenta admin
//
//  Elimina todas las predicciones del admin y pone a cero
//  sus puntos en el documento de usuario.
//
//  Uso:
//    node scripts/resetAdminStats.mjs <password-admin>
//
//  Opciones:
//    --dry-run   Solo muestra qué se haría, sin modificar nada
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
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

const ADMIN_EMAIL = 'ememos72@gmail.com';
const ADMIN_PASS  = process.argv[2] || '';
const DRY_RUN     = process.argv.includes('--dry-run');

if (!ADMIN_PASS) {
  console.error('❌ Debes pasar tu contraseña de admin como argumento.');
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log('\n🔄 Resetear predicciones y puntos del admin');
if (DRY_RUN) console.log('   ⚠️  DRY-RUN activo');
console.log('─'.repeat(50));

console.log('\n🔐 Autenticando...');
const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
const adminUid = cred.user.uid;
console.log(`✅ Autenticado — UID: ${adminUid}\n`);

// ── 1. Borrar predicciones de partidos ────────────────────────────────────────
console.log('🗑️  Buscando predicciones del admin...');
const predsSnap = await getDocs(
  query(collection(db, 'predictions'), where('userId', '==', adminUid))
);

if (predsSnap.empty) {
  console.log('   ℹ️  No se encontraron predicciones.');
} else {
  for (const p of predsSnap.docs) {
    const d = p.data();
    console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} Eliminando predicción ${p.id} (partido: ${d.matchId})`);
    if (!DRY_RUN) await deleteDoc(doc(db, 'predictions', p.id));
  }
  console.log(`   Total: ${predsSnap.size} predicciones ${DRY_RUN ? 'a eliminar' : 'eliminadas'}`);
}

// ── 2. Borrar pronóstico de grupos (si existe) ────────────────────────────────
console.log('\n🗑️  Eliminando pronóstico de grupos del admin...');
try {
  if (!DRY_RUN) await deleteDoc(doc(db, 'groupPredictions', adminUid));
  console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} groupPredictions/${adminUid} eliminado`);
} catch (err) {
  if (err.code === 'not-found') {
    console.log('   ℹ️  No existía pronóstico de grupos.');
  } else {
    console.log(`   ⚠️  ${err.message}`);
  }
}

// ── 3. Resetear puntos en el documento de usuario ────────────────────────────
console.log('\n🔄 Reseteando puntos en users/' + adminUid + '...');
if (!DRY_RUN) {
  await updateDoc(doc(db, 'users', adminUid), {
    totalPoints:   0,
    teamAdvances:  0,
    correctResults: 0,
    exactScores:   0,
  });
}
console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} totalPoints, teamAdvances, correctResults, exactScores → 0`);

// ── Resumen ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`\n${DRY_RUN ? '📋 DRY-RUN completado' : '✅ Listo'} — tu cuenta admin queda en estado limpio.\n`);
process.exit(0);
