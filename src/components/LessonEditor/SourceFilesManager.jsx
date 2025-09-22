import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { storage } from '../../firebase/config.js';

const SourceFilesManager = ({ lessonId }) => {
    const [sourceFiles, setSourceFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);
    const functions = getFunctions();

    const fetchFiles = useCallback(async () => {
        if (!lessonId) return;
        try {
            const filesRef = ref(storage, `sources/${lessonId}`);
            const res = await listAll(filesRef);
            const files = await Promise.all(res.items.map(async (itemRef) => ({
                name: itemRef.name,
                url: await getDownloadURL(itemRef)
            })));
            setSourceFiles(files);
        } catch (error) {
            console.error("Nepodařilo se načíst soubory:", error);
        }
    }, [lessonId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles, lessonId]);

    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (!files || !lessonId) return;
        
        Array.from(files).forEach(file => {
            const allowedTypes = ['application/pdf']; // Omezeno jen na PDF pro tuto funkci
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Pro AI analýzu jsou podporovány pouze PDF soubory: ${file.name}`);
                return;
            }

            const storageRef = ref(storage, `sources/${lessonId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    toast.error('Nahrávání selhalo.');
                    setUploadProgress(0);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(() => {
                        toast.success("Soubor byl úspěšně nahrán!");
                        fetchFiles();
                        setUploadProgress(0);
                    });
                }
            );
        });

        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDeleteFile = async (fileName) => {
        if (!window.confirm(`Opravdu si přejete smazat soubor "${fileName}"?`)) return;
        try {
            const fileRef = ref(storage, `sources/${lessonId}/${fileName}`);
            await deleteObject(fileRef);
            toast.success(`Soubor "${fileName}" byl smazán.`);
            fetchFiles();
        } catch (error) {
            toast.error("Soubor se nepodařilo smazat.");
        }
    };

    const handleAnalyzeFile = async (fileName) => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        toast.loading("Analyzuji soubor...");
        try {
            const analyzeFunction = httpsCallable(functions, 'analyzeSourceFile');
            const result = await analyzeFunction({ lessonId, fileName });
            
            if (result.data.success) {
                setAnalysisResult(result.data.analysis);
                toast.dismiss();
                toast.success("Analýza dokončena!");
            } else {
                 throw new Error("Analýza se nezdařila.");
            }
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || "Při analýze souboru nastala chyba.");
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">1. Zdrojové soubory (pro tuto lekci)</h3>
            <div className="p-4 border rounded-lg h-full">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".pdf" />
                <button onClick={() => fileInputRef.current.click()} disabled={uploadProgress > 0 || isAnalyzing} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                    {uploadProgress > 0 ? `Nahrávám (${Math.round(uploadProgress)}%)` : 'Nahrát PDF soubor(y)'}
                </button>
                {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}
                <ul className="mt-4 space-y-2">
                    {sourceFiles.map(file => (
                        <li key={file.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate pr-2">{file.name}</a>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleAnalyzeFile(file.name)} disabled={isAnalyzing} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md disabled:bg-gray-400">
                                    Analyzovat s AI
                                </button>
                                <button onClick={() => handleDeleteFile(file.name)} disabled={isAnalyzing} className="text-red-500 hover:text-red-700 font-bold text-lg px-2 disabled:text-gray-400">&times;</button>
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