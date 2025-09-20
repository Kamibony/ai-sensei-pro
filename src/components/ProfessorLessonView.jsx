import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import LessonEditor from './LessonEditor.jsx';
import StudentInteractions from './StudentInteractions.jsx';

const ProfessorLessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [studentText, setStudentText] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [chatbotPersona, setChatbotPersona] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [activeTab, setActiveTab] = useState('edit');

    useEffect(() => {
        const docRef = doc(db, 'temata', lessonId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setLesson(data);
                setStudentText(data.studentText || '');
                setVideoUrl(data.videoUrl || '');
                setChatbotPersona(data.chatbotPersona || '');
            }
        });
        return () => unsubscribe();
    }, [lessonId]);

    const handleSave = async () => {
        setSaveMessage('Ukládám...');
        const lessonRef = doc(db, 'temata', lessonId);
        await updateDoc(lessonRef, {
            studentText,
            videoUrl,
            chatbotPersona,
        });
        setSaveMessage('Materiály byly úspěšně uloženy!');
        setTimeout(() => setSaveMessage(''), 3000);
    }

    return (
        <div className="container mx-auto">
            <button onClick={() => navigate('/professor/dashboard')} className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">&larr; Zpět</button>
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold">{lesson?.title}</h2>
                <p className="text-gray-600 mb-6">{lesson?.subtitle}</p>
                <div className="border-b mb-6">
                    <button onClick={() => setActiveTab('edit')} className={`py-2 px-4 ${activeTab === 'edit' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Editor Lekce</button>
                    <button onClick={() => setActiveTab('interactions')} className={`py-2 px-4 ${activeTab === 'interactions' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Interakce Studentů</button>
                </div>

                {activeTab === 'edit' && (
                    <>
                        <LessonEditor
                            lesson={lesson}
                            studentText={studentText} setStudentText={setStudentText}
                            videoUrl={videoUrl} setVideoUrl={setVideoUrl}
                            chatbotPersona={chatbotPersona} setChatbotPersona={setChatbotPersona}
                            lessonId={lessonId}
                        />
                        <div className="mt-8 text-right">
                            <span className="text-green-600 mr-4">{saveMessage}</span>
                            <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg">Uložit materiály</button>
                        </div>
                    </>
                )}

                {activeTab === 'interactions' && <StudentInteractions lessonId={lessonId} lessonText={lesson?.studentText}/>}
            </div>
        </div>
    );
};

export default ProfessorLessonView;
