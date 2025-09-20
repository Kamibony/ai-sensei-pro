import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth.js';
import Header from './components/Header.jsx';
import AppRoutes from './components/AppRoutes.jsx';
import { useNavigate } from 'react-router-dom';


export default function App() {
    const { user, userData } = useAuth();
    const navigate = useNavigate();

    const handleNavigateToDashboard = () => {
        if (userData?.role === 'professor') {
            navigate('/professor/dashboard');
        } else {
            navigate('/student/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Toaster position="top-center" reverseOrder={false} />
            {user && <Header userEmail={user.email} userData={userData} onNavigateToDashboard={handleNavigateToDashboard} />}
            <main className="p-4 md:p-8">
                <AppRoutes />
            </main>
        </div>
    );
}
