import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// UID del administrador — reemplaza con tu UID después de crear tu cuenta
export const ADMIN_UID = 'sGdnDrst12bNRqBNJNWgGJ6StIw1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }

      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);

        // Listen in real-time so isPaid changes reflect immediately without reload
        profileUnsub = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data());
          } else {
            // Crear documento si no existe
            const newProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email,
              email: firebaseUser.email,
              phone: '',
              isPaid: false,
              totalPoints: 0,
              correctResults: 0,
              exactScores: 0,
              teamAdvances: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const register = async (email, password, displayName, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      phone: phone || '',
      isPaid: false,
      totalPoints: 0,
      correctResults: 0,
      exactScores: 0,
      teamAdvances: 0,
      createdAt: new Date().toISOString(),
    });
    return cred;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const isAdmin = user?.uid === ADMIN_UID;

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, register, login, logout, resetPassword, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
