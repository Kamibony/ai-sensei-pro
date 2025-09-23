import React, { useState, useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config.js';
import toast from 'react-hot-toast';

const StudentChat = ({ selectedStudent, lessonId }) => {
    const [professorMessage, setProfessorMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedStudent?.messages]);

    const handleProfessorSend = async (e) => {
        e.preventDefault();
        if (!professorMessage.trim() || !selectedStudent || isSending) return;

        setIsSending(true);
        const sendMessage = httpsCallable(functions, 'sendMessageToStudent');

        try {
            await sendMessage({
                studentId: selectedStudent.studentId,
                lessonId: lessonId,
                text: professorMessage,
            });
            setProfessorMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Odeslání zprávy selhalo.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-black rounded-[40px] p-2 shadow-2xl border-4 border-gray-800">
            <div className="bg-white rounded-[32px] h-[85vh] flex flex-col overflow-hidden" style={{backgroundImage: `url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')`, backgroundSize: 'cover'}}>
                <div className="p-3 bg-gray-200/80 backdrop-blur-sm shadow-md flex items-center z-10 rounded-t-[32px]">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mr-3">S</div>
                    <div><h3 className="text-lg font-bold">{selectedStudent.studentEmail}</h3></div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    {selectedStudent.messages.map((msg, index) => (
                        <div key={index} className={`flex mb-3 ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                                msg.sender === 'student' ? 'bg-[#e1ffc7]' :
                                msg.sender === 'professor' ? 'bg-blue-200' : 'bg-white'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                 <form onSubmit={handleProfessorSend} className="p-2 border-t bg-white/50 backdrop-blur-sm flex items-center rounded-b-[32px]">
                    <input type="text" value={professorMessage} onChange={e => setProfessorMessage(e.target.value)} placeholder="Napsat zprávu studentovi..." className="flex-grow px-4 py-2 border bg-white rounded-full focus:outline-none" />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentChat;
