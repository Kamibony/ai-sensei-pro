import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, doc, collection, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { callGeminiAPI } from '../services/gemini.js';
import QuizResultView from './QuizResultView.jsx';
import { IconTrendingUp, IconZap, IconUserCheck, IconClipboardList, ChevronDown } from './Icons.jsx';


const StudentInteractions = ({ lessonId, lessonText }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('komunikace');
    const [professorMessage, setProfessorMessage] = useState('');
    const [overallAnalysis, setOverallAnalysis] = useState(null);
    const [isGeneratingOverall, setIsGeneratingOverall] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const messagesEndRef = useRef(null);

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
                        studentEmail: data.studentEmail || 'Email nezaznamenÃ¡n',
                        messages: messages.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0)),
                        quizzes: data.quizzes || [],
                    };
                });
                setChats(chatsData);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching student interactions:", err);
                setError("NepodaÅ™ilo se naÄÃ­st data. Zkuste to prosÃ­m znovu.");
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedStudent?.messages]);


    const handleProfessorSend = async (e) => {
        e.preventDefault();
        if (!professorMessage.trim() || !selectedStudent) return;
        
        const newMessage = {
            text: professorMessage,
            sender: 'professor',
            timestamp: serverTimestamp()
        };

        const chatDocRef = doc(db, 'temata', lessonId, 'chats', selectedStudent.studentId);
        try {
            await updateDoc(chatDocRef, {
                messages: arrayUnion(newMessage)
            });
            setProfessorMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };
    
    const handleGenerateOverallAnalysis = async () => {
        if (!selectedStudent) return;
        setIsGeneratingOverall(true);
        setOverallAnalysis(null);
        setExpandedSections({});

        const chatHistory = selectedStudent.messages.map(m => `${m.sender}: ${m.text}`).join('\n');
        const quizSummary = selectedStudent.quizzes.map((q, i) => 
            `KvÃ­z ${i+1}: SkÃ³re ${q.score}/${q.quizData.length}`
        ).join('\n');

        const prompt = `Jsi expertnÃ­ pedagogickÃ½ poradce. Na zÃ¡kladÄ› celÃ© historie interakcÃ­ a vÅ¡ech vÃ½sledkÅ¯ kvÃ­zÅ¯ studenta v tÃ©to lekci, vytvoÅ™ strukturovanou analÃ½zu a doporuÄenÃ­.
        
        StudijnÃ­ text lekce:
        ---
        ${lessonText}
        ---

        Historie konverzace studenta s AI:
        ---
        ${chatHistory}
        ---

        Souhrn vÃ½sledkÅ¯ kvÃ­zÅ¯:
        ---
        ${quizSummary}
        ---

        OdpovÄ›z POUZE ve formÃ¡tu JSON podle zadanÃ©ho schÃ©matu. NeuvÃ¡dÄ›j Å¾Ã¡dnÃ½ dalÅ¡Ã­ text mimo JSON.`;
        
        const schema = {
            type: "OBJECT",
            properties: {
                strongPoints: { type: "ARRAY", description: "PozitivnÃ­ zjiÅ¡tÄ›nÃ­, co student zvlÃ¡dl.", items: { type: "STRING" } },
                areasForImprovement: { type: "ARRAY", description: "KonkrÃ©tnÃ­ oblasti, kde mÃ¡ student mezery.", items: { "type": "STRING" }},
                recommendationsForStudent: { type: "ARRAY", description: "AkÄnÃ­ kroky pro studenta.", items: { "type": "STRING" }},
                recommendationsForProfessor: { type: "ARRAY", description: "NÃ¡vrhy, jak mÅ¯Å¾e profesor pomoci.", items: { "type": "STRING" }}
            },
            required: ["strongPoints", "areasForImprovement", "recommendationsForStudent", "recommendationsForProfessor"]
        };

         try {
            const resultText = await callGeminiAPI(prompt, schema);
            setOverallAnalysis(JSON.parse(resultText));
        } catch (err) {
            setOverallAnalysis({ error: 'NepodaÅ™ilo se vygenerovat souhrnnou analÃ½zu.' });
        } finally {
            setIsGeneratingOverall(false);
        }
    };
    
    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };


    if (loading) return <p>NaÄÃ­tÃ¡nÃ­ interakcÃ­...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    const AnalysisCard = ({ title, points, icon, color, sectionKey }) => {
        const isOpen = expandedSections[sectionKey];
        if (!points || points.length === 0) return null;
        return (
            <div className={`border ${color.border} rounded-lg`}>
                <button onClick={() => toggleSection(sectionKey)} className={`w-full flex justify-between items-center p-4 font-bold ${color.text} ${color.bgHeader} transition-colors hover:bg-gray-50`}>
                    <span className="flex items-center">{icon}{title}</span>
                    <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className={`p-4 ${color.bgBody}`}>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                           {points.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h3 className="text-xl font-semibold mb-4">Studenti</h3>
                {chats.length > 0 ? (
                    <ul className="space-y-2">
                        {chats.map(chat => (
                            <li key={chat.studentId}>
                                <button onClick={() => { setSelectedStudent(chat); setOverallAnalysis(null); }} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedStudent?.studentId === chat.studentId ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {chat.studentEmail}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500">ZatÃ­m Å¾Ã¡dnÃ© interakce.</p>}
            </div>
            <div className="md:col-span-2">
                {selectedStudent ? (
                    <div>
                         <div className="border-b mb-4">
                            <button onClick={() => setActiveTab('komunikace')} className={`py-2 px-4 ${activeTab === 'komunikace' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Komunikace</button>
                            <button onClick={() => setActiveTab('analyza')} className={`py-2 px-4 ${activeTab === 'analyza' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>AI AnalÃ½za</button>
                        </div>

                        {activeTab === 'komunikace' && (
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
                                         <input type="text" value={professorMessage} onChange={e => setProfessorMessage(e.target.value)} placeholder="Napsat zprÃ¡vu studentovi..." className="flex-grow px-4 py-2 border bg-white rounded-full focus:outline-none" />
                                         <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center ml-2">
                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                                         </button>
                                     </form>
                                 </div>
                             </div>
                        )}

                        {activeTab === 'analyza' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold">PÅ™ehled KvÃ­zÅ¯</h3>
                                {selectedStudent.quizzes.length > 0 ? selectedStudent.quizzes.map((quizResult, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-white">
                                        <h4 className="font-bold mb-2">VÃ½sledky KvÃ­zu #{index + 1}</h4>
                                        <QuizResultView quizResult={quizResult} />
                                    </div>
                                )) : <p>Student zatÃ­m nevyplnil Å¾Ã¡dnÃ½ kvÃ­z.</p>}
                                
                                <div className="mt-8 p-4 border-t">
                                     <h3 className="text-xl font-semibold mb-4">SouhrnnÃ¡ AnalÃ½za a DoporuÄenÃ­</h3>
                                     <button onClick={handleGenerateOverallAnalysis} disabled={isGeneratingOverall} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg mb-4">
                                         {isGeneratingOverall ? 'Generuji souhrn...' : 'Generovat souhrnnou AI analÃ½zu'}
                                     </button>
                                     {isGeneratingOverall && <div className="flex justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                     {overallAnalysis && !overallAnalysis.error && (
                                         <div className="space-y-4">
                                             <AnalysisCard 
                                                 title="SilnÃ© strÃ¡nky" 
                                                 points={overallAnalysis.strongPoints} 
                                                 icon={<IconTrendingUp className="mr-2 h-5 w-5"/>}
                                                 color={{ border: 'border-green-200', text: 'text-green-800', bgHeader: 'bg-green-100', bgBody: 'bg-green-50' }}
                                                 sectionKey="strong"
                                             />
                                              <AnalysisCard 
                                                 title="Oblasti ke zlepÅ¡enÃ­" 
                                                 points={overallAnalysis.areasForImprovement} 
                                                 icon={<IconZap className="mr-2 h-5 w-5"/>}
                                                 color={{ border: 'border-orange-200', text: 'text-orange-800', bgHeader: 'bg-orange-100', bgBody: 'bg-orange-50' }}
                                                 sectionKey="improve"
                                             />
                                             <AnalysisCard 
                                                 title="DoporuÄenÃ­ pro Studenta" 
                                                 points={overallAnalysis.recommendationsForStudent} 
                                                 icon={<IconUserCheck className="mr-2 h-5 w-5"/>}
                                                 color={{ border: 'border-blue-200', text: 'text-blue-800', bgHeader: 'bg-blue-100', bgBody: 'bg-blue-50' }}
                                                 sectionKey="student"
                                             />
                                            <AnalysisCard 
                                                 title="DoporuÄenÃ­ pro Profesora" 
                                                 points={overallAnalysis.recommendationsForProfessor} 
                                                 icon={<IconClipboardList className="mr-2 h-5 w-5"/>}
                                                 color={{ border: 'border-indigo-200', text: 'text-indigo-800', bgHeader: 'bg-indigo-100', bgBody: 'bg-indigo-50' }}
                                                 sectionKey="professor"
                                             />
                                         </div>
                                     )}
                                     {overallAnalysis?.error && <p className="text-red-500">{overallAnalysis.error}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                        <p className="text-gray-500">Vyberte studenta ze seznamu vlevo pro zobrazenÃ­ jeho interakcÃ­ a analÃ½z.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentInteractions;
