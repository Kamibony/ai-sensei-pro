import React, { useState } from 'react';
import { callGeminiAPI } from '../../services/gemini.js';
import QuizResultView from '../QuizResultView.jsx';
import { IconTrendingUp, IconZap, IconUserCheck, IconClipboardList, ChevronDown } from '../Icons.jsx';

const AnalysisCard = ({ title, points, icon, color, sectionKey, expandedSections, toggleSection }) => {
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


const StudentAnalysis = ({ selectedStudent, lessonText }) => {
    const [overallAnalysis, setOverallAnalysis] = useState(null);
    const [isGeneratingOverall, setIsGeneratingOverall] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    const handleGenerateOverallAnalysis = async () => {
        if (!selectedStudent) return;
        setIsGeneratingOverall(true);
        setOverallAnalysis(null);
        setExpandedSections({});

        const chatHistory = selectedStudent.messages.map(m => `${m.sender}: ${m.text}`).join('\n');
        const quizSummary = selectedStudent.quizzes.map((q, i) =>
            `Kvíz ${i+1}: Skóre ${q.score}/${q.quizData.length}`
        ).join('\n');

        const prompt = `Jsi expertní pedagogický poradce. Na základě celé historie interakcí a všech výsledků kvízů studenta v této lekci, vytvoř strukturovanou analýzu a doporučení.

        Studijní text lekce:
        ---
        ${lessonText}
        ---

        Historie konverzace studenta s AI:
        ---
        ${chatHistory}
        ---

        Souhrn výsledků kvízů:
        ---
        ${quizSummary}
        ---

        Odpověz POUZE ve formátu JSON podle zadaného schématu. Neuváděj žádný další text mimo JSON.`;

        const schema = {
            type: "OBJECT",
            properties: {
                strongPoints: { type: "ARRAY", description: "Pozitivní zjištění, co student zvládl.", items: { type: "STRING" } },
                areasForImprovement: { type: "ARRAY", description: "Konkrétní oblasti, kde má student mezery.", items: { type: "STRING" }},
                recommendationsForStudent: { type: "ARRAY", description: "Akční kroky pro studenta.", items: { type: "STRING" }},
                recommendationsForProfessor: { type: "ARRAY", description: "Návrhy, jak může profesor pomoci.", items: { type: "STRING" }}
            },
            required: ["strongPoints", "areasForImprovement", "recommendationsForStudent", "recommendationsForProfessor"]
        };

         try {
            const resultText = await callGeminiAPI(prompt, schema);
            setOverallAnalysis(JSON.parse(resultText));
        } catch (err) {
            setOverallAnalysis({ error: 'Nepodařilo se vygenerovat souhrnnou analýzu.' });
        } finally {
            setIsGeneratingOverall(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Přehled Kvízů</h3>
            {selectedStudent.quizzes.length > 0 ? selectedStudent.quizzes.map((quizResult, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white">
                    <h4 className="font-bold mb-2">Výsledky Kvízu #{index + 1}</h4>
                    <QuizResultView quizResult={quizResult} />
                </div>
            )) : <p>Student zatím nevyplnil žádný kvíz.</p>}

            <div className="mt-8 p-4 border-t">
                 <h3 className="text-xl font-semibold mb-4">Souhrnná Analýza a Doporučení</h3>
                 <button onClick={handleGenerateOverallAnalysis} disabled={isGeneratingOverall} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg mb-4">
                     {isGeneratingOverall ? 'Generuji souhrn...' : 'Generovat souhrnnou AI analýzu'}
                 </button>
                 {isGeneratingOverall && <div className="flex justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}
                 {overallAnalysis && !overallAnalysis.error && (
                     <div className="space-y-4">
                         <AnalysisCard
                             title="Silné stránky"
                             points={overallAnalysis.strongPoints}
                             icon={<IconTrendingUp className="mr-2 h-5 w-5"/>}
                             color={{ border: 'border-green-200', text: 'text-green-800', bgHeader: 'bg-green-100', bgBody: 'bg-green-50' }}
                             sectionKey="strong"
                             expandedSections={expandedSections}
                             toggleSection={toggleSection}
                         />
                          <AnalysisCard
                             title="Oblasti ke zlepšení"
                             points={overallAnalysis.areasForImprovement}
                             icon={<IconZap className="mr-2 h-5 w-5"/>}
                             color={{ border: 'border-orange-200', text: 'text-orange-800', bgHeader: 'bg-orange-100', bgBody: 'bg-orange-50' }}
                             sectionKey="improve"
                             expandedSections={expandedSections}
                             toggleSection={toggleSection}
                          />
                         <AnalysisCard
                             title="Doporučení pro Studenta"
                             points={overallAnalysis.recommendationsForStudent}
                             icon={<IconUserCheck className="mr-2 h-5 w-5"/>}
                             color={{ border: 'border-blue-200', text: 'text-blue-800', bgHeader: 'bg-blue-100', bgBody: 'bg-blue-50' }}
                             sectionKey="student"
                             expandedSections={expandedSections}
                             toggleSection={toggleSection}
                         />
                        <AnalysisCard
                             title="Doporučení pro Profesora"
                             points={overallAnalysis.recommendationsForProfessor}
                             icon={<IconClipboardList className="mr-2 h-5 w-5"/>}
                             color={{ border: 'border-indigo-200', text: 'text-indigo-800', bgHeader: 'bg-indigo-100', bgBody: 'bg-indigo-50' }}
                             sectionKey="professor"
                             expandedSections={expandedSections}
                             toggleSection={toggleSection}
                         />
                     </div>
                 )}
                 {overallAnalysis?.error && <p className="text-red-500">{overallAnalysis.error}</p>}
            </div>
        </div>
    );
};

export default StudentAnalysis;
