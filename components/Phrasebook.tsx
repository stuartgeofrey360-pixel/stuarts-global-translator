
import React from 'react';
import { PHRASEBOOK_DATA } from '../constants';

interface PhrasebookProps { 
  onSelectPhrase: (phrase: string) => void; 
  targetLanguageName: string;
}

const Phrasebook: React.FC<PhrasebookProps> = ({ onSelectPhrase, targetLanguageName }) => {
  return (
    <div className="space-y-10 h-full">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-sky-500/10 rounded-2xl flex items-center justify-center">
            <i className="fas fa-atlas text-sky-500 text-sm"></i>
        </div>
        <div className="flex flex-col">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Global Phrasebook</h2>
            <span className="text-[8px] font-bold text-sky-400 uppercase tracking-tighter">Verified Essentials</span>
        </div>
      </div>

      <div className="p-6 bg-sky-50/50 rounded-3xl border border-sky-100/50 mb-10">
          <p className="text-[11px] font-bold text-sky-800/60 leading-relaxed">
              Tap any phrase to instantly generate its translation into <span className="text-sky-600 font-black">{targetLanguageName}</span>.
          </p>
      </div>

      <div className="space-y-12 pb-24">
        {PHRASEBOOK_DATA.map((category) => (
          <div key={category.category} className="animate-reveal">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 border-b border-slate-50 pb-3">
              {category.category}
            </h4>
            <div className="space-y-3">
              {category.phrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPhrase(phrase.en)}
                  className="w-full text-left p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-sky-300 active:scale-[0.98] transition-all flex items-center group shadow-sm"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-sky-500 transition-colors">
                      <i className="fas fa-bolt text-slate-300 group-hover:text-white text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{phrase.en}</p>
                    <p className="text-[9px] font-black uppercase text-sky-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Translate to {targetLanguageName} →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Phrasebook;
