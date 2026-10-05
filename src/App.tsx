import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Viewport } from './components/Viewport';
import { ControlPanel } from './components/ControlPanel';
import { InstallModal } from './components/InstallModal';
import { processImage } from './engine/processor';
import { STUDIO_PRESETS } from './engine/presets';
import {
  DitherConfig,
  GrainConfig,
  VHSConfig,
  NTSCConfig,
  ChannelsConfig,
  LinesConfig,
} from './engine/types';

export const App: React.FC = () => {
  // Modals
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('cyberpunk-dither');

  // Animation timeline state
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeSec, setTimeSec] = useState(0);

  // Effect States
  const [dither, setDither] = useState<DitherConfig>({
    algo: 13, // Bayer 8x8 default
    mode: 0,
    levels: 3,
    scale: 1,
    threshold: 50,
    spread: 100,
    patternScale: 100,
    patternAngle: 0,
    contrast: 110,
    brightness: 0,
    noise: 0,
    serpentine: true,
    pixelate: false,
    animate: false,
    seed: 0,
    darkColor: '#000000',
    lightColor: '#ffffff',
    midColor: '#808080',
  });

  const [grain, setGrain] = useState<GrainConfig>({
    enabled: false,
    type: 0,
    sizeMm: 16,
    amount: 55,
    density: 85,
    contrast: 100,
    softness: 35,
    lumaResponse: 85,
    shadows: 90,
    midtones: 100,
    highlights: 45,
    colorMode: true,
    autoAnim: true,
    speed: 100,
    seed: 0,
  });

  const [vhs, setVhs] = useState<VHSConfig>({
    enabled: false,
    trackAmount: 20,
    headSwitch: 30,
    jitter: 15,
    vertInstability: 10,
    chromaBleed: 35,
    chromaShift: 2.5,
    staticAmount: 30,
    dashes: 25,
    streaks: 20,
    scanlines: 35,
    scanPitch: 3,
    flicker: 20,
    speed: 100,
    seed: 0,
  });

  const [ntsc, setNtsc] = useState<NTSCConfig>({
    enabled: false,
    dotCrawl: 45,
    chromaBleed: 40,
    carrierFreq: 100,
    phaseSkew: 20,
    ghosting: 25,
    ghostShift: 12,
    ringing: 30,
    scanlines: 35,
    rfSnow: 20,
    speed: 100,
    seed: 0,
  });

  const [channels, setChannels] = useState<ChannelsConfig>({
    enabled: true,
    amount: 5,
    angle: 0,
    radial: false,
    jitter: 1,
  });

  const [lines, setLines] = useState<LinesConfig>({
    enabled: false,
    amount: 600,
    length: 60,
    width: 1,
    curvature: 15,
    kink: 25,
    opacity: 85,
    color: '#ffffff',
    autoAnim: true,
    speed: 100,
    objectMode: false,
    edgeThreshold: 30,
    edgeSensitivity: 70,
    edgeDirection: 0,
  });

  // Canvas refs
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dstCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Main render runner
  const triggerRender = useCallback(() => {
    if (!srcCanvasRef.current || !dstCanvasRef.current) return;
    const w = srcCanvasRef.current.width;
    const h = srcCanvasRef.current.height;
    if (w <= 0 || h <= 0) return;

    const sctx = srcCanvasRef.current.getContext('2d');
    const dctx = dstCanvasRef.current.getContext('2d');
    if (!sctx || !dctx) return;

    processImage(sctx, dctx, w, h, timeSec, dither, grain, vhs, ntsc, channels, lines);
  }, [timeSec, dither, grain, vhs, ntsc, channels, lines]);

  // Render on state changes
  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  // Animation frame loop
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let lastT = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;
      setTimeSec((t) => t + Math.min(dt, 0.1));
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleApplyPreset = (presetId: string) => {
    const p = STUDIO_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setActivePresetId(presetId);
    if (p.dither) setDither((d) => ({ ...d, ...p.dither }));
    if (p.grain) setGrain((g) => ({ ...g, ...p.grain }));
    if (p.vhs) setVhs((v) => ({ ...v, ...p.vhs }));
    if (p.ntsc) setNtsc((n) => ({ ...n, ...p.ntsc }));
    if (p.channels) setChannels((c) => ({ ...c, ...p.channels }));
    if (p.lines) setLines((l) => ({ ...l, ...p.lines }));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Header */}
      <Header onOpenInstall={() => setIsInstallOpen(true)} />

      {/* Main Workspace: Viewport + Controls */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Viewport
          srcCanvasRef={srcCanvasRef}
          dstCanvasRef={dstCanvasRef}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onResetTime={() => setTimeSec(0)}
          timeSec={timeSec}
          onImageLoaded={triggerRender}
        />

        <ControlPanel
          dither={dither}
          setDither={setDither}
          grain={grain}
          setGrain={setGrain}
          vhs={vhs}
          setVhs={setVhs}
          ntsc={ntsc}
          setNtsc={setNtsc}
          channels={channels}
          setChannels={setChannels}
          lines={lines}
          setLines={setLines}
          onApplyPreset={handleApplyPreset}
          activePresetId={activePresetId}
        />
      </div>

      {/* Installation Modal */}
      <InstallModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </div>
  );
};
export default App;
