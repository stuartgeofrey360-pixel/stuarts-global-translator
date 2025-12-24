
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Language, UserLocation } from "../types";

/**
 * Extracts the primary name from the language object.
 * e.g., "Español (Spanish)" -> "Spanish"
 */
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Gemini 3 Flash is the fastest model available for real-time translation.
  const modelName = 'gemini-3-flash-preview';

  const sourceName = getLanguageIdentifier(fromLang);
  const targetName = getLanguageIdentifier(toLang);

  const systemInstruction = `CRITICAL TASK: TRANSLATION ENGINE.
  
  MAPPING:
  FROM: ${sourceName}
  TO: ${targetName}
  
  STRICT CONSTRAINTS:
  1. Output MUST be in ${targetName}.
  2. No conversational text.
  3. No preambles or quotes.
  4. Preserve technical terms, numbers, and proper names.
  5. If text is already in ${targetName}, return as-is but native-polished.
  
  JSON SCHEMA REQUIRED:
  {"translation": "..."}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `TRANSLATE THIS TEXT FROM ${sourceName.toUpperCase()} TO ${targetName.toUpperCase()} NOW: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: {
              type: Type.STRING,
              description: `Precision translation in ${targetName}.`,
            },
          },
          required: ["translation"],
        },
        // Low temperature for maximum deterministic accuracy
        temperature: 0.1,
      },
    });

    const json = JSON.parse(response.text || '{"translation": ""}');
    return { 
      text: json.translation || response.text || "Translation Error"
    };
  } catch (err) {
    console.error("Flash Engine Error:", err);
    throw new Error("Linguistic core timeout.");
  }
}

export async function translateImage(
  base64Image: string,
  fromLang: Language,
  toLang: Language
): Promise<{ text: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetName = getLanguageIdentifier(toLang);
  
  // Use gemini-3-flash-preview for vision analysis (OCR/Translation) instead of image generation models.
  return ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: `Identify and translate text/objects in this image to ${targetName}. Provide a clean list.` },
      ],
    },
    config: { 
      systemInstruction: `You are an OCR and translation lens. Target language is ${targetName}.` 
    },
  }).then(res => ({ text: res.text?.trim() || "Analysis failed." }));
}

export async function generateSpeech(
  text: string,
  toLang: Language
): Promise<{ audioData: string; sampleRate: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetName = getLanguageIdentifier(toLang);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read naturally in ${targetName}: "${text}"` }] }],
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
  if (!audioData) throw new Error("Voice synthesis failed.");

  return { audioData, sampleRate: 24000 };
}
