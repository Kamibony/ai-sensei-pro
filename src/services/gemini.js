import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Přejmenováno z generateQuiz na callGeminiAPI, aby odpovídalo importu v komponentě
export const callGeminiAPI = async (text) => {
    // Použití zpětných apostrofů (`) pro definici stringu
    // a vložení proměnné `text` pomocí ${text}
    const prompt = `Vytvoř kvíz s 5 otázkami a 4 možnostmi odpovědí (z toho jedna správná) na základě následujícího textu. Vrať pouze JSON pole objektů ve formátu [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}]. Text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
};

export const generatePresentation = async (text) => {
    const prompt = `Vytvoř 10 slidů prezentace na základě textu. Pro každý slide vytvoř nadpis a 3-5 odrážek. Vrať pouze JSON pole objektů ve formátu [{"title": "...", "points": ["...", "..."] }]. Text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
};

export const getPersonalizedRecommendations = async (quizResults) => {
    // `quizResults` by měly být převedeny na string, pokud je to objekt
    const resultsText = JSON.stringify(quizResults);
    const prompt = `Student odpověděl na tyto otázky s těmito výsledky: ${resultsText}. Na základě nesprávných odpovědí navrhni 3 témata nebo koncepty, které by si student měl zopakovat.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

export const askChatbot = async (question) => {
    const prompt = `Jsi AI asistent pro studenty. Odpověz na následující otázku co nejlépe a nejpřesněji: ${question}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

