import React from 'react';
import { Download, Sparkles, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

interface Props {
  onOpenInstall: () => void;
}

export const Header: React.FC<Props> = ({ onOpenInstall }) => {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-sm">
          YM
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-zinc-100 text-sm tracking-tight flex items-center gap-1.5">
              YMDithers Studio
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
              v2.0 AEX
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">After Effects Plugin & Interactive Suite</p>
        </div>
      </div>

      {/* Stats pill */}
      <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span><strong className="text-zinc-200">49</strong> Dither Algos</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span><strong className="text-zinc-200">4-64mm</strong> Film Emulsion</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Tests Passing 100%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenInstall}
          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Install Guide</span>
        </button>

        <a
          href="/YMDithers.aex"
          download="YMDithers.aex"
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Download .AEX</span>
        </a>
      </div>
    </header>
  );
};
