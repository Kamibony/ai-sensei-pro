import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Používateľ je prihlásený, ideme zistiť jeho rolu
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Pripojíme dáta z databázy (vrátane roly) k objektu používateľa
                    setUser({ ...user, ...docSnap.data() });
                } else {
                    // Ak používateľ nemá záznam v databáze, priradíme mu predvolenú rolu
                    // alebo ho necháme bez roly, podľa tvojej logiky
                    console.warn(`User with UID ${user.uid} not found in Firestore.`);
                    setUser(user);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, isLoading };
};