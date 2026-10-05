import React from 'react';
import { X, Download, Folder, CheckCircle, Monitor, ShieldCheck, Cpu } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">YMDithers.aex Installation Guide</h3>
              <p className="text-xs text-zinc-400">For Adobe After Effects (Windows x64)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Download card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-300">YMDithers.aex</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Build Ready • 419 KB
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">PE32+ 64-bit DLL • All 49 Algorithms Verified</p>
            </div>
            <a
              href="/YMDithers.aex"
              download="YMDithers.aex"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download .AEX
            </a>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Installation Steps</h4>

            <div className="flex gap-4 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">Copy the file to After Effects Plug-ins folder</p>
                <p className="text-xs text-zinc-400">Navigate to your After Effects installation directory:</p>
                <div className="mt-2 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-300 flex items-center gap-2 select-all">
                  <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\Plug-ins\</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">Restart Adobe After Effects</p>
                <p className="text-xs text-zinc-400">
                  After Effects will scan and cache the PiPL resource automatically upon startup.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">Apply the Effect</p>
                <p className="text-xs text-zinc-400">
                  Select your layer and go to: <span className="text-indigo-400 font-mono font-semibold">Effect &gt; YMDithers &gt; YMDithers</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Plugin details */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl text-center">
              <Monitor className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-zinc-300">AE Compatibility</div>
              <div className="text-[10px] text-zinc-500">2020 through 2026</div>
            </div>
            <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl text-center">
              <Cpu className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-zinc-300">Architecture</div>
              <div className="text-[10px] text-zinc-500">Windows x64 Native</div>
            </div>
            <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-emerald-400">Stress Tested</div>
              <div className="text-[10px] text-zinc-500">4K & 30k Strands Stable</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
