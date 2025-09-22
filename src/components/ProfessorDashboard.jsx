import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LessonCreationModal from './Dashboard/LessonCreationModal';
import GlobalFilesManager from './Dashboard/GlobalFilesManager';
import FullScreenLoader from './FullScreenLoader';

const ProfessorDashboard = () => {
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const fetchLessons = async () => {
                setIsLoading(true);
                try {
                    const q = query(
                        collection(db, 'lessons'), 
                        where('professorId', '==', user.uid),
                        orderBy('createdAt', 'desc') // Seřadí od nejnovější po nejstarší
                    );
                    const querySnapshot = await getDocs(q);
                    const lessonsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setLessons(lessonsData);
                } catch (error) {
                    console.error("Error fetching lessons: ", error);
                    toast.error("Failed to load lessons. Check console for details.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLessons();
        }
    }, [user]);

    const handleCreateLesson = async (title, subtitle) => {
        if (!user) return;

        try {
            const docRef = await addDoc(collection(db, "lessons"), {
                title,
                subtitle,
                createdAt: serverTimestamp(),
                professorId: user.uid,
            });
            setIsModalOpen(false);
            navigate(`/lesson-editor/${docRef.id}`);
        } catch (error) {
            console.error("Error creating lesson: ", error);
            toast.error("Failed to create lesson.");
        }
    };
    
    if (isLoading) {
        return <FullScreenLoader />;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Professor Dashboard</h1>
            <div className="mb-6">
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                    Vytvořit novou lekci
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Moje lekce</h2>
                    {lessons.length > 0 ? (
                         <ul className="space-y-2">
                            {lessons.map(lesson => (
                                <li key={lesson.id} className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => navigate(`/lesson-editor/${lesson.id}`)}>
                                    <h3 className="font-bold text-lg">{lesson.title}</h3>
                                    {lesson.subtitle && <p className="text-gray-600">{lesson.subtitle}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Zatím nebyly vytvořeny žádné lekce.</p>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Globální zdrojové soubory</h2>
                    {user && <GlobalFilesManager professorId={user.uid} />}
                </div>
            </div>
            <LessonCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateLesson}
            />
        </div>
    );
};

export default ProfessorDashboard;