// ============================================================
//  SCRIPT: Limpiar datos de prueba → estado inicial limpio
//
//  Elimina / restaura todo lo generado durante las pruebas:
//  - Predicciones (predictions) de cuentas de prueba
//  - Pronósticos de grupos (groupPredictions) de cuentas de prueba
//  - Documentos de usuario (users) marcados con isTestAccount: true
//  - config/groupPicks.advancing  (equipos clasificados del modal)
//
//  Con --also-reset-matches:
//  - Resetea result → null e isOpen → false en todos los partidos
//  - Restaura teamA/teamB a los slots originales en fases eliminatorias
//
//  NOTA: Las cuentas en Firebase Auth quedan inactivas pero no se
//  eliminan (requiere Admin SDK). Puedes eliminarlas manualmente
//  desde Firebase Console → Authentication.
//
//  Uso:
//    node scripts/cleanupTest.mjs <tu-password-admin>
//
//  Opciones:
//    --dry-run              Solo muestra qué se haría, sin borrar nada
//    --also-reset-matches   También resetea resultados de partidos y
//                           restaura los slots originales de eliminatorias
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  deleteField,
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
const DRY_RUN       = process.argv.includes('--dry-run');
const RESET_MATCHES = process.argv.includes('--also-reset-matches');

if (!ADMIN_PASS) {
  console.error('❌ Debes pasar tu contraseña de admin como argumento.');
  console.error('   Ejemplo: node scripts/cleanupTest.mjs MiPassword123');
  process.exit(1);
}

// ── Slots originales de las fases eliminatorias ──────────────────────────────
// Estos son los valores de teamA/teamB antes de que advancePhase.mjs
// los reemplace con nombres reales de equipos.
const KNOCKOUT_SLOTS = {
  // Dieciseisavos
  match_073: { teamA: '2A',      teamB: '2B'      },
  match_074: { teamA: '1E',      teamB: '3ABCDF'  },
  match_075: { teamA: '1F',      teamB: '2C'      },
  match_076: { teamA: '1C',      teamB: '2F'      },
  match_077: { teamA: '2E',      teamB: '2I'      },
  match_078: { teamA: '1I',      teamB: '3CDFGH'  },
  match_079: { teamA: '1A',      teamB: '3CEFHI'  },
  match_080: { teamA: '1L',      teamB: '3EHIJK'  },
  match_081: { teamA: '1G',      teamB: '3AEHIJ'  },
  match_082: { teamA: '1D',      teamB: '3BEFIJ'  },
  match_083: { teamA: '1H',      teamB: '2J'      },
  match_084: { teamA: '2K',      teamB: '2L'      },
  match_085: { teamA: '1B',      teamB: '3EFGIJ'  },
  match_086: { teamA: '2D',      teamB: '2G'      },
  match_087: { teamA: '1J',      teamB: '2H'      },
  match_088: { teamA: '1K',      teamB: '3DEIJL'  },
  // Octavos
  match_089: { teamA: 'W74',     teamB: 'W77'     },
  match_090: { teamA: 'W73',     teamB: 'W75'     },
  match_091: { teamA: 'W76',     teamB: 'W78'     },
  match_092: { teamA: 'W79',     teamB: 'W80'     },
  match_093: { teamA: 'W83',     teamB: 'W84'     },
  match_094: { teamA: 'W81',     teamB: 'W82'     },
  match_095: { teamA: 'W86',     teamB: 'W88'     },
  match_096: { teamA: 'W85',     teamB: 'W87'     },
  // Cuartos
  match_097: { teamA: 'W89',     teamB: 'W90'     },
  match_098: { teamA: 'W93',     teamB: 'W94'     },
  match_099: { teamA: 'W91',     teamB: 'W92'     },
  match_100: { teamA: 'W95',     teamB: 'W96'     },
  // Semifinales
  match_101: { teamA: 'W97',     teamB: 'W98'     },
  match_102: { teamA: 'W99',     teamB: 'W100'    },
  // Tercer puesto
  match_103: { teamA: 'RU101',   teamB: 'RU102'   },
  // Final
  match_104: { teamA: 'W101',    teamB: 'W102'    },
};

// ── Init ──────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log('\n🧹 Script de limpieza → estado inicial');
if (DRY_RUN)       console.log('   ⚠️  MODO DRY-RUN: no se modificará nada, solo se mostrará qué se haría');
if (RESET_MATCHES) console.log('   🔄  --also-reset-matches: se resetearán partidos y slots eliminatorias');
console.log('\n' + '─'.repeat(55));

// ── Auth ──────────────────────────────────────────────────────────────────────
console.log('\n🔐 Autenticando como admin...');
await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
console.log('✅ Autenticado\n');

let totalDeleted = 0;

// ── 1. Encontrar cuentas de prueba ────────────────────────────────────────────
console.log('🔍 Buscando cuentas de prueba (isTestAccount: true)...');
const usersSnap = await getDocs(
  query(collection(db, 'users'), where('isTestAccount', '==', true))
);

const testUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

if (testUsers.length === 0) {
  console.log('   ℹ️  No se encontraron cuentas de prueba.');
} else {
  console.log(`   Encontradas: ${testUsers.length} cuenta(s) de prueba`);
  testUsers.forEach(u => console.log(`   • ${u.displayName} (${u.email}) — UID: ${u.id}`));
}

