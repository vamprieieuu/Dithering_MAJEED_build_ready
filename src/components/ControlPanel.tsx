import React, { useState } from 'react';
import { Sliders, Cpu, Palette, Sparkles, Wand2, Info, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { DitherSettings, ColorMode } from '../types/dither';
import { DITHER_ALGOS } from '../engine/ditherEngine';
import { PRESET_PALETTES } from '../engine/palettes';

interface ControlPanelProps {
  settings: DitherSettings;
  onChange: (newSettings: DitherSettings) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onChange, onReset }) => {
  const [activeTab, setActiveTab] = useState<'algo' | 'params' | 'color' | 'preprocess' | 'lines'>('algo');

  const update = <K extends keyof DitherSettings>(key: K, value: DitherSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const currentAlgo = DITHER_ALGOS[settings.algo] || DITHER_ALGOS[0];

  return (
    <aside className="w-80 sm:w-88 h-full bg-[#0d0f14] border-l border-zinc-800 flex flex-col z-20 select-none text-zinc-300">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 bg-[#090b0e] text-[11px] font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('algo')}
          className={`flex-1 min-w-[64px] py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'algo'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Algo</span>
        </button>
        <button
          onClick={() => setActiveTab('params')}
          className={`flex-1 min-w-[64px] py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'params'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Params</span>
        </button>
        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 min-w-[64px] py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'color'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Color</span>
        </button>
        <button
          onClick={() => setActiveTab('preprocess')}
          className={`flex-1 min-w-[64px] py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'preprocess'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Prep</span>
        </button>
        <button
          onClick={() => setActiveTab('lines')}
          className={`flex-1 min-w-[64px] py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'lines'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Lines</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* ================================================================= */}
        {/* TAB 1: ALGORITHM & COLOR MODE */}
        {/* ================================================================= */}
        {activeTab === 'algo' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-400 font-semibold tracking-wider text-[10px] uppercase">
                  Dithering Algorithm (49 Available)
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">
                  #{currentAlgo.id + 1}
                </span>
              </div>
              <select
                value={settings.algo}
                onChange={(e) => update('algo', Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <optgroup label="── ERROR DIFFUSION (15) ──">
                  {DITHER_ALGOS.filter((a) => a.category === 'diffusion').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── ORDERED & BAYER (4) ──">
                  {DITHER_ALGOS.filter((a) => a.category === 'ordered').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── STOCHASTIC & NOISE (3) ──">
                  {DITHER_ALGOS.filter((a) => a.category === 'stochastic').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── HALFTONE & CONTINUOUS SCREENS (27) ──">
                  {DITHER_ALGOS.filter((a) => a.category === 'screens').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="mt-1 text-[11px] text-zinc-500 italic">
                {currentAlgo.description}
              </p>
            </div>

            {/* Color Mode */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-zinc-400 font-semibold tracking-wider text-[10px] uppercase mb-1.5">
                Output Color Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'mono', label: 'Monochrome (B&W)' },
                  { id: 'rgb', label: 'Preserve RGB' },
                  { id: 'duo', label: 'Duo-Tone' },
                  { id: 'cmyk', label: 'CMYK Rosette' },
                  { id: 'tritone', label: 'Tri-Tone Ramp' },
                  { id: 'indexed', label: 'Indexed Palette' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => update('mode', mode.id as ColorMode)}
                    className={`py-1.5 px-2 rounded text-[11px] border font-medium text-left transition-colors ${
                      settings.mode === mode.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Algorithm Parameters */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Scale / Pixel Size</span>
                  <span className="font-mono text-zinc-200">{settings.scale}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={settings.scale}
                  onChange={(e) => update('scale', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Levels (Tones)</span>
                  <span className="font-mono text-zinc-200">{settings.levels}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={settings.levels}
                  onChange={(e) => update('levels', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {currentAlgo.kind === 'screen' && (
                <>
                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span>Pattern Scale</span>
                      <span className="font-mono text-zinc-200">{settings.patternScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="300"
                      step="5"
                      value={settings.patternScale}
                      onChange={(e) => update('patternScale', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span>Pattern Angle</span>
                      <span className="font-mono text-zinc-200">{settings.patternAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={settings.patternAngle}
                      onChange={(e) => update('patternAngle', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: DETAILED DITHER PARAMETERS */}
        {/* ================================================================= */}
        {activeTab === 'params' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Master Dot Density (Amount)</span>
                <span className="font-mono text-zinc-200">{settings.amount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.amount}
                onChange={(e) => update('amount', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">Controls dither dot coverage over source image</p>
            </div>

            {settings.mode === 'mono' && (
              <div className="grid grid-cols-2 gap-3 p-2 bg-zinc-900/60 rounded border border-zinc-800">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>White Dots</span>
                    <span className="font-mono text-zinc-200">{settings.whiteAmount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.whiteAmount}
                    onChange={(e) => update('whiteAmount', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Black Dots</span>
                    <span className="font-mono text-zinc-200">{settings.blackAmount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.blackAmount}
                    onChange={(e) => update('blackAmount', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Threshold (Density Bias)</span>
                <span className="font-mono text-zinc-200">{settings.threshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.threshold}
                onChange={(e) => update('threshold', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Strength / Spread</span>
                <span className="font-mono text-zinc-200">{settings.strength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={settings.strength}
                onChange={(e) => update('strength', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Randomness / Jitter Noise</span>
                <span className="font-mono text-zinc-200">{settings.noise}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.noise}
                onChange={(e) => update('noise', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Contrast</span>
                <span className="font-mono text-zinc-200">{settings.contrast}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                value={settings.contrast}
                onChange={(e) => update('contrast', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Brightness</span>
                <span className="font-mono text-zinc-200">{settings.brightness}</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={settings.brightness}
                onChange={(e) => update('brightness', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Checkbox Toggles */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.serpentine}
                  onChange={(e) => update('serpentine', e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                />
                <span>Serpentine Alternating Scan</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pixelate}
                  onChange={(e) => update('pixelate', e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                />
                <span>Pixelate Output to Scale (Pixel Art mode)</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invert}
                  onChange={(e) => update('invert', e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                />
                <span>Invert Luminosity</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.linear}
                  onChange={(e) => update('linear', e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                />
                <span>Linear Gamma Space Processing</span>
              </label>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: COLOR PALETTES & TONAL SWATCHES */}
        {/* ================================================================= */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            {/* Duo-Tone or Tri-tone Color Controls */}
            {(settings.mode === 'duo' || settings.mode === 'tritone') && (
              <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-3">
                <span className="font-semibold text-zinc-400 tracking-wider text-[10px] uppercase block">
                  {settings.mode === 'duo' ? 'Duo-Tone Colors' : 'Tri-Tone Colors'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Dark / Shadow</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.darkColor}
                      onChange={(e) => update('darkColor', e.target.value)}
                      className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-[11px]">{settings.darkColor}</span>
                  </div>
                </div>

                {settings.mode === 'tritone' && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Midtone</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.midColor}
                        onChange={(e) => update('midColor', e.target.value)}
                        className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px]">{settings.midColor}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Light / Highlight</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.lightColor}
                      onChange={(e) => update('lightColor', e.target.value)}
                      className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-[11px]">{settings.lightColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Preset Palettes */}
            <div>
              <label className="block text-zinc-400 font-semibold tracking-wider text-[10px] uppercase mb-1.5">
                Retro Color Palettes ({PRESET_PALETTES.length})
              </label>
              <div className="space-y-2">
                {PRESET_PALETTES.map((pal) => (
                  <div
                    key={pal.id}
                    onClick={() => {
                      update('selectedPalette', pal.id);
                      if (settings.mode !== 'indexed') {
                        update('mode', 'indexed');
                      }
                    }}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      settings.selectedPalette === pal.id && settings.mode === 'indexed'
                        ? 'border-indigo-500 bg-indigo-950/20'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-[11px] text-zinc-200">{pal.name}</span>
                      <span className="text-[10px] text-zinc-500">{pal.category}</span>
                    </div>
                    <div className="flex h-4 rounded overflow-hidden border border-zinc-800">
                      {pal.colors.map((c, i) => (
                        <div
                          key={i}
                          style={{ backgroundColor: c, flex: 1 }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: PREPROCESSING (Blur, Sharpen, Noise) */}
        {/* ================================================================= */}
        {activeTab === 'preprocess' && (
          <div className="space-y-4">
            <p className="text-[11px] text-zinc-400">
              Analog pre-filtering applied prior to quantization and dithering.
            </p>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Sharpen Strength</span>
                <span className="font-mono text-zinc-200">{settings.sharpenStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={settings.sharpenStrength}
                onChange={(e) => update('sharpenStrength', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">High values produce crisp, laser-etched dots</p>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Soft Pre-Blur</span>
                <span className="font-mono text-zinc-200">{settings.preBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={settings.preBlur}
                onChange={(e) => update('preBlur', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">Smooths noisy textures for cleaner halftone screens</p>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Denoise | Pre-Noise</span>
                <span className="font-mono text-zinc-200">{settings.preNoise}</span>
              </div>
              <input
                type="range"
                min="-25"
                max="50"
                value={settings.preNoise}
                onChange={(e) => update('preNoise', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">Negative = Denoise, Positive = Analog grain</p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: LINES & PROCEDURAL CONTOURS (core/lines.cpp) */}
        {/* ================================================================= */}
        {activeTab === 'lines' && (
          <div className="space-y-4">
            <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-zinc-200 block text-xs">Enable Contour Lines</span>
                <span className="text-[10px] text-zinc-500">Procedural strands & contour tracing</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableLines}
                onChange={(e) => update('enableLines', e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
              />
            </div>

            {settings.enableLines && (
              <>
                <div className="space-y-2 p-2.5 bg-zinc-900/40 rounded border border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-200 font-medium">
                    <input
                      type="checkbox"
                      checked={settings.lineObjectMode}
                      onChange={(e) => update('lineObjectMode', e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                    />
                    <span>[x] Object Mode (Strict Contour Following)</span>
                  </label>
                  <p className="text-[10px] text-zinc-500 pl-5">
                    Sobel & Canny edge detector: lines adhere strictly to image contours with zero gap.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Lines Amount</span>
                    <span className="font-mono text-zinc-200">{settings.linesAmount}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1500"
                    step="10"
                    value={settings.linesAmount}
                    onChange={(e) => update('linesAmount', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Line Length</span>
                    <span className="font-mono text-zinc-200">{settings.lineLength}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={settings.lineLength}
                    onChange={(e) => update('lineLength', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Line Thickness</span>
                    <span className="font-mono text-zinc-200">{settings.lineWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="6"
                    step="0.1"
                    value={settings.lineWidth}
                    onChange={(e) => update('lineWidth', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Line Color & Opacity</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.lineColor}
                      onChange={(e) => update('lineColor', e.target.value)}
                      className="w-6 h-6 rounded border border-zinc-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.lineOpacity}
                      onChange={(e) => update('lineOpacity', Number(e.target.value))}
                      className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                    />
                    <span className="text-zinc-500">%</span>
                  </div>
                </div>

                {/* Hand Made Lines & Duplicate Lines */}
                <div className="pt-2 border-t border-zinc-800 space-y-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={settings.lineHandMade}
                        onChange={(e) => update('lineHandMade', e.target.checked)}
                        className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Hand Made Lines (Organic Curve)</span>
                    </label>
                    {settings.lineHandMade && (
                      <div className="pl-5">
                        <div className="flex justify-between text-zinc-400 mb-1">
                          <span>Curve Wobble</span>
                          <span className="font-mono text-zinc-200">{settings.lineCurve}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settings.lineCurve}
                          onChange={(e) => update('lineCurve', Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={settings.lineDuplicate}
                        onChange={(e) => update('lineDuplicate', e.target.checked)}
                        className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Duplicate Companion Lines</span>
                    </label>
                    {settings.lineDuplicate && (
                      <div className="pl-5 space-y-2">
                        <div className="flex justify-between text-zinc-400">
                          <span>Count</span>
                          <span className="font-mono text-zinc-200">{settings.lineDuplicateCount}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          value={settings.lineDuplicateCount}
                          onChange={(e) => update('lineDuplicateCount', Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
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
    </aside>
  );
};
