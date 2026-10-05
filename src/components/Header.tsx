import React, { useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  HelpCircle, 
  Layers, 
  Image as ImageIcon,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { SAMPLE_IMAGES } from '../engine/sampleImages';
import { PRESET_STYLES } from '../engine/presetStyles';
import { PresetStyle } from '../types/dither';

interface HeaderProps {
  onSelectSample: (sampleId: string) => void;
  onUploadImage: (file: File) => void;
  onSelectPreset: (preset: PresetStyle) => void;
  onReset: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  activeAlgoName: string;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onUploadImage,
  onSelectPreset,
  onReset,
  onOpenExport,
  onOpenHelp,
  activeAlgoName,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <header className="h-14 bg-[#101216] border-b border-[#212630] px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Layers className="w-4 h-4 text-black stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-white">YMDITHERS</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1a1f29] text-cyan-400 border border-cyan-500/30">
              v2.0 PRO
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono tracking-tight hidden sm:block">
            49 Native Algorithms • Halftone • Tonal Grade
          </p>
        </div>
      </div>

      {/* Middle Action Bar: Presets & Samples */}
      <div className="flex items-center gap-2">
        {/* Quick Style Presets dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#161a22] hover:bg-[#1f2430] border border-[#2a3140] text-xs font-mono text-zinc-200 transition">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Presets</span>
          </button>
          <div className="absolute left-0 mt-1 w-56 bg-[#161a22] border border-[#2b3345] rounded-md shadow-2xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-400 border-b border-[#252c3c]">
              Iconic Style Presets
            </div>
            {PRESET_STYLES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-cyan-500/10 hover:text-cyan-300 flex flex-col text-zinc-300 transition"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-[10px] text-zinc-400 truncate">{preset.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sample Images dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#161a22] hover:bg-[#1f2430] border border-[#2a3140] text-xs font-mono text-zinc-200 transition">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Sample Images</span>
          </button>
          <div className="absolute left-0 mt-1 w-52 bg-[#161a22] border border-[#2b3345] rounded-md shadow-2xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-400 border-b border-[#252c3c]">
              Test Imagery
            </div>
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample.id)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-cyan-500/10 hover:text-cyan-300 text-zinc-300 transition"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload User Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#161a22] hover:bg-[#1f2430] border border-[#2a3140] text-xs font-mono text-zinc-200 transition"
          title="Upload local image (PNG, JPG, WebP)"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Right Controls: Status, Help, Reset, Export */}
      <div className="flex items-center gap-2">
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-[10px]">Rendering...</span>
          </div>
        )}

        {/* Algorithm Badge */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-[#141820] border border-[#252c3c] text-xs font-mono text-zinc-400">
          <span className="text-[10px] text-zinc-400">ALGO:</span>
          <span className="text-cyan-400 font-medium truncate max-w-[130px]">{activeAlgoName}</span>
        </div>

        <button
          onClick={onReset}
          className="p-1.5 rounded hover:bg-[#1f2430] text-zinc-400 hover:text-zinc-200 transition"
          title="Reset to defaults"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded hover:bg-[#1f2430] text-zinc-400 hover:text-zinc-200 transition"
          title="Algorithm Encyclopedia & Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition shadow-lg shadow-cyan-500/25"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
