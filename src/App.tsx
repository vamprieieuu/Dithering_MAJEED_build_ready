import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Viewport } from './components/Viewport';
import { ControlPanel } from './components/ControlPanel';
import { SampleModal } from './components/SampleModal';
import { DitherSettings } from './types/dither';
import { processDither, hexToRgb } from './engine/ditherEngine';
import { renderLinesOverlay } from './engine/linesEngine';
import { SAMPLE_IMAGES, SampleImage } from './engine/samples';
import { PRESET_PALETTES } from './engine/palettes';
import { BUILT_IN_PRESETS } from './engine/presets';

const DEFAULT_SETTINGS: DitherSettings = {
  algo: 16, // Bayer 4x4
  mode: 'mono',
  levels: 2,
  scale: 2,
  threshold: 50,
  amount: 100,
  whiteAmount: 100,
  blackAmount: 100,
  strength: 100,
  patternScale: 100,
  patternAngle: 0,
  contrast: 110,
  brightness: 0,
  noise: 0,
  serpentine: true,
  linear: false,
  invert: false,
  pixelate: false,
  darkColor: '#000000',
  lightColor: '#ffffff',
  midColor: '#808080',
  selectedPalette: 'gameboy',
  customPalette: [],
  sharpenStrength: 0,
  sharpenRadius: 1,
  preBlur: 0,
  preNoise: 0,
  enableLines: false,
  linesAmount: 350,
  lineLength: 35,
  lineLengthRand: 30,
  lineWidth: 1.0,
  lineColor: '#ffffff',
  lineOpacity: 85,
  lineObjectMode: true,
  lineEdgeThreshold: 25,
  lineHandMade: true,
  lineCurve: 30,
  lineDuplicate: false,
  lineDuplicateCount: 1,
  lineDuplicateOffset: 2.5,
};

export const App: React.FC = () => {
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS);
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [ditheredImage, setDitheredImage] = useState<ImageData | null>(null);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize with high quality sample image on first load
  useEffect(() => {
    const defaultSample = SAMPLE_IMAGES[0];
    const initialData = defaultSample.generate(480, 480);
    setOriginalImage(initialData);
  }, []);

  // Compute active palette colors
  const getActivePaletteRgb = useCallback((): [number, number, number][] => {
    const pal = PRESET_PALETTES.find((p) => p.id === settings.selectedPalette);
    const colors = pal ? pal.colors : PRESET_PALETTES[0].colors;
    return colors.map((hex) => hexToRgb(hex));
  }, [settings.selectedPalette]);

  // Re-run dither whenever settings or originalImage updates
  useEffect(() => {
    if (!originalImage) return;

    const t0 = performance.now();
    const activePalRgb = getActivePaletteRgb();
    const processed = processDither(originalImage, settings, activePalRgb);
    const t1 = performance.now();

    setDitheredImage(processed);
    setRenderTimeMs(t1 - t0);

    // Update lines overlay if enabled
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        if (settings.enableLines) {
          renderLinesOverlay(ctx, originalImage, settings);
        }
      }
    }
  }, [originalImage, settings, getActivePaletteRgb]);

  // Handle image file upload
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Clamp maximum resolution to ~1024 to keep responsive interactive FPS
        let w = img.width;
        let h = img.height;
        const maxDim = 900;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          setOriginalImage(imgData);
        }
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset application
  const handleApplyPreset = (presetId: string) => {
    const preset = BUILT_IN_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({
        ...prev,
        ...preset.settings,
      }));
    }
  };

  // Reset to default settings
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Export high quality canvas download
  const handleExport = (format: 'png' | 'jpeg') => {
    if (!ditheredImage) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = ditheredImage.width;
    exportCanvas.height = ditheredImage.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Put dithered pixels
    ctx.putImageData(ditheredImage, 0, 0);

    // Draw lines overlay if canvas exists
    if (settings.enableLines && overlayCanvasRef.current) {
      ctx.drawImage(overlayCanvasRef.current, 0, 0);
    }

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `ymdithers_${Date.now()}.${ext}`;
    link.href = exportCanvas.toDataURL(mime, 0.95);
    link.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f]">
      {/* Top Application Bar */}
      <Header
        onExport={handleExport}
        onReset={handleReset}
        onApplyPreset={handleApplyPreset}
        currentSettings={settings}
        compareMode={compareMode}
        onToggleCompare={() => setCompareMode(!compareMode)}
        onOpenSampleModal={() => setSampleModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Central Pan & Zoom Canvas Viewport */}
        <Viewport
          originalImage={originalImage}
          ditheredImage={ditheredImage}
          renderTimeMs={renderTimeMs}
          compareMode={compareMode}
          onUploadFile={handleUploadFile}
          onOpenSampleModal={() => setSampleModalOpen(true)}
          overlayCanvasRef={overlayCanvasRef}
        />

        {/* Right Parameters & Modules Panel */}
        <ControlPanel
          settings={settings}
          onChange={setSettings}
          onReset={handleReset}
        />
      </div>

      {/* Sample Image Selection Modal */}
      <SampleModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        onSelectSample={(sample) => {
          const data = sample.generate(480, 480);
          setOriginalImage(data);
        }}
      />
    </div>
  );
};
