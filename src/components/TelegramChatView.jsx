import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config.js';
import { callGeminiAPI } from '../services/gemini.js';
import { sendTelegramMessage } from '../services/telegram.js';
import QuizModule from './QuizModule.jsx';

const TelegramChatView = ({ lesson, lessonId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingToProfessor, setIsSendingToProfessor] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const chatDocRef = doc(db, 'temata', lessonId, 'chats', auth.currentUser.uid);
        const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
            let initialMessages = [
                { type: 'text', text: Vítejte! Jsem AI Sensei pro lekci "\". Ptejte se mě na cokoliv., sender: 'ai' },
            ];
            if (lesson.preparedQuiz && lesson.preparedQuiz.length > 0) {
                initialMessages.push({ type: 'quiz_prompt', sender: 'ai' });
            }
            if (docSnap.exists()) {
                const data = docSnap.data();
                const allMessages = Array.isArray(data.messages) ? data.messages : [];
                allMessages.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
                setMessages(allMessages.length > 0 ? allMessages : initialMessages);
            } else {
                 setMessages(initialMessages);
            }
        });
        return () => unsubscribe();
    }, [lesson, lessonId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(scrollToBottom, [messages]);
    
    const saveQuizResult = async (quizResult) => {
        if (auth.currentUser) {
            const { uid, email } = auth.currentUser;
            const chatDocRef = doc(db, 'temata', lessonId, 'chats', uid);
            const docSnap = await getDoc(chatDocRef);
            if (docSnap.exists()) {
                await updateDoc(chatDocRef, { quizzes: arrayUnion(quizResult) });
            } else {
                await setDoc(chatDocRef, {
                    studentEmail: email,
                    messages: [],
                    quizzes: [quizResult]
                });
            }
        }
    }

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMessage = { text: input, sender: 'student', timestamp: serverTimestamp() };
        const chatDocRef = doc(db, 'temata', lessonId, 'chats', auth.currentUser.uid);
        
        const docSnap = await getDoc(chatDocRef);
        if (!docSnap.exists()) {
            await setDoc(chatDocRef, { 
                studentEmail: auth.currentUser.email,
                messages: [userMessage],
                quizzes: []
            });
        } else {
            await updateDoc(chatDocRef, { messages: arrayUnion(userMessage) });
        }
        
        setInput('');
        setIsLoading(true);
        
        const systemPrompt = Jste expert a asistent. Odpovídejte pouze na základě poskytnutého kontextu. \ Kontext: \n\n\;
        try {
            const aiText = await callGeminiAPI(input, null, systemPrompt);
            const aiMessage = { text: aiText, sender: 'ai', timestamp: serverTimestamp() };
            await updateDoc(chatDocRef, { messages: arrayUnion(aiMessage) });

        } catch (error) {
            console.error("Chat send error:", error);
            const errorMessage = { text: 'Omlouvám se, došlo k chybě.', sender: 'ai', timestamp: serverTimestamp() };
            await updateDoc(chatDocRef, { messages: arrayUnion(errorMessage) });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleContactProfessor = async () => {
        setIsSendingToProfessor(true);
        const chatHistory = messages
            .filter(msg => msg.type !== 'quiz_prompt' && msg.type !== 'quiz_module')
            .map(msg => {
                if (msg.sender === 'student') return Student: \;
                if (msg.sender === 'ai') return AI: \;
                if (msg.sender === 'professor') return Profesor: \;
                return \;
            }).join('\n');

        const studentEmail = auth.currentUser?.email || 'Neznámý student';
        
        const telegramText = *Nová žádost o pomoc od studenta!*\n\n*Lekce:* \\n*Student:* \\n\n*Průběh konverzace:*\n\\\\n\\n\\\`;

        const result = await sendTelegramMessage(telegramText);

        if(result.ok) {
            alert('Vaše zpráva byla úspěšně odeslána profesoru. Brzy se vám ozve.');
        } else {
            alert(Odeslání selhalo. Zkuste to prosím později.);
        }
        setIsSendingToProfessor(false);
    };


    const handleStartQuiz = () => {
        if (lesson.preparedQuiz && lesson.preparedQuiz.length > 0) {
            setMessages(prev => prev.filter(m => m.type !== 'quiz_prompt').concat({type: 'quiz_module', quizData: lesson.preparedQuiz, sender: 'ai'}));
        } else {
            alert("Pro tuto lekci není připraven žádný kvíz.");
        }
    };

    const quizModuleMsg = messages.find(msg => msg.type === 'quiz_module');
    const displayableMessages = messages.filter(msg => msg.type !== 'quiz_module' && msg.type !== 'quiz_prompt');
    const showQuizPrompt = messages.some(m => m.type === 'quiz_prompt');

    return (
        <>
            <div className="p-3 bg-gray-200/80 backdrop-blur-sm shadow-md flex items-center z-10 rounded-t-[32px]">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mr-3">AI</div>
                <div> <h3 className="text-lg font-bold">{lesson.title}</h3> <p className="text-sm text-green-600">online</p> </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {displayableMessages.map((msg, index) => (
                    <div key={index} className={lex mb-3 \}>
                        <div className={ounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap \}>
                           {msg.text}
                        </div>
                    </div>
                ))}
                {quizModuleMsg && (
                    <div className="flex justify-start mb-3">
                        <div className="rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap bg-white">
                             <QuizModule quizData={quizModuleMsg.quizData} onQuizSubmit={saveQuizResult} />
                        </div>
                    </div>
                )}
                 {showQuizPrompt && !quizModuleMsg && (
                    <div className="flex justify-start mb-3">
                         <div className="rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap bg-white">
                            <button onClick={handleStartQuiz} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg w-full">Spustit kvíz</button>
                        </div>
                    </div>
                 )}
                {isLoading && <div className="flex justify-start"><div className="bg-white rounded-xl px-4 py-2 shadow-sm"><div className="flex items-center space-x-1"><span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span><span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.3s]"></span><span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.5s]"></span></div></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t bg-white/50 backdrop-blur-sm">
                <button 
                    onClick={handleContactProfessor} 
                    disabled={isSendingToProfessor || messages.length <= 2}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed mb-2"
                >
                    {isSendingToProfessor ? 'Odesílám...' : 'Požádat o pomoc profesora'}
                </button>
            </div>
            <form onSubmit={handleSend} className="p-2 pt-0 bg-white/50 backdrop-blur-sm flex items-center rounded-b-[32px]">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Napsat zprávu..." className="flex-grow px-4 py-2 border bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center ml-2 disabled:bg-gray-400" disabled={isLoading || !input.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                </button>
            </form>
        </>
    );
};

export default TelegramChatView;