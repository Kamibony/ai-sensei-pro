import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/config.js';
import { callGeminiAPI } from '../services/gemini.js';
import { ChevronDown } from './Icons.jsx';


const LessonEditor = ({ lesson, studentText, setStudentText, videoUrl, setVideoUrl, chatbotPersona, setChatbotPersona, lessonId }) => {
    const [sourceFiles, setSourceFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [fileError, setFileError] = useState('');
    const [refineQuery, setRefineQuery] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const fileInputRef = useRef(null);
    
    const [quizConfig, setQuizConfig] = useState({ count: 5, instructions: '' });
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [preparedQuiz, setPreparedQuiz] = useState(null);

    useEffect(() => {
        if (lesson && lesson.preparedQuiz) {
            setPreparedQuiz(lesson.preparedQuiz);
        }
    }, [lesson]);
    
    const fetchFiles = useCallback(async () => {
        try {
            const filesRef = ref(storage, `sources/${lessonId}`);
            const res = await listAll(filesRef);
            const files = await Promise.all(res.items.map(async (itemRef) => ({
                name: itemRef.name,
                url: await getDownloadURL(itemRef)
            })));
            setSourceFiles(files);
        } catch (error) {
            setFileError(`NepodaÅ™ilo se naÄÃ­st soubory.`);
        }
    }, [lessonId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);
    
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `sources/${lessonId}/${file.name}`);
            await uploadBytes(storageRef, file);
            await fetchFiles();
        } catch (error) {
            console.error("Firebase Storage upload error:", error);
            setFileError('NahrÃ¡vÃ¡nÃ­ selhalo. Zkontrolujte konzoli (F12) pro detaily.');
        } finally {
            setUploading(false);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDeleteFile = async (fileName) => {
        if (!window.confirm(`Opravdu si pÅ™ejete smazat soubor "${fileName}"?`)) {
            return;
        }
        try {
            const fileRef = ref(storage, `sources/${lessonId}/${fileName}`);
            await deleteObject(fileRef);
            fetchFiles();
        } catch (error) {
            console.error("Error deleting file:", error);
            setFileError("Soubor se nepodaÅ™ilo smazat.");
        }
    };

    const handleGenerate = async () => {
        const supportedFiles = sourceFiles.filter(file => file.name.endsWith('.txt') || file.name.endsWith('.md'));
        
        if (supportedFiles.length === 0) {
            setFileError('Nebyly nalezeny Å¾Ã¡dnÃ© podporovanÃ© soubory (.txt, .md) pro generovÃ¡nÃ­.');
            return;
        }

        setIsGenerating(true);
        setFileError('');
        try {
            const texts = await Promise.all(supportedFiles.map(file => fetch(file.url).then(res => res.text())));
            const combinedContent = texts.join('\n\n---\n\n');
            const studentTextPrompt = `Jste expert na vzdÄ›lÃ¡vÃ¡nÃ­. Na zÃ¡kladÄ› VÅ ECH NÃSLEDUJÃCÃCH MATERIÃLÅ® (oddÄ›lenÃ½ch '---') vytvoÅ™te jeden souvislÃ½ a srozumitelnÃ½ studijnÃ­ text pro studenta. Syntetizujte informace ze vÅ¡ech zdrojÅ¯. PouÅ¾ijte nadpisy a odrÃ¡Å¾ky. MateriÃ¡ly:\n\n${combinedContent}`;
            const generatedText = await callGeminiAPI(studentTextPrompt);
            setStudentText(generatedText);
        } catch (error) {
            setFileError('GenerovÃ¡nÃ­ selhalo.');
        } finally {
            setIsGenerating(false);
        }
    }

    const handleRefineText = async (e) => {
        e.preventDefault();
        if (!refineQuery.trim() || !studentText.trim()) return;
        setIsRefining(true);
        const prompt = `Jako expert na vzdÄ›lÃ¡vÃ¡nÃ­, uprav nÃ¡sledujÃ­cÃ­ text na zÃ¡kladÄ› tohoto poÅ¾adavku: "${refineQuery}". Text k ÃºpravÄ›:\n\n${studentText}`;
        try {
            const refinedText = await callGeminiAPI(prompt);
            setStudentText(refinedText);
            setRefineQuery('');
        } catch(error) {
            console.error("Refining failed", error)
        } finally {
            setIsRefining(false);
        }
    }

    const handleQuizConfigChange = (e) => {
        setQuizConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGeneratePreparedQuiz = async () => {
        if (!studentText) {
            alert("Nejprve vygenerujte studijnÃ­ text lekce.");
            return;
        }
        setIsGeneratingQuiz(true);
        
        const prompt = `Jsi uÄitel. Na zÃ¡kladÄ› nÃ¡sledujÃ­cÃ­ho studijnÃ­ho textu vytvoÅ™ kvÃ­z. DodrÅ¾uj tyto instrukce:
        1. VytvoÅ™ pÅ™esnÄ› ${quizConfig.count} otÃ¡zek.
        2. KaÅ¾dÃ¡ otÃ¡zka musÃ­ mÃ­t 4 moÅ¾nÃ© odpovÄ›di.
        3. JasnÄ› oznaÄ index sprÃ¡vnÃ© odpovÄ›di (0-3).
        4. ${quizConfig.instructions ? `ZamÄ›Å™ se na tyto specifickÃ© pokyny: ${quizConfig.instructions}` : ''}
        
        StudijnÃ­ text:
        ---
        ${studentText}
        ---`;

        const schema = {
            type: "ARRAY", items: { type: "OBJECT", properties: { "question": { "type": "STRING" }, "options": { "type": "ARRAY", "items": { "type": "STRING" }}, "correctAnswerIndex": { "type": "INTEGER" }}, required: ["question", "options", "correctAnswerIndex"] }
        };

        try {
            const resultText = await callGeminiAPI(prompt, schema);
            const generatedQuiz = JSON.parse(resultText);
            
            const lessonRef = doc(db, 'temata', lessonId);
            await updateDoc(lessonRef, { preparedQuiz: generatedQuiz });
            
            setPreparedQuiz(generatedQuiz);
            alert('KvÃ­z byl ÃºspÄ›Å¡nÄ› vygenerovÃ¡n a uloÅ¾en!');

        } catch (error) {
            alert('NepodaÅ™ilo se vygenerovat kvÃ­z.');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };
    
    const unsupportedFiles = sourceFiles.filter(file => !file.name.endsWith('.txt') && !file.name.endsWith('.md'));

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-2">1. ZdrojovÃ© soubory</h3>
                    <div className="p-4 border rounded-lg h-full">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.pdf" />
                        <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">{uploading ? 'NahrÃ¡vÃ¡m...' : 'NahrÃ¡t soubor'}</button>
                        {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
                        <ul className="mt-4 space-y-2">
                            {sourceFiles.map(file => (
                                <li key={file.name} className="flex items-center justify-between">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate pr-2">{file.name}</a>
                                    <button onClick={() => handleDeleteFile(file.name)} className="text-red-500 hover:text-red-700 font-bold text-lg px-2">&times;</button>
                                </li>
                            ))}
                        </ul>
                         {unsupportedFiles.length > 0 && (
                            <div className="mt-4 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm">
                                <p><strong>UpozornÄ›nÃ­:</strong> NÃ¡sledujÃ­cÃ­ soubory majÃ­ nepodporovanÃ½ formÃ¡t a budou pÅ™i generovÃ¡nÃ­ lekce ignorovÃ¡ny:</p>
                                <ul className="list-disc list-inside ml-4">
                                    {unsupportedFiles.map(f => <li key={f.name}>{f.name}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-2">2. Vygenerovat & Upravit Lekci</h3>
                    <button onClick={handleGenerate} disabled={isGenerating || sourceFiles.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full disabled:bg-purple-400">
                        {isGenerating ? 'Generuji...' : 'âœ¨ Vygenerovat text lekce'}
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2">3. FinÃ¡lnÃ­ podoba lekce</h3>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <textarea value={studentText} onChange={e => setStudentText(e.target.value)} rows="18" className="w-full p-4 border rounded-lg shadow-inner" placeholder="Zde se zobrazÃ­ text pro studenta..."></textarea>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">VylepÅ¡it text s AI</h4>
                        <p className="text-sm text-gray-600 mb-4">Zadejte pokyn pro Ãºpravu textu vlevo.</p>
                        <form onSubmit={handleRefineText}>
                            <textarea value={refineQuery} onChange={(e) => setRefineQuery(e.target.value)} rows="4" className="w-full p-2 border rounded-lg" placeholder="NapÅ™. 'ZjednoduÅ¡ to' nebo 'PÅ™idej pÅ™Ã­klad...'"></textarea>
                            <button type="submit" disabled={isRefining} className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg disabled:bg-gray-400">Upravit</button>
                        </form>
                    </div>
                </div>
            </div>

             <div>
                <h3 className="text-xl font-semibold mb-2">4. DoplÅˆkovÃ© materiÃ¡ly</h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="font-semibold">Video k Lekci (YouTube URL)</label>
                        <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full p-3 mt-1 border rounded-lg" />
                    </div>
                     <div>
                        <label className="font-semibold">ChovÃ¡nÃ­ AI Asistenta (Prompt)</label>
                        <textarea value={chatbotPersona} onChange={e => setChatbotPersona(e.target.value)} rows="3" className="w-full p-3 mt-1 border rounded-lg" placeholder="NapÅ™. 'Jsi vtipnÃ½ asistent, kterÃ½ pouÅ¾Ã­vÃ¡ analogie.'"></textarea>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t">
                <h3 className="text-xl font-semibold mb-2">5. PÅ™Ã­prava KvÃ­zu</h3>
                <div className="grid md:grid-cols-2 gap-8 p-4 border rounded-lg bg-gray-50">
                    <div>
                        <label className="font-semibold block mb-1">PoÄet otÃ¡zek</label>
                        <input 
                            type="number" 
                            name="count"
                            value={quizConfig.count}
                            onChange={handleQuizConfigChange}
                            min="1" max="10"
                            className="w-full p-3 border rounded-lg" 
                        />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">SpecifickÃ© pokyny pro AI</label>
                        <textarea 
                            name="instructions"
                            value={quizConfig.instructions}
                            onChange={handleQuizConfigChange}
                            rows="3" 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="NapÅ™. ZamÄ›Å™ se na definice..."
                        ></textarea>
                    </div>
                    <div className="md:col-span-2">
                         <button 
                            onClick={handleGeneratePreparedQuiz} 
                            disabled={isGeneratingQuiz} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg"
                        >
                            {isGeneratingQuiz ? 'Generuji kvÃ­z...' : 'Vygenerovat a UloÅ¾it KvÃ­z'}
                        </button>
                    </div>
                </div>
                 {preparedQuiz && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">NÃ¡hled pÅ™ipravenÃ©ho kvÃ­zu:</h4>
                        <div className="p-4 border rounded-lg max-h-96 overflow-y-auto">
                            {preparedQuiz.map((q, i) => (
                                <div key={i} className="mb-4">
                                    <p className="font-bold">{i+1}. {q.question}</p>
                                    <ul className="list-disc list-inside ml-4">
                                        {q.options.map((opt, j) => (
                                            <li key={j} className={j === q.correctAnswerIndex ? 'text-green-600' : ''}>{opt}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};

export default LessonEditor;
