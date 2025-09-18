import React, { useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';

const QuizModule = ({ quizData, onQuizSubmit }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleAnswerChange = (qIndex, aIndex) => {
        setAnswers({ ...answers, [qIndex]: aIndex });
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length !== quizData.length) {
            alert("ProsÃ­m, odpovÄ›zte na vÅ¡echny otÃ¡zky.");
            return;
        }
        setSubmitted(true);
        const score = quizData.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswerIndex ? 1 : 0), 0);
        if(onQuizSubmit) {
            onQuizSubmit({ quizData, answers, score, submittedAt: serverTimestamp() });
        }
    };

    let score = submitted ? quizData.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswerIndex ? 1 : 0), 0) : 0;

    return (
        <div className="mt-2 bg-white/80 p-4 rounded-lg shadow-inner">
            <h4 className="font-bold text-center mb-4">Test znalostÃ­</h4>
            {quizData.map((q, qIndex) => (
                <div key={qIndex} className="mb-6">
                    <p className="font-semibold mb-2 text-sm">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                            let optionStyle = 'bg-white/50 border-gray-300';
                            if (submitted) {
                                if (oIndex === q.correctAnswerIndex) {
                                    optionStyle = 'bg-green-200 border-green-500';
                                } else if (answers[qIndex] === oIndex) {
                                    optionStyle = 'bg-red-200 border-red-500';
                                }
                            } else if (answers[qIndex] === oIndex) {
                                optionStyle = 'bg-blue-100 border-blue-400';
                            }
                            
                            return (
                                <label key={oIndex} className={`block p-2 text-sm rounded-lg border cursor-pointer ${optionStyle}`}>
                                    <input type="radio" name={`q${qIndex}`} onChange={() => handleAnswerChange(qIndex, oIndex)} className="hidden" disabled={submitted}/>
                                    {option}
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
            {!submitted && <button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">Vyhodnotit</button>}
            {submitted && <div className="text-center p-4 bg-blue-100 rounded-lg"><p className="text-lg font-bold">SkÃ³re: {score} / {quizData.length}</p></div>}
        </div>
    );
}

export default QuizModule;
