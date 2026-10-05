import React from 'react';
import { Layers, Download, Sliders, Image as ImageIcon, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { BUILT_IN_PRESETS } from '../engine/presets';
import { DitherSettings } from '../types/dither';

interface HeaderProps {
  onOpenExportModal: () => void;
  onUploadClick: () => void;
  onReset: () => void;
  onApplyPreset: (presetId: string) => void;
  currentSettings: DitherSettings;
  compareMode: boolean;
  onToggleCompare: () => void;
  onOpenSampleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExportModal,
  onUploadClick,
  onReset,
  onApplyPreset,
  compareMode,
  onToggleCompare,
  onOpenSampleModal,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-[#0d0f14]/95 backdrop-blur px-4 flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm shadow-inner">
            YM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-zinc-100">YMDithers</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                49 ALGOS
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                SMART-FX
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 -mt-0.5">Native Retro Dithering & Halftone Engine</p>
          </div>
        </div>

        <div className="h-5 w-px bg-zinc-800 mx-2 hidden sm:block" />

        {/* Quick Presets Picker */}
        <div className="hidden lg:flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-400 mr-1">Presets:</span>
          <select
            className="bg-zinc-900 border border-zinc-700/70 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            onChange={(e) => {
              if (e.target.value) onApplyPreset(e.target.value);
            }}
            defaultValue=""
          >
            <option value="" disabled>Select Preset Style...</option>
            {BUILT_IN_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm"
          title="Upload image to test in Preview"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Upload Image</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm"
          title="Export processed image in full original resolution"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Image</span>
        </button>

        <a
          href="/YMDithers.aex"
          download="YMDithers.aex"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/20 transition-all border border-indigo-400/30"
          title="Download the real native After Effects plugin binary (YMDithers.aex)"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-200" />
          <span>Download YMDithers.aex</span>
        </a>

        <div className="h-5 w-px bg-zinc-800 mx-1 hidden md:block" />

        <button
          onClick={onToggleCompare}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
            compareMode
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700/60'
          }`}
          title="Toggle Split-Screen Comparison"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Split</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition-colors"
          title="Reset to default settings"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
