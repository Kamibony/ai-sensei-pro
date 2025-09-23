import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

// Jednoduchá a bezpečná verze pro dočasné použití
const SourceFilesManager = ({ lessonId }) => {
    const [sourceFiles, setSourceFiles] = useState([
        { name: "simulovany-soubor-1.pdf", url: "#" },
    ]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);

    const handleAnalyzeFile = async (fileName) => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        toast.loading("Simuluji analýzu souboru...");

        setTimeout(() => {
            const fakeAnalysis = `Toto je falešný výsledek analýzy pro soubor: ${fileName}.\n- Vše funguje, build je opravený.`;
            setAnalysisResult(fakeAnalysis);
            toast.dismiss();
            toast.success("Analýza dokončena (simulace)!");
            setIsAnalyzing(false);
        }, 1500);
    };
    
    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">1. Zdrojové soubory (pro tuto lekci)</h3>
            <div className="p-4 border rounded-lg h-full">
                <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf" />
                <button 
                    onClick={() => toast.success('Nahrávání je dočasně simulováno.')} 
                    disabled={isAnalyzing} 
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                    Nahrát PDF soubor(y)
                </button>
                
                <ul className="mt-4 space-y-2">
                    {sourceFiles.map(file => (
                        <li key={file.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <span className="text-blue-600 truncate pr-2">{file.name}</span>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleAnalyzeFile(file.name)} disabled={isAnalyzing} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md disabled:bg-gray-400">
                                    Analyzovat s AI
                                </button>
                                <button onClick={() => toast.success('Mazání je dočasně simulováno.')} disabled={isAnalyzing} className="text-red-500 hover:text-red-700 font-bold text-lg px-2 disabled:text-gray-400">&times;</button>
                            </div>
                        </li>
                    ))}
                </ul>

                {analysisResult && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-bold mb-2">Výsledek analýzy:</h4>
                        <p className="text-sm whitespace-pre-wrap">{analysisResult}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SourceFilesManager;