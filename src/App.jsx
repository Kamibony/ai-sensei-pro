import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth.js';
import Header from './components/Header.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProfessorDashboard from './components/ProfessorDashboard.jsx';
import ProfessorLessonView from './components/ProfessorLessonView.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import StudentLessonView from './components/StudentLessonView.jsx';
import FullScreenLoader from './components/FullScreenLoader.jsx';

export default function App() {
    const { user, userData, loading } = useAuth();
    const [view, setView] = useState('dashboard');
    const [selectedLessonId, setSelectedLessonId] = useState(null);

    const handleSelectLesson = (lessonId) => {
        setSelectedLessonId(lessonId);
        setView('lesson');
    };

    const navigateToDashboard = () => {
        setView('dashboard');
        setSelectedLessonId(null);
    }

    if (loading) return <FullScreenLoader />;

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {!user ? (
                <AuthPage />
            ) : (
                <>
                    <Header userEmail={user.email} userData={userData} onNavigateToDashboard={navigateToDashboard} />
                    <main className="p-4 md:p-8">
                        {userData?.role === 'professor' && view === 'dashboard' && <ProfessorDashboard onSelectLesson={handleSelectLesson} />}
                        {userData?.role === 'professor' && view === 'lesson' && <ProfessorLessonView lessonId={selectedLessonId} onBack={navigateToDashboard} />}
                        {userData?.role === 'student' && view === 'dashboard' && <StudentDashboard onSelectLesson={handleSelectLesson} />}
                        {userData?.role === 'student' && view === 'lesson' && <StudentLessonView lessonId={selectedLessonId} onBack={navigateToDashboard} />}
                    </main>
                </>
            )}
        </div>
    );
}
