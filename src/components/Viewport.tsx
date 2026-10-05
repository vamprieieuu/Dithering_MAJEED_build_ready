import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Maximize2, SplitSquareVertical, Upload, Camera, RefreshCw } from 'lucide-react';
import { SAMPLE_IMAGES } from '../engine/sampleImages';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

interface Props {
  srcCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  dstCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetTime: () => void;
  timeSec: number;
  onImageLoaded: () => void;
}

export const Viewport: React.FC<Props> = ({
  srcCanvasRef,
  dstCanvasRef,
  isPlaying,
  onTogglePlay,
  onResetTime,
  timeSec,
  onImageLoaded,
}) => {
  const [splitPos, setSplitPos] = useState<number>(50); // percentage
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load default sample image on mount
  useEffect(() => {
    if (srcCanvasRef.current) {
      srcCanvasRef.current.width = 640;
      srcCanvasRef.current.height = 480;
      SAMPLE_IMAGES[0].generate(srcCanvasRef.current);
      if (dstCanvasRef.current) {
        dstCanvasRef.current.width = 640;
        dstCanvasRef.current.height = 480;
      }
      onImageLoaded();
    }
  }, []);

  const handleSelectSample = (sampleId: string) => {
    const s = SAMPLE_IMAGES.find((x) => x.id === sampleId);
    if (s && srcCanvasRef.current && dstCanvasRef.current) {
      srcCanvasRef.current.width = 640;
      srcCanvasRef.current.height = 480;
      dstCanvasRef.current.width = 640;
      dstCanvasRef.current.height = 480;
      s.generate(srcCanvasRef.current);
      onImageLoaded();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (srcCanvasRef.current && dstCanvasRef.current) {
          // Constrain to max 1280x720 for real-time web responsiveness
          let w = img.width, h = img.height;
          const maxDim = 960;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          srcCanvasRef.current.width = w;
          srcCanvasRef.current.height = h;
          dstCanvasRef.current.width = w;
          dstCanvasRef.current.height = h;

          const ctx = srcCanvasRef.current.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          onImageLoaded();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSnapshot = () => {
    if (!dstCanvasRef.current) return;
    const a = document.createElement('a');
    a.href = dstCanvasRef.current.toDataURL('image/png');
    a.download = `ymdithers-${Date.now()}.png`;
    a.click();
  };

  // Mouse drag for split slider
  const handleMouseDown = () => setIsSplitting(true);
  useEffect(() => {
    const handleMouseUp = () => setIsSplitting(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSplitting || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      setSplitPos((x / rect.width) * 100);
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isSplitting]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-0 border-r border-zinc-800">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-zinc-800 bg-zinc-900/40 px-4 flex items-center justify-between">
        {/* Sample pickers */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Image:</span>
          <div className="flex items-center gap-1.5">
            {SAMPLE_IMAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s.id)}
                className="px-2.5 py-1 text-xs rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
              >
                {s.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors ml-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Viewport controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Zoom */}
          <div className="flex items-center bg-zinc-800/60 border border-zinc-700/60 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-300 min-w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="p-1 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1:1 Pixel mode */}
          <button
            onClick={() => setZoom(1)}
            className={`px-2 py-1 rounded-md border text-[11px] font-mono transition-colors ${
              zoom === 1
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
          >
            1:1 Pixel
          </button>

          {/* Toggle comparison mode */}
          <button
            onClick={() => setShowOriginal((x) => !x)}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-colors ${
              showOriginal
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{showOriginal ? 'Split Slider' : 'Toggle Compare'}</span>
          </button>

          {/* Snapshot */}
          <button
            onClick={handleSnapshot}
            className="p-1.5 rounded-md bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 hover:text-white transition-colors"
            title="Download Processed PNG"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Display Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center p-6 select-none"
        style={{
          backgroundImage:
            'radial-gradient(#27272a 1px, transparent 1px), radial-gradient(#18181b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      >
        {/* Canvases wrapper with zoom */}
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-zinc-800/80 transition-transform duration-75"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Source canvas (Hidden or underlying) */}
          <canvas
            ref={srcCanvasRef}
            className="block max-w-full max-h-full"
            style={{ display: showOriginal ? 'block' : 'none' }}
          />

          {/* Destination canvas (Processed output) */}
          <canvas
            ref={dstCanvasRef}
            className="block max-w-full max-h-full"
            style={{ display: showOriginal ? 'none' : 'block' }}
          />

          {/* Interactive Split View Overlay if splitting */}
          {!showOriginal && splitPos < 100 && splitPos > 0 && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
            >
              {/* Overlay original canvas */}
              {srcCanvasRef.current && (
                <img
                  src={srcCanvasRef.current.toDataURL()}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}

          {/* Split Divider Handle */}
          {!showOriginal && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 cursor-ew-resize pointer-events-auto shadow-[0_0_10px_rgba(99,102,241,0.8)]"
              style={{ left: `${splitPos}%` }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-[10px] text-white font-bold">
                ↔
              </div>
            </div>
          )}
        </div>

        {/* Labels on corners */}
        {!showOriginal && (
          <div className="absolute top-8 left-8 flex items-center gap-2 pointer-events-none">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold bg-zinc-900/90 text-zinc-300 border border-zinc-700/80 rounded shadow">
              Original
            </span>
          </div>
        )}
        {!showOriginal && (
          <div className="absolute top-8 right-8 flex items-center gap-2 pointer-events-none">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold bg-indigo-950/90 text-indigo-300 border border-indigo-700/80 rounded shadow">
              YMDithers Output
            </span>
          </div>
        )}
      </div>

      {/* Bottom Animation Control Bar */}
      <div className="h-12 border-t border-zinc-800 bg-zinc-900/50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Live Motion'}</span>
          </button>

          <button
            onClick={onResetTime}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Reset frame counter"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="font-mono text-xs text-zinc-400 flex items-center gap-2">
            <span>Frame: <strong className="text-zinc-200">{Math.floor(timeSec * 24)}</strong></span>
            <span>Time: <strong className="text-zinc-200">{timeSec.toFixed(2)}s</strong></span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 hidden sm:block">
          Drag vertical bar to compare original vs processed
        </div>
      </div>
    </div>
  );
};
