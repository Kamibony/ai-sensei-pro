import React from 'react';

const StudentList = ({ chats, selectedStudent, onSelectStudent }) => {
    return (
        <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4">Studenti</h3>
            {chats.length > 0 ? (
                <ul className="space-y-2">
                    {chats.map(chat => (
                        <li key={chat.studentId}>
                            <button onClick={() => onSelectStudent(chat)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedStudent?.studentId === chat.studentId ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                {chat.studentEmail}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500">Zatím žádné interakce.</p>}
        </div>
    );
};

export default StudentList;
