export interface DitherConfig {
  algo: number;
  mode: number; // 0: RGB, 1: Mono, 2: Duo-tone, 3: CMYK, 4: Tri-tone
  levels: number;
  scale: number;
  threshold: number;
  spread: number;
  patternScale: number;
  patternAngle: number;
  contrast: number;
  brightness: number;
  noise: number;
  serpentine: boolean;
  pixelate: boolean;
  animate: boolean;
  seed: number;
  darkColor: string;
  lightColor: string;
  midColor: string;
}

export interface GrainConfig {
  enabled: boolean;
  type: number; // 0: Crystal, 1: Gauss, 2: Tape, 3: Cluster
  sizeMm: number; // 4, 8, 12, 16, 24, 32, 48, 64
  amount: number;
  density: number;
  contrast: number;
  softness: number;
  lumaResponse: number;
  shadows: number;
  midtones: number;
  highlights: number;
  colorMode: boolean; // true: Color (RGB dye), false: Mono (Silver)
  autoAnim: boolean;
  speed: number;
  seed: number;
}

export interface VHSConfig {
  enabled: boolean;
  trackAmount: number;
  headSwitch: number;
  jitter: number;
  vertInstability: number;
  chromaBleed: number;
  chromaShift: number;
  staticAmount: number;
  dashes: number;
  streaks: number;
  scanlines: number;
  scanPitch: number;
  flicker: number;
  speed: number;
  seed: number;
}

export interface NTSCConfig {
  enabled: boolean;
  dotCrawl: number;
  chromaBleed: number;
  carrierFreq: number;
  phaseSkew: number;
  ghosting: number;
  ghostShift: number;
  ringing: number;
  scanlines: number;
  rfSnow: number;
  speed: number;
  seed: number;
}

export interface ChannelsConfig {
  enabled: boolean;
  amount: number;
  angle: number;
  radial: boolean;
  jitter: number;
}

export interface LinesConfig {
  enabled: boolean;
  amount: number;
  length: number;
  width: number;
  curvature: number;
  kink: number;
  opacity: number;
  color: string;
  autoAnim: boolean;
  speed: number;
  objectMode: boolean;
  edgeThreshold: number;
  edgeSensitivity: number;
  edgeDirection: number; // 0: Along, 1: Perp, 2: Random
}

export interface StudioPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  dither: Partial<DitherConfig>;
  grain: Partial<GrainConfig>;
  vhs: Partial<VHSConfig>;
  ntsc: Partial<NTSCConfig>;
  channels: Partial<ChannelsConfig>;
  lines: Partial<LinesConfig>;
}
