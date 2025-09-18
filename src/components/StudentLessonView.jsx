import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import FullScreenLoader from './FullScreenLoader.jsx';
import TelegramChatView from './TelegramChatView.jsx';

const StudentLessonView = ({ lessonId, onBack }) => {
    const [lesson, setLesson] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        const docRef = doc(db, 'temata', lessonId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) setLesson(docSnap.data())
        });
        return () => unsubscribe();
    }, [lessonId]);

    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        let videoId;
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1].split('&')[0];
        }
        return videoId ? https://www.youtube.com/embed/\ : null;
    }

    if (!lesson) return <FullScreenLoader />;

    const embedUrl = getYoutubeEmbedUrl(lesson.videoUrl);

    return (
        <div className="container mx-auto">
            <button onClick={onBack} className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">&larr; Zpět</button>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{lesson.title}</h2>
            <p className="text-gray-600 mb-8 italic">{lesson.subtitle}</p>
            
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/3 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-semibold">Video Lekce</h3>
                            {embedUrl && <button onClick={() => setShowVideo(!showVideo)} className="font-semibold text-blue-600">{showVideo ? 'Skrýt' : 'Zobrazit'}</button>}
                        </div>
                        {embedUrl && showVideo && (
                            <div className="aspect-video">
                                <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe>
                            </div>
                        )}
                        {!embedUrl && <p className="text-gray-500">Video není k dispozici.</p>}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-semibold">Studijní text</h3>
                            <button onClick={() => setShowText(!showText)} className="font-semibold text-blue-600">{showText ? 'Skrýt' : 'Zobrazit'}</button>
                        </div>
                        {showText && (
                            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap overflow-y-auto h-[60vh] mt-4 border-t pt-4">
                                {lesson.studentText}
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full lg:w-1/3">
                     <div className="lg:sticky top-8">
                         <div className="w-full max-w-lg mx-auto bg-black rounded-[40px] p-2 shadow-2xl border-4 border-gray-800">
                             <div className="bg-white rounded-[32px] h-[85vh] flex flex-col overflow-hidden" style={{backgroundImage: url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg'), backgroundSize: 'cover'}}>
                                {lesson && <TelegramChatView lesson={lesson} lessonId={lessonId} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentLessonView;