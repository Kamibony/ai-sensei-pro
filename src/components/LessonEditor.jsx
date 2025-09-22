import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import SourceFilesManager from './LessonEditor/SourceFilesManager';
import TextEditor from './LessonEditor/TextEditor';
import QuizGenerator from './LessonEditor/QuizGenerator';
import PresentationGenerator from './LessonEditor/PresentationGenerator';
import FinalTestGenerator from './LessonEditor/FinalTestGenerator';
import FullScreenLoader from './FullScreenLoader';

const LessonEditor = () => {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLesson = async () => {
            if (!lessonId) {
                setError("Lesson ID not found.");
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const lessonRef = doc(db, 'lessons', lessonId);
                const lessonSnap = await getDoc(lessonRef);

                if (lessonSnap.exists()) {
                    setLesson({ id: lessonSnap.id, ...lessonSnap.data() });
                } else {
                    setError("Lekce nebyla nalezena.");
                }
            } catch (err) {
                console.error("Error fetching lesson:", err);
                setError("Nepodařilo se načíst lekci.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchLesson();
    }, [lessonId]);

    if (loading) {
        return <FullScreenLoader />;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">{error}</div>;
    }

    if (!lesson) {
        return <div className="text-center mt-10">Nelze načíst data lekce.</div>;
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-bold mb-2 text-gray-800">{lesson.title}</h1>
            <h2 className="text-xl text-gray-500 mb-8">{lesson.subtitle}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <SourceFilesManager lessonId={lessonId} />
                    <TextEditor lessonId={lessonId} />
                </div>
                <div className="space-y-8">
                    <QuizGenerator lessonId={lessonId} />
                    <PresentationGenerator lessonId={lessonId} />
                    <FinalTestGenerator lessonId={lessonId} />
                </div>
            </div>
        </div>
    );
};

export default LessonEditor;