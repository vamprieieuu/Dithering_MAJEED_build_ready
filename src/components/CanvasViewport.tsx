import React, { useRef, useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Split, 
  Grid, 
  Eye, 
  Move,
  Check
} from 'lucide-react';
import { ContourLinesConfig } from '../types/dither';
import { renderContourLines } from '../engine/linesEngine';

interface CanvasViewportProps {
  processedImageData: ImageData | null;
  sourceImageData: ImageData | null;
  linesConfig: ContourLinesConfig;
  renderTimeMs: number;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  processedImageData,
  sourceImageData,
  linesConfig,
  renderTimeMs,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Viewport transforms
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Split-screen Before/After slider
  const [splitPos, setSplitPos] = useState<number>(0.5); // 0..1
  const [isSplitDragging, setIsSplitDragging] = useState<boolean>(false);
  const [enableSplit, setEnableSplit] = useState<boolean>(false);

  // Inspector & Overlays
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [inspectedColor, setInspectedColor] = useState<{ r: number; g: number; b: number; x: number; y: number } | null>(null);

  // Fit image to container on initial load
  useEffect(() => {
    if (processedImageData && containerRef.current) {
      const containerW = containerRef.current.clientWidth - 40;
      const containerH = containerRef.current.clientHeight - 40;
      const scaleX = containerW / processedImageData.width;
      const scaleY = containerH / processedImageData.height;
      const fitZoom = Math.min(1.5, Math.min(scaleX, scaleY));
      setZoom(Math.max(0.2, fitZoom));
      setPan({ x: 0, y: 0 });
    }
  }, [processedImageData?.width, processedImageData?.height]);

  // Render on main canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !processedImageData) return;

    const w = processedImageData.width;
    const h = processedImageData.height;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (enableSplit && sourceImageData) {
      // Draw split: left side is processed, right side is original source
      const splitX = Math.round(w * splitPos);

      // Draw processed
      ctx.putImageData(processedImageData, 0, 0);

      // Render contour lines on processed portion if enabled
      if (linesConfig.enabled) {
        renderContourLines(ctx, processedImageData, linesConfig);
      }

      // Draw source on right
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.putImageData(sourceImageData, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        ctx.drawImage(offscreen, 0, 0);
        ctx.restore();
      }

      // Draw split divider line
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = Math.max(1, 2 / zoom);
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();
    } else {
      // Full dither image
      ctx.putImageData(processedImageData, 0, 0);

      // Overlay procedural contour strands if enabled
      if (linesConfig.enabled) {
        renderContourLines(ctx, processedImageData, linesConfig);
      }
    }
  }, [processedImageData, sourceImageData, enableSplit, splitPos, linesConfig, zoom]);

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(16, Math.max(0.1, prev * zoomFactor)));
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isSplitDragging) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }

    if (isSplitDragging && containerRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      setSplitPos(Math.max(0.01, Math.min(0.99, relativeX)));
    }

    // Color inspector
    if (canvasRef.current && processedImageData) {
      const rect = canvasRef.current.getBoundingClientRect();
      const imgX = Math.floor(((e.clientX - rect.left) / rect.width) * processedImageData.width);
      const imgY = Math.floor(((e.clientY - rect.top) / rect.height) * processedImageData.height);

      if (imgX >= 0 && imgX < processedImageData.width && imgY >= 0 && imgY < processedImageData.height) {
        const idx = (imgY * processedImageData.width + imgX) * 4;
        setInspectedColor({
          r: processedImageData.data[idx],
          g: processedImageData.data[idx + 1],
          b: processedImageData.data[idx + 2],
          x: imgX,
          y: imgY,
        });
      } else {
        setInspectedColor(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsSplitDragging(false);
  };

  const zoom100 = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const fitToScreen = () => {
    if (processedImageData && containerRef.current) {
      const containerW = containerRef.current.clientWidth - 40;
      const containerH = containerRef.current.clientHeight - 40;
      const scaleX = containerW / processedImageData.width;
      const scaleY = containerH / processedImageData.height;
      setZoom(Math.min(scaleX, scaleY));
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full bg-[#0b0c0e] overflow-hidden select-none cursor-crosshair flex items-center justify-center"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Subtle Grid Texture */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#252c3c 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating Canvas Transform Wrapper */}
      <div
        className="relative transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          className={`shadow-2xl shadow-black/80 rounded-sm border border-[#252c3c] ${
            zoom >= 3 ? 'image-pixelated' : ''
          }`}
          style={{
            imageRendering: zoom >= 2 ? 'pixelated' : 'auto',
          }}
        />

        {/* Pixel Grid lines overlay for high zoom */}
        {showGrid && zoom >= 4 && processedImageData && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,229,255,0.15) 1px, transparent 1px)',
              backgroundSize: `${100 / processedImageData.width}% ${100 / processedImageData.height}%`,
            }}
          />
        )}

        {/* Split screen interactable slider line handle */}
        {enableSplit && processedImageData && (
          <div
            className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex items-center justify-center pointer-events-auto"
            style={{ left: `${splitPos * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsSplitDragging(true);
            }}
          >
            <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg border border-white">
              <Split className="w-3 h-3 rotate-90" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Viewport Controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12151c]/90 backdrop-blur-md border border-[#242b3a] shadow-xl text-xs font-mono text-zinc-300 z-10">
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z * 0.8))}
          className="p-1 rounded hover:bg-[#1f2533] text-zinc-400 hover:text-zinc-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="px-1 text-[11px] text-cyan-400 font-bold min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(16, z * 1.25))}
          className="p-1 rounded hover:bg-[#1f2533] text-zinc-400 hover:text-zinc-200"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[#2a3244] mx-1" />

        <button
          onClick={zoom100}
          className="px-2 py-0.5 rounded text-[11px] hover:bg-[#1f2533] text-zinc-300 hover:text-cyan-400"
          title="Actual Size (1:1)"
        >
          1:1
        </button>
        <button
          onClick={fitToScreen}
          className="p-1 rounded hover:bg-[#1f2533] text-zinc-400 hover:text-zinc-200"
          title="Fit to Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[#2a3244] mx-1" />

        <button
          onClick={() => setEnableSplit((s) => !s)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
            enableSplit
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'hover:bg-[#1f2533] text-zinc-400'
          }`}
          title="Compare with Original (Before / After Split)"
        >
          <Split className="w-3 h-3" />
          <span>Split</span>
        </button>

        <button
          onClick={() => setShowGrid((g) => !g)}
          className={`p-1 rounded transition ${
            showGrid ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-[#1f2533] text-zinc-400'
          }`}
          title="Toggle Pixel Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Floating Color & Stats Bar */}
      <div className="absolute top-4 left-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#12151c]/90 backdrop-blur-md border border-[#242b3a] shadow-xl text-xs font-mono text-zinc-400 z-10 pointer-events-none">
        {processedImageData && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-300">
              {processedImageData.width} × {processedImageData.height} px
            </span>
            <span className="text-[#2b3345]">•</span>
            <span className="text-[10px] text-emerald-400">
              {renderTimeMs.toFixed(1)} ms
            </span>
          </div>
        )}

        {inspectedColor && (
          <>
            <span className="text-[#2b3345]">•</span>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                style={{
                  backgroundColor: `rgb(${inspectedColor.r},${inspectedColor.g},${inspectedColor.b})`,
                }}
              />
              <span className="text-[11px] text-zinc-200">
                X:{inspectedColor.x} Y:{inspectedColor.y}
              </span>
              <span className="text-[11px] text-cyan-400 font-bold">
                rgb({inspectedColor.r}, {inspectedColor.g}, {inspectedColor.b})
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
