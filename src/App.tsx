import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { DitherControls } from './components/DitherControls';
import { ExportModal } from './components/ExportModal';
import { AlgorithmInfoModal } from './components/AlgorithmInfoModal';
import { DitherParams, PresetStyle } from './types/dither';
import { processDither, ALGORITHMS } from './engine/ditherEngine';
import { SAMPLE_IMAGES } from './engine/sampleImages';

const DEFAULT_PARAMS: DitherParams = {
  algoId: 0, // Floyd-Steinberg
  dpi: 300,
  scale: 4,
  renderMode: 'tonal',

  // Density & Dot Coverage
  amount: 100,
  whiteAmount: 100,
  blackAmount: 100,
  threshold: 50,
  strength: 100,
  contrast: 110,
  brightness: 0,
  levelsCount: 2,

  // Tonal mode
  tonalCount: 1,
  highlightThreshold: 128,
  midtoneThreshold: 90,
  shadowThreshold: 45,
  highlightColor: '#00e5ff',
  midtoneColor: '#ff007f',
  shadowColor: '#12151c',
  backgroundColor: '#0a0c10',
  knockoutBg: false,

  // Color Grade
  colorspace: 'indexed',
  indexedColorCount: 8,
  spread: 100,
  palettePreset: 'classic-faded',
  customPalette: [],
  gradeBias: 0,
  gradeBiasSource: 'classic-faded',
  biasStyle: 'screen',
  grainMode: 'grain',
  hue: 0,
  saturation: 0,
  invert: false,

  // Pre-processing
  levels: {
    blackClip: 0,
    shadow: 0,
    mid: 1.0,
    highlight: 255,
    whiteClip: 255,
  },
  sharpenStrength: 15,
  sharpenRadius: 10,
  noise: 0,
  blur: 0,

  // Pattern
  patternScale: 100,
  patternAngle: 0,
  serpentine: true,
  pixelate: false,
  seed: 1,

  // Contour lines
  lines: {
    enabled: false,
    amount: 300,
    length: 45,
    width: 1.2,
    opacity: 80,
    curvature: 25,
    color: '#00e5ff',
    edgeGuided: true,
    duplicate: false,
  },
};

export function App() {
  const [params, setParams] = useState<DitherParams>(DEFAULT_PARAMS);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modals
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Worker / processing ref
  const renderTimeoutRef = useRef<number | null>(null);

  // Load sample image
  const loadSample = useCallback((sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId) || SAMPLE_IMAGES[0];
    const offCanvas = document.createElement('canvas');
    sample.generate(offCanvas);
    const ctx = offCanvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      setSourceImageData(imgData);
    }
  }, []);

  // Handle uploaded image file
  const handleUploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        // Cap max dimension to 1600px to maintain snappy responsive real-time dithering
        let w = img.width;
        let h = img.height;
        const maxDim = 1200;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        offCanvas.width = w;
        offCanvas.height = h;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          setSourceImageData(imgData);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (const item of Array.from(e.clipboardData.items)) {
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) handleUploadImage(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleUploadImage]);

  // Initial load
  useEffect(() => {
    loadSample('sculpture');
  }, [loadSample]);

  // Perform dithering when source image or parameters change
  useEffect(() => {
    if (!sourceImageData) return;

    if (renderTimeoutRef.current) {
      window.clearTimeout(renderTimeoutRef.current);
    }

    setIsProcessing(true);

    // Fast debounce for sliders
    renderTimeoutRef.current = window.setTimeout(() => {
      const t0 = performance.now();
      try {
        const result = processDither(sourceImageData, params);
        const t1 = performance.now();
        setProcessedImageData(result);
        setRenderTimeMs(t1 - t0);
      } catch (err) {
        console.error('Dithering calculation error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 20);

    return () => {
      if (renderTimeoutRef.current) {
        window.clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [sourceImageData, params]);

  // Update parameters helper
  const handleParamChange = (updated: Partial<DitherParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleResetParam = (key: keyof DitherParams) => {
    setParams((prev) => ({ ...prev, [key]: DEFAULT_PARAMS[key] }));
  };

  const handleSelectPreset = (preset: PresetStyle) => {
    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));
  };

  const activeAlgo = ALGORITHMS.find((a) => a.id === params.algoId) || ALGORITHMS[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0c0e]">
      {/* Top Header */}
      <Header
        onSelectSample={loadSample}
        onUploadImage={handleUploadImage}
        onSelectPreset={handleSelectPreset}
        onReset={() => setParams(DEFAULT_PARAMS)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        activeAlgoName={activeAlgo.name}
        isProcessing={isProcessing}
      />

      {/* Main Workspace: Left Canvas + Right Controls */}
      <div className="flex flex-1 overflow-hidden relative">
        <CanvasViewport
          processedImageData={processedImageData}
          sourceImageData={sourceImageData}
          linesConfig={params.lines}
          renderTimeMs={renderTimeMs}
        />

        <DitherControls
          params={params}
          onChange={handleParamChange}
          onResetParam={handleResetParam}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        processedImageData={processedImageData}
        params={params}
      />

      {/* Algorithm Encyclopedia Modal */}
      <AlgorithmInfoModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onSelectAlgo={(id) => handleParamChange({ algoId: id })}
      />
    </div>
  );
}

export default App;
