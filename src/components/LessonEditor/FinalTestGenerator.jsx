import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { callGeminiAPI } from '../../services/gemini.js';

const FinalTestGenerator = ({ studentText, lessonId, lesson }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [config, setConfig] = useState({
        count: 10,
        type: 'multiple-choice',
        difficulty: 'střední'
    });
    const [generatedTest, setGeneratedTest] = useState(null);

    const handleChange = (e) => {
        setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerate = async () => {
        if (!studentText) {
            toast.error("Nejprve vygenerujte a uložte studijní text.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading('Generuji finální test...');
        
        const prompt = `Jsi expert na tvorbu testů. Na základě studijního textu vytvoř finální test.
        Studijní text: """${studentText}"""
        Požadavky:
        - Vytvoř přesně ${config.count} otázek.
        - Typ otázek: ${config.type}.
        - Obtížnost: ${config.difficulty}.
        - Každá otázka musí mít 'question' (otázka), 'options' (pole 4 možností) a 'correctAnswerIndex' (index správné odpovědi 0-3).
        - Přidej i 'explanation' (krátké vysvětlení správné odpovědi).
        Odpověz POUZE ve formátu JSON.`;

        const schema = {
            type: "ARRAY", items: { type: "OBJECT", properties: { "question": { "type": "STRING" }, "options": { "type": "ARRAY", "items": { "type": "STRING" }}, "correctAnswerIndex": { "type": "INTEGER" }, "explanation": { "type": "STRING" }}, required: ["question", "options", "correctAnswerIndex", "explanation"] }
        };

        try {
            const resultText = await callGeminiAPI(prompt, schema);
            const testData = JSON.parse(resultText);
            
            const lessonRef = doc(db, 'temata', lessonId);
            await updateDoc(lessonRef, { finalTest: testData });
            
            setGeneratedTest(testData);
            toast.success('Finální test byl úspěšně vygenerován a uložen!', { id: toastId });
        } catch (error) {
            toast.error('Generování testu selhalo.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="mt-8 pt-8 border-t">
            <h3 className="text-xl font-semibold mb-2">7. Generátor Finálního Testu</h3>
            <div className="p-4 border rounded-lg bg-gray-50 grid md:grid-cols-3 gap-6">
                <div>
                    <label className="font-semibold block mb-1">Počet otázek</label>
                    <input type="number" name="count" value={config.count} onChange={handleChange} min="5" max="20" className="w-full p-3 border rounded-lg"/>
                </div>
                <div>
                    <label className="font-semibold block mb-1">Typ otázek</label>
                    <select name="type" value={config.type} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                        <option value="multiple-choice">Výběr z možností</option>
                        <option value="true-false">Pravda/Nepravda</option>
                    </select>
                </div>
                <div>
                    <label className="font-semibold block mb-1">Obtížnost</label>
                    <select name="difficulty" value={config.difficulty} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                        <option value="lehká">Lehká</option>
                        <option value="střední">Střední</option>
                        <option value="těžká">Těžká</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg">
                        {isGenerating ? 'Generuji...' : 'Vytvořit a Uložit Finální Test'}
                    </button>
                </div>
            </div>
             {(generatedTest || lesson?.finalTest) && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Náhled vygenerovaného testu:</h4>
                    <div className="p-4 border rounded-lg max-h-96 overflow-y-auto">
                        {(generatedTest || lesson.finalTest).map((q, i) => (
                            <div key={i} className="mb-4 pb-2 border-b">
                                <p className="font-bold">{i+1}. {q.question}</p>
                                <ul className="list-disc list-inside ml-4 text-sm">
                                    {q.options.map((opt, j) => (
                                        <li key={j} className={j === q.correctAnswerIndex ? 'text-green-600 font-semibold' : ''}>{opt}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-gray-500 mt-1">Vysvětlení: {q.explanation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinalTestGenerator;