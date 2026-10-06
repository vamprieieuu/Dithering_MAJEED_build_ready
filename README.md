# YMDithers FX Studio — Web Dithering & Halftone Suite

A web-based recreation and interactive studio for **YMDithers**, bringing the 49 native dithering and continuous spot halftone algorithms directly into a modern browser interface.

## Features

- **49 Native Dithering Algorithms**:
  - **Error Diffusion (15)**: Floyd-Steinberg, Floyd-Steinberg Serpentine, Jarvis-Judice-Ninke, Stucki, Atkinson, Burkes, Sierra-3, Sierra Two-Row, Sierra Lite, Fan, Shiau-Fan, Skip Neighbours 1/2/3, Xerox Grain.
  - **Ordered & Stochastic (7)**: Bayer 2x2, Bayer 4x4, Bayer 8x8, Bayer 16x16, Blue Noise, Jimenez Interleaved Gradient Noise, White Noise.
  - **Continuous Halftone & Pattern Screens (27)**: Halftone (0°, 22.5°, 45° newspaper), Matrix, Square, Mosaic, Rekt Block, Row/Medium/Heavy/Column Modulations, Tilt (+45° engraving), Bitslash (-45°), Variable Hatch (woodcut), Grid, Cyber, Cross Square, Diamond, Star, Bytewav, Z-Modulation, Circuit, Vertical/Horizontal Stitch, Clock, Bi-thread, Knit.
- **5 Render Modes**:
  - Monochrome (Black & White or Custom Ink Color)
  - Duo-Tone (Shadow & Highlight custom ramp)
  - RGB (Per-channel error diffusion / screens)
  - Tonal Mode (1-Color, 2-Color, 3-Color Highlight/Midtone/Shadow bands with background knockout)
  - Color Grade Mode (Indexed Palette Quantization with presets including Game Boy, Macintosh, Risograph, Cyberpunk, CGA, C64, PICO-8, and custom swatch editing)
- **Image Preprocessing**:
  - 5-point Tonal Levels (Shadows, Gamma Midpoint, Highlights)
  - Edge Sharpening (Unsharp Mask with Strength & Radius)
  - Pre-Blur & Denoise / Grain Noise
  - Hue Rotation & Saturation
  - Photographic Negative Invert
- **Interactive Viewport**:
  - Split Before/After compare slider
  - Side-by-side and isolated view modes
  - Smooth Zoom & Pan
  - Eyedropper Color Sampler
- **Aesthetic Preset Recipes**:
  - 1-click recipes for Game Boy (1989), 45° Newspaper Halftone, Macintosh 1-Bit Atkinson, Risograph 3-Color, Cyberpunk 2084 Terminal, CRT Slot-Mask TV, and Xerox Zine Toner.
- **Export Options**:
  - PNG & JPEG at 1x, 2x, 4x print resolution
  - Vector SVG dither output
  - Palette JSON copy
