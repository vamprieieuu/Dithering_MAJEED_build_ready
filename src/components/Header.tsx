import React, { useState } from 'react';
import { 
  Download, 
  HelpCircle, 
  RotateCcw, 
  Image as ImageIcon,
  Zap,
  Package,
  ChevronDown
} from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/sampleImages';
import { STUDIO_STYLE_PRESETS, StudioStylePreset } from '../data/palettes';
import { LOGO_DATA_URL } from '../assets/logoDataUrl';

interface HeaderProps {
  currentSampleId: string;
  onSelectSample: (id: string) => void;
  onApplyPreset: (preset: StudioStylePreset) => void;
  onResetParams: () => void;
  onOpenExport: () => void;
  onOpenInfo: () => void;
  onFileUpload: (file: File) => void;
  renderTimeMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentSampleId,
  onSelectSample,
  onApplyPreset,
  onResetParams,
  onOpenExport,
  onOpenInfo,
  onFileUpload,
  renderTimeMs,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-[#111317] border-b border-[#21242d] px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Brand & Project Logo */}
      <div className="flex items-center space-x-3">
        <div className="h-9 px-1 bg-[#0b0c0e] rounded border border-[#2b303c] flex items-center justify-center shadow-md overflow-hidden">
          <img 
            src={LOGO_DATA_URL} 
            alt="YMDithers Logo" 
            className="h-7 w-auto object-contain image-rendering-pixelated"
          />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-wider text-sm text-white font-mono">
              YMDithers
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
              PRO
            </span>
          </div>
          <span className="text-[10px] text-gray-500 tracking-wide font-mono hidden sm:inline-block">
            49 Native Algorithms • Dither & Contour Lines
          </span>
        </div>
      </div>

      {/* Center Toolset: Sample picker, Style presets & Upload */}
      <div className="flex items-center space-x-2">
        {/* Sample Image dropdown */}
        <select
          value={currentSampleId}
          onChange={(e) => onSelectSample(e.target.value)}
          className="bg-[#181b22] hover:bg-[#20242e] text-xs text-gray-200 border border-[#2b303c] rounded px-2.5 py-1.5 font-mono cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="custom" disabled>Custom Uploaded</option>
          {SAMPLE_IMAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.category})
            </option>
          ))}
        </select>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileUpload(e.target.files[0]);
            }
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload your own image (PNG, JPG, WebP)"
          className="flex items-center space-x-1.5 bg-[#181b22] hover:bg-[#20242e] text-xs text-gray-300 border border-[#2b303c] rounded px-2.5 py-1.5 font-mono cursor-pointer transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Open Image</span>
        </button>

        {/* Quick Style Presets Menu */}
        <select
          defaultValue=""
          onChange={(e) => {
            const p = STUDIO_STYLE_PRESETS.find((x) => x.id === e.target.value);
            if (p) onApplyPreset(p);
            e.target.value = '';
          }}
          className="bg-[#181b22] hover:bg-[#20242e] text-xs text-gray-200 border border-[#2b303c] rounded px-2.5 py-1.5 font-mono cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="" disabled>
            ⚡ Presets...
          </option>
          {STUDIO_STYLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} [{p.category}]
            </option>
          ))}
        </select>
      </div>

      {/* Right Actions: Download Plugin Dropdown, Benchmark, Reset, Info, Export */}
      <div className="flex items-center space-x-2 relative">
        <div 
          className="hidden lg:flex items-center space-x-1.5 px-2 py-1 bg-[#14171e] border border-[#222733] rounded text-[11px] font-mono text-gray-400"
          title="Engine Render Latency"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>{renderTimeMs.toFixed(1)} ms</span>
        </div>

        {/* Direct One-Click Download for YMDithers.aex */}
        <a
          href="/YMDithers.aex"
          download="YMDithers.aex"
          title="Download YMDithers.aex (Native After Effects Plugin - 287 KB)"
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-3 py-1.5 rounded shadow-md shadow-emerald-950/50 border border-emerald-400/60 transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تحميل YMDithers.aex</span>
        </a>

        {/* Dedicated Direct Plugin Download Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            className="flex items-center space-x-1.5 bg-[#1f2430] hover:bg-[#282f3f] text-emerald-300 border border-emerald-500/40 text-xs font-mono px-2 py-1.5 rounded transition-colors cursor-pointer"
            title="Additional download options"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {downloadMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-[#14171e] border border-[#2b303c] rounded-lg shadow-2xl py-1.5 z-50 text-xs font-mono"
              onMouseLeave={() => setDownloadMenuOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] text-gray-400 border-b border-[#212530] font-semibold flex items-center justify-between">
                <span>ملفات البلجن الجاهزة للتحميل:</span>
                <span className="text-emerald-400 text-[9px]">Built Native x64</span>
              </div>
              <a
                href="/YMDithers.aex"
                download="YMDithers.aex"
                className="flex items-center justify-between px-3 py-2 text-gray-200 hover:bg-[#1f2430] hover:text-emerald-400 transition-colors"
                onClick={() => setDownloadMenuOpen(false)}
              >
                <div>
                  <div className="font-bold text-emerald-400 flex items-center space-x-1">
                    <span>YMDithers.aex</span>
                    <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1 rounded">287 KB</span>
                  </div>
                  <div className="text-[10px] text-gray-400">After Effects Native Plugin (Win x64)</div>
                  <div className="text-[9px] text-gray-500">build/bin/Release/YMDithers.aex</div>
                </div>
                <Download className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
              </a>
              <a
                href="/YMDithers_Full_Package.zip"
                download="YMDithers_Full_Package.zip"
                className="flex items-center justify-between px-3 py-2 text-gray-200 hover:bg-[#1f2430] hover:text-emerald-400 transition-colors border-t border-[#212530]"
                onClick={() => setDownloadMenuOpen(false)}
              >
                <div>
                  <div className="font-bold text-white flex items-center space-x-1">
                    <span>حزمة المشروع الكاملة (.zip)</span>
                    <span className="text-[10px] bg-[#212530] text-gray-300 px-1 rounded">320 KB</span>
                  </div>
                  <div className="text-[10px] text-gray-400">AEX Plugin + Core C++ + Headers</div>
                </div>
                <Download className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
              </a>
            </div>
          )}
        </div>

        <button
          onClick={onResetParams}
          title="Reset to default settings"
          className="p-1.5 rounded bg-[#181b22] hover:bg-[#222733] text-gray-400 hover:text-gray-200 border border-[#2b303c] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenInfo}
          title="Documentation & Reference"
          className="p-1.5 rounded bg-[#181b22] hover:bg-[#222733] text-gray-400 hover:text-gray-200 border border-[#2b303c] transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold px-3 py-1.5 rounded shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Image</span>
        </button>
      </div>
    </header>
  );
};
