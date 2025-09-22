const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const pdf = require("pdf-parse");

admin.initializeApp();

// API klíč se bude načítat až uvnitř funkce, což je bezpečnější

exports.analyzeSourceFile = functions.https.onCall(async (data, context) => {
    // 1. Ověření, že je uživatel přihlášen
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Pro provedení této akce musíte být přihlášeni."
        );
    }

    // 2. Bezpečné načtení API klíče
    const geminiApiKey = functions.config().gemini.key;
    if (!geminiApiKey) {
        console.error("Chybí API klíč pro Gemini v konfiguraci!");
        throw new functions.https.HttpsError(
            "internal",
            "Server není správně nakonfigurován. Chybí API klíč."
        );
    }

    const { lessonId, fileName } = data;
    if (!lessonId || !fileName) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "V požadavku chybí potřebné údaje (lessonId nebo fileName)."
        );
    }

    try {
        const bucket = admin.storage().bucket();
        const filePath = `sources/${lessonId}/${fileName}`;
        const file = bucket.file(filePath);

        const [fileBuffer] = await file.download();
        
        // Zpracování PDF
        const pdfData = await pdf(fileBuffer);
        const textContent = pdfData.text;

        if (!textContent) {
            throw new functions.https.HttpsError(
                "not-found",
                "Nepodařilo se extrahovat text z PDF souboru."
            );
        }

        // Sestavení promptu pro Gemini
        const prompt = `Proveď analýzu následujícího textu z edukativního materiálu a vytvoř strukturované shrnutí klíčových bodů:\n\n${textContent}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        // Volání Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Chyba Gemini API:", errorBody);
            throw new functions.https.HttpsError("internal", "Chyba při komunikaci s Gemini API.");
        }

        const responseData = await response.json();
        
        if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new functions.https.HttpsError("internal", "Neplatná odpověď od Gemini API.");
        }

        const analysisResult = responseData.candidates[0].content.parts[0].text;
        
        return { success: true, analysis: analysisResult };

    } catch (error) {
        console.error("Kompletní chyba ve funkci analyzeSourceFile:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            "internal",
            "Nastala neočekávaná chyba při zpracování souboru."
        );
    }
});