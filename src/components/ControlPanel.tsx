import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Tv,
  Activity,
  Sliders,
  RotateCcw,
  Palette,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { DitherConfig, GrainConfig, VHSConfig, NTSCConfig, ChannelsConfig, LinesConfig } from '../engine/types';
import { DITHER_ALGORITHMS } from '../engine/algorithms';
import { STUDIO_PRESETS } from '../engine/presets';

interface Props {
  dither: DitherConfig;
  setDither: React.Dispatch<React.SetStateAction<DitherConfig>>;
  grain: GrainConfig;
  setGrain: React.Dispatch<React.SetStateAction<GrainConfig>>;
  vhs: VHSConfig;
  setVhs: React.Dispatch<React.SetStateAction<VHSConfig>>;
  ntsc: NTSCConfig;
  setNtsc: React.Dispatch<React.SetStateAction<NTSCConfig>>;
  channels: ChannelsConfig;
  setChannels: React.Dispatch<React.SetStateAction<ChannelsConfig>>;
  lines: LinesConfig;
  setLines: React.Dispatch<React.SetStateAction<LinesConfig>>;
  onApplyPreset: (presetId: string) => void;
  activePresetId: string;
}

export const ControlPanel: React.FC<Props> = ({
  dither,
  setDither,
  grain,
  setGrain,
  vhs,
  setVhs,
  ntsc,
  setNtsc,
  channels,
  setChannels,
  lines,
  setLines,
  onApplyPreset,
  activePresetId,
}) => {
  const [activeTab, setActiveTab] = useState<'dither' | 'grain' | 'vhs' | 'lines'>('dither');

  return (
    <div className="w-80 md:w-96 flex flex-col bg-zinc-900/90 backdrop-blur-md border-l border-zinc-800 min-h-0 select-none">
      {/* Presets Quick Carousel */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            Curated Styles
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">1-Click Look</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STUDIO_PRESETS.map((p) => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onApplyPreset(p.id)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-indigo-600/30 border-indigo-500/80 text-white shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="text-[11px] font-medium flex items-center gap-1.5">
                  {p.name}
                  {isActive && <Check className="w-3 h-3 text-indigo-400" />}
                </div>
                <div className="text-[9px] text-zinc-400">{p.badge}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-950/80">
        <button
          onClick={() => setActiveTab('dither')}
          className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 transition-colors border-b-2 ${
            activeTab === 'dither'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dither</span>
        </button>

        <button
          onClick={() => setActiveTab('grain')}
          className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 transition-colors border-b-2 ${
            activeTab === 'grain'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Grain</span>
        </button>

        <button
          onClick={() => setActiveTab('vhs')}
          className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 transition-colors border-b-2 ${
            activeTab === 'vhs'
              ? 'border-pink-500 text-pink-400 bg-pink-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>VHS/NTSC</span>
        </button>

        <button
          onClick={() => setActiveTab('lines')}
          className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 transition-colors border-b-2 ${
            activeTab === 'lines'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Lines</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ===================== DITHER TAB ===================== */}
        {activeTab === 'dither' && (
          <div className="space-y-4">
            {/* Algorithm Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Dither Algorithm (49 Available)</label>
              <select
                value={dither.algo}
                onChange={(e) => setDither((d) => ({ ...d, algo: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <optgroup label="Error Diffusion">
                  {DITHER_ALGORITHMS.filter((x) => x.category === 'diffusion').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bayer Ordered Matrices">
                  {DITHER_ALGORITHMS.filter((x) => x.category === 'bayer').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Blue Noise & Stochastic">
                  {DITHER_ALGORITHMS.filter((x) => x.category === 'noise').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Continuous Halftone Screens">
                  {DITHER_ALGORITHMS.filter((x) => x.category === 'halftone').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[11px] text-zinc-500">
                {DITHER_ALGORITHMS.find((x) => x.id === dither.algo)?.desc}
              </p>
            </div>

            {/* Color Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Color Palette Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDither((d) => ({ ...d, mode: 0 }))}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    dither.mode === 0
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Preserve RGB
                </button>
                <button
                  onClick={() => setDither((d) => ({ ...d, mode: 1 }))}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    dither.mode === 1
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Monochrome (B&W)
                </button>
              </div>
            </div>

            {/* Slider: Levels */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Tonal Levels</span>
                <span className="font-mono text-zinc-400">{dither.levels}</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                value={dither.levels}
                onChange={(e) => setDither((d) => ({ ...d, levels: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider: Threshold / Density */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Threshold / Dot Density</span>
                <span className="font-mono text-zinc-400">{dither.threshold}</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={dither.threshold}
                onChange={(e) => setDither((d) => ({ ...d, threshold: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider: Strength / Spread */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Dither Strength</span>
                <span className="font-mono text-zinc-400">{dither.spread}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={dither.spread}
                onChange={(e) => setDither((d) => ({ ...d, spread: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Checkbox: Pixelate to Scale */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dither.pixelate}
                  onChange={(e) => setDither((d) => ({ ...d, pixelate: e.target.checked }))}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-0 bg-zinc-900 w-4 h-4"
                />
                <span className="text-xs font-medium text-zinc-300">Pixelate Output</span>
              </label>
              <p className="text-[10px] text-zinc-400 pl-6">
                When unchecked, dither operates at 1:1 subpixel resolution without big chunky blocks.
              </p>
            </div>
          </div>
        )}

        {/* ===================== FILM GRAIN TAB ===================== */}
        {activeTab === 'grain' && (
          <div className="space-y-4">
            {/* Enable switch */}
            <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Enable Film Emulsion</span>
                <p className="text-[10px] text-zinc-400">Resolution-adaptive silver halide</p>
              </div>
              <input
                type="checkbox"
                checked={grain.enabled}
                onChange={(e) => setGrain((g) => ({ ...g, enabled: e.target.checked }))}
                className="rounded border-zinc-700 text-purple-600 focus:ring-0 bg-zinc-900 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Physical Stock Size (mm) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Stock Size (Physical mm)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[4, 8, 12, 16, 24, 32, 48, 64].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setGrain((g) => ({ ...g, sizeMm: sz }))}
                    className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      grain.sizeMm === sz
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sz}mm
                  </button>
                ))}
              </div>
            </div>

            {/* Grain Mode (Color vs Mono) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Stock Emulsion Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGrain((g) => ({ ...g, colorMode: true }))}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    grain.colorMode
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Color (RGB Dye Clouds)
                </button>
                <button
                  onClick={() => setGrain((g) => ({ ...g, colorMode: false }))}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    !grain.colorMode
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Monochrome (Silver)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Grain Amount</span>
                <span className="font-mono text-zinc-400">{grain.amount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={grain.amount}
                onChange={(e) => setGrain((g) => ({ ...g, amount: parseInt(e.target.value) }))}
                className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Luminance Response (H&D curve) */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                Film Luminance Response (H&amp;D Curves)
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Shadows (Toe)</span>
                  <span className="font-mono text-zinc-400">{grain.shadows}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={grain.shadows}
                  onChange={(e) => setGrain((g) => ({ ...g, shadows: parseInt(e.target.value) }))}
                  className="w-full accent-purple-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Midtones (Halide Peak)</span>
                  <span className="font-mono text-zinc-400">{grain.midtones}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={grain.midtones}
                  onChange={(e) => setGrain((g) => ({ ...g, midtones: parseInt(e.target.value) }))}
                  className="w-full accent-purple-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Highlights (Shoulder)</span>
                  <span className="font-mono text-zinc-400">{grain.highlights}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={grain.highlights}
                  onChange={(e) => setGrain((g) => ({ ...g, highlights: parseInt(e.target.value) }))}
                  className="w-full accent-purple-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Auto animation */}
            <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Auto-Animated Grain</span>
                <p className="text-[10px] text-zinc-400">Deterministic per-frame variation</p>
              </div>
              <input
                type="checkbox"
                checked={grain.autoAnim}
                onChange={(e) => setGrain((g) => ({ ...g, autoAnim: e.target.checked }))}
                className="rounded border-zinc-700 text-purple-600 focus:ring-0 bg-zinc-900 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ===================== VHS / NTSC TAB ===================== */}
        {activeTab === 'vhs' && (
          <div className="space-y-4">
            {/* VHS Section */}
            <div className="space-y-3 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">VHS Tape Simulation</span>
                  <p className="text-[10px] text-zinc-400">Tracking wobble &amp; head switch</p>
                </div>
                <input
                  type="checkbox"
                  checked={vhs.enabled}
                  onChange={(e) => setVhs((v) => ({ ...v, enabled: e.target.checked }))}
                  className="rounded border-zinc-700 text-pink-600 focus:ring-0 bg-zinc-900 w-4 h-4 cursor-pointer"
                />
              </div>

              {vhs.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Tracking Wobble</span>
                      <span className="font-mono text-zinc-400">{vhs.trackAmount}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={vhs.trackAmount}
                      onChange={(e) => setVhs((v) => ({ ...v, trackAmount: parseInt(e.target.value) }))}
                      className="w-full accent-pink-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Head Switch Skew</span>
                      <span className="font-mono text-zinc-400">{vhs.headSwitch}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={vhs.headSwitch}
                      onChange={(e) => setVhs((v) => ({ ...v, headSwitch: parseInt(e.target.value) }))}
                      className="w-full accent-pink-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">CRT Scanlines</span>
                      <span className="font-mono text-zinc-400">{vhs.scanlines}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={vhs.scanlines}
                      onChange={(e) => setVhs((v) => ({ ...v, scanlines: parseInt(e.target.value) }))}
                      className="w-full accent-pink-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NTSC Section */}
            <div className="space-y-3 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">NTSC 3.58MHz Composite</span>
                  <p className="text-[10px] text-zinc-400">Dot crawl &amp; rainbow fringing</p>
                </div>
                <input
                  type="checkbox"
                  checked={ntsc.enabled}
                  onChange={(e) => setNtsc((n) => ({ ...n, enabled: e.target.checked }))}
                  className="rounded border-zinc-700 text-pink-600 focus:ring-0 bg-zinc-900 w-4 h-4 cursor-pointer"
                />
              </div>

              {ntsc.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Dot Crawl &amp; Cross Color</span>
                      <span className="font-mono text-zinc-400">{ntsc.dotCrawl}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ntsc.dotCrawl}
                      onChange={(e) => setNtsc((n) => ({ ...n, dotCrawl: parseInt(e.target.value) }))}
                      className="w-full accent-pink-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">RF Ghosting (Multipath)</span>
                      <span className="font-mono text-zinc-400">{ntsc.ghosting}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ntsc.ghosting}
                      onChange={(e) => setNtsc((n) => ({ ...n, ghosting: parseInt(e.target.value) }))}
                      className="w-full accent-pink-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== LINES & CHANNELS TAB ===================== */}
        {activeTab === 'lines' && (
          <div className="space-y-4">
            {/* RGB Channels Chromatic Aberration */}
            <div className="space-y-3 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">RGB Channels Split</span>
                  <p className="text-[10px] text-zinc-400">Chromatic aberration &amp; jitter</p>
                </div>
                <input
                  type="checkbox"
                  checked={channels.enabled}
                  onChange={(e) => setChannels((c) => ({ ...c, enabled: e.target.checked }))}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0 bg-zinc-900 w-4 h-4 cursor-pointer"
                />
              </div>

              {channels.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Separation Amount</span>
                      <span className="font-mono text-zinc-400">{channels.amount}px</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={channels.amount}
                      onChange={(e) => setChannels((c) => ({ ...c, amount: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hair / Strands Procedural Simulation */}
            <div className="space-y-3 p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Procedural Hair / Strands</span>
                  <p className="text-[10px] text-zinc-400">Crash-proof bounded vector simulation</p>
                </div>
                <input
                  type="checkbox"
                  checked={lines.enabled}
                  onChange={(e) => setLines((l) => ({ ...l, enabled: e.target.checked }))}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0 bg-zinc-900 w-4 h-4 cursor-pointer"
                />
              </div>

              {lines.enabled && (
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  {/* Object Mode Checkbox! */}
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lines.objectMode}
                        onChange={(e) => setLines((l) => ({ ...l, objectMode: e.target.checked }))}
                        className="rounded border-zinc-700 text-emerald-500 focus:ring-0 bg-zinc-900 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-emerald-300">Object / Edge Detection</span>
                    </label>
                    <p className="text-[10px] text-zinc-400 pl-6">
                      Spawns strands exclusively along detected contours and silhouettes (Sobel filter).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Strand Count</span>
                      <span className="font-mono text-zinc-400">{lines.amount}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="2000"
                      step="50"
                      value={lines.amount}
                      onChange={(e) => setLines((l) => ({ ...l, amount: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Strand Length</span>
                      <span className="font-mono text-zinc-400">{lines.length}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      value={lines.length}
                      onChange={(e) => setLines((l) => ({ ...l, length: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Curvature &amp; Sway</span>
                      <span className="font-mono text-zinc-400">{lines.curvature}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={lines.curvature}
                      onChange={(e) => setLines((l) => ({ ...l, curvature: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
