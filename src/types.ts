export type DitherKind = 'error' | 'bayer' | 'blue' | 'ign' | 'white' | 'screen';

export interface DitherAlgoInfo {
  id: number;
  name: string;
  category: 'DIFFUSION' | 'MODULATION' | 'SIERRA' | 'HALFTONE' | 'MOSAIC' | 'PATTERN' | 'BAYER' | 'OTHER' | 'SKIP NEIGHBOURS';
  kind: DitherKind;
  param: number;
  cell: number;
  angle: number;
  desc: string;
}

export type RenderMode = 'tonal' | 'grade';
export type TonalCount = 1 | 2 | 3;
export type ColorspaceMode = 'gray' | 'rgb' | 'indexed';
export type DpiOption = 75 | 100 | 200 | 300 | 450 | 600;

export interface LevelsParams {
  inBlack: number;   // 0..255
  inGamma: number;   // 0.1..5.0 (1.0 = linear)
  inWhite: number;   // 0..255
  outBlack: number;  // 0..255
  outWhite: number;  // 0..255
}

export interface LinesParams {
  enabled: boolean;
  amount: number;       // strand count (10..1500)
  length: number;       // base strand length (5..200)
  width: number;        // thickness in px (0.5..8)
  opacity: number;      // 0..100
  colorMode: 'single' | 'sampled' | 'random';
  color: string;        // hex color
  objectMode: boolean;  // strictly follow object contours (Sobel/Canny)
  edgeThreshold: number; // 5..90
  handMade: boolean;    // organic hand-drawn deviation
  curve: number;        // curvature (0..100)
  duplicate: boolean;   // companion lines
  duplicateCount: number;
  duplicateOffset: number;
}

export interface DitherStudioParams {
  dpi: DpiOption;
  scale: number;           // 1..25
  linkDpiScale: boolean;
  algoId: number;          // 0..48
  renderMode: RenderMode;  // tonal vs grade
  
  // Effect Controls
  levels: LevelsParams;
  sharpenStrength: number; // 0..200
  sharpenRadius: number;   // 0..20
  noise: number;           // -25 (denoise) .. 50 (film grain)
  blur: number;            // 0..20
  
  // Tonal Controls
  tonalMapping: TonalCount; // 1, 2, 3 colors
  highlightsThreshold: number; // 0..255 (or 0..170)
  midtonesOverlap: number;     // 0..128
  shadowsThreshold: number;    // 0..128
  highlightsColor: string;     // Hex
  midtonesColor: string;       // Hex
  shadowsColor: string;        // Hex
  backgroundColor: string;     // Hex
  knockoutMode: boolean;       // transparent background
  
  // Color Controls (Grade Mode)
  colorspace: ColorspaceMode;
  indexColorsCount: number;    // 2..64
  palette: string[];           // Active palette hex array
  suppressedSwatches: number[];// Indices of muted swatches
  spread: number;              // 0..100 (in halftone/indexed mode)
  gradeSource: string;         // Preset tone bias name
  gradeBias: number;           // 0..100
  hue: number;                 // -180..180
  saturation: number;          // -100..100
  invert: number;              // 0..100
  fadeMode: boolean;           // grain (stippled <=8 colors) vs fade (posterized <=64 colors)
  
  // Advanced & Modifiers
  serpentine: boolean;
  pixelate: boolean;
  dotCoverage: number;         // 0..100 (amount)
  whiteCoverage: number;       // 0..100
  blackCoverage: number;       // 0..100
  
  // Contour Lines Overlay
  lines: LinesParams;
}

export interface Preset {
  id: string;
  name: string;
  category: string;
  description: string;
  params: Partial<DitherStudioParams>;
}
