
import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  publisherId: string;
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle';
}

const AdUnit: React.FC<AdUnitProps> = ({ publisherId, slotId, format = 'auto' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let checkCount = 0;
    const maxChecks = 50; // Try for 5 seconds max

    const initAd = () => {
      if (initializedRef.current) return;

      // AdSense requires a non-zero width to calculate responsive ad size.
      // In React/SPAs, the element might not have a width immediately during hydration/animation.
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        try {
          // Fix: Use any cast to access external global library variables on the window object.
          if ((window as any).adsbygoogle) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            initializedRef.current = true;
          }
        } catch (e) {
          console.error("AdSense push error:", e);
        }
      } else if (checkCount < maxChecks) {
        checkCount++;
        setTimeout(initAd, 100); // Check again in 100ms
      }
    };

    // Give the browser a moment to complete initial layout/animations
    const timeoutId = setTimeout(initAd, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [slotId]);

  return (
    <div 
      ref={containerRef}
      className="w-full flex flex-col items-center my-6 overflow-hidden animate-reveal"
      style={{ minWidth: '250px' }} // Standard min width for mobile ads
    >
      <div className="flex items-center space-x-2 mb-2 opacity-30">
        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400">Sponsored Intelligence</span>
        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
      </div>
      
      <div className="w-full max-w-full min-h-[100px] bg-white/10 backdrop-blur-sm rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm relative">
        <ins
          className="adsbygoogle"
          style={{ 
            display: 'block', 
            width: '100%', 
            minHeight: '100px',
            textAlign: 'center'
          }}
          data-ad-client={publisherId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        ></ins>
        
        {/* Placeholder for when ads are blocked or loading */}
        {!initializedRef.current && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <i className="fas fa-rectangle-ad text-3xl"></i>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdUnit;