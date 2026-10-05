import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Upload,
  Download,
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  Eye,
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
  Check,
  ChevronDown,
  ChevronRight,
  Wand2,
} from 'lucide-react';
import {
  clampf,
  copyFloatImage,
  createFloatImage,
  DitherKind,
  DitherParams,
  FloatImage,
  hexToRgb01,
  LinesColorMode,
  LinesEdgeDir,
  LinesParams,
  rgb01ToHex,
} from './engine/core';
import { ALGOS, render_dither } from './engine/dither';
import { render_lines } from './engine/lines';
import {
  DEFAULT_DITHER,
  DEFAULT_LINES,
  SAMPLE_SCENES,
  STUDIO_PRESETS,
  StudioPreset,
} from './engine/presets';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  defaultValue,
  onChange,
  disabled = false,
}) => {
  const pct = clampf(((value - min) / (max - min)) * 100, 0, 100);
  return (
    <div
      className={`group flex flex-col gap-1 py-1.5 ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-center justify-between text-[11px]">
        <span
          className="text-zinc-400 font-medium tracking-wide select-none cursor-pointer hover:text-zinc-200 transition-colors"
          title={defaultValue !== undefined ? 'Double-click to reset' : undefined}
          onDoubleClick={() => {
            if (defaultValue !== undefined) onChange(defaultValue);
          }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Number(value.toFixed(step < 1 ? 2 : 0))}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) onChange(clampf(v, min, max));
            }}
            className="w-14 bg-[#14161b] border border-zinc-800/90 rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-amber-400 focus:outline-none focus:border-amber-500/60"
          />
          {unit && <span className="text-[10px] text-zinc-500 font-mono w-3">{unit}</span>}
        </div>
      </div>
      <div className="relative flex items-center h-4">
        <div className="w-full h-1.5 bg-[#16181e] rounded-full overflow-hidden border border-zinc-800/80">
          <div
            className="h-full bg-gradient-to-r from-amber-600/80 to-amber-400"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        />
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  rightToggle?: {
    checked: boolean;
    onChange: (v: boolean) => void;
  };
  children: React.ReactNode;
}

const SectionGroup: React.FC<SectionProps> = ({
  title,
  badge,
  defaultOpen = true,
  rightToggle,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800/80">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#12141a] hover:bg-[#161921] cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {badge}
            </span>
          )}
        </div>
        {rightToggle && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              rightToggle.onChange(!rightToggle.checked);
            }}
            className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
              rightToggle.checked ? 'bg-amber-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-zinc-950 transition-transform ${
                rightToggle.checked ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        )}
      </div>
      {open && <div className="px-3.5 py-2.5 bg-[#0e1015] space-y-1">{children}</div>}
    </div>
  );
};

export function App() {
  const [dither, setDither] = useState<DitherParams>(DEFAULT_DITHER);
  const [lines, setLines] = useState<LinesParams>(DEFAULT_LINES);
  const [activePresetId, setActivePresetId] = useState<string>('ae-default');
  const [sceneId, setSceneId] = useState<string>('sculpted-bust');
  const [customImageName, setCustomImageName] = useState<string | null>(null);
  const [resolution, setResolution] = useState<number>(560);

  // Viewport & Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeSec, setTimeSec] = useState<number>(0);
  const [splitCompare, setSplitCompare] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50);
  const [showOriginalHold, setShowOriginalHold] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [renderMs, setRenderMs] = useState<number>(0);
  const [enableDitherStage, setEnableDitherStage] = useState<boolean>(true);

  const srcImageRef = useRef<FloatImage | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Build or rebuild source FloatImage when scene or resolution changes
  useEffect(() => {
    if (sceneId === 'custom') return;
    const found = SAMPLE_SCENES.find((s) => s.id === sceneId) || SAMPLE_SCENES[0];
    srcImageRef.current = found.render(resolution, resolution);
    setCustomImageName(null);
  }, [sceneId, resolution]);

  // Handle custom image upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = resolution;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1.5);
        const w = Math.max(64, Math.round(img.width * scale));
        const h = Math.max(64, Math.round(img.height * scale));
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const ctx = off.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const fImg = createFloatImage(w, h);
        for (let i = 0; i < imgData.data.length; i += 4) {
          fImg.px[i] = imgData.data[i] / 255;
          fImg.px[i + 1] = imgData.data[i + 1] / 255;
          fImg.px[i + 2] = imgData.data[i + 2] / 255;
          fImg.px[i + 3] = imgData.data[i + 3] / 255;
        }
        srcImageRef.current = fImg;
        setSceneId('custom');
        setCustomImageName(file.name);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Animation loop at 24fps (matching After Effects FrameCtx default)
  useEffect(() => {
    if (!isPlaying) return;
    let animId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      if (dt >= 1 / 24) {
        setTimeSec((t) => t + dt);
        last = now;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Unified Render Pipeline (matching unified_render in ae/MajeedDither.cpp)
  const executeRender = useCallback(() => {
    const src = srcImageRef.current;
    const canvas = canvasRef.current;
    if (!src || !canvas) return;

    const t0 = performance.now();
    const W = src.w;
    const H = src.h;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    const bufA = createFloatImage(W, H);
    const bufFX = createFloatImage(W, H);
    copyFloatImage(src, bufA);

    const frameCtx = { timeSec, fps: 24.0 };

    if (!showOriginalHold) {
      // 1. DITHER STAGE
      if (enableDitherStage) {
        render_dither(bufA, bufFX, dither, frameCtx);
        copyFloatImage(bufFX, bufA);
      }

      // 2. LINES STAGE
      if (lines.enabled) {
        render_lines(bufA, bufFX, lines, frameCtx);
        copyFloatImage(bufFX, bufA);
      }
    }

    const ctx = canvas.getContext('2d')!;
    const outData = ctx.createImageData(W, H);
    const dstU8 = outData.data;
    const splitX = splitCompare ? Math.floor((splitPos / 100) * W) : W;

    for (let y = 0; y < H; ++y) {
      for (let x = 0; x < W; ++x) {
        const i = (y * W + x) * 4;
        const sourceBuf = splitCompare && x > splitX ? src.px : bufA.px;
        dstU8[i] = Math.round(clampf(sourceBuf[i], 0, 1) * 255);
        dstU8[i + 1] = Math.round(clampf(sourceBuf[i + 1], 0, 1) * 255);
        dstU8[i + 2] = Math.round(clampf(sourceBuf[i + 2], 0, 1) * 255);
        dstU8[i + 3] = Math.round(clampf(sourceBuf[i + 3], 0, 1) * 255);
      }
    }

    ctx.putImageData(outData, 0, 0);
    const t1 = performance.now();
    setRenderMs(Math.round(t1 - t0));
  }, [
    dither,
    lines,
    timeSec,
    splitCompare,
    splitPos,
    showOriginalHold,
    enableDitherStage,
    sceneId,
    customImageName,
    resolution,
  ]);

  useEffect(() => {
    executeRender();
  }, [executeRender]);

  const applyPreset = (preset: StudioPreset) => {
    setActivePresetId(preset.id);
    setDither((prev) => ({ ...prev, ...preset.dither }));
    setLines((prev) => ({ ...prev, ...preset.lines }));
  };

  const resetAll = () => {
    setActivePresetId('ae-default');
    setDither(DEFAULT_DITHER);
    setLines(DEFAULT_LINES);
    setEnableDitherStage(true);
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `YMDithers_${ALGOS[dither.algo].name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const currentAlgo = ALGOS[dither.algo] || ALGOS[16];
  const currentFrame = Math.floor(timeSec * 24.0 + 0.5);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090a0d] text-zinc-200 select-none overflow-hidden">
      {/* Top Studio Header */}
      <header className="h-13 border-b border-zinc-800/90 bg-[#101217] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* YMDithers Geometric Brand Emblem */}
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/40 flex items-center justify-center">
            <svg viewBox="0 0 48.6 48.3" className="w-5 h-5 fill-amber-400">
              <path d="M20.3,12.3h8v8h-8V12.3z M0.2,0.1v48.2h48.2V0.1H0.2z M44.2,12.3l-8,8h-8v8h8l8,8v8h-8l-8-8v-8h-8v8l-8,8h-8v-8l8-8h8v-8h-8l-8-8v-8h8l8,8v-8h8v8l8-8h8L44.2,12.3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm text-zinc-100">YMDITHERS</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                AE 23.2.1 Native Core
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              49 Dither &amp; Halftone Engines + Canny NMS Contour Strands
            </p>
          </div>
        </div>

        {/* Center Source & Preset Controls */}
        <div className="flex items-center gap-2">
          {/* Sample Scene Picker */}
          <div className="flex items-center bg-[#151820] border border-zinc-800 rounded-md p-0.5">
            {SAMPLE_SCENES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSceneId(s.id)}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  sceneId === s.id
                    ? 'bg-zinc-800 text-amber-300 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s.name.split(' ')[0]}
              </button>
            ))}
            {customImageName && (
              <button
                onClick={() => setSceneId('custom')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer max-w-28 truncate ${
                  sceneId === 'custom'
                    ? 'bg-zinc-800 text-amber-300 font-medium'
                    : 'text-zinc-400'
                }`}
              >
                {customImageName}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#151820] hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors cursor-pointer"
            title="Load Custom Image"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Image</span>
          </button>

          {/* Resolution selector */}
          <select
            value={resolution}
            onChange={(e) => setResolution(Number(e.target.value))}
            className="bg-[#151820] border border-zinc-800 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500/60"
            title="Internal Render Resolution"
          >
            <option value={420}>420px (Fast)</option>
            <option value={560}>560px (HD)</option>
            <option value={720}>720px (Print)</option>
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#151820] hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Reset all parameters to YMDithers.aex default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Preset & Algorithm Quick-Browser */}
        <aside className="w-72 border-r border-zinc-800/90 bg-[#0d0f14] flex flex-col shrink-0">
          {/* Curated Studio Presets */}
          <div className="p-3 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Effect Presets
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {STUDIO_PRESETS.length} Ready
              </span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {STUDIO_PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`w-full text-left p-2 rounded-md border transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/10 border-amber-500/50 text-zinc-100'
                        : 'bg-[#13161d] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{preset.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-amber-400/90 border border-zinc-800">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 49 Dither Algorithms Browser */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 py-2.5 border-b border-zinc-800/80 flex items-center justify-between bg-[#111319]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                49 Native Algorithms
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                #{dither.algo + 1}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {(['Error Diffusion', 'Ordered & Noise', 'Halftone & Screen'] as const).map(
                (category) => {
                  const items = ALGOS.map((a, idx) => ({ ...a, idx })).filter(
                    (a) => a.category === category
                  );
                  return (
                    <div key={category}>
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        {category} ({items.length})
                      </div>
                      <div className="space-y-0.5 mt-0.5">
                        {items.map((item) => {
                          const selected = dither.algo === item.idx;
                          return (
                            <button
                              key={item.idx}
                              onClick={() =>
                                setDither((d) => ({ ...d, algo: item.idx }))
                              }
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
                                selected
                                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                                  : 'text-zinc-300 hover:bg-[#171a22]'
                              }`}
                            >
                              <span className="truncate">{item.name}</span>
                              {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </aside>

        {/* Center Interactive Viewport */}
        <main
          className="flex-1 flex flex-col bg-[#08090c] relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileUpload(f);
          }}
        >
          {/* Top Viewport Info Pill Bar */}
          <div className="h-10 border-b border-zinc-800/80 bg-[#0d0f14]/90 px-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-amber-400 font-medium">
                {currentAlgo.name}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 text-[11px]">{currentAlgo.desc}</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
              <span>
                {srcImageRef.current?.w || resolution}×{srcImageRef.current?.h || resolution}px
              </span>
              <span className="text-zinc-700">|</span>
              <span>Frame {currentFrame}</span>
              <span className="text-zinc-700">|</span>
              <span className="text-emerald-400">{renderMs} ms</span>
            </div>
          </div>

          {/* Canvas Stage */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative">
            <div
              className="relative shadow-2xl border border-zinc-800/90 bg-zinc-950 transition-transform duration-150"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <canvas
                ref={canvasRef}
                className="block max-w-[72vh] max-h-[72vh] w-auto h-auto"
                style={{ imageRendering: zoom > 1.25 ? 'pixelated' : 'auto' }}
              />

              {/* Split Wipe Divider Handle */}
              {splitCompare && (
                <div
                  className="absolute inset-y-0 w-0.5 bg-amber-400 pointer-events-none"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-amber-400/50 text-[9px] font-mono text-amber-300 whitespace-nowrap">
                    FX / SOURCE
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Timeline & Viewport Transport Bar */}
          <div className="h-12 border-t border-zinc-800/90 bg-[#101217] px-4 flex items-center justify-between">
            {/* Transport controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                  isPlaying
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-[#171a22] hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause (24 fps)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Temporal Anim</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setTimeSec((t) => t + 1 / 24)}
                className="px-2.5 py-1.5 rounded bg-[#171a22] hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 cursor-pointer"
                title="Step +1 Frame"
              >
                +1F
              </button>

              <span className="text-[11px] font-mono text-zinc-500 ml-1">
                t = {timeSec.toFixed(2)}s
              </span>
            </div>

            {/* Split & Hold Original */}
            <div className="flex items-center gap-3">
              {splitCompare && (
                <div className="flex items-center gap-2 w-36">
                  <span className="text-[10px] font-mono text-zinc-400">Wipe</span>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-ew-resize"
                  />
                </div>
              )}

              <button
                onClick={() => setSplitCompare(!splitCompare)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs border cursor-pointer transition-colors ${
                  splitCompare
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-[#171a22] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Split Compare</span>
              </button>

              <button
                onMouseDown={() => setShowOriginalHold(true)}
                onMouseUp={() => setShowOriginalHold(false)}
                onMouseLeave={() => setShowOriginalHold(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs border cursor-pointer transition-colors ${
                  showOriginalHold
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-semibold'
                    : 'bg-[#171a22] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hold Original</span>
              </button>

              {/* Zoom controls */}
              <div className="flex items-center bg-[#171a22] border border-zinc-800 rounded">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span
                  onClick={() => setZoom(1)}
                  className="px-2 text-[11px] font-mono text-zinc-300 cursor-pointer"
                  title="Click to reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right After Effects Effect Controls Panel */}
        <aside className="w-88 border-l border-zinc-800/90 bg-[#0e1015] flex flex-col shrink-0">
          <div className="px-3.5 py-2.5 border-b border-zinc-800/90 bg-[#12141a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Effect Controls // YMDithers
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">32-bit Float</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
            {/* ============================================================ */}
            {/* GROUP 1: DITHER                                              */}
            {/* ============================================================ */}
            <SectionGroup
              title="1. Dither & Halftone"
              badge={currentAlgo.category.split(' ')[0]}
              defaultOpen={true}
              rightToggle={{
                checked: enableDitherStage,
                onChange: setEnableDitherStage,
              }}
            >
              {/* Color Mode */}
              <div className="py-1.5">
                <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                  Color Mode
                </label>
                <select
                  value={dither.mode}
                  onChange={(e) =>
                    setDither((d) => ({ ...d, mode: Number(e.target.value) }))
                  }
                  className="w-full bg-[#151820] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60"
                >
                  <option value={0}>Preserve Original Colors (RGB)</option>
                  <option value={1}>Monochrome (Black &amp; White)</option>
                  <option value={2}>Custom Duo-Tone (Dark / Light)</option>
                  <option value={3}>CMYK Halftone Separation (15°/75°/0°/45°)</option>
                  <option value={4}>Tonal Tri-Tone Ramp (Shadow / Mid / High)</option>
                </select>
              </div>

              {/* Duo-Tone / Tri-Tone Color Swatches */}
              {(dither.mode === 2 || dither.mode === 4) && (
                <div className="grid grid-cols-3 gap-2 py-1.5 bg-[#13161d] px-2.5 rounded border border-zinc-800/80">
                  <div>
                    <span className="block text-[10px] text-zinc-400 mb-1">Shadows</span>
                    <input
                      type="color"
                      value={rgb01ToHex(dither.dark)}
                      onChange={(e) =>
                        setDither((d) => ({ ...d, dark: hexToRgb01(e.target.value) }))
                      }
                      className="w-full h-6 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  {dither.mode === 4 && (
                    <div>
                      <span className="block text-[10px] text-zinc-400 mb-1">Midtones</span>
                      <input
                        type="color"
                        value={rgb01ToHex(dither.mid)}
                        onChange={(e) =>
                          setDither((d) => ({ ...d, mid: hexToRgb01(e.target.value) }))
                        }
                        className="w-full h-6 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                  )}
                  <div>
                    <span className="block text-[10px] text-zinc-400 mb-1">Highlights</span>
                    <input
                      type="color"
                      value={rgb01ToHex(dither.light)}
                      onChange={(e) =>
                        setDither((d) => ({ ...d, light: hexToRgb01(e.target.value) }))
                      }
                      className="w-full h-6 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              )}

              <SliderRow
                label="Amount (Dot Density)"
                value={dither.amount}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={100}
                onChange={(v) => setDither((d) => ({ ...d, amount: v }))}
              />

              {dither.mode === 1 && (
                <div className="pl-2 border-l-2 border-amber-500/30 space-y-0.5">
                  <SliderRow
                    label="White Amount"
                    value={dither.whiteAmount}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                    defaultValue={100}
                    onChange={(v) => setDither((d) => ({ ...d, whiteAmount: v }))}
                  />
                  <SliderRow
                    label="Black Amount"
                    value={dither.blackAmount}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                    defaultValue={100}
                    onChange={(v) => setDither((d) => ({ ...d, blackAmount: v }))}
                  />
                </div>
              )}

              <SliderRow
                label="Levels (Tones)"
                value={dither.levels}
                min={2}
                max={32}
                step={1}
                defaultValue={2}
                onChange={(v) => setDither((d) => ({ ...d, levels: v }))}
              />

              <SliderRow
                label="Scale (Pixel Size)"
                value={dither.size}
                min={1}
                max={16}
                step={0.25}
                unit="px"
                defaultValue={1}
                onChange={(v) => setDither((d) => ({ ...d, size: v }))}
              />

              <SliderRow
                label="Threshold (Density Bias)"
                value={dither.threshold}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={50}
                onChange={(v) => setDither((d) => ({ ...d, threshold: v }))}
              />

              <SliderRow
                label="Strength (Spread)"
                value={dither.strength}
                min={0}
                max={200}
                step={1}
                unit="%"
                defaultValue={100}
                onChange={(v) => setDither((d) => ({ ...d, strength: v }))}
              />

              {currentAlgo.kind === DitherKind.DK_SCREEN && (
                <div className="pl-2 border-l-2 border-amber-500/30 space-y-0.5">
                  <SliderRow
                    label="Pattern Scale"
                    value={dither.patternScale}
                    min={25}
                    max={250}
                    step={1}
                    unit="%"
                    defaultValue={100}
                    onChange={(v) => setDither((d) => ({ ...d, patternScale: v }))}
                  />
                  <SliderRow
                    label="Pattern Angle"
                    value={dither.patternAngle}
                    min={-180}
                    max={180}
                    step={1}
                    unit="°"
                    defaultValue={0}
                    onChange={(v) => setDither((d) => ({ ...d, patternAngle: v }))}
                  />
                </div>
              )}

              <SliderRow
                label="Contrast"
                value={dither.contrast}
                min={0}
                max={250}
                step={1}
                unit="%"
                defaultValue={100}
                onChange={(v) => setDither((d) => ({ ...d, contrast: v }))}
              />

              <SliderRow
                label="Brightness"
                value={dither.brightness}
                min={-100}
                max={100}
                step={1}
                unit="%"
                defaultValue={0}
                onChange={(v) => setDither((d) => ({ ...d, brightness: v }))}
              />

              <SliderRow
                label="Randomness (Jitter)"
                value={dither.noise}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={0}
                onChange={(v) => setDither((d) => ({ ...d, noise: v }))}
              />

              <SliderRow
                label="Dither Seed"
                value={dither.seed}
                min={0}
                max={1000}
                step={1}
                defaultValue={0}
                onChange={(v) => setDither((d) => ({ ...d, seed: v }))}
              />

              {/* Boolean Checkboxes */}
              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {[
                  {
                    key: 'serpentine',
                    label: 'Serpentine Scan',
                    val: dither.serpentine,
                  },
                  {
                    key: 'linear',
                    label: 'Linear Gamma',
                    val: dither.linear,
                  },
                  {
                    key: 'pixelate',
                    label: 'Pixelate Blocks',
                    val: dither.pixelate,
                  },
                  {
                    key: 'invert',
                    label: 'Invert Input',
                    val: dither.invert,
                  },
                  {
                    key: 'animate',
                    label: 'Animate Noise',
                    val: dither.animate,
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#14171f] border border-zinc-800/80 text-[11px] text-zinc-300 cursor-pointer hover:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) =>
                        setDither((d) => ({ ...d, [item.key]: e.target.checked }))
                      }
                      className="accent-amber-400 rounded"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                ))}
              </div>
            </SectionGroup>

            {/* ============================================================ */}
            {/* GROUP 2: LINES & CONTOUR STRANDS                             */}
            {/* ============================================================ */}
            <SectionGroup
              title="2. Procedural & Contour Lines"
              badge={lines.objectMode ? 'CANNY NMS' : 'PROCEDURAL'}
              defaultOpen={true}
              rightToggle={{
                checked: lines.enabled,
                onChange: (v) => setLines((l) => ({ ...l, enabled: v })),
              }}
            >
              <SliderRow
                label="Lines Amount (Strands)"
                value={lines.amount}
                min={0}
                max={2500}
                step={10}
                defaultValue={600}
                onChange={(v) => setLines((l) => ({ ...l, amount: v }))}
              />

              <SliderRow
                label="Line Length"
                value={lines.length}
                min={4}
                max={200}
                step={1}
                unit="px"
                defaultValue={50}
                onChange={(v) => setLines((l) => ({ ...l, length: v }))}
              />

              <SliderRow
                label="Length Randomness"
                value={lines.lengthRand}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={40}
                onChange={(v) => setLines((l) => ({ ...l, lengthRand: v }))}
              />

              <SliderRow
                label="Line Thickness"
                value={lines.width}
                min={0.2}
                max={6}
                step={0.1}
                unit="px"
                defaultValue={1.0}
                onChange={(v) => setLines((l) => ({ ...l, width: v }))}
              />

              <SliderRow
                label="Thickness Randomness"
                value={lines.widthRand}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={30}
                onChange={(v) => setLines((l) => ({ ...l, widthRand: v }))}
              />

              {/* Color Mode & Swatch */}
              <div className="flex items-center gap-2 py-1.5">
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Line Color Mode
                  </label>
                  <select
                    value={lines.colorMode}
                    onChange={(e) =>
                      setLines((l) => ({
                        ...l,
                        colorMode: Number(e.target.value) as LinesColorMode,
                      }))
                    }
                    className="w-full bg-[#151820] border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200"
                  >
                    <option value={LinesColorMode.LCM_SINGLE}>Single Color</option>
                    <option value={LinesColorMode.LCM_SAMPLED}>Sampled from Image</option>
                    <option value={LinesColorMode.LCM_RANDOM}>Random Palette</option>
                  </select>
                </div>
                {lines.colorMode === LinesColorMode.LCM_SINGLE && (
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={rgb01ToHex(lines.color)}
                      onChange={(e) =>
                        setLines((l) => ({ ...l, color: hexToRgb01(e.target.value) }))
                      }
                      className="w-10 h-7 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                )}
              </div>

              <SliderRow
                label="Lines Opacity"
                value={lines.opacity}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={90}
                onChange={(v) => setLines((l) => ({ ...l, opacity: v }))}
              />

              {/* Sub-group: [x] Object & Edges */}
              <div className="mt-2 p-2.5 rounded-md bg-[#13161e] border border-zinc-800/90 space-y-1">
                <label className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    [x] Object (Contour Following)
                  </span>
                  <input
                    type="checkbox"
                    checked={lines.objectMode}
                    onChange={(e) =>
                      setLines((l) => ({ ...l, objectMode: e.target.checked }))
                    }
                    className="accent-amber-400"
                  />
                </label>

                {lines.objectMode ? (
                  <>
                    <SliderRow
                      label="Edge Threshold"
                      value={lines.edgeThreshold}
                      min={5}
                      max={85}
                      step={1}
                      defaultValue={25}
                      onChange={(v) => setLines((l) => ({ ...l, edgeThreshold: v }))}
                    />
                    <SliderRow
                      label="Edge Sensitivity"
                      value={lines.edgeSensitivity}
                      min={10}
                      max={100}
                      step={1}
                      defaultValue={75}
                      onChange={(v) => setLines((l) => ({ ...l, edgeSensitivity: v }))}
                    />
                    <SliderRow
                      label="Edge Offset (0 = Zero Gap)"
                      value={lines.edgeOffset}
                      min={-15}
                      max={15}
                      step={0.5}
                      unit="px"
                      defaultValue={0}
                      onChange={(v) => setLines((l) => ({ ...l, edgeOffset: v }))}
                    />
                  </>
                ) : (
                  <>
                    <SliderRow
                      label="Direction Angle"
                      value={lines.angle}
                      min={-180}
                      max={180}
                      step={1}
                      unit="°"
                      defaultValue={0}
                      onChange={(v) => setLines((l) => ({ ...l, angle: v }))}
                    />
                    <SliderRow
                      label="Direction Randomness"
                      value={lines.angleRand}
                      min={0}
                      max={180}
                      step={1}
                      unit="°"
                      defaultValue={180}
                      onChange={(v) => setLines((l) => ({ ...l, angleRand: v }))}
                    />
                  </>
                )}
              </div>

              {/* Sub-group: [x] Hand Made Lines */}
              <div className="mt-2 p-2.5 rounded-md bg-[#13161e] border border-zinc-800/90 space-y-1">
                <label className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-200">
                    [x] Hand Made Lines
                  </span>
                  <input
                    type="checkbox"
                    checked={lines.handMade}
                    onChange={(e) =>
                      setLines((l) => ({ ...l, handMade: e.target.checked }))
                    }
                    className="accent-amber-400"
                  />
                </label>
                <SliderRow
                  label="Curve (Organic Wobble)"
                  value={lines.curve}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  defaultValue={30}
                  disabled={!lines.handMade}
                  onChange={(v) => setLines((l) => ({ ...l, curve: v }))}
                />
              </div>

              {/* Sub-group: [x] Duplicate Lines */}
              <div className="mt-2 p-2.5 rounded-md bg-[#13161e] border border-zinc-800/90 space-y-1">
                <label className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-200">
                    [x] Duplicate Companion Lines
                  </span>
                  <input
                    type="checkbox"
                    checked={lines.duplicate}
                    onChange={(e) =>
                      setLines((l) => ({ ...l, duplicate: e.target.checked }))
                    }
                    className="accent-amber-400"
                  />
                </label>
                {lines.duplicate && (
                  <>
                    <SliderRow
                      label="Duplicate Count"
                      value={lines.duplicateCount}
                      min={1}
                      max={4}
                      step={1}
                      defaultValue={1}
                      onChange={(v) => setLines((l) => ({ ...l, duplicateCount: v }))}
                    />
                    <SliderRow
                      label="Duplicate Offset"
                      value={lines.duplicateOffset}
                      min={0.5}
                      max={20}
                      step={0.5}
                      unit="px"
                      defaultValue={2.5}
                      onChange={(v) => setLines((l) => ({ ...l, duplicateOffset: v }))}
                    />
                    <SliderRow
                      label="Duplicate Width"
                      value={lines.duplicateWidth}
                      min={0.2}
                      max={5}
                      step={0.1}
                      unit="px"
                      defaultValue={0.8}
                      onChange={(v) => setLines((l) => ({ ...l, duplicateWidth: v }))}
                    />
                    <SliderRow
                      label="Duplicate Opacity"
                      value={lines.duplicateOpacity}
                      min={0}
                      max={100}
                      step={1}
                      unit="%"
                      defaultValue={75}
                      onChange={(v) => setLines((l) => ({ ...l, duplicateOpacity: v }))}
                    />
                  </>
                )}
              </div>

              {/* Sub-group: Lines Animation */}
              <div className="mt-2 p-2.5 rounded-md bg-[#13161e] border border-zinc-800/90 space-y-1">
                <label className="flex items-center justify-between cursor-pointer pb-1 border-b border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-200">
                    Auto Animate Along Contours
                  </span>
                  <input
                    type="checkbox"
                    checked={lines.autoAnim}
                    onChange={(e) =>
                      setLines((l) => ({ ...l, autoAnim: e.target.checked }))
                    }
                    className="accent-amber-400"
                  />
                </label>
                <SliderRow
                  label="Animation Speed"
                  value={lines.motionSpeed}
                  min={0}
                  max={300}
                  step={5}
                  unit="%"
                  defaultValue={100}
                  disabled={!lines.autoAnim}
                  onChange={(v) => setLines((l) => ({ ...l, motionSpeed: v }))}
                />
                <SliderRow
                  label="Random Seed"
                  value={lines.seed}
                  min={0}
                  max={1000}
                  step={1}
                  defaultValue={1}
                  onChange={(v) => setLines((l) => ({ ...l, seed: v }))}
                />
              </div>
            </SectionGroup>
          </div>
        </aside>
      </div>
    </div>
  );
}
export default App;
