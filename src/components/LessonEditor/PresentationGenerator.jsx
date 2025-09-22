import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { callGeminiAPI } from '../../services/gemini.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PresentationGenerator = ({ studentText, lessonTitle }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [slideCount, setSlideCount] = useState(5);
    const [themeColor, setThemeColor] = useState('#005A9C'); // Modrá barva

    const generatePdf = async (slides) => {
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const color = rgb(
            parseInt(themeColor.slice(1, 3), 16) / 255,
            parseInt(themeColor.slice(3, 5), 16) / 255,
            parseInt(themeColor.slice(5, 7), 16) / 255
        );
        
        slides.forEach((slide, index) => {
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            
            page.drawText(slide.title, {
                x: 50,
                y: height - 100,
                font: helveticaBoldFont,
                size: 24,
                color: color,
            });
            
            let yPosition = height - 160;
            slide.content.forEach(point => {
                page.drawText(`• ${point}`, {
                    x: 70,
                    y: yPosition,
                    font: helveticaFont,
                    size: 14,
                    color: rgb(0, 0, 0),
                    maxWidth: width - 140,
                    lineHeight: 20
                });
                yPosition -= 40;
            });

             page.drawText(`${index + 1} / ${slides.length}`, {
                x: width / 2 - 10,
                y: 30,
                font: helveticaFont,
                size: 10,
                color: rgb(0.5, 0.5, 0.5),
            });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const handleGenerate = async () => {
        if (!studentText) {
            toast.error("Nejprve vygenerujte a uložte studijní text.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading('Generuji obsah prezentace...');

        const prompt = `Jsi expert na tvorbu prezentací. Z následujícího textu vytvoř obsah pro prezentaci o ${slideCount} slidech. Každý slide musí mít krátký 'title' a 'content' jako pole s maximálně 4 stručnými odrážkami. Odpověz POUZE ve formátu JSON. Text:\n\n${studentText}`;
        const schema = {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING" },
                    content: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["title", "content"]
            }
        };

        try {
            const resultText = await callGeminiAPI(prompt, schema);
            const slides = JSON.parse(resultText);
            toast.loading('Sestavuji PDF soubor...', { id: toastId });
            await generatePdf(slides);
            toast.success('Prezentace byla úspěšně vytvořena!', { id: toastId });
        } catch (error) {
            toast.error('Generování prezentace selhalo.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t">
            <h3 className="text-xl font-semibold mb-2">6. Generátor PDF Prezentace</h3>
            <div className="p-4 border rounded-lg bg-gray-50 grid md:grid-cols-3 gap-6">
                <div>
                    <label className="font-semibold block mb-1">Počet slidů</label>
                    <input type="number" value={slideCount} onChange={(e) => setSlideCount(e.target.value)} min="3" max="15" className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                    <label className="font-semibold block mb-1">Barva motivu</label>
                    <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-12 p-1 border rounded-lg" />
                </div>
                <div className="md:col-span-3">
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg">
                        {isGenerating ? 'Generuji...' : 'Vytvořit PDF Prezentaci'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PresentationGenerator;