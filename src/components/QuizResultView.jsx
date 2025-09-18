import React from 'react';

const QuizResultView = ({ quizResult }) => {
    const { quizData, answers, score } = quizResult;
    return (
         <div className="mt-2 bg-white/80 p-4 rounded-lg shadow-inner border">
            <h4 className="font-bold text-center mb-4">VÃ½sledky KvÃ­zu</h4>
            {quizData.map((q, qIndex) => (
                <div key={qIndex} className="mb-6">
                    <p className="font-semibold mb-2 text-sm">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                            let optionStyle = 'bg-white/50 border-gray-300';
                            if (oIndex === q.correctAnswerIndex) {
                                optionStyle = 'bg-green-200 border-green-500'; // SprÃ¡vnÃ¡ odpovÄ›Ä
                            } else if (answers[qIndex] === oIndex) {
                                optionStyle = 'bg-red-200 border-red-500'; // Å patnÄ› zvolenÃ¡ odpovÄ›Ä
                            }
                            return (
                                <label key={oIndex} className={`block p-2 text-sm rounded-lg border ${optionStyle}`}>
                                    {option}
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
             <div className="text-center p-4 bg-blue-100 rounded-lg">
                <p className="text-lg font-bold">SkÃ³re: {score} / {quizData.length}</p>
            </div>
        </div>
    )
}

export default QuizResultView;
