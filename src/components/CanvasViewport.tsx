import React, { useRef, useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Columns, 
  Eye, 
  UploadCloud,
  Layers,
  SplitSquareVertical
} from 'lucide-react';
import { drawLinesOnCanvas, RenderedLine } from '../core/linesEngine';

interface CanvasViewportProps {
  originalData: ImageData | null;
  ditheredData: ImageData | null;
  lines: RenderedLine[];
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  originalData,
  ditheredData,
  lines,
  onFileUpload,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'split' | 'dither' | 'original' | 'sideBySide'>('split');
  const [splitPos, setSplitPos] = useState<number>(0.5); // 0..1
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [pixelInfo, setPixelInfo] = useState<{ x: number; y: number; r: number; g: number; b: number } | null>(null);

  // Auto-fit on initial load or image resize
  useEffect(() => {
    if (!originalData || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const scaleX = (cw - 48) / originalData.width;
    const scaleY = (ch - 48) / originalData.height;
    const fitScale = Math.min(scaleX, scaleY, 1.0);
    setZoom(Math.max(0.2, fitScale));
  }, [originalData?.width, originalData?.height]);

  // Main rendering loop to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalData || !ditheredData) return;

    const W = originalData.width;
    const H = originalData.height;

    if (viewMode === 'sideBySide') {
      canvas.width = W * 2 + 16;
      canvas.height = H;
    } else {
      canvas.width = W;
      canvas.height = H;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (viewMode === 'original') {
      ctx.putImageData(originalData, 0, 0);
    } else if (viewMode === 'dither') {
      ctx.putImageData(ditheredData, 0, 0);
      if (lines.length > 0) {
        drawLinesOnCanvas(ctx, lines);
      }
    } else if (viewMode === 'sideBySide') {
      // Left: Original
      ctx.putImageData(originalData, 0, 0);
      // Right: Dithered
      ctx.putImageData(ditheredData, W + 16, 0);
      if (lines.length > 0) {
        ctx.save();
        ctx.translate(W + 16, 0);
        drawLinesOnCanvas(ctx, lines);
        ctx.restore();
      }
      // Divider
      ctx.fillStyle = '#222733';
      ctx.fillRect(W, 0, 16, H);
    } else if (viewMode === 'split') {
      // Split mode: Original on left of split line, Dithered on right
      const splitX = Math.round(W * splitPos);

      // Render dithered completely first
      ctx.putImageData(ditheredData, 0, 0);
      if (lines.length > 0) {
        drawLinesOnCanvas(ctx, lines);
      }

      // Clip and render original on the left
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, H);
      ctx.clip();
      
      // Temporary offscreen canvas for original
      const offCanvas = document.createElement('canvas');
      offCanvas.width = W;
      offCanvas.height = H;
      const offCtx = offCanvas.getContext('2d')!;
      offCtx.putImageData(originalData, 0, 0);
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // Draw high-visibility split bar line
      ctx.fillStyle = '#10b981';
      ctx.fillRect(splitX - 1, 0, 2, H);

      // Handle circle
      ctx.beginPath();
      ctx.arc(splitX, H / 2, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#0b0c0e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Small arrows inside split circle
      ctx.fillStyle = '#0b0c0e';
      ctx.beginPath();
      ctx.moveTo(splitX - 6, H / 2);
      ctx.lineTo(splitX - 2, H / 2 - 4);
      ctx.lineTo(splitX - 2, H / 2 + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(splitX + 6, H / 2);
      ctx.lineTo(splitX + 2, H / 2 - 4);
      ctx.lineTo(splitX + 2, H / 2 + 4);
      ctx.closePath();
      ctx.fill();
    }
  }, [originalData, ditheredData, lines, viewMode, splitPos]);

  // Handle Split drag interactions
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !canvasRef.current || viewMode !== 'split') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0.02, Math.min(0.98, x / rect.width));
    setSplitPos(ratio);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !ditheredData) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);

    if (x >= 0 && x < ditheredData.width && y >= 0 && y < ditheredData.height) {
      const idx = (y * ditheredData.width + x) * 4;
      setPixelInfo({
        x,
        y,
        r: ditheredData.data[idx],
        g: ditheredData.data[idx + 1],
        b: ditheredData.data[idx + 2],
      });
    } else {
      setPixelInfo(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-[#0b0c0e] relative flex flex-col overflow-hidden"
      onMouseMove={handleSplitMouseMove}
      onMouseUp={() => setIsDraggingSplit(false)}
      onMouseLeave={() => { setIsDraggingSplit(false); setPixelInfo(null); }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onFileUpload(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Floating Viewport Toolbar */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 bg-[#12141a]/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-[#212530] shadow-xl text-xs font-mono">
        {/* Mode Buttons */}
        <div className="flex bg-[#0b0c0f] p-0.5 rounded border border-[#1e222c]">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
              viewMode === 'split' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Split Before / After Slider"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setViewMode('dither')}
            className={`px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
              viewMode === 'dither' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Dithered Output Only"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dither</span>
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
              viewMode === 'original' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Original Source Only"
          >
            <span>Original</span>
          </button>
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
              viewMode === 'sideBySide' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Side-by-side view"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dual</span>
          </button>
        </div>

        <div className="w-[1px] h-4 bg-[#232733]" />

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setZoom(z => Math.max(0.1, z - 0.15))}
            className="p-1 hover:bg-[#1a1d26] rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-gray-300 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(5.0, z + 0.15))}
            className="p-1 hover:bg-[#1a1d26] rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="px-1.5 py-0.5 text-[10px] bg-[#171a22] hover:bg-[#20242e] text-gray-300 rounded border border-[#262a36] transition-colors"
            title="100% 1:1 Pixel Scale"
          >
            1:1
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll / Viewport Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#3a4050 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Canvas Element with dynamic zoom */}
        <div 
          className="relative shadow-2xl rounded border border-[#222733] bg-[#000000] overflow-hidden"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.05s ease-out'
          }}
          onMouseDown={() => {
            if (viewMode === 'split') setIsDraggingSplit(true);
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            className="block cursor-crosshair image-rendering-pixelated"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-[#111317] border border-emerald-500/40 text-emerald-400 font-mono text-xs shadow-xl animate-pulse">
                <span>Rendering 49-engine...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Bar: Resolution & Pixel Inspector */}
      <div className="h-7 bg-[#111317] border-t border-[#1f232b] px-4 flex items-center justify-between text-[11px] font-mono text-gray-400 select-none z-10 shrink-0">
        <div className="flex items-center space-x-4">
          {originalData && (
            <span>
              Canvas: <strong className="text-gray-200">{originalData.width} × {originalData.height} px</strong>
            </span>
          )}
          {viewMode === 'split' && (
            <span className="text-emerald-400">
              Drag line to compare Before (Left) & After (Right)
            </span>
          )}
        </div>

        {/* Pixel probe info */}
        {pixelInfo ? (
          <div className="flex items-center space-x-3">
            <span>X: {pixelInfo.x} Y: {pixelInfo.y}</span>
            <div className="flex items-center space-x-1.5">
              <div 
                className="w-3 h-3 rounded-xs border border-white/20"
                style={{ backgroundColor: `rgb(${pixelInfo.r}, ${pixelInfo.g}, ${pixelInfo.b})` }}
              />
              <span>RGB({pixelInfo.r}, {pixelInfo.g}, {pixelInfo.b})</span>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Drop an image here anytime to dither</span>
        )}
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm border-2 border-dashed border-emerald-400 z-50 flex flex-col items-center justify-center font-mono pointer-events-none">
          <UploadCloud className="w-16 h-16 text-emerald-400 mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-1">Drop Image to Load</h3>
          <p className="text-xs text-emerald-200">PNG, JPG, WEBP, GIF, SVG accepted</p>
        </div>
      )}
    </div>
  );
};
