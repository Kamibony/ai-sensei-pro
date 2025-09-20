import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { callGeminiAPI } from '../../services/gemini.js';

const TextEditor = ({ studentText, setStudentText, sourceFiles }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [refineQuery, setRefineQuery] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [fileError, setFileError] = useState('');

    const handleGenerate = async () => {
        const supportedFiles = sourceFiles.filter(file => file.name.endsWith('.txt') || file.name.endsWith('.md'));

        if (supportedFiles.length === 0) {
            setFileError('Nebyly nalezeny žádné podporované soubory (.txt, .md) pro generování.');
            return;
        }

        setIsGenerating(true);
        setFileError('');
        try {
            const texts = await Promise.all(supportedFiles.map(file => fetch(file.url).then(res => res.text())));
            const combinedContent = texts.join('\n\n---\n\n');
            const studentTextPrompt = `Jste expert na vzdělávání. Na základě VŠECH NÁSLEDUJÍCÍCH MATERIÁLŮ (oddělených '---') vytvořte jeden souvislý a srozumitelný studijní text pro studenta. Syntetizujte informace ze všech zdrojů. Použijte nadpisy a odrážky. Materiály:\n\n${combinedContent}`;
            const generatedText = await callGeminiAPI(studentTextPrompt);
            setStudentText(generatedText);
            toast.success("Text lekce byl úspěšně vygenerován!");
        } catch (error) {
            setFileError('Generování selhalo.');
            toast.error("Generování textu selhalo.");
        } finally {
            setIsGenerating(false);
        }
    }

    const handleRefineText = async (e) => {
        e.preventDefault();
        if (!refineQuery.trim() || !studentText.trim()) return;
        setIsRefining(true);
        const prompt = `Jako expert na vzdělávání, uprav následující text na základě tohoto požadavku: "${refineQuery}". Text k úpravě:\n\n${studentText}`;
        try {
            const refinedText = await callGeminiAPI(prompt);
            setStudentText(refinedText);
            setRefineQuery('');
            toast.success("Text byl upraven.");
        } catch(error) {
            console.error("Refining failed", error)
            toast.error("Úprava textu selhala.");
        } finally {
            setIsRefining(false);
        }
    }

    return (
        <>
            <div>
                <h3 className="text-xl font-semibold mb-2">2. Vygenerovat & Upravit Lekci</h3>
                <button onClick={handleGenerate} disabled={isGenerating || sourceFiles.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full disabled:bg-purple-400">
                    {isGenerating ? 'Generuji...' : '✨ Vygenerovat text lekce'}
                </button>
                {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2">3. Finální podoba lekce</h3>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <textarea value={studentText} onChange={e => setStudentText(e.target.value)} rows="18" className="w-full p-4 border rounded-lg shadow-inner" placeholder="Zde se zobrazí text pro studenta..."></textarea>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">Vylepšit text s AI</h4>
                        <p className="text-sm text-gray-600 mb-4">Zadejte pokyn pro úpravu textu vlevo.</p>
                        <form onSubmit={handleRefineText}>
                            <textarea value={refineQuery} onChange={(e) => setRefineQuery(e.target.value)} rows="4" className="w-full p-2 border rounded-lg" placeholder="Např. 'Zjednoduš to' nebo 'Přidej příklad...'"></textarea>
                            <button type="submit" disabled={isRefining} className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg disabled:bg-gray-400">Upravit</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TextEditor;