// ── 2. Eliminar predicciones de partidos ──────────────────────────────────────
if (testUsers.length > 0) {
  console.log('\n🗑️  Eliminando predicciones de partidos...');
  const predsSnap = await getDocs(collection(db, 'predictions'));

  let predsDeleted = 0;
  for (const predDoc of predsSnap.docs) {
    const p = predDoc.data();
    if (testUsers.some(u => u.id === p.userId)) {
      if (!DRY_RUN) {
        await deleteDoc(doc(db, 'predictions', predDoc.id));
      }
      console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} Predicción ${predDoc.id} (partido: ${p.matchId}, usuario: ${p.userId})`);
      predsDeleted++;
    }
  }
  totalDeleted += predsDeleted;
  console.log(`   Total predicciones ${DRY_RUN ? 'a eliminar' : 'eliminadas'}: ${predsDeleted}`);

  // ── 3. Eliminar pronósticos de grupos ──────────────────────────────────────
  console.log('\n🗑️  Eliminando pronósticos de grupos...');
  let groupsDeleted = 0;
  for (const u of testUsers) {
    try {
      if (!DRY_RUN) {
        await deleteDoc(doc(db, 'groupPredictions', u.id));
      }
      console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} groupPredictions/${u.id} (${u.displayName})`);
      groupsDeleted++;
    } catch (err) {
      if (err.code !== 'not-found') {
        console.log(`   ⚠️  ${u.displayName}: ${err.message}`);
      }
    }
  }
  totalDeleted += groupsDeleted;
  console.log(`   Total pronósticos de grupos ${DRY_RUN ? 'a eliminar' : 'eliminados'}: ${groupsDeleted}`);

  // ── 4. Eliminar documentos de usuario en Firestore ─────────────────────────
  console.log('\n🗑️  Eliminando documentos de usuario de Firestore...');
  let usersDeleted = 0;
  for (const u of testUsers) {
    if (!DRY_RUN) {
      await deleteDoc(doc(db, 'users', u.id));
    }
    console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} users/${u.id} (${u.displayName})`);
    usersDeleted++;
  }
  totalDeleted += usersDeleted;
  console.log(`   Total usuarios ${DRY_RUN ? 'a eliminar' : 'eliminados'}: ${usersDeleted}`);
}

// ── 5. Limpiar config/groupPicks.advancing ────────────────────────────────────
console.log('\n🗑️  Limpiando config/groupPicks (equipos clasificados del modal)...');
if (!DRY_RUN) {
  await setDoc(doc(db, 'config', 'groupPicks'), {
    advancing: {},
    advancingUpdatedAt: null,
  }, { merge: true });
  console.log('   ✓ config/groupPicks.advancing → vacío');
} else {
  console.log('   [DRY] config/groupPicks.advancing → se pondría vacío');
}

// ── 6. (Opcional) Reset de resultados de partidos + slots eliminatorias ───────
if (RESET_MATCHES) {
  // 6a. Resetear resultados de todos los partidos
  console.log('\n⚠️  Reseteando resultados de partidos...');
  const matchesSnap = await getDocs(collection(db, 'matches'));
  let matchesReset = 0;

  for (const mDoc of matchesSnap.docs) {
    const m = mDoc.data();
    if (m.result !== null && m.result !== undefined) {
      if (!DRY_RUN) {
        await updateDoc(doc(db, 'matches', mDoc.id), { result: null, isOpen: false });
      }
      console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} Reset resultado: ${mDoc.id} (${m.teamA} vs ${m.teamB})`);
      matchesReset++;
    }
  }
  console.log(`   Total partidos con resultado reseteado: ${matchesReset}`);

  // 6b. Restaurar teamA/teamB originales en fases eliminatorias
  console.log('\n🔄 Restaurando slots originales en fases eliminatorias...');
  let slotsRestored = 0;

  for (const [matchId, slots] of Object.entries(KNOCKOUT_SLOTS)) {
    const mDoc = matchesSnap.docs.find(d => d.id === matchId);
    if (!mDoc) {
      console.log(`   ⚠️  No encontrado: ${matchId}`);
      continue;
    }
    const m = mDoc.data();
    const needsRestore = m.teamA !== slots.teamA || m.teamB !== slots.teamB;
    if (needsRestore) {
      if (!DRY_RUN) {
        await updateDoc(doc(db, 'matches', matchId), {
          teamA: slots.teamA,
          teamB: slots.teamB,
        });
      }
      console.log(`   ${DRY_RUN ? '[DRY]' : '✓'} ${matchId}: "${m.teamA}" → "${slots.teamA}" | "${m.teamB}" → "${slots.teamB}"`);
      slotsRestored++;
    }
  }
  if (slotsRestored === 0) {
    console.log('   ℹ️  Todos los slots ya están en su valor original.');
  } else {
    console.log(`   Total slots restaurados: ${slotsRestored}`);
  }
}

// ── Resumen ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log(`\n${DRY_RUN ? '📋 DRY-RUN COMPLETADO' : '✅ LIMPIEZA COMPLETADA'}`);
if (testUsers.length > 0) {
  console.log(`   Predicciones de partidos eliminadas: (ver arriba)`);
  console.log(`   Pronósticos de grupos eliminados:    (ver arriba)`);
  console.log(`   Documentos de usuario eliminados:    ${testUsers.length}`);
}
console.log(`   config/groupPicks.advancing:         ${DRY_RUN ? 'se pondría vacío' : 'limpiado ✓'}`);
if (RESET_MATCHES) {
  console.log(`   Resultados de partidos:              ${DRY_RUN ? 'se resetearían' : 'reseteados ✓'}`);
  console.log(`   Slots eliminatorias restaurados:     ${DRY_RUN ? 'se restaurarían' : '✓'}`);
}

if (!DRY_RUN && testUsers.length > 0) {
  console.log('\n⚠️  PENDIENTE (manual):');
  console.log('   Las cuentas en Firebase Authentication siguen existiendo.');
  console.log('   Para eliminarlas:');
  console.log('   Firebase Console → Authentication → Users → busca test_jugador*');
  console.log('   → selecciona todas → Eliminar');
}

console.log('');
process.exit(0);
