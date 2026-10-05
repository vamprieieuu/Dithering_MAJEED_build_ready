import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, Image as ImageIcon } from 'lucide-react';
import { DitherParams } from '../types/dither';
import { ALGORITHMS } from '../core/ditherEngine';
import { RenderedLine, drawLinesOnCanvas } from '../core/linesEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalData: ImageData | null;
  ditheredData: ImageData | null;
  lines: RenderedLine[];
  params: DitherParams;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  ditheredData,
  lines,
  params,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [jpegQuality, setJpegQuality] = useState<number>(92);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !ditheredData) return null;

  const currentAlgo = ALGORITHMS[Math.min(ALGORITHMS.length - 1, Math.max(0, params.algoId))];
  const filename = `ymdithers_${currentAlgo.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${params.mode}`;

  const getCompositedCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = ditheredData.width;
    canvas.height = ditheredData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(ditheredData, 0, 0);
    if (lines.length > 0) {
      drawLinesOnCanvas(ctx, lines);
    }
    return canvas;
  };

  const handleDownloadRaster = () => {
    const canvas = getCompositedCanvas();
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? jpegQuality / 100.0 : undefined;
    const dataUrl = canvas.toDataURL(mime, quality);

    const link = document.createElement('a');
    link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    try {
      const canvas = getCompositedCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadSVG = () => {
    const W = ditheredData.width;
    const H = ditheredData.height;
    const data = ditheredData.data;

    const step = Math.max(1, Math.floor(params.scale));
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:#000">\n`;

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const idx = (y * W + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3] / 255.0;

        if (r === 0 && g === 0 && b === 0 && params.mode !== 'rgb') continue;
        if (a < 0.05) continue;

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        const radius = (step * 0.48).toFixed(2);
        svgContent += `  <circle cx="${x + step / 2}" cy="${y + step / 2}" r="${radius}" fill="${hex}" />\n`;
      }
    }

    if (lines.length > 0) {
      svgContent += `  <g id="lines" stroke-linecap="round" stroke-linejoin="round">\n`;
      for (const line of lines) {
        if (line.points.length < 2) continue;
        let d = `M ${line.points[0].x.toFixed(1)} ${line.points[0].y.toFixed(1)}`;
        for (let i = 1; i < line.points.length; ++i) {
          d += ` L ${line.points[i].x.toFixed(1)} ${line.points[i].y.toFixed(1)}`;
        }
        const r = Math.round(line.color[0] * 255);
        const g = Math.round(line.color[1] * 255);
        const b = Math.round(line.color[2] * 255);
        const strokeHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        svgContent += `    <path d="${d}" stroke="${strokeHex}" stroke-width="${line.width}" stroke-opacity="${line.opacity}" fill="none" />\n`;
      }
      svgContent += `  </g>\n`;
    }

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#111317] border border-[#262b36] rounded-xl w-full max-w-lg shadow-2xl font-mono text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#212530] bg-[#15181f]">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-white tracking-wider">
              EXPORT YMDITHERS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#20242e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-gray-300">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFormat('png')}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                format === 'png'
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                  : 'border-[#262b36] bg-[#14171e] text-gray-400 hover:bg-[#181b24]'
              }`}
            >
              <ImageIcon className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <span className="font-bold block text-xs">PNG</span>
              <span className="text-[9px] text-gray-500">Lossless</span>
            </button>

            <button
              onClick={() => setFormat('jpeg')}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                format === 'jpeg'
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                  : 'border-[#262b36] bg-[#14171e] text-gray-400 hover:bg-[#181b24]'
              }`}
            >
              <ImageIcon className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <span className="font-bold block text-xs">JPG</span>
              <span className="text-[9px] text-gray-500">Compressed</span>
            </button>

            <button
              onClick={() => setFormat('svg')}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                format === 'svg'
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                  : 'border-[#262b36] bg-[#14171e] text-gray-400 hover:bg-[#181b24]'
              }`}
            >
              <FileCode className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <span className="font-bold block text-xs">SVG</span>
              <span className="text-[9px] text-gray-500">Vector Halftone</span>
            </button>
          </div>

          {format === 'jpeg' && (
            <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] space-y-2">
              <div className="flex justify-between items-center text-[11px] text-gray-300">
                <span>JPEG QUALITY</span>
                <span className="text-emerald-400">{jpegQuality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={jpegQuality}
                onChange={(e) => setJpegQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {format === 'svg' && (
            <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] text-[11px] text-gray-400 space-y-1">
              <p className="text-emerald-400 font-semibold">Scalable Vector Halftone & Contours</p>
              <p>
                Generates resolution-independent SVG vector circles and path strands. Importable directly into Adobe Illustrator, Figma, or pen plotters.
              </p>
            </div>
          )}

          <div className="p-3 bg-[#0d0f14] rounded-lg border border-[#1b1e26] text-[11px] space-y-1 text-gray-400">
            <div>Resolution: <strong className="text-gray-200">{ditheredData.width} × {ditheredData.height} px</strong></div>
            <div>Algorithm: <strong className="text-emerald-400">{currentAlgo.name}</strong></div>
            <div>Color Mode: <strong className="text-gray-200 uppercase">{params.mode}</strong></div>
            <div>DPI: <strong className="text-gray-200">{params.dpi} DPI</strong></div>
            <div>Active Strands: <strong className="text-emerald-400">{lines.length} lines</strong></div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-[#212530] bg-[#15181f] flex items-center justify-between">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#1f242f] hover:bg-[#282e3c] text-gray-300 font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-transparent hover:bg-[#20242e] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (format === 'svg') handleDownloadSVG();
                else handleDownloadRaster();
              }}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
