import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthPage from './AuthPage';
import ProfessorDashboard from './ProfessorDashboard';
import ProfessorLessonView from './ProfessorLessonView';
import StudentDashboard from './StudentDashboard';
import StudentLessonView from './StudentLessonView';
import FullScreenLoader from './FullScreenLoader';

const ProtectedRoute = ({ children, role, userRole }) => {
    if (role && role !== userRole) {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default function AppRoutes() {
    const { user, userData, loading } = useAuth();

    if (loading) {
        return <FullScreenLoader />;
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={
                userData?.role?.toLowerCase() === 'professor'
                    ? <Navigate to="/professor/dashboard" replace />
                    : <Navigate to="/student/dashboard" replace />
            } />

            <Route path="/professor/dashboard" element={
                <ProtectedRoute role="professor" userRole={userData?.role}>
                    <ProfessorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/professor/lesson/:lessonId" element={
                <ProtectedRoute role="professor" userRole={userData?.role}>
                    <ProfessorLessonView />
                </ProtectedRoute>
            } />

            <Route path="/student/dashboard" element={
                <ProtectedRoute role="student" userRole={userData?.role}>
                    <StudentDashboard />
                </ProtectedRoute>
            } />
            <Route path="/student/lesson/:lessonId" element={
                <ProtectedRoute role="student" userRole={userData?.role}>
                    <StudentLessonView />
                </ProtectedRoute>
            } />
        </Routes>
    );
}