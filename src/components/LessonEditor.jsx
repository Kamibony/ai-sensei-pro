import React, { useState } from 'react';
import SourceFilesManager from './LessonEditor/SourceFilesManager';
import TextEditor from './LessonEditor/TextEditor';
import AdditionalMaterials from './LessonEditor/AdditionalMaterials';
import QuizGenerator from './LessonEditor/QuizGenerator';

const LessonEditor = ({ lesson, studentText, setStudentText, videoUrl, setVideoUrl, chatbotPersona, setChatbotPersona, lessonId }) => {
    const [sourceFiles, setSourceFiles] = useState([]);

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <SourceFilesManager lessonId={lessonId} onFilesChange={setSourceFiles} />
                <TextEditor studentText={studentText} setStudentText={setStudentText} sourceFiles={sourceFiles} />
            </div>
            <AdditionalMaterials videoUrl={videoUrl} setVideoUrl={setVideoUrl} chatbotPersona={chatbotPersona} setChatbotPersona={setChatbotPersona} />
            <QuizGenerator studentText={studentText} lessonId={lessonId} lesson={lesson} />
        </div>
    );
};

export default LessonEditor;
