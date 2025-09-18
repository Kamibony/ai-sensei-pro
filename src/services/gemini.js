const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const callGeminiAPI = async (prompt, schema = null, systemPrompt = null) => {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    if (schema) {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: schema
        };
    }
    
    if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error Response:", errorBody);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        console.error("Invalid response from Gemini API:", data);
        throw new Error("Invalid response from Gemini API: No candidates found.");
    }

    return data.candidates[0].content.parts[0].text;
};
