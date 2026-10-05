import React, { useState } from 'react';
import { X, BookOpen, Layers, Cpu, HelpCircle, Terminal } from 'lucide-react';
import { ALGORITHMS } from '../core/ditherEngine';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'legend' | 'algos' | 'engine' | 'download'>('legend');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#111317] border border-[#262b36] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl font-mono text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#212530] bg-[#15181f]">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-white tracking-wider">
              YMDITHERS DOCUMENTATION & REFERENCE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#20242e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-[#212530] bg-[#0e1014] px-5">
          <button
            onClick={() => setTab('legend')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'legend'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Dither & Lines Controls
          </button>
          <button
            onClick={() => setTab('algos')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'algos'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            49 Algorithms ({ALGORITHMS.length})
          </button>
          <button
            onClick={() => setTab('engine')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'engine'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Contour & Density Math
          </button>
          <button
            onClick={() => setTab('download')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'download'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            تحميل YMDithers.aex
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-gray-300">
          {tab === 'legend' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] space-y-1">
                <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  Dot Density (Amount, White Amount, Black Amount)
                </h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Unlike standard opacity fading, reducing Amount decreases the actual count and density of dither dots, allowing the crisp photographic details of the original source image to emerge naturally between the dots without making them washed out or transparent.
                </p>
                <p className="text-gray-400 leading-relaxed text-[11px] mt-1">
                  In Monochrome mode, White Amount and Black Amount independently control the density of white and black dots, giving total artistic control over highlight and shadow rasterization.
                </p>
              </div>

              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] space-y-1">
                <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  Strict Object Contour Following (Object Checkbox)
                </h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  When <strong className="text-gray-200">Object</strong> is checked, Canny NMS ridge detection and connected hysteresis chain tracing identify true object silhouettes and edges. Lines are generated directly along the contour ridge with zero offset gap. When unchecked, lines are placed across the canvas procedurally.
                </p>
              </div>

              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] space-y-1">
                <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  Hand Made Lines & Curve
                </h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  When enabled, lines acquire subtle organic irregularity and hand-drawn variation anchored to the contour. The Curve slider modulates the degree of organic curvature without separating the stroke from the object edge.
                </p>
              </div>

              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] space-y-1">
                <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  Duplicate Lines
                </h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Spawns companion parallel lines hugging the same contour path with tight user-defined spacing, length scale, and opacity.
                </p>
              </div>
            </div>
          )}

          {tab === 'algos' && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-400">
                All 49 native algorithms from <code className="text-emerald-400">core/dither.cpp</code>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {ALGORITHMS.map(a => (
                  <div key={a.id} className="p-2 bg-[#161922] rounded border border-[#232733] text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-200">{a.id + 1}. {a.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {a.category}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px] mt-0.5">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'engine' && (
            <div className="space-y-3 text-[11px] leading-relaxed">
              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733]">
                <h4 className="text-emerald-400 font-bold mb-1">Canny NMS & Subpixel Contour Chain Extraction</h4>
                <p className="text-gray-400">
                  Sobel gradients are thinned along normal directions via 4-sector Non-Maximum Suppression (NMS) to generate 1-pixel wide ridges. Connected 8-neighbor hysteresis chains are parameterized by arc-length, allowing continuous subpixel stroke evaluation that adheres strictly to contours.
                </p>
              </div>

              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733]">
                <h4 className="text-emerald-400 font-bold mb-1">Dual-Polarity Dot Density Gating</h4>
                <p className="text-gray-400">
                  Instead of rendering a uniform dither and applying opacity, candidate dots are evaluated against independent spatial hash thresholds for light dots (White Amount) and dark dots (Black Amount). Non-activated pixels reveal the original image directly.
                </p>
              </div>
            </div>
          )}

          {tab === 'download' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-950/40 rounded-lg border border-emerald-500/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-emerald-400 font-bold text-sm">الملف الثنائي الحقيقي: YMDithers.aex</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">287 KB • Ready</span>
                </div>
                <p className="text-gray-300 text-xs mb-3">
                  تم بناء ملف الـ After Effects Plugin الثنائي بنجاح باستخدام CMake و After Effects SDK و MinGW-w64 x64 مع تصدير EffectMain.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/YMDithers.aex"
                    download="YMDithers.aex"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-lg transition-colors cursor-pointer"
                  >
                    <span>تحميل YMDithers.aex مباشرة</span>
                  </a>
                  <a
                    href="/YMDithers_Full_Package.zip"
                    download="YMDithers_Full_Package.zip"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1e232e] hover:bg-[#282f3d] text-gray-200 font-bold rounded border border-[#3b4354] transition-colors cursor-pointer"
                  >
                    <span>تحميل الحزمة الكاملة (.zip)</span>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#161922] rounded-lg border border-[#232733] space-y-2 text-xs">
                <h5 className="font-bold text-white">مسارات الملف على النظام:</h5>
                <ul className="list-disc list-inside space-y-1 text-gray-400 font-mono text-[11px]">
                  <li><code className="text-emerald-400">build/bin/Release/YMDithers.aex</code> (287 KB)</li>
                  <li><code className="text-emerald-400">dist/YMDithers.aex</code> (287 KB)</li>
                  <li><code className="text-emerald-400">public/YMDithers.aex</code> (Web Download)</li>
                </ul>
                <h5 className="font-bold text-white pt-2">طريقة التثبيت في After Effects:</h5>
                <p className="text-gray-400 leading-normal">
                  انسخ ملف <code className="text-emerald-400">YMDithers.aex</code> إلى مجلد البلجنز في Adobe After Effects:
                  <br />
                  <code className="text-gray-300 block bg-[#0e1014] p-2 rounded mt-1 font-mono text-[11px]">
                    C:\Program Files\Adobe\Adobe After Effects &lt;Version&gt;\Support Files\Plug-ins\YMDithers.aex
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#212530] bg-[#15181f] flex justify-between items-center text-gray-500 text-[10px]">
          <span>YMDithers • Native After Effects & Studio Edition</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
