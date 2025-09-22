import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FullScreenLoader from './FullScreenLoader';

const StudentDashboard = () => {
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLessons = async () => {
            setIsLoading(true);
            try {
                // Přidáno řazení, aby byly lekce vždy ve stejném pořadí
                const q = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const lessonsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLessons(lessonsData);
            } catch (error) {
                console.error("Error fetching lessons: ", error);
                toast.error("Failed to load lessons.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLessons();
    }, []);
    
    // Funkce nyní provede skutečnou navigaci
    const handleLessonClick = (lessonId) => {
        navigate(`/lesson/${lessonId}`);
    };

    if (isLoading) {
        return <FullScreenLoader />;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
            <div>
                <h2 className="text-2xl font-semibold mb-4">Dostupné lekce</h2>
                {lessons.length > 0 ? (
                    <ul className="space-y-2">
                        {lessons.map(lesson => (
                            <li key={lesson.id} 
                                className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => handleLessonClick(lesson.id)}>
                                <h3 className="font-bold text-lg">{lesson.title}</h3>
                                {lesson.subtitle && <p className="text-gray-600">{lesson.subtitle}</p>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Momentálně nejsou k dispozici žádné lekce.</p>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;