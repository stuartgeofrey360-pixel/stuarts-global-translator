
import { Language, PhraseCategory } from './types';

export const ALL_LANGUAGES: (Language & { flag: string })[] = [
  { code: 'en', name: 'English', sttCode: 'en-US', flag: '🇺🇸' },
  { code: 'es', name: 'Español (Spanish)', sttCode: 'es-ES', flag: '🇪🇸' },
  { code: 'sw', name: 'Kiswahili (Swahili)', sttCode: 'sw-KE', flag: '🇹🇿' },
  { code: 'fr', name: 'Français (French)', sttCode: 'fr-FR', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', sttCode: 'de-DE', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano (Italian)', sttCode: 'it-IT', flag: '🇮🇹' },
  { code: 'nl', name: 'Nederlands (Dutch)', sttCode: 'nl-NL', flag: '🇳🇱' },
  { code: 'zh', name: '中文 (Mandarin)', sttCode: 'zh-CN', flag: '🇨🇳' },
  { code: 'pt', name: 'Português (Portuguese)', sttCode: 'pt-PT', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский (Russian)', sttCode: 'ru-RU', flag: '🇷🇺' },
  { code: 'ja', name: '日本語 (Japanese)', sttCode: 'ja-JP', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية (Arabic)', sttCode: 'ar-SA', flag: '🇸🇦' },
  { code: 'ko', name: '한국어 (Korean)', sttCode: 'ko-KR', flag: '🇰🇷' },
  { code: 'hi', name: 'हिन्दी (Hindi)', sttCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'th', name: 'ไทย (Thai)', sttCode: 'th-TH', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe (Turkish)', sttCode: 'tr-TR', flag: '🇹🇷' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)', sttCode: 'vi-VN', flag: '🇻🇳' },
  { code: 'am', name: 'አማርኛ (Amharic)', sttCode: 'am-ET', flag: '🇪🇹' },
  { code: 'ha', name: 'Hausa (Hausa)', sttCode: 'ha-NG', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba (Yoruba)', sttCode: 'yo-NG', flag: '🇳🇬' },
];

export const PHRASEBOOK_DATA: PhraseCategory[] = [
  {
    category: "Communication",
    phrases: [
      { en: "Hello, how are you?", sw: "" },
      { en: "I don't understand, can you repeat?", sw: "" },
      { en: "What is your name?", sw: "" },
      { en: "Thank you very much.", sw: "" }
    ]
  },
  {
    category: "Travel & Survival",
    phrases: [
      { en: "Where is the nearest hospital?", sw: "" },
      { en: "I need a taxi to the airport.", sw: "" },
      { en: "Can you help me? I am lost.", sw: "" },
      { en: "Where can I find a police station?", sw: "" }
    ]
  },
  {
    category: "Dining & Social",
    phrases: [
      { en: "May I have the menu please?", sw: "" },
      { en: "The food was delicious, thank you.", sw: "" },
      { en: "Do you have any vegetarian options?", sw: "" },
      { en: "Can I pay by credit card?", sw: "" }
    ]
  }
];
