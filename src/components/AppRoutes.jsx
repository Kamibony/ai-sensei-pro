import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthPage from './AuthPage';
import ProfessorDashboard from './ProfessorDashboard';
import StudentDashboard from './StudentDashboard';
import LessonEditor from './LessonEditor';
import StudentLessonView from './StudentLessonView';
import FullScreenLoader from './FullScreenLoader';
import Layout from './Layout'; // Import the new Layout component

const AppRoutes = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <FullScreenLoader />;
    }

    const HomeRedirect = () => {
        if (!user) {
            return <Navigate to="/auth" />;
        }
        if (user.role === 'student') {
            return <Navigate to="/student-dashboard" />;
        }
        return <Navigate to="/professor-dashboard" />;
    };

    return (
        <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : <HomeRedirect />} />
            
            {/* Routes with Layout */}
            <Route element={<Layout />}>
                <Route path="/" element={<HomeRedirect />} />

                {/* Professor Routes */}
                <Route
                    path="/professor-dashboard"
                    element={user && user.role !== 'student' ? <ProfessorDashboard /> : <Navigate to="/auth" />}
                />
                <Route
                    path="/lesson-editor/:lessonId"
                    element={user && user.role !== 'student' ? <LessonEditor /> : <Navigate to="/auth" />}
                />

                {/* Student Routes */}
                <Route
                    path="/student-dashboard"
                    element={user && user.role === 'student' ? <StudentDashboard /> : <Navigate to="/auth" />}
                />
                <Route
                    path="/lesson/:lessonId"
                    element={user ? <StudentLessonView /> : <Navigate to="/auth" />}
                />
            </Route>

            <Route path="*" element={<HomeRedirect />} />
        </Routes>
    );
};

export default AppRoutes;