import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const StudentDashboard = ({ onSelectLesson }) => {
    const [lessons, setLessons] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'temata'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lessonsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(lekce => lekce.studentText && lekce.studentText.trim() !== '');
            setLessons(lessonsData);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-gray-700 mb-6">DostupnÃ© Lekce</h2>
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
                    <p>MomentÃ¡lnÄ› nejsou dostupnÃ© Å¾Ã¡dnÃ© lekce.</p>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
