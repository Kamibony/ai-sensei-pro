import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/config.js';
import toast from 'react-hot-toast';

const GlobalFilesManager = ({ professorId }) => {
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
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

    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (!files || !professorId) return;
        
        Array.from(files).forEach(file => {
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Nepodporovaný typ souboru: ${file.name}`);
                return;
            }

            const storageRef = ref(storage, `${getStoragePath()}/${file.name}`);
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
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".pdf,.docx" />
            <button onClick={() => fileInputRef.current.click()} disabled={uploadProgress > 0} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                {uploadProgress > 0 ? `Nahrávám (${Math.round(uploadProgress)}%)` : 'Nahrát globální soubor(y)'}
            </button>
            {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
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