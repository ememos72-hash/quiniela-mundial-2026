// ============================================================
//  SCRIPT: Eliminar usuarios específicos de Firestore
//
//  Uso:
//    node scripts/deleteUsers.mjs <password-admin> --names "Paula Castro,Carlos López"
//
//  O para eliminar TODOS excepto el admin:
//    node scripts/deleteUsers.mjs <password-admin> --all-except-admin
//
//  Añade --dry-run para ver qué se borraría sin ejecutar nada.
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKRERWLV1ZX1uEGQB006c02S3chuJVSdo",
  authDomain: "quiniela---mundial-2026.firebaseapp.com",
  projectId: "quiniela---mundial-2026",
  storageBucket: "quiniela---mundial-2026.firebasestorage.app",
  messagingSenderId: "735911362707",
  appId: "1:735911362707:web:eaf12c2871b1cb09f20d66",
};

const ADMIN_EMAIL  = 'ememos72@gmail.com';
const ADMIN_PASS   = process.argv[2] || '';
const DRY_RUN      = process.argv.includes('--dry-run');
const ALL_EXCEPT   = process.argv.includes('--all-except-admin');

// --names "Nombre1,Nombre2"
const namesArg = process.argv.find(a => a.startsWith('--names='))
  || (process.argv.includes('--names') ? `--names=${process.argv[process.argv.indexOf('--names') + 1]}` : null);
const TARGET_NAMES = namesArg
  ? namesArg.replace('--names=', '').split(',').map(n => n.trim().toLowerCase())
  : [];

if (!ADMIN_PASS) {
  console.error('❌ Debes pasar tu contraseña de admin como argumento.');
  process.exit(1);
}
if (!ALL_EXCEPT && TARGET_NAMES.length === 0) {
  console.error('❌ Debes indicar --names "Nombre1,Nombre2"  o  --all-except-admin');
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log('\n🗑️  Script de borrado de usuarios');
if (DRY_RUN) console.log('   ⚠️  DRY-RUN activo — no se borrará nada');
console.log('─'.repeat(50));

console.log('\n🔐 Autenticando...');
await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
console.log('✅ Autenticado\n');

const usersSnap = await getDocs(collection(db, 'users'));
const allUsers  = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

const toDelete = allUsers.filter(u => {
  if (u.email === ADMIN_EMAIL) return false; // nunca borrar admin
  if (ALL_EXCEPT) return true;
  return TARGET_NAMES.includes((u.displayName || '').toLowerCase())
      || TARGET_NAMES.includes((u.email || '').toLowerCase());
});

if (toDelete.length === 0) {
  console.log('ℹ️  No se encontraron usuarios que coincidan con los criterios.\n');
  process.exit(0);
}

console.log(`Usuarios a eliminar (${toDelete.length}):\n`);
for (const u of toDelete) {
  console.log(`  • ${u.displayName || '(sin nombre)'} — ${u.email || u.id}`);
  if (!DRY_RUN) {
    // Borrar también sus predictions y groupPredictions
    const predsSnap = await getDocs(collection(db, 'predictions'));
    for (const p of predsSnap.docs) {
      if (p.data().userId === u.id) {
        await deleteDoc(doc(db, 'predictions', p.id));
        console.log(`    ↳ prediction ${p.id} eliminada`);
      }
    }
    try { await deleteDoc(doc(db, 'groupPredictions', u.id)); } catch (_) {}
    await deleteDoc(doc(db, 'users', u.id));
    console.log(`    ↳ users/${u.id} eliminado ✓`);
  }
}

console.log(`\n${DRY_RUN ? '📋 DRY-RUN completado' : '✅ Usuarios eliminados'}: ${toDelete.length}\n`);
if (!DRY_RUN) {
  console.log('⚠️  Recuerda eliminar las cuentas de Firebase Auth manualmente:');
  console.log('   Firebase Console → Authentication → Users\n');
}
process.exit(0);
