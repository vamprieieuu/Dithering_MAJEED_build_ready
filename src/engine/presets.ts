import { Preset } from '../types/dither';

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'macintosh_1984',
    name: 'Macintosh 1984 (Bill Atkinson)',
    category: 'Vintage Computer',
    description: 'Crisp 1-bit Atkinson error diffusion with pristine high-contrast edges and zero color contamination.',
    settings: {
      algo: 4, // Atkinson
      mode: 'mono',
      levels: 2,
      scale: 1,
      threshold: 50,
      amount: 100,
      whiteAmount: 100,
      blackAmount: 100,
      strength: 100,
      contrast: 110,
      brightness: 0,
      noise: 0,
      pixelate: false,
      enableLines: false,
    }
  },
  {
    id: 'gameboy_dmg',
    name: 'Nintendo Game Boy DMG-01',
    category: 'Retro Gaming',
    description: 'Iconic 4-shade greenish LCD phosphor with 4x4 ordered Bayer matrix dithering.',
    settings: {
      algo: 16, // Bayer 4x4
      mode: 'indexed',
      selectedPalette: 'gameboy',
      levels: 4,
      scale: 2,
      threshold: 50,
      amount: 100,
      strength: 100,
      contrast: 115,
      brightness: -5,
      noise: 0,
      pixelate: true,
      enableLines: false,
    }
  },
  {
    id: 'newsprint_45',
    name: 'Offset Newsprint Halftone 45°',
    category: 'Print & Press',
    description: 'Authentic 45-degree angled newspaper screening with continuous round dots.',
    settings: {
      algo: 24, // Halftone 45
      mode: 'mono',
      levels: 2,
      scale: 2,
      patternScale: 120,
      patternAngle: 0,
      threshold: 52,
      amount: 100,
      strength: 110,
      contrast: 120,
      brightness: 5,
      noise: 4,
      pixelate: false,
      enableLines: false,
    }
  },
  {
    id: 'cmyk_press',
    name: 'CMYK 4-Plate Separation',
    category: 'Print & Press',
    description: 'Full CMYK process separation with standard screen rosette angles: C=15°, M=75°, Y=0°, K=45°.',
    settings: {
      algo: 22, // Halftone
      mode: 'cmyk',
      levels: 2,
      scale: 2,
      patternScale: 100,
      patternAngle: 0,
      threshold: 50,
      amount: 100,
      strength: 100,
      contrast: 105,
      brightness: 0,
      noise: 0,
      pixelate: false,
      enableLines: false,
    }
  },
  {
    id: 'xerox_zine',
    name: 'Underground Zine Photocopy',
    category: 'Street Art & Print',
    description: 'Grainy, high-contrast xerographic toner bloom with edge boosting and noise.',
    settings: {
      algo: 14, // Xerox Grain
      mode: 'mono',
      levels: 2,
      scale: 1,
      threshold: 48,
      amount: 100,
      strength: 140,
      contrast: 135,
      brightness: -5,
      noise: 25,
      pixelate: false,
      sharpenStrength: 80,
      enableLines: true,
      linesAmount: 180,
      lineObjectMode: true,
      lineLength: 35,
      lineWidth: 1.2,
      lineColor: '#ffffff',
      lineOpacity: 70,
    }
  },
  {
    id: 'cyberpunk_matrix',
    name: 'Cyberpunk LED Terminal',
    category: 'Sci-Fi & Terminal',
    description: 'High-density LED / CRT matrix with neon phosphor and contour lines.',
    settings: {
      algo: 25, // Matrix
      mode: 'duo',
      darkColor: '#0a0d14',
      lightColor: '#00ffaa',
      levels: 2,
      scale: 2,
      patternScale: 90,
      threshold: 50,
      amount: 100,
      strength: 110,
      contrast: 125,
      brightness: 10,
      pixelate: false,
      enableLines: true,
      linesAmount: 240,
      lineObjectMode: true,
      lineColor: '#00ffcc',
      lineOpacity: 85,
      lineHandMade: true,
      lineCurve: 25,
    }
  },
  {
    id: 'risograph_duo',
    name: 'Risograph Blue & Coral Duo-Tone',
    category: 'Print & Press',
    description: 'Indie art printmaker aesthetic with blue and coral inks and Blue Noise isotropic stippling.',
    settings: {
      algo: 19, // Blue Noise
      mode: 'duo',
      darkColor: '#002244',
      lightColor: '#ff6666',
      levels: 2,
      scale: 1,
      threshold: 50,
      amount: 100,
      strength: 95,
      contrast: 100,
      brightness: 0,
      noise: 0,
      pixelate: false,
      enableLines: false,
    }
  },
  {
    id: 'crt_slot_mask',
    name: '90s CRT Slot-Mask',
    category: 'Retro Gaming',
    description: 'Notched horizontal scanline and CRT phosphor bar modulation preserving full RGB color.',
    settings: {
      algo: 30, // Medium Modulation
      mode: 'rgb',
      levels: 3,
      scale: 2,
      threshold: 50,
      amount: 100,
      strength: 100,
      patternScale: 100,
      contrast: 110,
      brightness: 5,
      pixelate: false,
      enableLines: false,
    }
  }
];
