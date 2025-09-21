import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');

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
                    role: role
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800">{isLogin ? 'Přihlášení' : 'Registrace'}</h2>
                <form onSubmit={handleAuthAction} className="space-y-6">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Heslo" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {!isLogin && (
                        <div className="flex items-center justify-center space-x-4">
                            <label className="flex items-center">
                                <input type="radio" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="form-radio h-5 w-5 text-blue-600" />
                                <span className="ml-2">Jsem Student</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" value="professor" checked={role === 'professor'} onChange={() => setRole('professor')} className="form-radio h-5 w-5 text-blue-600" />
                                <span className="ml-2">Jsem Profesor</span>
                            </label>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">{isLogin ? 'Přihlásit se' : 'Zaregistrovat se'}</button>
                </form>
                <p className="text-center text-sm">
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-blue-600 hover:underline">
                        {isLogin ? 'Zaregistrujte se' : 'Přihlaste se'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;