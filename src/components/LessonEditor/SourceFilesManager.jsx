import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/config.js';

const SourceFilesManager = ({ lessonId, onFilesChange }) => {
    const [sourceFiles, setSourceFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef(null);

    const fetchFiles = useCallback(async () => {
        try {
            const filesRef = ref(storage, `sources/${lessonId}`);
            const res = await listAll(filesRef);
            const files = await Promise.all(res.items.map(async (itemRef) => ({
                name: itemRef.name,
                url: await getDownloadURL(itemRef)
            })));
            setSourceFiles(files);
            onFilesChange(files);
        } catch (error) {
            setFileError(`Nepodařilo se načíst soubory.`);
        }
    }, [lessonId, onFilesChange]);

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
            toast.success("Soubor byl úspěšně nahrán!");
            await fetchFiles();
        } catch (error) {
            console.error("Firebase Storage upload error:", error);
            setFileError('Nahrávání selhalo. Zkontrolujte konzoli (F12) pro detaily.');
        } finally {
            setUploading(false);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDeleteFile = async (fileName) => {
        if (!window.confirm(`Opravdu si přejete smazat soubor "${fileName}"?`)) {
            return;
        }
        try {
            const fileRef = ref(storage, `sources/${lessonId}/${fileName}`);
            await deleteObject(fileRef);
            toast.success(`Soubor "${fileName}" byl smazán.`);
            fetchFiles();
        } catch (error) {
            console.error("Error deleting file:", error);
            setFileError("Soubor se nepodařilo smazat.");
        }
    };

    const unsupportedFiles = sourceFiles.filter(file => !file.name.endsWith('.txt') && !file.name.endsWith('.md'));

    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">1. Zdrojové soubory</h3>
            <div className="p-4 border rounded-lg h-full">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.pdf" />
                <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">{uploading ? 'Nahrávám...' : 'Nahrát soubor'}</button>
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
                        <p><strong>Upozornění:</strong> Následující soubory mají nepodporovaný formát a budou při generování lekce ignorovány:</p>
                        <ul className="list-disc list-inside ml-4">
                            {unsupportedFiles.map(f => <li key={f.name}>{f.name}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SourceFilesManager;
