import React, { useState } from 'react';

const LessonCreationModal = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(title, subtitle);
        setTitle('');
        setSubtitle('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-6">Vytvořit novou lekci</h3>
                <form onSubmit={handleSubmit}>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Název lekce" required className="w-full p-3 mb-4 border rounded-lg" />
                    <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Podtitulek (nepovinné)" className="w-full p-3 mb-6 border rounded-lg" />
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 bg-gray-300 hover:bg-gray-400 rounded-lg">Zrušit</button>
                        <button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Vytvořit a přejít k úpravám</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LessonCreationModal;