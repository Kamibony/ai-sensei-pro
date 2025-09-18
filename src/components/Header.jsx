import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config.js';

const Header = ({ userEmail, userData, onNavigateToDashboard }) => (
    <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
            <div onClick={onNavigateToDashboard} className="cursor-pointer flex items-center">
                <h1 className="text-2xl font-bold text-gray-800"><span className="text-blue-600">AI</span> Sensei</h1>
                {userData && <span className={"text-sm font-medium text-white bg-blue-600 rounded-full px-2 py-0.5 ml-2 capitalize"}>{userData.role}</span>}
            </div>
            <div className="flex items-center">
                <span className="text-gray-600 mr-4 hidden md:block">{userEmail}</span>
                <button onClick={() => signOut(auth)} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300">OdhlÃ¡sit se</button>
            </div>
        </div>
    </header>
);

export default Header;
