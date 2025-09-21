import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import LessonLibrary from './Dashboard/LessonLibrary';
import Timeline from './Dashboard/Timeline';
import GlobalFilesManager from './Dashboard/GlobalFilesManager';
import LessonCreationModal from './Dashboard/LessonCreationModal';

const ProfessorDashboard = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
    const [scheduledLessons, setScheduledLessons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'temata'), where('professorId', '==', auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'scheduledLessons'), where('professorId', '==', auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setScheduledLessons(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                scheduledDate: doc.data().scheduledDate.toDate()
            })));
        });
        return () => unsubscribe();
    }, []);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const draggedItemType = active.data.current?.type;
        const draggedId = active.id;
        const targetContainerId = over.id;

        const dateStr = targetContainerId.toString();
        const [year, month, day] = dateStr.split('-').map(Number);
        const targetDate = new Date(Date.UTC(year, month - 1, day));

        if (draggedItemType === 'scheduled') {
            if (targetContainerId === 'library') {
                await deleteDoc(doc(db, 'scheduledLessons', draggedId));
                toast.success('Naplánovaná lekce byla odstraněna.');
            } else {
                const eventRef = doc(db, 'scheduledLessons', draggedId);
                await updateDoc(eventRef, { scheduledDate: Timestamp.fromDate(targetDate) });
                toast.success('Lekce přesunuta.');
            }
        } else if (draggedItemType === 'library' && targetContainerId !== 'library') {
            const lessonTemplate = lessons.find(l => l.id === draggedId);
            await addDoc(collection(db, 'scheduledLessons'), {
                lessonId: draggedId,
                title: lessonTemplate.title,
                subtitle: lessonTemplate.subtitle,
                professorId: auth.currentUser.uid,
                scheduledDate: Timestamp.fromDate(targetDate),
                status: 'Naplánováno'
            });
            toast.success('Lekce naplánována.');
        }
    };

    const handleCreateLesson = async (title, subtitle) => {
        if (!title.trim()) return;
        try {
            const newLessonRef = await addDoc(collection(db, 'temata'), {
                title,
                subtitle,
                professorId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                studentText: '',
                videoUrl: '',
                chatbotPersona: 'Jsi přátelský a nápomocný asistent.',
            });
            setIsModalOpen(false);
            toast.success('Lekce byla úspěšně vytvořena!');
            navigate(`/professor/lesson/${newLessonRef.id}`);
        } catch (error) {
            toast.error("Nepodařilo se vytvořit lekci.");
        }
    };
    
    return (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="container mx-auto p-4 md:p-8">
                 <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Globální soubory kurzu</h2>
                    <GlobalFilesManager professorId={auth.currentUser?.uid} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1">
                       <LessonLibrary lessons={lessons} onNewLessonClick={() => setIsModalOpen(true)} />
                    </div>
                    <div className="lg:col-span-3">
                        <Timeline scheduledLessons={scheduledLessons} />
                    </div>
                </div>
            </div>
            <LessonCreationModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onCreate={handleCreateLesson} 
            />
        </DndContext>
    );
};

export default ProfessorDashboard;