
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Language, UserLocation } from "../types";

function getLanguageIdentifier(lang: Language): string {
  const match = lang.name.match(/\(([^)]+)\)/);
  return match ? match[1] : lang.name;
}

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
  location?: UserLocation
): Promise<{ text: string }> {
  // Ensure we are using the most current key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const modelName = 'gemini-3-flash-preview';

  const sourceName = getLanguageIdentifier(fromLang);
  const targetName = getLanguageIdentifier(toLang);

  const systemInstruction = `CRITICAL: You are a translation engine.
  Target Language: ${targetName}.
  Constraint: Output ONLY the translated text. No explanations. No quotes.
  Response format: JSON with key "translation".`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Translate from ${sourceName} to ${targetName}: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
          },
          required: ["translation"],
        },
        temperature: 0.1,
      },
    });

    const rawText = response.text || "";
    try {
      const json = JSON.parse(rawText);
      return { text: json.translation || rawText };
    } catch (e) {
      // Fallback if the model didn't provide valid JSON despite the schema
      return { text: rawText.replace(/^{.*"translation":\s*"/, '').replace(/"}$/, '').trim() || "Translation unavailable" };
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw new Error("Linguistic core unreachable. Check API Key configuration.");
  }
}

export async function translateImage(
  base64Image: string,
  fromLang: Language,
  toLang: Language
): Promise<{ text: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const targetName = getLanguageIdentifier(toLang);
  
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Extract all text and key objects from this image and translate them to ${targetName}. Provide a structured list.` },
        ],
      },
      config: { 
        systemInstruction: `OCR & Visual Intelligence. Target: ${targetName}.` 
      },
    });
    return { text: res.text?.trim() || "No text detected in scan." };
  } catch (err) {
    console.error("Vision Error:", err);
    throw new Error("Vision hardware link failed.");
  }
}

export async function generateSpeech(
  text: string,
  toLang: Language
): Promise<{ audioData: string; sampleRate: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const targetName = getLanguageIdentifier(toLang);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this ${targetName} text naturally: "${text}"` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const audioData = part?.inlineData?.data;
  if (!audioData) throw new Error("Voice synthesis failure.");

  return { audioData, sampleRate: 24000 };
}
