import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { DndContext } from '@dnd-kit/core';

import LessonLibrary from './Dashboard/LessonLibrary';
import Timeline from './Dashboard/Timeline';
import GlobalFilesManager from './Dashboard/GlobalFilesManager';

const ProfessorDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'temata'), where('professorId', '==', auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const lessonsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Zajistíme, že scheduledDate je vždy objekt Date nebo null
                scheduledDate: doc.data().scheduledDate?.toDate() || null
            }));
            setLessons(lessonsData);
        });
        return () => unsubscribe();
    }, []);

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const lessonId = active.id;
            const newDateStr = over.id === 'library' ? null : over.id;

            const lessonRef = doc(db, 'temata', lessonId);
            try {
                await updateDoc(lessonRef, {
                    scheduledDate: newDateStr ? Timestamp.fromDate(new Date(newDateStr)) : null
                });
            } catch (error) {
                console.error("Chyba při aktualizaci data lekce: ", error);
            }
        }
    };
    
    const unscheduledLessons = lessons.filter(l => !l.scheduledDate);
    const scheduledLessons = lessons.filter(l => l.scheduledDate);

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="container mx-auto">
                <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Globální soubory kurzu</h2>
                    <p className="text-gray-600 mb-4">Zde nahrajte materiály, které jsou společné pro všechny lekce (např. sylabus, obecné zdroje).</p>
                    <GlobalFilesManager professorId={auth.currentUser?.uid} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        <Timeline scheduledLessons={scheduledLessons} />
                    </div>
                    <div className="lg:col-span-1">
                        <LessonLibrary lessons={unscheduledLessons} navigate={navigate} />
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default ProfessorDashboard;