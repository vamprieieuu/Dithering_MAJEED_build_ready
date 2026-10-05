import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasViewport } from './components/CanvasViewport';
import { InfoModal } from './components/InfoModal';
import { ExportModal } from './components/ExportModal';
import { DitherParams, LinesParams } from './types/dither';
import { renderDitherEngine } from './core/ditherEngine';
import { generateLinesOverlay, RenderedLine } from './core/linesEngine';
import { SAMPLE_IMAGES } from './data/sampleImages';
import { StudioStylePreset } from './data/palettes';

const DEFAULT_DITHER_PARAMS: DitherParams = {
  algoId: 24, // Halftone 45
  mode: 'monochrome',
  dpi: 300,
  scale: 3,
  threshold: 50,
  amount: 100,
  whiteAmount: 100,
  blackAmount: 100,
  spread: 100,
  patternScale: 100,
  patternAngle: 0,
  contrast: 120,
  brightness: 0,
  noise: 0,
  serpentine: true,
  pixelate: false,
  seed: 1337,
};

const DEFAULT_LINES_PARAMS: LinesParams = {
  enabled: false,
  amount: 450,
  length: 35,
  lengthRand: 35,
  width: 1.0,
  widthRand: 25,
  direction: 'along',
  directionAngle: 0,
  directionRand: 30,
  colorMode: 'white',
  color: '#ffffff',
  colorRand: 0,
  opacity: 90,
  motion: false,
  motionSpeed: 100,
  motionRand: 40,
  objectMode: true, // When ON: strict contour tracking with ZERO GAP
  edgeThreshold: 22,
  edgeSensitivity: 75,
  edgeOffset: 0.0, // strictly 0 gap default
  handMade: true,
  curve: 25,
  duplicate: false,
  duplicateCount: 1,
  duplicateOffset: 2.5,
  duplicateLength: 90,
  duplicateWidth: 0.8,
  duplicateOpacity: 75,
};

export const App: React.FC = () => {
  const [currentSampleId, setCurrentSampleId] = useState<string>('cyber-portrait');
  const [params, setParams] = useState<DitherParams>(DEFAULT_DITHER_PARAMS);
  const [linesParams, setLinesParams] = useState<LinesParams>(DEFAULT_LINES_PARAMS);

  const [originalData, setOriginalData] = useState<ImageData | null>(null);
  const [ditheredData, setDitheredData] = useState<ImageData | null>(null);
  const [lines, setLines] = useState<RenderedLine[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);

  const [animTime, setAnimTime] = useState<number>(0);

  useEffect(() => {
    loadSampleImage(currentSampleId);
  }, []);

  const loadSampleImage = (sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId) || SAMPLE_IMAGES[0];
    const data = sample.generate(640, 640);
    setOriginalData(data);
    setCurrentSampleId(sample.id);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 1024;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        setOriginalData(data);
        setCurrentSampleId('custom');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Animation frame loop if motion is enabled
  useEffect(() => {
    if (!linesParams.enabled || !linesParams.motion) return;
    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsedSec = (now - startTime) / 1000.0;
      setAnimTime(elapsedSec);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [linesParams.enabled, linesParams.motion]);

  const renderTimeoutRef = useRef<number | null>(null);

  const runProcessing = useCallback(() => {
    if (!originalData) return;
    setIsLoading(true);

    const t0 = performance.now();
    try {
      // 1. DITHER STAGE (with true dot density gating)
      const result = renderDitherEngine(originalData, params);
      setDitheredData(result);

      // 2. LINES STAGE (Canny contour following & hand-made curves)
      if (linesParams.enabled) {
        const lineOverlay = generateLinesOverlay(originalData, linesParams, animTime);
        setLines(lineOverlay);
      } else {
        setLines([]);
      }
      const t1 = performance.now();
      setRenderTimeMs(t1 - t0);
    } catch (err) {
      console.error('Rendering error', err);
    } finally {
      setIsLoading(false);
    }
  }, [originalData, params, linesParams, animTime]);

  useEffect(() => {
    if (renderTimeoutRef.current) {
      window.clearTimeout(renderTimeoutRef.current);
    }
    renderTimeoutRef.current = window.setTimeout(() => {
      runProcessing();
    }, 25);

    return () => {
      if (renderTimeoutRef.current) {
        window.clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [runProcessing]);

  const handleApplyPreset = (preset: StudioStylePreset) => {
    setParams((prev) => ({
      ...prev,
      algoId: preset.algoId,
      mode: preset.mode,
      scale: preset.scale,
      threshold: preset.threshold,
      amount: preset.amount,
      whiteAmount: preset.whiteAmount,
      blackAmount: preset.blackAmount,
      spread: preset.spread,
      patternScale: preset.patternScale,
      contrast: preset.contrast,
      brightness: preset.brightness,
      noise: preset.noise,
    }));

    if (preset.lines !== undefined) {
      setLinesParams((prev) => ({
        ...prev,
        enabled: preset.lines ?? false,
      }));
    }
  };

  const handleResetParams = () => {
    setParams(DEFAULT_DITHER_PARAMS);
    setLinesParams(DEFAULT_LINES_PARAMS);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0c0e]">
      {/* Top Application Header */}
      <Header
        currentSampleId={currentSampleId}
        onSelectSample={loadSampleImage}
        onApplyPreset={handleApplyPreset}
        onResetParams={handleResetParams}
        onOpenExport={() => setExportOpen(true)}
        onOpenInfo={() => setInfoOpen(true)}
        onFileUpload={handleFileUpload}
        renderTimeMs={renderTimeMs}
      />

      {/* Main Studio Workspace: Sidebar & Canvas */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          params={params}
          onChangeParams={setParams}
          linesParams={linesParams}
          onChangeLines={setLinesParams}
        />

        <CanvasViewport
          originalData={originalData}
          ditheredData={ditheredData}
          lines={lines}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <InfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        originalData={originalData}
        ditheredData={ditheredData}
        lines={lines}
        params={params}
      />
    </div>
  );
};
