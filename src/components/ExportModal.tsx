import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, Image as ImageIcon, Package, FileArchive } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'image' | 'plugin'>('plugin');
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
      <div className="bg-[#111317] border border-[#262b36] rounded-xl w-full max-w-xl shadow-2xl font-mono text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#212530] bg-[#15181f]">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-white tracking-wider">
              تحميل YMDITHERS & تصدير النتائج
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#20242e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#212530] bg-[#0e1014] px-5">
          <button
            onClick={() => setActiveTab('plugin')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'plugin'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>تحميل بلجن After Effects (.aex)</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'image'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>تصدير الصورة الناتجة (PNG / JPG / SVG)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-gray-300">
          {activeTab === 'plugin' ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#161922] rounded-lg border border-[#2b303c] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span className="text-emerald-400">YMDithers.aex</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        Windows x64
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">
                      ملف بلجن After Effects الأصلي جاهز للتثبيت والاستخدام المباشر.
                    </p>
                  </div>
                  <a
                    href="/YMDithers.aex"
                    download="YMDithers.aex"
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-950/40 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل (.aex)</span>
                  </a>
                </div>

                <div className="p-2.5 bg-[#0b0c0f] rounded border border-[#1f232b] text-[10px] space-y-1">
                  <div className="text-gray-400 font-bold text-[11px]">طريقة التثبيت في After Effects:</div>
                  <div className="text-emerald-300">انسخ الملف <code>YMDithers.aex</code> إلى مسار البلجنز:</div>
                  <code className="block p-1 bg-[#14171e] text-gray-200 rounded text-[9px] select-all">
                    C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\Plug-ins\
                  </code>
                  <div className="text-gray-500">ثم افتح After Effects وطبقه من القائمة: Effect &gt; YMDithers &gt; YMDithers</div>
                </div>
              </div>

              {/* Source code zip package */}
              <div className="p-4 bg-[#161922] rounded-lg border border-[#2b303c] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white flex items-center space-x-1.5">
                    <FileArchive className="w-4 h-4 text-emerald-400" />
                    <span>حزمة المشروع المصدرية كاملة (.zip)</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    تحتوي على YMDithers.aex + الأكواد المصدرية C++ الكاملة (core/ و ae/ و CMakeLists.txt).
                  </p>
                </div>
                <a
                  href="/YMDithers_Full_Package.zip"
                  download="YMDithers_Full_Package.zip"
                  className="flex items-center space-x-1 px-3 py-1.5 bg-[#1f2430] hover:bg-[#282f3f] text-gray-200 hover:text-white border border-[#2b303c] rounded-lg text-[11px] font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل ZIP</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#1f242f] hover:bg-[#282e3c] text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
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
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#212530] bg-[#15181f] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-transparent hover:bg-[#20242e] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
