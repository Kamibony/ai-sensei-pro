import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { callGeminiAPI } from '../../services/gemini.js';

const QuizGenerator = ({ studentText, lessonId, lesson }) => {
    const [quizConfig, setQuizConfig] = useState({ count: 5, instructions: '' });
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [preparedQuiz, setPreparedQuiz] = useState(null);

    useEffect(() => {
        if (lesson && lesson.preparedQuiz) {
            setPreparedQuiz(lesson.preparedQuiz);
        }
    }, [lesson]);

    const handleQuizConfigChange = (e) => {
        setQuizConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGeneratePreparedQuiz = async () => {
        if (!studentText) {
            toast.error("Nejprve vygenerujte studijní text lekce.");
            return;
        }
        setIsGeneratingQuiz(true);

        const prompt = `Jsi učitel. Na základě následujícího studijního textu vytvoř kvíz. Dodržuj tyto instrukce:
        1. Vytvoř přesně ${quizConfig.count} otázek.
        2. Každá otázka musí mít 4 možné odpovědi.
        3. Jasně označ index správné odpovědi (0-3).
        4. ${quizConfig.instructions ? `Zaměř se na tyto specifické pokyny: ${quizConfig.instructions}` : ''}

        Studijní text:
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
            toast.success('Kvíz byl úspěšně vygenerován a uložen!');

        } catch (error) {
            toast.error('Nepodařilo se vygenerovat kvíz.');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t">
            <h3 className="text-xl font-semibold mb-2">5. Příprava Kvízu</h3>
            <div className="grid md:grid-cols-2 gap-8 p-4 border rounded-lg bg-gray-50">
                <div>
                    <label className="font-semibold block mb-1">Počet otázek</label>
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
                    <label className="font-semibold block mb-1">Specifické pokyny pro AI</label>
                    <textarea
                        name="instructions"
                        value={quizConfig.instructions}
                        onChange={handleQuizConfigChange}
                        rows="3"
                        className="w-full p-3 border rounded-lg"
                        placeholder="Např. Zaměř se na definice..."
                    ></textarea>
                </div>
                <div className="md:col-span-2">
                     <button
                        onClick={handleGeneratePreparedQuiz}
                        disabled={isGeneratingQuiz}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg"
                    >
                        {isGeneratingQuiz ? 'Generuji kvíz...' : 'Vygenerovat a Uložit Kvíz'}
                    </button>
                </div>
            </div>
             {preparedQuiz && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Náhled připraveného kvízu:</h4>
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
    );
};

export default QuizGenerator;
