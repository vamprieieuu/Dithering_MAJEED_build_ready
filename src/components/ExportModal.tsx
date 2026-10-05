import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileCode, 
  Layers, 
  Copy, 
  Check, 
  Printer, 
  Palette
} from 'lucide-react';
import { DitherParams } from '../types/dither';
import { hexToRgb } from '../engine/paletteData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedImageData: ImageData | null;
  params: DitherParams;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  processedImageData,
  params,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [svgGenerating, setSvgGenerating] = useState<boolean>(false);

  if (!isOpen || !processedImageData) return null;

  const width = processedImageData.width;
  const height = processedImageData.height;

  // Create temporary canvas
  const getProcessedCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(processedImageData, 0, 0);
    return canvas;
  };

  // Export PNG
  const handleExportPng = () => {
    const canvas = getProcessedCanvas();
    const link = document.createElement('a');
    link.download = `ymdithers_${params.renderMode}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Export JPEG
  const handleExportJpeg = () => {
    const canvas = getProcessedCanvas();
    const link = document.createElement('a');
    link.download = `ymdithers_${params.renderMode}_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // Copy PNG to Clipboard
  const handleCopyClipboard = async () => {
    const canvas = getProcessedCanvas();
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Clipboard copy failed:', err);
        }
      }
    });
  };

  // Export SVG Vector Halftone Dots
  const handleExportSvg = () => {
    setSvgGenerating(true);
    setTimeout(() => {
      const step = Math.max(1, Math.round(params.scale * (params.dpi / 300.0)));
      const circles: string[] = [];
      const data = processedImageData.data;

      // Group SVG elements by color to keep file small
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const a = data[idx + 3];
          if (a > 20) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const colorHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            const radius = (step * 0.5) * (a / 255);
            circles.push(`<circle cx="${x + step * 0.5}" cy="${y + step * 0.5}" r="${radius}" fill="${colorHex}"/>`);
          }
        }
      }

      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${params.knockoutBg ? 'none' : params.backgroundColor}"/>
  ${circles.join('\n  ')}
</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `ymdithers_vector_${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setSvgGenerating(false);
    }, 50);
  };

  // Export Separate Tonal Layers (for Risograph & Silkscreen screen preparation!)
  const handleExportLayerSeparation = (layerType: 'highlight' | 'midtone' | 'shadow') => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const layerData = ctx.createImageData(width, height);
    const src = processedImageData.data;
    const dst = layerData.data;

    let targetRgb: [number, number, number] = [0, 0, 0];
    if (layerType === 'highlight') targetRgb = hexToRgb(params.highlightColor);
    else if (layerType === 'midtone') targetRgb = hexToRgb(params.midtoneColor);
    else targetRgb = hexToRgb(params.shadowColor);

    for (let i = 0; i < src.length; i += 4) {
      const dr = Math.abs(src[i] - targetRgb[0]);
      const dg = Math.abs(src[i + 1] - targetRgb[1]);
      const db = Math.abs(src[i + 2] - targetRgb[2]);
      if (dr < 15 && dg < 15 && db < 15 && src[i + 3] > 0) {
        // Solid black ink on transparent substrate for photo-emulsion exposure
        dst[i] = 0;
        dst[i + 1] = 0;
        dst[i + 2] = 0;
        dst[i + 3] = 255;
      } else {
        dst[i + 3] = 0;
      }
    }

    ctx.putImageData(layerData, 0, 0);
    const link = document.createElement('a');
    link.download = `ymdithers_${layerType}_plate_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Export Palette JSON
  const handleExportPaletteJson = () => {
    const paletteData = {
      name: 'YMDithers Custom Palette',
      renderMode: params.renderMode,
      colors: [
        params.highlightColor,
        params.midtoneColor,
        params.shadowColor,
        params.backgroundColor,
      ],
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `palette_${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-mono">
      <div className="w-full max-w-lg bg-[#12151c] border border-[#252c3c] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#161a22] border-b border-[#252c3c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white tracking-wide">EXPORT RENDER</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#202636] text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs text-zinc-300">
          {/* Resolution Info */}
          <div className="flex items-center justify-between p-3 rounded bg-[#161a22] border border-[#252c3c]">
            <span className="text-zinc-400">Output Dimensions</span>
            <span className="text-cyan-400 font-bold">{width} × {height} px @ {params.dpi} DPI</span>
          </div>

          {/* Standard Raster Export Buttons */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Raster Formats
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportPng}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded bg-[#1a202c] hover:bg-cyan-500 hover:text-black border border-[#2d3748] font-bold transition group"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:text-black" />
                <span>Export PNG (Lossless)</span>
              </button>

              <button
                onClick={handleExportJpeg}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded bg-[#1a202c] hover:bg-cyan-500 hover:text-black border border-[#2d3748] font-bold transition group"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:text-black" />
                <span>Export JPEG (Compressed)</span>
              </button>
            </div>
          </div>

          {/* Vector SVG Export */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Vector Print & Plotter Formats
            </span>
            <button
              onClick={handleExportSvg}
              disabled={svgGenerating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded bg-[#1a202c] hover:bg-cyan-500 hover:text-black border border-[#2d3748] font-bold transition group"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400 group-hover:text-black" />
              <span>{svgGenerating ? 'Generating Vector SVG...' : 'Export SVG Vector Halftone Dots'}</span>
            </button>
            <p className="text-[10px] text-zinc-400 mt-1 italic">
              Converts halftone dots to infinite-resolution SVG vector elements for vinyl cutting, laser etching, and large format printing.
            </p>
          </div>

          {/* Risograph & Screen Printing Multi-Layer Plates */}
          {params.renderMode === 'tonal' && (
            <div className="p-3 bg-[#161a22] rounded border border-[#252c3c] space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Screen-Printing / Risograph Color Separations</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Exports isolated black-on-transparent film plates ready for direct screen exposure:
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => handleExportLayerSeparation('highlight')}
                  className="py-1.5 px-2 rounded bg-[#1f2636] hover:bg-cyan-500 hover:text-black text-[10px] font-bold border border-[#2d3748] transition"
                >
                  Highlight Plate
                </button>
                {params.tonalCount === 3 && (
                  <button
                    onClick={() => handleExportLayerSeparation('midtone')}
                    className="py-1.5 px-2 rounded bg-[#1f2636] hover:bg-cyan-500 hover:text-black text-[10px] font-bold border border-[#2d3748] transition"
                  >
                    Midtone Plate
                  </button>
                )}
                {params.tonalCount >= 2 && (
                  <button
                    onClick={() => handleExportLayerSeparation('shadow')}
                    className="py-1.5 px-2 rounded bg-[#1f2636] hover:bg-cyan-500 hover:text-black text-[10px] font-bold border border-[#2d3748] transition"
                  >
                    Shadow Plate
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions: Clipboard & Palette */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#212630]">
            <button
              onClick={handleCopyClipboard}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#1a202c] hover:bg-[#252e3e] text-zinc-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleExportPaletteJson}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#1a202c] hover:bg-[#252e3e] text-zinc-200 transition"
              title="Download Palette JSON"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              <span>Palette JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
