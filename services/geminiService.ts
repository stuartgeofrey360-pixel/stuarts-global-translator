
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Language, UserLocation } from "../types";

function getLanguageIdentifier(lang: Language): string {
  const match = lang.name.match(/\(([^)]+)\)/);
  return match ? match[1] : lang.name;
}

function validateKey() {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key.length < 10) {
    throw new Error("API Key missing. Please set VITE_API_KEY in Netlify/Vercel and RE-DEPLOY.");
  }
}

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
  location?: UserLocation
): Promise<{ text: string }> {
  validateKey();
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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
      // Handle cases where model might wrap JSON in markdown blocks
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleaned);
      return { text: json.translation || cleaned };
    } catch (e) {
      return { text: rawText.replace(/^{.*"translation":\s*"/, '').replace(/"}$/, '').trim() || "Translation failed to parse." };
    }
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    const msg = err.message || "";
    if (msg.includes("401")) throw new Error("API Key rejected (Unauthorized).");
    if (msg.includes("403")) throw new Error("API Key restricted or Quota exceeded.");
    if (msg.includes("429")) throw new Error("Too many requests. Please wait.");
    throw new Error("Communication failure. Check your internet or API key.");
  }
}

export async function translateImage(
  base64Image: string,
  fromLang: Language,
  toLang: Language
): Promise<{ text: string }> {
  validateKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  const targetName = getLanguageIdentifier(toLang);
  
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Extract and translate all text from this image to ${targetName}. Provide only the translation.` },
        ],
      },
      config: { 
        systemInstruction: `OCR & Translation Mode. Target: ${targetName}.` 
      },
    });
    return { text: res.text?.trim() || "No text detected." };
  } catch (err: any) {
    console.error("Vision Error:", err);
    throw new Error(err.message?.includes("401") ? "Key Invalid" : "Vision hardware link failed.");
  }
}

export async function generateSpeech(
  text: string,
  toLang: Language
): Promise<{ audioData: string; sampleRate: number }> {
  validateKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  const targetName = getLanguageIdentifier(toLang);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this ${targetName} text: "${text}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("TTS Failure");

    return { audioData, sampleRate: 24000 };
  } catch (err) {
    throw new Error("Voice synthesis blocked.");
  }
}
