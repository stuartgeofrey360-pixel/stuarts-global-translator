
import React, { useState, useEffect, useRef } from 'react';
import { Language, AppMode, StatusMessage, HistoryItem, UserLocation } from './types';
import { ALL_LANGUAGES } from './constants';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import StatusArea from './components/StatusArea';
import Phrasebook from './components/Phrasebook';
import CameraTranslator from './components/CameraTranslator';
import ModeSelector from './components/ModeSelector';
import AdUnit from './components/AdUnit';
import { translateText, generateSpeech } from './services/geminiService';
import { decodeBase64, decodePCMToBuffer } from './utils/audioUtils';

const LOADING_MESSAGES = [
  "Flash mapping...",
  "Neural routing...",
  "Synthesizing...",
  "Linking...",
];

const ADMOB_PUB_ID = "ca-pub-6940105229279652"; 
const ADMOB_SLOT_ID = "7677043562"; 

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('text-only');
  const [fromLang, setFromLang] = useState<Language & { flag: string }>(ALL_LANGUAGES.find(l => l.code === 'en')!);
  const [toLang, setToLang] = useState<Language & { flag: string }>(ALL_LANGUAGES.find(l => l.code === 'it')!); 
  const [inputText, setInputText] = useState('');
  const [translationResult, setTranslationResult] = useState<{ text: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.debug("GPS Refused", err)
      );
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTranslating) {
      interval = setInterval(() => setMsgIdx(p => (p + 1) % LOADING_MESSAGES.length), 600);
    }
    return () => clearInterval(interval);
  }, [isTranslating]);

  useEffect(() => {
    const saved = localStorage.getItem('global_vault_v7');
    if (saved) setHistory(JSON.parse(saved));

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setInputText(text);
        performTranslation(text);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [fromLang, toLang]);

  const showStatus = (text: string, type: 'info' | 'success' | 'error') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 2500);
  };

  const handleSpeak = async (textToSpeak?: string) => {
    const text = textToSpeak || translationResult?.text;
    if (!text || isSpeaking || isSynthesizing) return;
    
    setIsSynthesizing(true);
    try {
      const { audioData, sampleRate } = await generateSpeech(text, toLang);
      
      // Initialize or retrieve the AudioContext
      let ctx = audioContextRef.current;
      if (!ctx) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          ctx = new AudioContextClass({ sampleRate });
          audioContextRef.current = ctx;
        }
      }
      
      // Strict narrowing using truthiness check on local variable
      if (ctx) {
        // We use non-null assertion on ctx here as the 'if (ctx)' check guarantees its presence for tsc.
        const buffer = await decodePCMToBuffer(decodeBase64(audioData), ctx!, sampleRate);
        
        setIsSynthesizing(false);
        setIsSpeaking(true);
        const source = ctx!.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx!.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        throw new Error("Audio interface unavailable");
      }
    } catch (err) {
      console.error("Speech Synthesis Error:", err);
      setIsSynthesizing(false);
      setIsSpeaking(false);
    }
  };

  const performTranslation = async (textToProcess?: string) => {
    const text = textToProcess || inputText;
    if (!text.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslationResult(null);
    try {
      const currentFrom = fromLang;
      const currentTo = toLang;
      
      const result = await translateText(text, currentFrom, currentTo, location || undefined);
      setTranslationResult(result);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        original: text,
        translated: result.text,
        fromLang: currentFrom.code.toUpperCase(),
        toLang: currentTo.code.toUpperCase(),
        timestamp: Date.now(),
      };
      
      setHistory(prev => {
        const next = [newItem, ...prev].slice(0, 25);
        localStorage.setItem('global_vault_v7', JSON.stringify(next));
        return next;
      });

      if (autoSpeak) handleSpeak(result.text);

      setTimeout(() => {
        const anchor = document.getElementById('result-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (e) {
      showStatus("Mapping failed. Retrying...", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleListen = () => {
    if (isListening) recognitionRef.current?.stop();
    else if (recognitionRef.current) {
      recognitionRef.current.lang = fromLang.sttCode;
      recognitionRef.current.start();
    }
  };

  return (
    <div className="app-container flex flex-col min-h-screen">
      <Header />

      <div className="px-6 flex items-center justify-between mb-4">
         <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_#0ea5e9]"></div>
            <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Global Flash Active</span>
         </div>
         <button 
           onClick={() => setAutoSpeak(!autoSpeak)}
           className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all border ${autoSpeak ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
         >
            <i className={`fas ${autoSpeak ? 'fa-volume-high' : 'fa-volume-xmark'} text-[10px]`}></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">Audio {autoSpeak ? 'ON' : 'OFF'}</span>
         </button>
      </div>

      <div className="px-6 py-4 sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
        <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
      </div>

      <main className="px-6 flex-1 pt-6 pb-32">
        {currentMode === 'text-only' && (
            <div className="flex flex-col space-y-8 animate-reveal">
                <div className="flex items-center space-x-2">
                    <LanguageSelector label="FROM" selectedLanguage={fromLang} onSelect={setFromLang} />
                    <button 
                      onClick={() => { setFromLang(toLang); setToLang(fromLang); }} 
                      className="w-10 h-10 mt-6 flex-shrink-0 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl active:scale-90 transition-all"
                    >
                        <i className="fas fa-shuffle text-[12px]"></i>
                    </button>
                    <LanguageSelector label="TO" selectedLanguage={toLang} onSelect={setToLang} />
                </div>
                
                <div className="crystal-card p-6 bg-white border border-slate-100 shadow-2xl focus-within:ring-4 ring-sky-50 transition-all">
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full h-32 bg-transparent text-slate-900 text-xl font-extrabold placeholder-slate-200 outline-none resize-none leading-tight"
                        placeholder="Enter text..."
                    />
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{inputText.length} CHARS</span>
                        {inputText && (
                            <button onClick={() => setInputText('')} className="text-rose-400 font-black text-[9px] uppercase tracking-widest px-3 py-1 bg-rose-50 rounded-lg">Clear</button>
                        )}
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button onClick={toggleListen} className={`flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg btn-squishy ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-slate-800 border-2 border-slate-100'}`}>
                        <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} mr-2`}></i> {isListening ? '...' : 'Talk'}
                    </button>
                    <button onClick={() => performTranslation()} className="flex-[2] py-5 bg-sky-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-sky-100 btn-squishy hover:bg-sky-700 active:scale-95 transition-all">
                        Translate to {toLang.name.split(' ')[0]}
                    </button>
                </div>

                <div id="result-anchor" className={`p-10 rounded-[3.5rem] min-h-[180px] relative transition-all duration-300 ${translationResult ? 'crystal-card border-sky-100' : 'bg-slate-50/50 border-2 border-dashed border-slate-200 flex items-center justify-center'}`}>
                    {isTranslating ? (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-black uppercase text-[9px] tracking-[0.5em] text-sky-600">{LOADING_MESSAGES[msgIdx]}</p>
                        </div>
                    ) : translationResult ? (
                        <div className="w-full animate-reveal">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-2">
                                  <div className="px-2 py-1 bg-sky-100 text-sky-700 text-[9px] font-black rounded-lg uppercase tracking-widest border border-sky-200">{fromLang.code} → {toLang.code}</div>
                                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Flash Accuracy Mode</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                      onClick={() => handleSpeak()} 
                                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSynthesizing ? 'bg-sky-500 text-white animate-pulse' : isSpeaking ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
                                    >
                                        <i className={`fas ${isSynthesizing ? 'fa-spinner fa-spin' : isSpeaking ? 'fa-volume-high' : 'fa-volume-up'} text-lg`}></i>
                                    </button>
                                </div>
                            </div>
                            <p className="text-3xl font-black text-slate-900 leading-tight select-all tracking-tight">{translationResult.text}</p>
                        </div>
                    ) : (
                        <div className="text-center opacity-10">
                            <p className="font-black uppercase text-[10px] tracking-[0.6em] text-slate-400">Ready for Mapping</p>
                        </div>
                    )}
                </div>

                <AdUnit publisherId={ADMOB_PUB_ID} slotId={ADMOB_SLOT_ID} />
            </div>
        )}
        
        {currentMode === 'camera' && (
            <div className="pb-12">
                <CameraTranslator fromLang={fromLang} toLang={toLang} onTranslate={(res) => { setTranslationResult(res); if(autoSpeak) setTimeout(() => handleSpeak(), 200); }} isTranslating={isTranslating} setIsTranslating={setIsTranslating} onError={showStatus as any} />
            </div>
        )}
        
        {currentMode === 'phrasebook' && (
          <div className="animate-reveal">
            <Phrasebook 
              targetLanguageName={toLang.name} 
              onSelectPhrase={(p) => { setInputText(p); setCurrentMode('text-only'); performTranslation(p); }} 
            />
          </div>
        )}
        
        {currentMode === 'conversational' && (
            <div className="space-y-4 animate-reveal">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Memory Cache</h2>
                    <button onClick={() => { setHistory([]); localStorage.removeItem('global_vault_v7'); }} className="text-[8px] font-black uppercase text-rose-500">Flush</button>
                </div>
                {history.map((item) => (
                    <div key={item.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-sky-600">{item.fromLang} → {item.toLang}</span>
                            <span className="text-[8px] text-slate-300">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic mb-1">"{item.original}"</p>
                        <p className="font-extrabold text-slate-900 text-lg leading-tight">{item.translated}</p>
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="py-24 text-center opacity-10">
                        <p className="font-black uppercase tracking-[0.5em] text-[10px]">Vault Empty</p>
                    </div>
                )}
            </div>
        )}
      </main>

      <footer className="w-full py-12 flex flex-col items-center justify-center bg-slate-50/30 mt-auto">
        <span className="text-[9px] font-black uppercase tracking-[1em] text-slate-300">
            STUART CORP • UNIVERSAL
        </span>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 pointer-events-none p-6 z-[3000]">
        <StatusArea message={status} />
      </div>
    </div>
  );
};

export default App;
