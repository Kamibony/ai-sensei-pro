import React, { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config.js'; // Opravená cesta k souboru
import { doc, getDoc } from 'firebase/firestore';

// Vytvoření kontextu pro sdílení dat o přihlášení
const AuthContext = createContext();

// Komponenta "Provider", která bude obalovat celou aplikaci
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    console.log("AuthProvider: useEffect for auth state is running.");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthProvider: onAuthStateChanged callback fired. User object:", user);
      if (user) {
        // Uživatel je přihlášen, získáme jeho roli z Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role); // 'profesor' nebo 'student'
        }
        setUser(user);
      } else {
        // Uživatel není přihlášen
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
      console.log("AuthProvider: isLoading state has been set to false.");
    });

    // Odhlášení listeneru při odmontování komponenty
    return () => unsubscribe();
  }, []);

  // Hodnoty, které budou dostupné v celé aplikaci
  const value = { user, loading, userRole };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Vlastní hook pro snadné použití kontextu v jiných komponentách
export const useAuth = () => {
  return useContext(AuthContext);
};

