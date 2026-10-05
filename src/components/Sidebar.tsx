import React, { useState } from 'react';
import { 
  DitherParams, 
  LinesParams, 
  DitherCategory 
} from '../types/dither';
import { ALGORITHMS } from '../core/ditherEngine';
import { 
  Sliders, 
  Sparkles, 
  ChevronDown, 
  ChevronRight,
  Crosshair,
  Feather,
  Copy
} from 'lucide-react';

interface SidebarProps {
  params: DitherParams;
  onChangeParams: (updater: (prev: DitherParams) => DitherParams) => void;
  linesParams: LinesParams;
  onChangeLines: (updater: (prev: LinesParams) => LinesParams) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  params,
  onChangeParams,
  linesParams,
  onChangeLines,
}) => {
  const [sectionOpen, setSectionOpen] = useState({
    dither: true,
    lines: true,
  });

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateDither = <K extends keyof DitherParams>(key: K, value: DitherParams[K]) => {
    onChangeParams(prev => ({ ...prev, [key]: value }));
  };

  const updateLines = <K extends keyof LinesParams>(key: K, value: LinesParams[K]) => {
    onChangeLines(prev => ({ ...prev, [key]: value }));
  };

  const currentAlgo = ALGORITHMS[Math.min(ALGORITHMS.length - 1, Math.max(0, params.algoId))];

  const categories: DitherCategory[] = ['DIFFUSION', 'ORDERED', 'HALFTONE', 'MODULATION', 'PATTERN', 'OTHER'];
  const algoByCategory = categories.map(cat => ({
    category: cat,
    items: ALGORITHMS.filter(a => a.category === cat)
  }));

  const dpiOptions = [75, 100, 200, 300, 450, 600];

  return (
    <aside className="w-80 md:w-92 bg-[#0f1115] border-r border-[#1f232b] flex flex-col h-full overflow-hidden select-none shrink-0 z-10 font-mono text-xs">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        
        {/* DPI Quality Segmented Bar */}
        <div className="bg-[#14171e] p-2.5 rounded border border-[#222733]">
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 font-semibold">
            <span>DPI QUALITY</span>
            <span className="text-emerald-400">{params.dpi} DPI</span>
          </div>
          <div className="grid grid-cols-6 gap-1 bg-[#0b0c0f] p-1 rounded border border-[#1b1e26]">
            {dpiOptions.map(dpi => (
              <button
                key={dpi}
                onClick={() => updateDither('dpi', dpi)}
                className={`py-1 text-[11px] rounded transition-all font-mono font-medium cursor-pointer ${
                  params.dpi === dpi
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181b22]'
                }`}
              >
                {dpi}
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 1. DITHER MODULE                                                  */}
        {/* ================================================================= */}
        <div className="bg-[#14171e] rounded border border-[#222733] overflow-hidden">
          <button
            onClick={() => toggleSection('dither')}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#171a22] hover:bg-[#1c202a] text-gray-200 font-semibold text-xs tracking-wider transition-colors border-b border-[#222733] cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>DITHER</span>
            </div>
            {sectionOpen.dither ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {sectionOpen.dither && (
            <div className="p-3 space-y-3.5">
              {/* Color Mode Selection: Monochrome vs Preserve RGB */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-semibold">
                  COLOR MODE
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#0b0c0f] p-1 rounded border border-[#1b1e26]">
                  <button
                    onClick={() => updateDither('mode', 'monochrome')}
                    className={`py-1.5 text-[11px] rounded transition-all font-mono font-medium cursor-pointer ${
                      params.mode === 'monochrome'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#181b22]'
                    }`}
                  >
                    Monochrome (B&W)
                  </button>
                  <button
                    onClick={() => updateDither('mode', 'rgb')}
                    className={`py-1.5 text-[11px] rounded transition-all font-mono font-medium cursor-pointer ${
                      params.mode === 'rgb'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#181b22]'
                    }`}
                  >
                    Preserve Colors (RGB)
                  </button>
                </div>
              </div>

              {/* Master Dot Density (Amount) */}
              <div className="p-2.5 bg-[#0b0c0f] rounded border border-[#1f232b] space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-gray-300 font-semibold">
                  <span>AMOUNT (DOT DENSITY)</span>
                  <span className="text-emerald-400 font-bold">{params.amount}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={params.amount}
                  onChange={(e) => updateDither('amount', Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-[10px] text-gray-500 block">
                  Controls density/count of dots — original image emerges naturally between sparse dots.
                </span>
              </div>

              {/* White Amount & Black Amount (Only for Monochrome) */}
              {params.mode === 'monochrome' && (
                <div className="p-2.5 bg-[#0b0c0f] rounded border border-[#1f232b] space-y-2.5">
                  <div className="text-[11px] text-gray-300 font-semibold">
                    POLARITY DENSITY CONTROLS
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                      <span>WHITE AMOUNT (LIGHT DOTS DENSITY)</span>
                      <span className="text-emerald-400 font-bold">{params.whiteAmount}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={params.whiteAmount}
                      onChange={(e) => updateDither('whiteAmount', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                      <span>BLACK AMOUNT (DARK DOTS DENSITY)</span>
                      <span className="text-emerald-400 font-bold">{params.blackAmount}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={params.blackAmount}
                      onChange={(e) => updateDither('blackAmount', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Algorithm Picker */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  ALGORITHM ({ALGORITHMS.length})
                </label>
                <select
                  value={params.algoId}
                  onChange={(e) => updateDither('algoId', Number(e.target.value))}
                  className="w-full bg-[#0d0f14] text-gray-200 border border-[#2b303c] rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {algoByCategory.map(group => (
                    <optgroup key={group.category} label={`─── ${group.category} ───`} className="bg-[#14171e] text-emerald-400 font-bold">
                      {group.items.map(a => (
                        <option key={a.id} value={a.id} className="text-gray-200 bg-[#0d0f14]">
                          {a.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-500 italic">
                  {currentAlgo.description}
                </p>
              </div>

              {/* Scale (Pixel Size) */}
              <div>
                <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                  <span>SCALE (PIXEL SIZE)</span>
                  <span className="text-emerald-400">{params.scale}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={params.scale}
                  onChange={(e) => updateDither('scale', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Threshold / Density Bias */}
              <div>
                <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                  <span>THRESHOLD (DENSITY BIAS)</span>
                  <span className="text-emerald-400">{params.threshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={params.threshold}
                  onChange={(e) => updateDither('threshold', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Strength / Spread */}
              <div>
                <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                  <span>STRENGTH (SPREAD)</span>
                  <span className="text-emerald-400">{params.spread}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={params.spread}
                  onChange={(e) => updateDither('spread', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Pattern Controls (for Continuous Screens) */}
              {currentAlgo.kind === 'SCREEN' && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1f232b]">
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                      <span>PAT. SCALE</span>
                      <span className="text-emerald-400">{params.patternScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="300"
                      step="5"
                      value={params.patternScale}
                      onChange={(e) => updateDither('patternScale', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                      <span>PAT. ANGLE</span>
                      <span className="text-emerald-400">{params.patternAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={params.patternAngle}
                      onChange={(e) => updateDither('patternAngle', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Error Diffusion toggles */}
              {currentAlgo.kind === 'ERROR' && (
                <div className="pt-1 border-t border-[#1f232b] flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-[11px] text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={params.serpentine}
                      onChange={(e) => updateDither('serpentine', e.target.checked)}
                      className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Serpentine Scan</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[11px] text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={params.pixelate}
                      onChange={(e) => updateDither('pixelate', e.target.checked)}
                      className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Discrete Block Pixelate</span>
                  </label>
                </div>
              )}

              {/* Contrast & Brightness */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1f232b]">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                    <span>CONTRAST</span>
                    <span className="text-emerald-400">{params.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={params.contrast}
                    onChange={(e) => updateDither('contrast', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                    <span>BRIGHTNESS</span>
                    <span className="text-emerald-400">{params.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="2"
                    value={params.brightness}
                    onChange={(e) => updateDither('brightness', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Randomness / Jitter */}
              <div>
                <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                  <span>RANDOMNESS (JITTER)</span>
                  <span className="text-emerald-400">{params.noise}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={params.noise}
                  onChange={(e) => updateDither('noise', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 2. LINES MODULE                                                   */}
        {/* ================================================================= */}
        <div className="bg-[#14171e] rounded border border-[#222733] overflow-hidden">
          <button
            onClick={() => toggleSection('lines')}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#171a22] hover:bg-[#1c202a] text-gray-200 font-semibold text-xs tracking-wider transition-colors border-b border-[#222733] cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>LINES</span>
            </div>
            {sectionOpen.lines ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {sectionOpen.lines && (
            <div className="p-3 space-y-3.5">
              {/* Master Enable Lines */}
              <label className="flex items-center justify-between text-[11px] text-gray-200 cursor-pointer pb-2 border-b border-[#1f232b]">
                <span className="font-semibold">Enable Lines</span>
                <input
                  type="checkbox"
                  checked={linesParams.enabled}
                  onChange={(e) => updateLines('enabled', e.target.checked)}
                  className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </label>

              {linesParams.enabled && (
                <>
                  {/* OBJECT CHECKBOX (Strict Edge Detection & Following) */}
                  <div className={`p-2.5 rounded border transition-colors ${
                    linesParams.objectMode 
                      ? 'bg-emerald-950/20 border-emerald-500/50' 
                      : 'bg-[#0b0c0f] border-[#1f232b]'
                  }`}>
                    <label className="flex items-center justify-between text-[11px] text-gray-200 font-semibold cursor-pointer">
                      <div className="flex items-center space-x-1.5">
                        <Crosshair className={`w-3.5 h-3.5 ${linesParams.objectMode ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span>Object (Contour Following)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={linesParams.objectMode}
                        onChange={(e) => updateLines('objectMode', e.target.checked)}
                        className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <p className="mt-1 text-[10px] text-gray-400">
                      {linesParams.objectMode 
                        ? 'Lines adhere strictly to object contours with ZERO gap (Object Edge |||| Line).'
                        : 'Object is OFF: Standard ambient procedural lines across the canvas.'}
                    </p>

                    {/* Edge following parameters */}
                    {linesParams.objectMode && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/20 space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>EDGE THRESHOLD</span>
                            <span className="text-emerald-400 font-bold">{linesParams.edgeThreshold}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="80"
                            step="1"
                            value={linesParams.edgeThreshold}
                            onChange={(e) => updateLines('edgeThreshold', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>EDGE SENSITIVITY</span>
                            <span className="text-emerald-400 font-bold">{linesParams.edgeSensitivity}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="2"
                            value={linesParams.edgeSensitivity}
                            onChange={(e) => updateLines('edgeSensitivity', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>EDGE OFFSET (GAP TO CONTOUR)</span>
                            <span className="text-emerald-400 font-bold">{linesParams.edgeOffset}px</span>
                          </div>
                          <input
                            type="range"
                            min="-5"
                            max="15"
                            step="0.5"
                            value={linesParams.edgeOffset}
                            onChange={(e) => updateLines('edgeOffset', Number(e.target.value))}
                            className="w-full"
                          />
                          <span className="text-[9px] text-gray-500 block">Default 0px gives exact contour adherence without gaps.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HAND MADE LINES CHECKBOX & CURVE SLIDER */}
                  <div className={`p-2.5 rounded border transition-colors ${
                    linesParams.handMade 
                      ? 'bg-emerald-950/20 border-emerald-500/50' 
                      : 'bg-[#0b0c0f] border-[#1f232b]'
                  }`}>
                    <label className="flex items-center justify-between text-[11px] text-gray-200 font-semibold cursor-pointer">
                      <div className="flex items-center space-x-1.5">
                        <Feather className={`w-3.5 h-3.5 ${linesParams.handMade ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span>Hand Made Lines</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={linesParams.handMade}
                        onChange={(e) => updateLines('handMade', e.target.checked)}
                        className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <p className="mt-1 text-[10px] text-gray-400">
                      Imparts hand-drawn organic wobble and natural variation anchored to the contour.
                    </p>

                    {/* Curve control: only active when Hand Made Lines is checked */}
                    {linesParams.handMade && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/20">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>CURVE</span>
                          <span className="text-emerald-400 font-bold">{linesParams.curve}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={linesParams.curve}
                          onChange={(e) => updateLines('curve', Number(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-[9px] text-gray-500 block">0 = straight, medium = gentle arc, high = pronounced organic bow.</span>
                      </div>
                    )}
                  </div>

                  {/* DUPLICATE LINES CHECKBOX & CONTROLS */}
                  <div className={`p-2.5 rounded border transition-colors ${
                    linesParams.duplicate 
                      ? 'bg-emerald-950/20 border-emerald-500/50' 
                      : 'bg-[#0b0c0f] border-[#1f232b]'
                  }`}>
                    <label className="flex items-center justify-between text-[11px] text-gray-200 font-semibold cursor-pointer">
                      <div className="flex items-center space-x-1.5">
                        <Copy className={`w-3.5 h-3.5 ${linesParams.duplicate ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span>Duplicate Lines</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={linesParams.duplicate}
                        onChange={(e) => updateLines('duplicate', e.target.checked)}
                        className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <p className="mt-1 text-[10px] text-gray-400">
                      Spawns companion parallel line(s) hugging the same contour without wandering away.
                    </p>

                    {linesParams.duplicate && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/20 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>DUP COUNT</span>
                              <span className="text-emerald-400 font-bold">{linesParams.duplicateCount}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="4"
                              step="1"
                              value={linesParams.duplicateCount}
                              onChange={(e) => updateLines('duplicateCount', Number(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>DUP OFFSET</span>
                              <span className="text-emerald-400 font-bold">{linesParams.duplicateOffset}px</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="15"
                              step="0.5"
                              value={linesParams.duplicateOffset}
                              onChange={(e) => updateLines('duplicateOffset', Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>DUP WIDTH</span>
                              <span className="text-emerald-400 font-bold">{linesParams.duplicateWidth}px</span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="5"
                              step="0.2"
                              value={linesParams.duplicateWidth}
                              onChange={(e) => updateLines('duplicateWidth', Number(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>DUP OPACITY</span>
                              <span className="text-emerald-400 font-bold">{linesParams.duplicateOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              step="5"
                              value={linesParams.duplicateOpacity}
                              onChange={(e) => updateLines('duplicateOpacity', Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Standard Strand Dimensions */}
                  <div className="space-y-3 pt-1">
                    {/* Amount / Count */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                        <span>AMOUNT (STRAND COUNT)</span>
                        <span className="text-emerald-400 font-bold">{linesParams.amount}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="2500"
                        step="20"
                        value={linesParams.amount}
                        onChange={(e) => updateLines('amount', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Length & Length Randomness */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                          <span>LENGTH</span>
                          <span className="text-emerald-400">{linesParams.length}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="120"
                          step="2"
                          value={linesParams.length}
                          onChange={(e) => updateLines('length', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                          <span>LEN RND</span>
                          <span className="text-emerald-400">{linesParams.lengthRand}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={linesParams.lengthRand}
                          onChange={(e) => updateLines('lengthRand', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Width & Width Randomness */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                          <span>WIDTH</span>
                          <span className="text-emerald-400">{linesParams.width}px</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="8"
                          step="0.2"
                          value={linesParams.width}
                          onChange={(e) => updateLines('width', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                          <span>WIDTH RND</span>
                          <span className="text-emerald-400">{linesParams.widthRand}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={linesParams.widthRand}
                          onChange={(e) => updateLines('widthRand', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Color controls */}
                    <div className="p-2.5 bg-[#0b0c0f] rounded border border-[#1f232b] space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-gray-300 font-semibold">
                        <span>LINES COLOR</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-[10px]">
                        {(['white', 'black', 'custom', 'sampled', 'random'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => updateLines('colorMode', mode)}
                            className={`py-1 rounded capitalize font-mono cursor-pointer transition-all ${
                              linesParams.colorMode === mode
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-[#181b22] text-gray-400 hover:text-white'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      {linesParams.colorMode === 'custom' && (
                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="color"
                            value={linesParams.color}
                            onChange={(e) => updateLines('color', e.target.value)}
                            className="w-6 h-6 rounded border border-gray-600 bg-transparent cursor-pointer p-0"
                          />
                          <span className="text-[10px] text-gray-400">{linesParams.color}</span>
                        </div>
                      )}
                    </div>

                    {/* Opacity Slider */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                        <span>OPACITY</span>
                        <span className="text-emerald-400">{linesParams.opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="2"
                        value={linesParams.opacity}
                        onChange={(e) => updateLines('opacity', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Motion / Animation */}
                    <div className="p-2 bg-[#0b0c0f] rounded border border-[#1f232b] space-y-2">
                      <label className="flex items-center justify-between text-[11px] text-gray-300 cursor-pointer">
                        <span>Auto Animate Motion</span>
                        <input
                          type="checkbox"
                          checked={linesParams.motion}
                          onChange={(e) => updateLines('motion', e.target.checked)}
                          className="rounded bg-[#0d0f14] border-[#2b303c] text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </label>

                      {linesParams.motion && (
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>MOTION SPEED</span>
                            <span className="text-emerald-400">{linesParams.motionSpeed}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            step="5"
                            value={linesParams.motionSpeed}
                            onChange={(e) => updateLines('motionSpeed', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
