import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import toast from 'react-hot-toast';

// A placeholder for the GoogleIcon component, as its definition is not provided.
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.23 0 5.45.99 7.18 2.62l5.48-5.48C32.93 2.95 28.88 1 24 1 14.9 1 7.38 6.55 4.24 14.29l6.32 4.88C11.62 13.54 17.38 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.24 25.02c0-1.65-.15-3.25-.42-4.8H24v9.1h12.48c-.54 2.94-2.18 5.43-4.64 7.08l6.13 4.75C42.84 37.1 46.24 31.6 46.24 25.02z"></path>
        <path fill="#FBBC05" d="M10.56 28.17c-.5-1.48-.78-3.06-.78-4.7s.28-3.22.78-4.7l-6.32-4.88C2.5 17.25 1 20.47 1 24s1.5 6.75 4.24 9.51l6.32-4.84z"></path>
        <path fill="#EA4335" d="M24 47c4.88 0 8.93-1.95 11.82-5.18l-6.13-4.75c-1.65 1.1-3.75 1.75-6.19 1.75-6.62 0-12.38-4.04-14.44-9.62L4.24 33.71C7.38 41.45 14.9 47 24 47z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);


const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth();

  const handleAuthAction = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Prosím, vyplňte e-mail a heslo.');
      return;
    }
    setIsLoading(true);
    setError('');
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
          createdAt: serverTimestamp(),
        });
        toast.success('Registrace byla úspěšná!');
      }
    } catch (error) {
      console.error("Chyba při autentizaci:", error);
      setError(error.message);
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

        // Here you might want to add logic to check if the user exists in your Firestore 'users' collection
        // and add them if they don't. For now, just show success.

        toast.success('Přihlášení přes Google bylo úspěšné!');

    } catch (error) {
        console.error("Chyba při přihlášení přes Google:", error);
        setError(error.message);
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
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

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
