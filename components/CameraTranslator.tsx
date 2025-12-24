
import React, { useRef, useState, useEffect } from 'react';
import { Language } from '../types';
import { translateImage } from '../services/geminiService';

interface CameraTranslatorProps {
  fromLang: Language;
  toLang: Language;
  onTranslate: (result: { text: string; sources?: { uri: string; title: string }[] }) => void;
  isTranslating: boolean;
  setIsTranslating: (val: boolean) => void;
  onError: (msg: string) => void;
}

const CameraTranslator: React.FC<CameraTranslatorProps> = ({
  fromLang,
  toLang,
  onTranslate,
  isTranslating,
  setIsTranslating,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.debug("Camera inhib", err);
      }
    }
    setupCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  const processImage = async (base64Data: string) => {
    setIsTranslating(true);
    try {
      const result = await translateImage(base64Data, fromLang, toLang);
      onTranslate(result);
    } catch {
      onError("Vision scan failure");
    } finally {
      setIsTranslating(false);
    }
  };

  const captureAndTranslate = async () => {
    if (!videoRef.current || !canvasRef.current || isTranslating) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    await processImage(base64Data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) await processImage(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col space-y-8 h-full animate-reveal">
      <div className={`relative w-full aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl border-4 transition-all duration-700 ${isTranslating ? 'border-sky-400 shadow-[0_0_40px_rgba(56,189,248,0.4)]' : 'border-white'}`}>
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="w-12 h-12 border-t border-l border-white/40 rounded-tl-2xl mb-2"></div>
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40">Wildlife Detector</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-12 h-12 border-t border-r border-white/40 rounded-tr-2xl mb-2"></div>
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40">Explorer Lens v4.2</span>
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                 <div className="w-32 h-32 border border-dashed border-white/10 rounded-full flex items-center justify-center animate-[spin_15s_linear_infinite]">
                     <div className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_10px_#38bdf8]"></div>
                 </div>
                 <p className="mt-4 text-[8px] font-black text-white/50 uppercase tracking-[0.4em] animate-pulse">Scanning Bio-Signatures</p>
            </div>

            <div className="flex justify-between">
                <div className="w-12 h-12 border-b border-l border-white/40 rounded-bl-2xl"></div>
                <div className="w-12 h-12 border-b border-r border-white/40 rounded-br-2xl"></div>
            </div>
        </div>

        {/* Signature Gold Scan Line */}
        <div className={`absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent shadow-[0_0_8px_#D4AF37] z-20 ${isTranslating ? 'animate-[scanning_1.5s_ease-in-out_infinite]' : 'animate-[scanning_4s_ease-in-out_infinite]'}`}></div>
        <style>{`
            @keyframes scanning {
                0%, 100% { top: 15%; opacity: 0; }
                20%, 80% { opacity: 1; }
                50% { top: 85%; }
            }
            @keyframes subtle-pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
                50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(56, 189, 248, 0.3); }
            }
            .btn-pulse {
                animation: subtle-pulse 2s infinite ease-in-out;
            }
        `}</style>

        {/* Interaction Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center space-x-8 px-10 z-30">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTranslating}
            className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center btn-squishy shadow-xl hover:bg-white/20 transition-all"
          >
            <i className="fas fa-panorama text-white text-lg"></i>
          </button>

          <button
            onClick={captureAndTranslate}
            disabled={isTranslating}
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center btn-squishy shadow-2xl relative bg-white active:scale-90 transition-all duration-300 ${isTranslating ? 'border-sky-400 btn-pulse' : 'border-white'}`}
          >
            <div className="w-18 h-18 rounded-full flex items-center justify-center">
                {isTranslating ? (
                    <i className="fas fa-circle-notch fa-spin text-sky-500 text-3xl"></i>
                ) : (
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                        <i className="fas fa-eye text-white text-3xl animate-pulse"></i>
                    </div>
                )}
            </div>
          </button>

          <div className="w-16 h-16 opacity-0 pointer-events-none"></div>
        </div>
      </div>
      
      <div className="text-center">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] italic opacity-50">S-Signature Vision • Explorer Enabled</p>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraTranslator;
