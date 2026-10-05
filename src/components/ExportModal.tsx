import React, { useState } from 'react';
import { Download, X, Image as ImageIcon, CheckCircle, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'jpeg', quality: number) => Promise<void>;
  imageWidth: number;
  imageHeight: number;
  algoName: string;
  colorMode: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  imageWidth,
  imageHeight,
  algoName,
  colorMode,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState<number>(0.95);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedSuccess, setExportedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, quality);
      setExportedSuccess(true);
      setTimeout(() => {
        setExportedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#10131a] border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-[#0a0c10]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-zinc-100">Export Dithered Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-zinc-300">
          {/* Output info card */}
          <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Target Resolution:</span>
              <span className="font-mono font-medium text-zinc-100">
                {imageWidth} × {imageHeight} px
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Render Quality:</span>
              <span className="text-emerald-400 font-medium">Full Source Precision (1:1)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Algorithm:</span>
              <span className="text-zinc-200 font-mono">{algoName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Color Mode:</span>
              <span className="text-zinc-200 uppercase font-mono">{colorMode}</span>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-zinc-400 font-semibold tracking-wider text-[10px] uppercase mb-2">
              Select File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  format === 'png'
                    ? 'border-indigo-500 bg-indigo-950/30 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-xs text-zinc-100 mb-0.5">PNG (Recommended)</div>
                <div className="text-[11px] text-zinc-400">
                  Lossless pixel clarity, alpha transparency preserved.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  format === 'jpeg'
                    ? 'border-indigo-500 bg-indigo-950/30 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-xs text-zinc-100 mb-0.5">JPEG</div>
                <div className="text-[11px] text-zinc-400">
                  Smaller file size, solid background composited.
                </div>
              </button>
            </div>
          </div>

          {/* JPEG Quality Slider (only shown if format is JPEG) */}
          {format === 'jpeg' && (
            <div className="p-3 bg-zinc-900/40 rounded border border-zinc-800">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>JPEG Compression Quality</span>
                <span className="font-mono text-zinc-200">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleStartExport}
              className="px-4 py-2 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Full Res...</span>
                </>
              ) : exportedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
