import { Preset } from './types';
import { PALETTE_PRESETS } from './engine/paletteUtils';

export const STUDIO_PRESETS: Preset[] = [
  {
    id: 'newspaper-halftone',
    name: 'Newspaper Halftone (300 DPI)',
    category: 'Print & Halftone',
    description: 'Classic 45° offset round-dot newspaper screen with rich tonal contrast.',
    params: {
      algoId: 24, // Halftone 45°
      dpi: 300,
      scale: 3,
      renderMode: 'tonal',
      tonalMapping: 2,
      highlightsColor: '#ffffff',
      shadowsColor: '#121214',
      backgroundColor: '#f4ede2',
      sharpenStrength: 45,
      levels: { inBlack: 15, inGamma: 1.05, inWhite: 240, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'xerox-grain',
    name: '90s Photocopy / Xerox Grain',
    category: 'Vintage & Analog',
    description: 'Gritty toner edge Laplacian sharpening with grainy serpentine diffusion.',
    params: {
      algoId: 14, // Xerox Grain
      dpi: 300,
      scale: 2,
      renderMode: 'tonal',
      tonalMapping: 1,
      highlightsColor: '#050505',
      backgroundColor: '#e8e6df',
      knockoutMode: false,
      sharpenStrength: 80,
      noise: 28,
      levels: { inBlack: 35, inGamma: 0.9, inWhite: 220, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'mac-1bit-atkinson',
    name: 'Apple Macintosh 1984 (Atkinson)',
    category: 'Retro Computing',
    description: 'Bill Atkinson’s iconic 6/8 error diffusion algorithm from the original 1984 Mac OS.',
    params: {
      algoId: 4, // Atkinson
      dpi: 100,
      scale: 2,
      renderMode: 'grade',
      colorspace: 'indexed',
      palette: PALETTE_PRESETS['mac-1bit'].colors,
      sharpenStrength: 30,
      levels: { inBlack: 10, inGamma: 1.0, inWhite: 245, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'gameboy-1989',
    name: 'Nintendo Game Boy 1989',
    category: 'Retro Computing',
    description: '4-level olive green LCD palette with classic 4x4 Bayer matrix ordered dithering.',
    params: {
      algoId: 16, // Bayer 4x4
      dpi: 100,
      scale: 3,
      renderMode: 'grade',
      colorspace: 'indexed',
      palette: PALETTE_PRESETS['gameboy-original'].colors,
      levels: { inBlack: 5, inGamma: 1.1, inWhite: 250, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'risograph-duo',
    name: 'Risograph 3-Tone Spot Inks',
    category: 'Print & Halftone',
    description: 'Fluorescent pink and electric blue screenprinting with distinct ink layer separation.',
    params: {
      algoId: 23, // Halftone 22.5°
      dpi: 300,
      scale: 4,
      renderMode: 'tonal',
      tonalMapping: 3,
      highlightsColor: '#ff007f',
      midtonesColor: '#0077ff',
      shadowsColor: '#1a0033',
      backgroundColor: '#fbfbf7',
      knockoutMode: false,
      midtonesOverlap: 75,
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon Matrix',
    category: 'Sci-Fi & Glitch',
    description: 'Fine LED dot matrix grid with ultra-vibrant electric neon color grade.',
    params: {
      algoId: 25, // Matrix
      dpi: 200,
      scale: 3,
      renderMode: 'grade',
      colorspace: 'indexed',
      palette: PALETTE_PRESETS['cyberpunk'].colors,
      spread: 85,
      sharpenStrength: 60,
    },
  },
  {
    id: 'woodcut-hatch',
    name: 'Japanese Woodcut Engraving',
    category: 'Artistic & Traditional',
    description: 'Woodcut cross-hatching spot screens transitioning from single lines to cross-hatches.',
    params: {
      algoId: 35, // Variable Hatch
      dpi: 300,
      scale: 3,
      renderMode: 'tonal',
      tonalMapping: 2,
      highlightsColor: '#2b231d',
      shadowsColor: '#120d09',
      backgroundColor: '#ede3d1',
      levels: { inBlack: 20, inGamma: 1.0, inWhite: 235, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'crt-scanline',
    name: 'Sony Trinitron CRT Scanlines',
    category: 'Vintage & Analog',
    description: 'Aperture-grille horizontal row modulation with warm analog phosphor feeling.',
    params: {
      algoId: 29, // Row Modulation
      dpi: 200,
      scale: 2,
      renderMode: 'grade',
      colorspace: 'indexed',
      palette: PALETTE_PRESETS['retro-warm'].colors,
      levels: { inBlack: 15, inGamma: 1.2, inWhite: 250, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'pcb-blueprint',
    name: 'PCB Circuit Blueprint',
    category: 'Technical & Blueprint',
    description: 'Concentric copper circuit tracks and solder pad geometry screens.',
    params: {
      algoId: 43, // Circuit Modulation
      dpi: 300,
      scale: 3,
      renderMode: 'tonal',
      tonalMapping: 2,
      highlightsColor: '#00ffff',
      shadowsColor: '#002855',
      backgroundColor: '#001428',
    },
  },
  {
    id: 'blue-noise-stipple',
    name: 'Blue Noise Fine Stippling',
    category: 'Artistic & Traditional',
    description: 'Isotropic high-frequency stippling with zero repeating grid patterns.',
    params: {
      algoId: 19, // Blue Noise
      dpi: 300,
      scale: 1,
      renderMode: 'tonal',
      tonalMapping: 1,
      highlightsColor: '#18181b',
      backgroundColor: '#fafafa',
      levels: { inBlack: 10, inGamma: 1.0, inWhite: 245, outBlack: 0, outWhite: 255 },
    },
  },
  {
    id: 'pico8-retro',
    name: 'PICO-8 16-Color Palette',
    category: 'Retro Computing',
    description: 'The beloved 16-color fantasy console palette paired with 8x8 Bayer ordered dithering.',
    params: {
      algoId: 17, // Bayer 8x8
      dpi: 100,
      scale: 2,
      renderMode: 'grade',
      colorspace: 'indexed',
      palette: PALETTE_PRESETS['pico8'].colors,
    },
  },
  {
    id: 'vhs-glitch-negative',
    name: 'VHS Double-Inverted Aesthetic',
    category: 'Sci-Fi & Glitch',
    description: 'Heavy notched bar modulation blended with double photographic negative inversion.',
    params: {
      algoId: 31, // Heavy Modulation
      dpi: 200,
      scale: 3,
      renderMode: 'grade',
      colorspace: 'rgb',
      invert: 65,
      noise: 35,
      hue: -25,
      saturation: 45,
    },
  },
];
