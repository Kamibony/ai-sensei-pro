import toast from 'react-hot-toast';

const TELEGRAM_API_TOKEN = import.meta.env.VITE_TELEGRAM_API_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_API_TOKEN}`;

export const sendTelegramMessage = async (message) => {
    if (!TELEGRAM_API_TOKEN || !CHAT_ID) {
        console.error("Telegram API Token or Chat ID is not configured in .env file.");
        toast.error("Chyba: Telegram není správně nakonfigurován. Kontaktujte administrátora.");
        return { ok: false, description: "Telegram not configured." };
    }

    const url = `${BASE_URL}/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return { ok: false, description: error.message };
    }
};