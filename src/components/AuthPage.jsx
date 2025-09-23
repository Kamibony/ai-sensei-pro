import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import toast from 'react-hot-toast';

// Komponenta pro ikonu Google
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);


const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  const handleAuthAction = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Prosím, vyplňte e-mail a heslo.');
      return;
    }
    setIsLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast.success('Přihlášení bylo úspěšné!');
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Uložíme roli uživatele do databáze (výchozí je 'student')
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: 'student',
          createdAt: new Date(),
        });
        toast.success('Registrace byla úspěšná!');
      }
    } catch (error) {
      console.error("Chyba při autentizaci:", error);
      toast.error(error.message || 'Něco se pokazilo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Zkontrolujeme, zda uživatel již existuje v naší databázi
        // Pokud ne, vytvoříme pro něj nový záznam
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
             await setDoc(userRef, {
                email: user.email,
                role: 'student', // default role
                createdAt: new Date(),
                displayName: user.displayName,
                photoURL: user.photoURL
            });
        }
        toast.success('Přihlášení přes Google bylo úspěšné!');

    } catch (error) {
        console.error("Chyba při přihlášení přes Google:", error);
        toast.error(error.message || 'Přihlášení přes Google se nezdařilo.');
    } finally {
        setIsLoading(false);
    }
};


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {isLogin ? 'Přihlásit se' : 'Vytvořit účet'}
        </h2>
        <p className="text-center text-gray-500 mb-8">Vítejte v AI Sensei!</p>
        
        <form onSubmit={handleAuthAction}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vas@email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Heslo
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="******************"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:bg-blue-300"
            >
              {isLoading ? 'Pracuji...' : (isLogin ? 'Přihlásit se' : 'Registrovat')}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400">nebo</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:bg-gray-200"
            >
            <GoogleIcon />
            Pokračovat s Google
        </button>
        
        <p className="text-center text-sm text-gray-600 mt-8">
          {isLogin ? 'Nemáte účet?' : 'Máte již účet?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-blue-600 hover:text-blue-800 ml-2"
          >
            {isLogin ? 'Zaregistrujte se' : 'Přihlaste se'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

