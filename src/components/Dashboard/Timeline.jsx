import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { addDays, format, startOfWeek, isToday } from 'date-fns';
import { cs } from 'date-fns/locale';

const DraggableScheduledLesson = ({ lesson }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: lesson.id,
        data: { type: 'scheduled' }
    });
    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className="bg-blue-100 border-l-4 border-blue-500 rounded-r-lg p-3 cursor-grab active:cursor-grabbing mb-2 shadow">
            <p className="font-semibold text-blue-800">{lesson.title}</p>
        </div>
    );
};

const DayColumn = ({ date, lessons }) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({ id: dateStr });
    const isCurrentDay = isToday(date);
    return (
        <div ref={setNodeRef} className={`rounded-xl p-2 min-h-[200px] transition-colors border-2 ${isOver ? 'bg-green-100 border-green-400 border-dashed' : 'bg-gray-100 border-transparent'}`}>
            <div className={`text-center pb-2 mb-2 ${isCurrentDay ? 'bg-blue-600 text-white rounded-t-lg -mx-2 -mt-2' : ''}`}>
                <p className="font-bold capitalize">{format(date, 'eeee', { locale: cs })}</p>
                <p className="text-sm">{format(date, 'd. M.', { locale: cs })}</p>
            </div>
            <div className="space-y-2">
                {lessons.map(lesson => <DraggableScheduledLesson key={lesson.id} lesson={lesson} />)}
            </div>
        </div>
    );
};

const Timeline = ({ scheduledLessons }) => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const days = Array.from({ length: 14 }).map((_, i) => addDays(startOfCurrentWeek, i));
    const lessonsByDate = scheduledLessons.reduce((acc, lesson) => {
        const dateStr = format(lesson.scheduledDate, 'yyyy-MM-dd');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(lesson);
        return acc;
    }, {});
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Plánovač lekcí</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-4">
                {days.map(day => (
                    <DayColumn key={format(day, 'yyyy-MM-dd')} date={day} lessons={lessonsByDate[format(day, 'yyyy-MM-dd')] || []}/>
                ))}
            </div>
        </div>
    );
};

export default Timeline;