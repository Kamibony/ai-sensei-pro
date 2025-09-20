import React, { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import StudentList from './StudentInteractions/StudentList';
import StudentChat from './StudentInteractions/StudentChat';
import StudentAnalysis from './StudentInteractions/StudentAnalysis';

const StudentInteractions = ({ lessonId, lessonText }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('komunikace');

    useEffect(() => {
        const chatsColRef = collection(db, 'temata', lessonId, 'chats');
        const unsubscribe = onSnapshot(
            chatsColRef,
            (snapshot) => {
                const chatsData = snapshot.docs.map(chatDoc => {
                    const data = chatDoc.data();
                    const messages = Array.isArray(data.messages) ? data.messages : [];
                    return {
                        studentId: chatDoc.id,
                        studentEmail: data.studentEmail || 'Email nezaznamenán',
                        messages: messages.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0)),
                        quizzes: data.quizzes || [],
                    };
                });
                setChats(chatsData);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching student interactions:", err);
                setError("Nepodařilo se načíst data. Zkuste to prosím znovu.");
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [lessonId]);

    useEffect(() => {
        if (selectedStudent) {
            const updatedStudentData = chats.find(chat => chat.studentId === selectedStudent.studentId);
            if (updatedStudentData) {
                setSelectedStudent(updatedStudentData);
            }
        }
    }, [chats, selectedStudent?.studentId]);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setActiveTab('komunikace');
    };

    if (loading) return <p>Načítání interakcí...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StudentList
                chats={chats}
                selectedStudent={selectedStudent}
                onSelectStudent={handleSelectStudent}
            />
            <div className="md:col-span-2">
                {selectedStudent ? (
                    <div>
                         <div className="border-b mb-4">
                            <button onClick={() => setActiveTab('komunikace')} className={`py-2 px-4 ${activeTab === 'komunikace' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Komunikace</button>
                            <button onClick={() => setActiveTab('analyza')} className={`py-2 px-4 ${activeTab === 'analyza' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>AI Analýza</button>
                        </div>

                        {activeTab === 'komunikace' && (
                             <StudentChat selectedStudent={selectedStudent} lessonId={lessonId} />
                        )}

                        {activeTab === 'analyza' && (
                            <StudentAnalysis selectedStudent={selectedStudent} lessonText={lessonText} />
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                        <p className="text-gray-500">Vyberte studenta ze seznamu vlevo pro zobrazení jeho interakcí a analýz.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentInteractions;
