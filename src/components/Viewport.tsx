import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Upload, Move, Sparkles } from 'lucide-react';

interface ViewportProps {
  originalImage: ImageData | null;
  ditheredImage: ImageData | null;
  renderTimeMs: number;
  compareMode: boolean;
  onUploadFile: (file: File) => void;
  onOpenSampleModal: () => void;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const Viewport: React.FC<ViewportProps> = ({
  originalImage,
  ditheredImage,
  renderTimeMs,
  compareMode,
  onUploadFile,
  onOpenSampleModal,
  overlayCanvasRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const origCanvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [splitPos, setSplitPos] = useState<number>(50); // percentage (0..100)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Paint dithered canvas
  useEffect(() => {
    if (!mainCanvasRef.current || !ditheredImage) return;
    const canvas = mainCanvasRef.current;
    if (canvas.width !== ditheredImage.width || canvas.height !== ditheredImage.height) {
      canvas.width = ditheredImage.width;
      canvas.height = ditheredImage.height;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(ditheredImage, 0, 0);
    }
  }, [ditheredImage]);

  // Paint original canvas for comparison
  useEffect(() => {
    if (!origCanvasRef.current || !originalImage) return;
    const canvas = origCanvasRef.current;
    if (canvas.width !== originalImage.width || canvas.height !== originalImage.height) {
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(originalImage, 0, 0);
    }
  }, [originalImage]);

  // Sync lines overlay canvas size
  useEffect(() => {
    if (!overlayCanvasRef.current || !ditheredImage) return;
    const canvas = overlayCanvasRef.current;
    if (canvas.width !== ditheredImage.width || canvas.height !== ditheredImage.height) {
      canvas.width = ditheredImage.width;
      canvas.height = ditheredImage.height;
    }
  }, [ditheredImage, overlayCanvasRef]);

  // Fit image to viewport
  const handleFit = () => {
    if (!containerRef.current || !originalImage) return;
    const cw = containerRef.current.clientWidth - 48;
    const ch = containerRef.current.clientHeight - 48;
    const scale = Math.min(cw / originalImage.width, ch / originalImage.height, 1.5);
    setZoom(Math.max(0.2, scale));
    setPan({ x: 0, y: 0 });
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(8.0, Math.max(0.1, prev * factor)));
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingSplit) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && containerRef.current && originalImage) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));
      setSplitPos(pct);
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  const width = originalImage?.width || 0;
  const height = originalImage?.height || 0;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex-1 h-full bg-[#08090d] overflow-hidden select-none flex items-center justify-center cursor-grab ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #1a1e28 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-950/80 border-2 border-dashed border-indigo-400 z-50 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-indigo-300 animate-bounce mb-2" />
          <p className="text-white font-semibold">Drop image here to dither</p>
        </div>
      )}

      {/* Main Transformable Canvas Container */}
      {originalImage && (
        <div
          className="relative transition-transform duration-75 ease-out shadow-2xl rounded"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            imageRendering: zoom >= 1.5 ? 'pixelated' : 'auto',
          }}
        >
          {/* Main Dither Output Canvas */}
          <canvas
            ref={mainCanvasRef}
            className="block rounded shadow-inner"
            style={{ width, height }}
          />

          {/* Lines Overlay Canvas */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width, height }}
          />

          {/* Split Mode Comparison Clip */}
          {compareMode && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none border-r border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              style={{
                width: `${splitPos}%`,
              }}
            >
              <canvas
                ref={origCanvasRef}
                className="block"
                style={{ width, height }}
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-amber-300 font-semibold border border-amber-400/40">
                ORIGINAL
              </div>
            </div>
          )}

          {compareMode && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-indigo-300 font-semibold border border-indigo-500/40 pointer-events-none">
              DITHERED
            </div>
          )}

          {/* Draggable Split Handle */}
          {compareMode && (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingSplit(true);
              }}
              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex items-center justify-center pointer-events-auto group z-20"
              style={{ left: `${splitPos}%` }}
            >
              <div className="w-1.5 h-10 bg-amber-400 rounded-full shadow-lg group-hover:scale-125 transition-transform" />
            </div>
          )}
        </div>
      )}

      {/* Empty State / Quick Upload Prompt */}
      {!originalImage && (
        <div className="text-center p-8 max-w-md bg-zinc-900/60 border border-zinc-800 rounded-xl backdrop-blur">
          <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Drop Image or Select Demo</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Supports PNG, JPEG, WEBP, and GIF files. Processed locally in high precision.
          </p>
          <div className="flex gap-2 justify-center">
            <label className="cursor-pointer px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              Choose File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadFile(e.target.files[0]);
                  }
                }}
              />
            </label>
            <button
              onClick={onOpenSampleModal}
              className="px-3 py-1.5 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Demo Images
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Badge (bottom left) */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-[#0e1118]/85 border border-zinc-800/80 rounded-md px-2.5 py-1.5 text-[11px] text-zinc-400 backdrop-blur z-20">
        <span>{width}×{height}px</span>
        <span className="text-zinc-600">•</span>
        <span className="text-emerald-400 font-medium">{renderTimeMs.toFixed(1)}ms</span>
        <span className="text-zinc-600">•</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Floating Viewport Controls (bottom right) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#0e1118]/90 border border-zinc-800/80 rounded-md p-1 backdrop-blur z-20">
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z * 0.8))}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
          className="px-2 py-1 rounded text-[11px] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
          title="Reset to 100%"
        >
          1:1
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(8.0, z * 1.25))}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-zinc-800 mx-0.5" />
        <button
          onClick={handleFit}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
