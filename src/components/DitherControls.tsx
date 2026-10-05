import React, { useState } from 'react';
import { 
  Sliders, 
  Palette, 
  Layers, 
  Sparkles, 
  Wand2, 
  PenTool, 
  Sun, 
  Activity,
  Droplet,
  Shuffle,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { DitherParams, RenderMode, TonalCount, Colorspace } from '../types/dither';
import { ALGORITHMS } from '../engine/ditherEngine';
import { PALETTE_PRESETS } from '../engine/paletteData';

interface DitherControlsProps {
  params: DitherParams;
  onChange: (updated: Partial<DitherParams>) => void;
  onResetParam: (key: keyof DitherParams) => void;
}

export const DitherControls: React.FC<DitherControlsProps> = ({
  params,
  onChange,
  onResetParam,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'filters' | 'tonal_grade' | 'lines'>('main');

  const DPI_OPTIONS = [75, 100, 200, 300, 450, 600];

  // Group algorithms by category
  const categories = Array.from(new Set(ALGORITHMS.map((a) => a.category)));

  return (
    <aside className="w-80 md:w-88 bg-[#101216] border-l border-[#212630] flex flex-col h-full select-none z-10 text-xs font-mono">
      {/* Tab Switcher */}
      <div className="flex border-b border-[#212630] bg-[#0d0f13]">
        <button
          onClick={() => setActiveTab('main')}
          className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'main'
              ? 'border-cyan-400 text-cyan-400 font-bold bg-[#141820]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Core</span>
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'filters'
              ? 'border-cyan-400 text-cyan-400 font-bold bg-[#141820]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Levels</span>
        </button>
        <button
          onClick={() => setActiveTab('tonal_grade')}
          className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'tonal_grade'
              ? 'border-cyan-400 text-cyan-400 font-bold bg-[#141820]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Color</span>
        </button>
        <button
          onClick={() => setActiveTab('lines')}
          className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'lines'
              ? 'border-cyan-400 text-cyan-400 font-bold bg-[#141820]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Lines</span>
        </button>
      </div>

      {/* Scrollable Control Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ================================================================= */}
        {/* TAB 1: MAIN / CORE PARAMETERS */}
        {/* ================================================================= */}
        {activeTab === 'main' && (
          <div className="space-y-4">
            {/* DPI Quality Segmented Selector */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-zinc-300">DPI QUALITY</span>
                <span className="text-[10px] text-zinc-400">{params.dpi} DPI</span>
              </div>
              <div className="grid grid-cols-6 gap-1 bg-[#161a22] p-1 rounded border border-[#252c3c]">
                {DPI_OPTIONS.map((dpi) => (
                  <button
                    key={dpi}
                    onClick={() => onChange({ dpi })}
                    className={`py-1 rounded text-center text-[10px] font-bold transition ${
                      params.dpi === dpi
                        ? 'bg-cyan-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-[#202636]'
                    }`}
                  >
                    {dpi}
                  </button>
                ))}
              </div>
            </div>

            {/* Algorithm Selector */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-zinc-300">ALGORITHM (49)</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {ALGORITHMS.find((a) => a.id === params.algoId)?.category}
                </span>
              </div>
              <div className="relative">
                <select
                  value={params.algoId}
                  onChange={(e) => onChange({ algoId: Number(e.target.value) })}
                  className="w-full bg-[#161a22] border border-[#2a3140] text-zinc-200 py-2 px-2.5 rounded text-xs focus:outline-none focus:border-cyan-400 appearance-none font-mono cursor-pointer"
                >
                  {categories.map((cat) => (
                    <optgroup key={cat} label={`── ${cat} ──`} className="bg-[#12151c] text-cyan-400 font-bold">
                      {ALGORITHMS.filter((a) => a.category === cat).map((algo) => (
                        <option key={algo.id} value={algo.id} className="text-zinc-200 font-normal">
                          {algo.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 italic leading-tight">
                {ALGORITHMS.find((a) => a.id === params.algoId)?.desc}
              </p>
            </div>

            {/* Render Mode */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-zinc-300">RENDER MODE</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-[#161a22] p-1 rounded border border-[#252c3c]">
                {[
                  { id: 'tonal', label: 'Tonal' },
                  { id: 'color_grade', label: 'Grade' },
                  { id: 'monochrome', label: 'B & W' },
                  { id: 'duotone', label: 'Duo-Tone' },
                  { id: 'cmyk', label: 'CMYK' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onChange({ renderMode: m.id as RenderMode })}
                    className={`py-1 rounded text-center text-[10px] font-bold transition ${
                      params.renderMode === m.id
                        ? 'bg-cyan-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-[#202636]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-zinc-300">SCALE</span>
                <span className="text-[11px] text-cyan-400 font-bold">{params.scale}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={params.scale}
                onChange={(e) => onChange({ scale: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 mt-0.5">
                <span>1 (Fine)</span>
                <span>12</span>
                <span>25 (Coarse)</span>
              </div>
            </div>

            {/* Pattern Scale & Angle for Screens */}
            <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-3">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Pattern Frequency & Rotation</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-300">Pattern Pitch</span>
                  <span className="text-[10px] text-cyan-400">{params.patternScale}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={params.patternScale}
                  onChange={(e) => onChange({ patternScale: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-300">Screen Angle</span>
                  <span className="text-[10px] text-cyan-400">{params.patternAngle}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={params.patternAngle}
                  onChange={(e) => onChange({ patternAngle: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Coverage / Amount & Dot Densities */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-zinc-300">MASTER AMOUNT</span>
                <span className="text-[11px] text-cyan-400 font-bold">{params.amount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.amount}
                onChange={(e) => onChange({ amount: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* White & Black Dot Densities for Monochrome */}
            {params.renderMode === 'monochrome' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-zinc-300">White Dots</span>
                    <span className="text-[10px] text-zinc-400">{params.whiteAmount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.whiteAmount}
                    onChange={(e) => onChange({ whiteAmount: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-zinc-300">Black Dots</span>
                    <span className="text-[10px] text-zinc-400">{params.blackAmount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.blackAmount}
                    onChange={(e) => onChange({ blackAmount: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Threshold & Spread */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-zinc-300">THRESHOLD</span>
                  <span className="text-[10px] text-cyan-400">{params.threshold}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.threshold}
                  onChange={(e) => onChange({ threshold: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-zinc-300">SPREAD</span>
                  <span className="text-[10px] text-cyan-400">{params.strength}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={params.strength}
                  onChange={(e) => onChange({ strength: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Toggle checkboxes: Serpentine & Pixelate */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1e2430]">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={params.serpentine}
                  onChange={(e) => onChange({ serpentine: e.target.checked })}
                  className="rounded bg-[#161a22] border-[#2b3345] text-cyan-400 focus:ring-0"
                />
                <span>Serpentine Scan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={params.pixelate}
                  onChange={(e) => onChange({ pixelate: e.target.checked })}
                  className="rounded bg-[#161a22] border-[#2b3345] text-cyan-400 focus:ring-0"
                />
                <span>Pixelate Block</span>
              </label>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LEVELS & IMAGE PRE-PROCESSING */}
        {/* ================================================================= */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-300">5-POINT LEVELS</span>
                <button
                  onClick={() =>
                    onChange({
                      levels: { blackClip: 0, shadow: 0, mid: 1.0, highlight: 255, whiteClip: 255 },
                    })
                  }
                  className="text-[10px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Shadows */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Input Shadows</span>
                  <span className="text-cyan-400">{params.levels.shadow}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="128"
                  value={params.levels.shadow}
                  onChange={(e) =>
                    onChange({
                      levels: { ...params.levels, shadow: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Midtone Gamma */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Midtone (Gamma)</span>
                  <span className="text-cyan-400">{params.levels.mid.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={params.levels.mid}
                  onChange={(e) =>
                    onChange({
                      levels: { ...params.levels, mid: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Highlights */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Input Highlights</span>
                  <span className="text-cyan-400">{params.levels.highlight}</span>
                </div>
                <input
                  type="range"
                  min="128"
                  max="255"
                  value={params.levels.highlight}
                  onChange={(e) =>
                    onChange({
                      levels: { ...params.levels, highlight: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Sharpening */}
            <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-3">
              <span className="text-[11px] font-bold text-zinc-300">SHARPEN PASS</span>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Strength</span>
                  <span className="text-cyan-400">{params.sharpenStrength}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={params.sharpenStrength}
                  onChange={(e) => onChange({ sharpenStrength: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Radius</span>
                  <span className="text-cyan-400">{params.sharpenRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.sharpenRadius}
                  onChange={(e) => onChange({ sharpenRadius: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Denoise & Noise */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-zinc-300">DENOISE | NOISE</span>
                <span className="text-[11px] text-cyan-400 font-bold">{params.noise}</span>
              </div>
              <input
                type="range"
                min="-25"
                max="50"
                value={params.noise}
                onChange={(e) => onChange({ noise: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 mt-0.5">
                <span>-25 (Denoise)</span>
                <span>0</span>
                <span>+50 (Film Grain)</span>
              </div>
            </div>

            {/* Blur */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-zinc-300">PRE-DITHER BLUR</span>
                <span className="text-[11px] text-cyan-400 font-bold">{params.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={params.blur}
                onChange={(e) => onChange({ blur: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: TONAL & COLOR CONTROLS */}
        {/* ================================================================= */}
        {activeTab === 'tonal_grade' && (
          <div className="space-y-4">
            {params.renderMode === 'tonal' ? (
              /* TONAL MODE MAPPING (1, 2, or 3 Colors) */
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-zinc-300 mb-1.5 block">TONAL BANDS</span>
                  <div className="grid grid-cols-3 gap-1 bg-[#161a22] p-1 rounded border border-[#252c3c]">
                    {([1, 2, 3] as TonalCount[]).map((count) => (
                      <button
                        key={count}
                        onClick={() => onChange({ tonalCount: count })}
                        className={`py-1 text-center font-bold rounded transition ${
                          params.tonalCount === count
                            ? 'bg-cyan-500 text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {count} Color{count > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlights Band */}
                <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-300">HIGHLIGHTS</span>
                    <input
                      type="color"
                      value={params.highlightColor}
                      onChange={(e) => onChange({ highlightColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border border-[#3b4356] bg-transparent"
                    />
                  </div>
                  {params.tonalCount > 1 && (
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Threshold</span>
                        <span className="text-cyan-400">{params.highlightThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={params.highlightThreshold}
                        onChange={(e) => onChange({ highlightThreshold: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Midtones Band (if 3 color) */}
                {params.tonalCount === 3 && (
                  <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-300">MIDTONES</span>
                      <input
                        type="color"
                        value={params.midtoneColor}
                        onChange={(e) => onChange({ midtoneColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-[#3b4356] bg-transparent"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Threshold</span>
                        <span className="text-cyan-400">{params.midtoneThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={params.midtoneThreshold}
                        onChange={(e) => onChange({ midtoneThreshold: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Shadows Band (if 2 or 3 color) */}
                {params.tonalCount >= 2 && (
                  <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-300">SHADOWS</span>
                      <input
                        type="color"
                        value={params.shadowColor}
                        onChange={(e) => onChange({ shadowColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-[#3b4356] bg-transparent"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Threshold</span>
                        <span className="text-cyan-400">{params.shadowThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={params.shadowThreshold}
                        onChange={(e) => onChange({ shadowThreshold: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Background & Knockout Mode */}
                <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-zinc-300">BACKGROUND</span>
                      <p className="text-[9px] text-zinc-400">Substrate color</p>
                    </div>
                    <input
                      type="color"
                      value={params.backgroundColor}
                      onChange={(e) => onChange({ backgroundColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border border-[#3b4356] bg-transparent"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300 pt-1 border-t border-[#1e2430]">
                    <input
                      type="checkbox"
                      checked={params.knockoutBg}
                      onChange={(e) => onChange({ knockoutBg: e.target.checked })}
                      className="rounded bg-[#161a22] border-[#2b3345] text-cyan-400 focus:ring-0"
                    />
                    <span>Knockout Background (Transparent)</span>
                  </label>
                </div>
              </div>
            ) : (
              /* COLOR GRADE / INDEXED COLOR */
              <div className="space-y-4">
                {/* Colorspace */}
                <div>
                  <span className="text-[11px] font-bold text-zinc-300 mb-1.5 block">COLORSPACE</span>
                  <div className="grid grid-cols-3 gap-1 bg-[#161a22] p-1 rounded border border-[#252c3c]">
                    {(['gray', 'rgb', 'indexed'] as Colorspace[]).map((cs) => (
                      <button
                        key={cs}
                        onClick={() => onChange({ colorspace: cs })}
                        className={`py-1 text-center font-bold rounded uppercase transition ${
                          params.colorspace === cs
                            ? 'bg-cyan-500 text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cs}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Palette Selector */}
                {params.colorspace === 'indexed' && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-zinc-300 mb-1 block">COLOR PALETTE</span>
                      <select
                        value={params.palettePreset}
                        onChange={(e) => onChange({ palettePreset: e.target.value, customPalette: [] })}
                        className="w-full bg-[#161a22] border border-[#2a3140] text-zinc-200 py-1.5 px-2 rounded text-xs focus:outline-none focus:border-cyan-400 font-mono"
                      >
                        {PALETTE_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.colors.length})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Palette Swatches */}
                    <div>
                      <span className="text-[10px] text-zinc-400 mb-1 block">Active Swatches</span>
                      <div className="flex flex-wrap gap-1 p-2 bg-[#161a22] rounded border border-[#252c3c]">
                        {(
                          params.customPalette.length > 0
                            ? params.customPalette
                            : (PALETTE_PRESETS.find((p) => p.id === params.palettePreset)?.colors || [])
                        )
                          .slice(0, params.indexedColorCount)
                          .map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border border-white/20 shadow-sm relative group cursor-pointer"
                              style={{ backgroundColor: color }}
                            >
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  const current = [
                                    ...(params.customPalette.length > 0
                                      ? params.customPalette
                                      : (PALETTE_PRESETS.find((p) => p.id === params.palettePreset)?.colors || [])),
                                  ];
                                  current[idx] = e.target.value;
                                  onChange({ customPalette: current });
                                }}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Index Colors Count */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-zinc-300">Index Color Count</span>
                        <span className="text-[10px] text-cyan-400 font-bold">{params.indexedColorCount}</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="32"
                        value={params.indexedColorCount}
                        onChange={(e) => onChange({ indexedColorCount: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Spread */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-zinc-300">Halftone Color Spread</span>
                        <span className="text-[10px] text-cyan-400 font-bold">{params.spread}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={params.spread}
                        onChange={(e) => onChange({ spread: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Hue & Saturation & Invert */}
                <div className="p-3 bg-[#131720] rounded border border-[#212836] space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-zinc-400">Hue Shift</span>
                      <span className="text-cyan-400">{params.hue}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={params.hue}
                      onChange={(e) => onChange({ hue: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-zinc-400">Saturation</span>
                      <span className="text-cyan-400">{params.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={params.saturation}
                      onChange={(e) => onChange({ saturation: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300 pt-1 border-t border-[#1e2430]">
                    <input
                      type="checkbox"
                      checked={params.invert}
                      onChange={(e) => onChange({ invert: e.target.checked })}
                      className="rounded bg-[#161a22] border-[#2b3345] text-cyan-400 focus:ring-0"
                    />
                    <span>Invert Luminance (VHS Negative)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: CONTOUR LINES & PROCEDURAL STRANDS */}
        {/* ================================================================= */}
        {activeTab === 'lines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#212630]">
              <span className="text-[11px] font-bold text-zinc-300">PROCEDURAL LINES</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.lines.enabled}
                  onChange={(e) =>
                    onChange({
                      lines: { ...params.lines, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <p className="text-[10px] text-zinc-400 italic">
              From <code className="text-cyan-400 font-bold">core/lines.cpp</code>: procedural Bezier contour strands hugging high-contrast image gradients.
            </p>

            <div className={`space-y-3 ${!params.lines.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* Line Color */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-300">Strand Color</span>
                <input
                  type="color"
                  value={params.lines.color}
                  onChange={(e) =>
                    onChange({
                      lines: { ...params.lines, color: e.target.value },
                    })
                  }
                  className="w-6 h-6 rounded cursor-pointer border border-[#3b4356] bg-transparent"
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-300">Strand Count</span>
                  <span className="text-cyan-400 font-bold">{params.lines.amount}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1200"
                  step="50"
                  value={params.lines.amount}
                  onChange={(e) =>
                    onChange({
                      lines: { ...params.lines, amount: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Length */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-300">Strand Length</span>
                  <span className="text-cyan-400 font-bold">{params.lines.length}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={params.lines.length}
                  onChange={(e) =>
                    onChange({
                      lines: { ...params.lines, length: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Curvature */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-300">Curvature / Bend</span>
                  <span className="text-cyan-400 font-bold">{params.lines.curvature}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.lines.curvature}
                  onChange={(e) =>
                    onChange({
                      lines: { ...params.lines, curvature: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Edge Guided & Duplicate checkboxes */}
              <div className="space-y-2 pt-2 border-t border-[#1e2430]">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={params.lines.edgeGuided}
                    onChange={(e) =>
                      onChange({
                        lines: { ...params.lines, edgeGuided: e.target.checked },
                      })
                    }
                    className="rounded bg-[#161a22] border-[#2b3345] text-cyan-400 focus:ring-0"
                  />
                  <span>Edge-Guided Contour Following</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={params.lines.duplicate}
                    onChange={(e) =>
                      onChange({
                        lines: { ...params.lines, duplicate: e.target.checked },
                      })
                    }
                    className="rounded bg-[#161a22] border-[#2b3345] text-cyan-400 focus:ring-0"
                  />
                  <span>Duplicate Companion Lines</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
