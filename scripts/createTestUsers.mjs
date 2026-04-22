// ============================================================
//  SCRIPT: Crear cuentas de prueba en bulk
//
//  Crea N usuarios de prueba en Firebase Auth + Firestore.
//  Los usuarios se marcan con isTestAccount: true para que
//  el script de limpieza los identifique fácilmente.
//
//  Uso:
//    node scripts/createTestUsers.mjs <password-admin> [cantidad]
//
//  Ejemplos:
//    node scripts/createTestUsers.mjs MiPass123        → crea 20 usuarios
//    node scripts/createTestUsers.mjs MiPass123 30     → crea 30 usuarios
//    node scripts/createTestUsers.mjs MiPass123 5      → crea 5 usuarios
//
//  Después de correr este script:
//  1. Entra al Admin Panel → Jugadores → marca cada test_* como "Pagado"
//     (o usa el botón "Marcar todos pagados" si lo tienes)
//  2. Inicia sesión como cada usuario de prueba para entregar predicciones
//  3. Cuando termines las pruebas, corre: node scripts/cleanupTest.mjs
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKRERWLV1ZX1uEGQB006c02S3chuJVSdo",
  authDomain: "quiniela---mundial-2026.firebaseapp.com",
  projectId: "quiniela---mundial-2026",
  storageBucket: "quiniela---mundial-2026.firebasestorage.app",
  messagingSenderId: "735911362707",
  appId: "1:735911362707:web:eaf12c2871b1cb09f20d66",
};

const ADMIN_PASS = process.argv[2] || '';
const COUNT      = parseInt(process.argv[3] || '20', 10);

if (!ADMIN_PASS) {
  console.error('❌ Debes pasar tu contraseña de admin como argumento.');
  console.error('   Ejemplo: node scripts/createTestUsers.mjs MiPassword123');
  console.error('   Con cantidad: node scripts/createTestUsers.mjs MiPassword123 25');
  process.exit(1);
}

if (isNaN(COUNT) || COUNT < 1 || COUNT > 50) {
  console.error('❌ La cantidad debe ser un número entre 1 y 50.');
  process.exit(1);
}

// Nombres ficticios para que el ranking se vea más real
const NOMBRES = [
  'Alejandro', 'Sofía', 'Carlos', 'Valentina', 'Diego',
  'Camila', 'Andrés', 'Isabella', 'Jorge', 'Natalia',
  'Ricardo', 'Daniela', 'Fernando', 'Gabriela', 'Miguel',
  'Lucia', 'Roberto', 'Paula', 'Sebastian', 'Valeria',
  'Eduardo', 'Ana', 'Gustavo', 'Monica', 'Hector',
  'Paola', 'Oscar', 'Laura', 'Ivan', 'Catalina',
  'Pablo', 'Sandra', 'Ramon', 'Patricia', 'Victor',
  'Claudia', 'Marco', 'Elena', 'Luis', 'Adriana',
  'Ernesto', 'Beatriz', 'Enrique', 'Rosa', 'Cesar',
  'Alicia', 'Nicolas', 'Maria', 'Arturo', 'Diana',
];

const APELLIDOS = [
  'García', 'Martínez', 'López', 'Hernández', 'González',
  'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Morales', 'Ortega', 'Vásquez',
  'Jiménez', 'Medina', 'Castro', 'Vargas', 'Ruiz',
  'Guerrero', 'Reyes', 'Mendoza', 'Rojas', 'Delgado',
];

// Genera lista de usuarios de prueba
const TEST_USERS = Array.from({ length: COUNT }, (_, i) => {
  const n = i + 1;
  const nombre   = NOMBRES[i % NOMBRES.length];
  const apellido = APELLIDOS[i % APELLIDOS.length];
  return {
    email:       `test_jugador${String(n).padStart(2, '0')}@quiniela.test`,
    password:    'TestPass1234!',
    displayName: `${nombre} ${apellido}`,
    phone:       `000-${String(n).padStart(3, '0')}`,
  };
});

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log(`\n🧪 Creando ${COUNT} cuentas de prueba...\n`);
console.log('─'.repeat(55));

const created = [];
const skipped = [];
const failed  = [];

for (const [i, testUser] of TEST_USERS.entries()) {
  process.stdout.write(`[${String(i + 1).padStart(2)}/${COUNT}] ${testUser.email.padEnd(42)} `);

  try {
    // Crear cuenta en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password);
    await updateProfile(cred.user, { displayName: testUser.displayName });

    // Crear documento en Firestore con flag isTestAccount
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid:            cred.user.uid,
      displayName:    testUser.displayName,
      email:          testUser.email,
      phone:          testUser.phone,
      isPaid:         true,   // pagado por defecto para no bloquear testing
      isTestAccount:  true,
      totalPoints:    0,
      correctResults: 0,
      exactScores:    0,
      teamAdvances:   0,
      createdAt:      new Date().toISOString(),
    });

    created.push({ uid: cred.user.uid, ...testUser });
    console.log(`✅ ${testUser.displayName}`);
    await signOut(auth);

  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`⏭  Ya existe`);
      skipped.push(testUser);
    } else {
      console.log(`❌ ${err.message}`);
      failed.push({ ...testUser, error: err.message });
    }
    try { await signOut(auth); } catch {}
  }

  // Pequeña pausa para no saturar Firebase (cada 5 usuarios)
  if ((i + 1) % 5 === 0 && i + 1 < COUNT) {
    await new Promise(r => setTimeout(r, 500));
  }
}

// ── Resumen ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log('\n📋 RESUMEN\n');
console.log(`   ✅ Creados:     ${created.length}`);
console.log(`   ⏭  Ya existían: ${skipped.length}`);
console.log(`   ❌ Errores:     ${failed.length}`);
console.log(`   TOTAL:         ${COUNT}`);

if (failed.length > 0) {
  console.log('\n❌ Errores detallados:');
  failed.forEach(u => console.log(`   ${u.email}: ${u.error}`));
}

console.log('\n' + '─'.repeat(55));
console.log('\n📌 PRÓXIMOS PASOS:\n');
console.log('   1. Admin Panel → Jugadores → marca todos los test_* como Pagado');
console.log('   2. Inicia sesión con cada cuenta y entrega predicciones');
console.log('      Email:      test_jugador01@quiniela.test ... test_jugador' + String(COUNT).padStart(2,'0') + '@quiniela.test');
console.log('      Contraseña: TestPass1234!');
console.log('   3. Como admin, asigna resultados a los partidos');
console.log('   4. Verifica el ranking y puntos');
console.log('   5. Al terminar: node scripts/cleanupTest.mjs TuPassword\n');

process.exit(0);
