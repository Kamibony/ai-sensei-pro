import React, { useState } from 'react';
 feature/user-auth-file-management-revised
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
 main

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

 feature/user-auth-file-management-revised
    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    email: email,
                    role: role,
                    createdAt: serverTimestamp()
                });
            }
        } catch (err) {
            setError(err.message);
 main
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

