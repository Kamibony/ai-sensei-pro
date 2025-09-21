import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';

const DraggableLesson = ({ lesson }) => {
    const navigate = useNavigate();
    const { attributes, listeners, setNodeRef } = useDraggable({
      id: lesson.id,
      data: { type: 'library', lesson }
    });

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
            <div className="cursor-pointer" onClick={() => navigate(`/professor/lesson/${lesson.id}`)}>
                <h3 className="text-lg font-bold text-gray-800">{lesson.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{lesson.subtitle}</p>
                 <span className="text-xs text-gray-500 font-medium bg-gray-200 rounded-full px-2 py-0.5 mt-2 inline-block">Šablona</span>
            </div>
            <div {...listeners} {...attributes} ref={setNodeRef} className="text-center text-gray-400 cursor-grab active:cursor-grabbing pt-2 mt-2 border-t">
                •••
            </div>
        </div>
    );
};

const LessonLibrary = ({ lessons, onNewLessonClick }) => {
    const { setNodeRef } = useDroppable({ id: 'library' });
    return (
        <div className="bg-stone-50 rounded-xl p-4 sticky top-8 shadow-inner">
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Knihovna lekcí</h2>
            <div ref={setNodeRef} className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-2">
                {lessons.length > 0 ? (
                    lessons.map(lesson => <DraggableLesson key={lesson.id} lesson={lesson} />)
                ) : (
                     <div className="text-center py-10 text-gray-500"><p>Zatím jste nevytvořili žádné lekce.</p></div>
                )}
            </div>
             <button onClick={onNewLessonClick} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg">
                + Vytvořit novou lekci
            </button>
        </div>
    );
};

export default LessonLibrary;