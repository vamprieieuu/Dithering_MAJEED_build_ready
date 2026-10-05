import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Viewport } from './components/Viewport';
import { ControlPanel } from './components/ControlPanel';
import { SampleModal } from './components/SampleModal';
import { ExportModal } from './components/ExportModal';
import { DitherSettings } from './types/dither';
import { processDither, hexToRgb, DITHER_ALGOS } from './engine/ditherEngine';
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
  // Full-resolution original image for pristine 1:1 export
  const [fullResOriginalImage, setFullResOriginalImage] = useState<ImageData | null>(null);
  // Preview image for interactive viewport
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [ditheredImage, setDitheredImage] = useState<ImageData | null>(null);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with high quality sample image on first load
  useEffect(() => {
    const defaultSample = SAMPLE_IMAGES[0];
    const initialData = defaultSample.generate(640, 640);
    setFullResOriginalImage(initialData);
    setOriginalImage(initialData);
  }, []);

  // Compute active palette colors
  const getActivePaletteRgb = useCallback((): [number, number, number][] => {
    const pal = PRESET_PALETTES.find((p) => p.id === settings.selectedPalette);
    const colors = pal ? pal.colors : PRESET_PALETTES[0].colors;
    return colors.map((hex) => hexToRgb(hex));
  }, [settings.selectedPalette]);

  // Re-run dither for preview whenever settings or preview image updates
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

  // Handle image file upload - preserves 100% full original resolution for export!
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const fullW = img.naturalWidth || img.width;
        const fullH = img.naturalHeight || img.height;

        // 1. Store FULL original resolution image data
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = fullW;
        fullCanvas.height = fullH;
        const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
        if (fullCtx) {
          fullCtx.drawImage(img, 0, 0);
          const fullImgData = fullCtx.getImageData(0, 0, fullW, fullH);
          setFullResOriginalImage(fullImgData);
        }

        // 2. Prepare interactive preview (if full image is very large, downscale for 60fps sliders)
        const maxPreviewDim = 1200;
        let prevW = fullW;
        let prevH = fullH;
        if (fullW > maxPreviewDim || fullH > maxPreviewDim) {
          if (fullW > fullH) {
            prevH = Math.round((fullH * maxPreviewDim) / fullW);
            prevW = maxPreviewDim;
          } else {
            prevW = Math.round((fullW * maxPreviewDim) / fullH);
            prevH = maxPreviewDim;
          }
        }

        const prevCanvas = document.createElement('canvas');
        prevCanvas.width = prevW;
        prevCanvas.height = prevH;
        const prevCtx = prevCanvas.getContext('2d', { willReadFrequently: true });
        if (prevCtx) {
          prevCtx.drawImage(img, 0, 0, prevW, prevH);
          const prevImgData = prevCtx.getImageData(0, 0, prevW, prevH);
          setOriginalImage(prevImgData);
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

  // High-Resolution Image Export
  // Directly renders the actual full-resolution source image (NOT a screenshot or downsampled preview)
  const handleExport = async (format: 'png' | 'jpeg', quality: number): Promise<void> => {
    const targetSource = fullResOriginalImage || originalImage;
    if (!targetSource) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const fullW = targetSource.width;
        const fullH = targetSource.height;

        // Process dither at 100% full original resolution
        const activePalRgb = getActivePaletteRgb();
        const fullProcessed = processDither(targetSource, settings, activePalRgb);

        // Offscreen export canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = fullW;
        exportCanvas.height = fullH;
        const ctx = exportCanvas.getContext('2d', { alpha: format === 'png' });
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // For JPEG, composite with white background to prevent black alpha matte
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, fullW, fullH);
        }

        // Put the exact full-resolution dithered pixels (preserves Alpha if PNG)
        ctx.putImageData(fullProcessed, 0, 0);

        // Render lines overlay if enabled at full resolution
        if (settings.enableLines) {
          renderLinesOverlay(ctx, targetSource, settings);
        }

        // Generate download Blob
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const fileExt = format === 'jpeg' ? 'jpg' : 'png';

        exportCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const cleanAlgoName = (DITHER_ALGOS[settings.algo]?.name || 'Dither')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_');
            a.download = `YMDithers_${cleanAlgoName}_${fullW}x${fullH}_${Date.now()}.${fileExt}`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            resolve();
          },
          mimeType,
          quality
        );
      } catch (err) {
        reject(err);
      }
    });
  };

  const currentAlgo = DITHER_ALGOS[settings.algo] || DITHER_ALGOS[0];
  const exportW = fullResOriginalImage?.width || originalImage?.width || 0;
  const exportH = fullResOriginalImage?.height || originalImage?.height || 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f]">
      {/* Top Application Bar */}
      <Header
        onOpenExportModal={() => setExportModalOpen(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        onReset={handleReset}
        onApplyPreset={handleApplyPreset}
        currentSettings={settings}
        compareMode={compareMode}
        onToggleCompare={() => setCompareMode(!compareMode)}
        onOpenSampleModal={() => setSampleModalOpen(true)}
      />

      {/* Hidden file input for header upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUploadFile(e.target.files[0]);
          }
        }}
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
          const data = sample.generate(640, 640);
          setFullResOriginalImage(data);
          setOriginalImage(data);
        }}
      />

      {/* High-Resolution Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        imageWidth={exportW}
        imageHeight={exportH}
        algoName={currentAlgo.name}
        colorMode={settings.mode}
      />
    </div>
  );
};
