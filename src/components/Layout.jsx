import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../hooks/useAuth.jsx';

const Layout = () => {
    const { user, userRole } = useAuth();

    return (
        <div className="flex flex-col min-h-screen">
            <Header userEmail={user?.email} userData={{ role: userRole }} />
            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;