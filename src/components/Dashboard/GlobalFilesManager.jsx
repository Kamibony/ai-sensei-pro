import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/config.js';
import toast from 'react-hot-toast';

const GlobalFilesManager = ({ professorId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const getStoragePath = () => `global_sources/${professorId}`;

    const fetchFiles = useCallback(async () => {
        if (!professorId) return;
        try {
            const filesRef = ref(storage, getStoragePath());
            const res = await listAll(filesRef);
            const fileData = await Promise.all(res.items.map(async (itemRef) => ({
                name: itemRef.name,
                url: await getDownloadURL(itemRef)
            })));
            setFiles(fileData);
        } catch (error) {
            console.error("Nepodařilo se načíst globální soubory:", error);
        }
    }, [professorId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !professorId) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `${getStoragePath()}/${file.name}`);
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
        if (!window.confirm(`Opravdu si přejete smazat globální soubor "${fileName}"?`)) return;
        try {
            const fileRef = ref(storage, `${getStoragePath()}/${fileName}`);
            await deleteObject(fileRef);
            toast.success(`Soubor "${fileName}" byl smazán.`);
            fetchFiles();
        } catch (error) {
            toast.error("Soubor se nepodařilo smazat.");
        }
    };

    return (
        <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                {uploading ? 'Nahrávám...' : 'Nahrát globální soubor'}
            </button>
            <ul className="mt-4 space-y-2">
                {files.map(file => (
                    <li key={file.name} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate pr-2">{file.name}</a>
                        <button onClick={() => handleDeleteFile(file.name)} className="text-red-500 hover:text-red-700 font-bold text-lg px-2">&times;</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GlobalFilesManager;