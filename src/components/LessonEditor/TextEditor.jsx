import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import toast from 'react-hot-toast';

const TextEditor = ({ lessonId }) => {
    const [lessonText, setLessonText] = useState('');
    const [sourceFiles, setSourceFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!lessonId) return;

        const docRef = doc(db, 'lessons', lessonId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setLessonText(data.lessonText || '');
                // Bezpečná kontrola pro sourceFiles
                setSourceFiles(data.sourceFiles || []);
                setError(null);
            } else {
                setError('Lekce nebyla nalezena.');
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching lesson data:", err);
            setError('Nepodařilo se načíst data lekce.');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [lessonId]);


    const handleSave = async () => {
        try {
            const docRef = doc(db, 'lessons', lessonId);
            await updateDoc(docRef, {
                lessonText: lessonText
            });
            toast.success('Text lekce byl úspěšně uložen!');
        } catch (error) {
            toast.error('Ukládání selhalo.');
            console.error("Error saving lesson text: ", error);
        }
    };

    if (isLoading) {
        return <div>Načítání editoru...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">2. Text lekce (manuální úpravy)</h3>
            <div className="p-4 border rounded-lg">
                <textarea
                    value={lessonText}
                    onChange={(e) => setLessonText(e.target.value)}
                    className="w-full h-64 p-2 border rounded"
                    placeholder="Zde můžete psát nebo upravovat text lekce..."
                />
                <div className="flex justify-between items-center mt-4">
                    {/* Bezpečná kontrola pro zobrazení počtu souborů */}
                    <p className="text-sm text-gray-500">
                        K dispozici je {sourceFiles.length} zdrojových souborů.
                    </p>
                    <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
                        Uložit text
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TextEditor;