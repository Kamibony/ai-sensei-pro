import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { httpsCallable } from 'firebase/functions';
import FullScreenLoader from './FullScreenLoader.jsx';
import TelegramChatView from './TelegramChatView.jsx';
import toast from 'react-hot-toast';

const StudentLessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [showText, setShowText] = useState(false);
    const [telegramToken, setTelegramToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(false);

    const generateToken = async () => {
        setIsTokenLoading(true);
        try {
            const generateTokenCallable = httpsCallable(functions, 'generateTelegramConnectionToken');
            const result = await generateTokenCallable();
            setTelegramToken(result.data.token);
        } catch (error) {
            console.error("Error generating Telegram token:", error);
            toast.error("Failed to generate Telegram connection code.");
        } finally {
            setIsTokenLoading(false);
        }
    };

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
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (!lesson) return <FullScreenLoader />;

    const embedUrl = getYoutubeEmbedUrl(lesson.videoUrl);

    return (
        <div className="container mx-auto">
            <button onClick={() => navigate('/student/dashboard')} className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">&larr; Back</button>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{lesson.title}</h2>
            <p className="text-gray-600 mb-8 italic">{lesson.subtitle}</p>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/3 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-semibold">Video Lesson</h3>
                            {embedUrl && <button onClick={() => setShowVideo(!showVideo)} className="font-semibold text-blue-600">{showVideo ? 'Hide' : 'Show'}</button>}
                        </div>
                        {embedUrl && showVideo && (
                            <div className="aspect-video">
                                <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe>
                            </div>
                        )}
                        {!embedUrl && <p className="text-gray-500">Video not available.</p>}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-semibold">Study Text</h3>
                            <button onClick={() => setShowText(!showText)} className="font-semibold text-blue-600">{showText ? 'Hide' : 'Show'}</button>
                        </div>
                        {showText && (
                            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap overflow-y-auto h-[60vh] mt-4 border-t pt-4">
                                {lesson.studentText}
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full lg:w-1/3">
                     <div className="lg:sticky top-8 space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-semibold mb-3">Connect to Telegram</h3>
                            {telegramToken ? (
                                <div className="text-center">
                                    <p className="text-gray-600 mb-2">Open Telegram and send this message to the bot:</p>
                                    <code className="bg-gray-200 text-gray-800 p-2 rounded-md block mb-4 text-lg font-mono">/start {telegramToken}</code>
                                    <p className="text-sm text-gray-500">This code will expire in 10 minutes.</p>
                                </div>
                            ) : (
                                <button
                                    onClick={generateToken}
                                    disabled={isTokenLoading}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
                                >
                                    {isTokenLoading ? 'Generating Code...' : 'Get Connection Code'}
                                </button>
                            )}
                        </div>
                         <div className="w-full max-w-lg mx-auto bg-black rounded-[40px] p-2 shadow-2xl border-4 border-gray-800">
                             <div className="bg-white rounded-[32px] h-[75vh] flex flex-col overflow-hidden" style={{backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover'}}>
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