import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';

const ProfessorDashboard = ({ onSelectLesson }) => {
    const [lessons, setLessons] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonSubtitle, setNewLessonSubtitle] = useState('');

    useEffect(() => {
        if (auth.currentUser) {
            const q = query(collection(db, 'temata'), where('professorId', '==', auth.currentUser.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const lessonsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLessons(lessonsData);
            });
            return () => unsubscribe();
        }
    }, []);
    
    const handleCreateLesson = async (e) => {
        e.preventDefault();
        if (!newLessonTitle.trim()) return;
        try {
            await addDoc(collection(db, 'temata'), {
                title: newLessonTitle,
                subtitle: newLessonSubtitle,
                professorId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                studentText: '',
                videoScript: '',
                videoUrl: '',
                chatbotPersona: 'Jsi pÅ™Ã¡telskÃ½ a nÃ¡pomocnÃ½ asistent.',
                preparedQuiz: null
            });
            setShowModal(false);
            setNewLessonTitle('');
            setNewLessonSubtitle('');
        } catch (error) {
            console.error("Error creating lesson: ", error);
            alert("NepodaÅ™ilo se vytvoÅ™it lekci. Zkontrolujte prosÃ­m bezpeÄnostnÃ­ pravidla databÃ¡ze a zkuste to znovu.");
        }
    }

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-700">Moje Lekce</h2>
                <button onClick={() => setShowModal(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">+ VytvoÅ™it Lekci</button>
            </div>

            {lessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lekce) => (
                        <div key={lekce.id} onClick={() => onSelectLesson(lekce.id)} className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold">{lekce.title}</h3>
                            <p className="text-gray-600 mt-2">{lekce.subtitle}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p>ZatÃ­m jste nevytvoÅ™ili Å¾Ã¡dnÃ© lekce.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-6">NovÃ¡ Lekce</h3>
                        <form onSubmit={handleCreateLesson}>
                            <input type="text" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="NÃ¡zev lekce" required className="w-full p-3 mb-4 border rounded-lg" />
                            <input type="text" value={newLessonSubtitle} onChange={(e) => setNewLessonSubtitle(e.target.value)} placeholder="Podtitulek" required className="w-full p-3 mb-6 border rounded-lg" />
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="py-2 px-6 bg-gray-300 hover:bg-gray-400 rounded-lg">ZruÅ¡it</button>
                                <button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">VytvoÅ™it</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorDashboard;
