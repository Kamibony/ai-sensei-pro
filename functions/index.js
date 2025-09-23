const functions = require("firebase-functions");
const admin = require("firebase-admin");
 feature/user-auth-file-management-revised
const fetch = require("node-fetch");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
 main

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

const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Funkce pro manuální nastavení webhooku
exports.setupTelegramWebhook = functions.https.onRequest(async (req, res) => {
    const functionUrl = `https://${process.env.FUNCTION_REGION || 'us-central1'}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/telegramWebhook`;
    const webhookUrl = `${TELEGRAM_API_URL}/setWebhook?url=${functionUrl}`;

    try {
        const response = await fetch(webhookUrl);
        const data = await response.json();
        const message = `Webhook setup response: ${JSON.stringify(data)}`;
        console.log(message);
        res.status(200).send(message);
    } catch (error) {
        console.error("Error setting Telegram webhook:", error);
        res.status(500).send(`Error setting webhook: ${error.message}`);
    }
});


exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const update = req.body;
    if (!update || !update.message) {
        return res.status(200).send("OK");
    }

    const { message } = update;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;
    const db = admin.firestore();

    try {
        // Handle /start <lessonId> command
        if (text && text.startsWith('/start')) {
            const lessonId = text.split(' ')[1];
            if (!lessonId) {
                await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: "Prosím, zadejte příkaz ve formátu /start <ID lekce>" }),
                });
                return res.status(200).send('OK');
            }

            const lessonRef = db.doc(`temata/${lessonId}`);
            const lessonDoc = await lessonRef.get();

            if (!lessonDoc.exists) {
                await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: "Lekce s tímto ID nebyla nalezena." }),
                });
                return res.status(200).send('OK');
            }

            const studentRef = db.doc(`students/${userId}`);
            await studentRef.set({
                telegramId: userId,
                telegramChatId: chatId,
                activeLesson: lessonId,
                firstName: message.from.first_name,
                lastName: message.from.last_name || '',
            }, { merge: true });

            const welcomeText = `Vítejte v lekci "${lessonDoc.data().title}"! Můžete začít chatovat.`;
            await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: welcomeText }),
            });

        } else {
            // Handle regular messages
            const studentRef = db.doc(`students/${userId}`);
            const studentDoc = await studentRef.get();

            if (!studentDoc.exists || !studentDoc.data().activeLesson) {
                await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                     method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: "Nejprve prosím spusťte lekci příkazem /start <ID lekce>" }),
                });
                return res.status(200).send('OK');
            }

            const lessonId = studentDoc.data().activeLesson;
            const chatRef = db.doc(`temata/${lessonId}/chats/${userId}`);

            const userMessage = {
                text: text,
                sender: 'student',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            await chatRef.set({
                studentId: userId,
                studentName: `${message.from.first_name} ${message.from.last_name || ''}`.trim(),
                messages: admin.firestore.FieldValue.arrayUnion(userMessage)
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error processing Telegram webhook:", error);
    }

    res.status(200).send("OK");
});

exports.sendMessageToStudent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte být přihlášeni jako profesor.");
    }

    const { studentId, lessonId, text } = data;
    if (!studentId || !lessonId || !text) {
        throw new functions.https.HttpsError("invalid-argument", "Chybí potřebné údaje (studentId, lessonId, text).");
    }

    const db = admin.firestore();

    try {
        // 1. Save professor's message to Firestore
        const chatRef = db.doc(`temata/${lessonId}/chats/${studentId}`);
        const professorMessage = {
            text: text,
            sender: 'professor',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        await chatRef.set({
            messages: admin.firestore.FieldValue.arrayUnion(professorMessage)
        }, { merge: true });

        // 2. Send message to student on Telegram
        const studentRef = db.doc(`students/${studentId}`);
        const studentDoc = await studentRef.get();
        if (!studentDoc.exists || !studentDoc.data().telegramChatId) {
            throw new functions.https.HttpsError("not-found", "Nepodařilo se najít telegramChatId pro tohoto studenta.");
        }
        const chatId = studentDoc.data().telegramChatId;

        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
        });

        const responseData = await response.json();
        if (!response.ok) {
            console.error("Chyba při odesílání zprávy na Telegram:", responseData);
            throw new functions.https.HttpsError("internal", "Nepodařilo se odeslat zprávu na Telegram.");
        }

        return { success: true };

    } catch (error) {
        console.error("Chyba ve funkci sendMessageToStudent:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Došlo k neočekávané chybě.");
    }
});

exports.getSourceFileContent = functions.https.onCall(async (data, context) => {
    // 1. Check for authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to perform this action."
        );
    }

    const { filePath } = data;
    if (!filePath) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a 'filePath' argument."
        );
    }

    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);

        const [fileBuffer] = await file.download();
        let textContent = "";

        // 2. Extract text based on file type
        if (filePath.endsWith(".pdf")) {
            const pdfData = await pdf(fileBuffer);
            textContent = pdfData.text;
        } else if (filePath.endsWith(".docx")) {
            const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
            textContent = docxResult.value;
        } else if (filePath.endsWith(".txt")) {
            textContent = fileBuffer.toString("utf8");
        } else {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Unsupported file type."
            );
        }

        if (!textContent) {
            throw new functions.https.HttpsError(
                "not-found",
                "Could not extract text from the file."
            );
        }

        // 3. Return the extracted text
        return { success: true, text: textContent };

    } catch (error) {
        console.error("Error in getSourceFileContent:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            "internal",
            "An unexpected error occurred while processing the file."
        );
    }
});
