export interface AlgoDef {
  id: number;
  name: string;
  category: 'bayer' | 'noise' | 'diffusion' | 'halftone' | 'special';
  desc: string;
}

export const DITHER_ALGORITHMS: AlgoDef[] = [
  // Error Diffusion
  { id: 0, name: "Floyd-Steinberg", category: "diffusion", desc: "Classic 4-tap diffusion, organic stipple" },
  { id: 1, name: "Atkinson (Mac Classic)", category: "diffusion", desc: "Subtle 6-tap 3/4 diffusion with high contrast midtones" },
  { id: 2, name: "Jarvis-Judice-Ninke", category: "diffusion", desc: "12-tap broad diffusion with ultra smooth tonal gradients" },
  { id: 3, name: "Stucki", category: "diffusion", desc: "Fast 12-tap variant with crisp contrast" },
  { id: 4, name: "Burkes", category: "diffusion", desc: "Clean 7-tap diffusion avoiding worm artifacts" },
  { id: 5, name: "Sierra-3", category: "diffusion", desc: "Frank Sierra's 10-tap smooth distribution" },
  { id: 6, name: "Two-Row Sierra", category: "diffusion", desc: "7-tap intermediate diffusion" },
  { id: 7, name: "Sierra Lite", category: "diffusion", desc: "3-tap fast retro diffusion" },
  { id: 8, name: "Fan 1993", category: "diffusion", desc: "Adaptive weights for reduced directional bias" },
  { id: 9, name: "Shiau-Fan", category: "diffusion", desc: "Reduced worm artifacts for fine linework" },

  // Bayer Ordered
  { id: 10, name: "Bayer 2x2", category: "bayer", desc: "Coarse 4-level ordered grid" },
  { id: 11, name: "Bayer 3x3", category: "bayer", desc: "9-level odd matrix cross pattern" },
  { id: 12, name: "Bayer 4x4", category: "bayer", desc: "Standard 16-level ordered dither" },
  { id: 13, name: "Bayer 8x8", category: "bayer", desc: "64-level smooth ordered dither" },
  { id: 14, name: "Bayer 16x16", category: "bayer", desc: "256-level ultra-high definition matrix" },

  // Blue Noise & Stochastic
  { id: 15, name: "Blue Noise 64x64", category: "noise", desc: "Void-and-cluster frequency tailored stipple" },
  { id: 16, name: "Interleaved Gradient (IGN)", category: "noise", desc: "Jorge Jimenez's temporal anti-aliasing pattern" },
  { id: 17, name: "White Noise (Random)", category: "noise", desc: "Pure high-entropy stochastic thresholding" },

  // Continuous Halftone Screens
  { id: 18, name: "Halftone Dot 45°", category: "halftone", desc: "Classic printing press offset screen" },
  { id: 19, name: "Round Dot", category: "halftone", desc: "Euclidean dot matrix with circular rosettes" },
  { id: 20, name: "Elliptical Dot", category: "halftone", desc: "Directional ellipse for photographic prints" },
  { id: 21, name: "Horizontal Line", category: "halftone", desc: "Linear raster scanline screen" },
  { id: 22, name: "Medium Line", category: "halftone", desc: "Engraving woodcut line screen" },
  { id: 23, name: "Heavy Line", category: "halftone", desc: "Bold posterization line art" },
  { id: 24, name: "Vertical Line", category: "halftone", desc: "Vertical optical striping" },
  { id: 25, name: "Diagonal Slash 45°", category: "halftone", desc: "Forward diagonal hatch" },
  { id: 26, name: "Diagonal Back 135°", category: "halftone", desc: "Reverse diagonal hatch" },
  { id: 27, name: "Crosshatch Screen", category: "halftone", desc: "Intersecting pen-and-ink cross pattern" },
  { id: 28, name: "Square Screen", category: "halftone", desc: "Isometric square grid screen" },
  { id: 29, name: "Diamond Screen", category: "halftone", desc: "Rhombus 45° diamond screen" },
  { id: 30, name: "Star Screen", category: "halftone", desc: "Astroid 4-point star burst" },
  { id: 31, name: "Cyber Octagon", category: "halftone", desc: "Futuristic 8-sided aperture screen" },
  { id: 32, name: "Cross Screen", category: "halftone", desc: "Greek cross halftone pattern" },
  { id: 33, name: "Mosaic Halftone", category: "halftone", desc: "Stained-glass polygonal halftone tiles" },
];
