import React from 'react';

const AdditionalMaterials = ({ videoUrl, setVideoUrl, chatbotPersona, setChatbotPersona }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">4. Doplňkové materiály</h3>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <label className="font-semibold">Video k Lekci (YouTube URL)</label>
                    <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full p-3 mt-1 border rounded-lg" />
                </div>
                 <div>
                    <label className="font-semibold">Chování AI Asistenta (Prompt)</label>
                    <textarea value={chatbotPersona} onChange={e => setChatbotPersona(e.target.value)} rows="3" className="w-full p-3 mt-1 border rounded-lg" placeholder="Např. 'Jsi vtipný asistent, který používá analogie.'"></textarea>
                </div>
            </div>
        </div>
    );
};

export default AdditionalMaterials;
