import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/config.js';

const SourceFilesManager = ({ lessonId }) => {
    const [sourceFiles, setSourceFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !lessonId) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `sources/${lessonId}/${file.name}`);
            await uploadBytes(storageRef, file);
            toast.success("Soubor byl úspěšně nahrán!");
            await fetchFiles();
        } catch (error) {
            toast.error('Nahrávání selhalo.');
        } finally {
            setUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
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
    
    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">1. Zdrojové soubory (pro tuto lekci)</h3>
            <div className="p-4 border rounded-lg h-full">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                    {uploading ? 'Nahrávám...' : 'Nahrát soubor'}
                </button>
                <ul className="mt-4 space-y-2">
                    {sourceFiles.map(file => (
                        <li key={file.name} className="flex items-center justify-between">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate pr-2">{file.name}</a>
                            <button onClick={() => handleDeleteFile(file.name)} className="text-red-500 hover:text-red-700 font-bold text-lg px-2">&times;</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SourceFilesManager;