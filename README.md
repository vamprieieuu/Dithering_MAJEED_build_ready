# YMDithers — Native Adobe After Effects 23.2.1 Plugin (`YMDithers.aex`)

`YMDithers.aex` is a native Windows x64 SmartFX plugin (8-bit, 16-bit, and 32-bit float) for **Adobe After Effects 23.2.1** (menu: `Effect > YMDithers > YMDithers`).

All image processing runs natively inside the C++ engine (`core/`) on the target layer — no native After Effects helper effects, extra layers, solids, or precompositions are created.

## Modules Included in `YMDithers`

1. **Dither & Halftone (`core/dither.cpp`)**
   - 49 distinct dithering and halftone algorithms:
     - **Error Diffusion (15):** Floyd-Steinberg, Floyd-Steinberg Serpentine, Jarvis-Judice-Ninke, Stucki, Atkinson, Burkes, Sierra, Sierra Two Row, Sierra Lite, Fan, Shiau-Fan, Skip Neighbours, Skip1 Neighbours, Skip2 Neighbours, Xerox Grain.
     - **Ordered & Stochastic (7):** Bayer 2x2, Bayer 4x4, Bayer 8x8, Bayer 16x16, Blue Noise, Interleaved Gradient Noise, White Noise.
     - **Halftone & Pattern Screens (27):** Halftone (0°, 22.5°, 45°), Matrix, Square Halftone, Mosaic Halftone, Rekt Block, Row/Medium/Heavy/Column/Tilt Modulation, Bitslash, Variable Hatch, Grid Modulation, Cyber, Cross Square, Diamond, Star, Bytewav, Z-Modulation, Circuit Modulation, Vertical/Horizontal Stitch, Clock, Bi-thread, Knit.
   - **Color Modes (5):** Preserve Original Colors (RGB), Monochrome (B&W), Custom Duo-Tone, CMYK Angled Halftone Separation, Tonal Tri-Tone Ramp.
   - Dedicated controls for **Levels (Tones)**, **Scale**, **Threshold (Density)**, **Strength (Spread)**, **Pattern Scale**, **Pattern Angle**, **Contrast**, **Brightness**, **Randomness (Jitter)**, **Serpentine**, and **Automatic Temporal Animation**.

2. **Color, Tone & Preprocess (`ae/MajeedDither.cpp`)**
   - Hue Shift, Saturation, Grade Bias, Invert, Indexed Palette Quantization, Tri-Tone Color Mapping (Highlights / Midtones / Shadows), Denoise / Pre-Noise, Pre-Blur, and Unsharp Mask.

3. **Smart Film Grain (`core/grain.cpp`)**
   - Resolution-adaptive physical grain sizes: **4mm, 8mm, 12mm, 16mm, 24mm, 32mm, 48mm, 64mm** + Custom size.
   - Multi-scale rotated isotropic halide crystal synthesis (no blocky squares or Voronoi grid artifacts).
   - **Smart Luminance Response:** H&D film curve toe/shoulder roll-off with independent Shadows, Midtones, and Highlights response plus image-linked crystal nucleation.
   - **Color Grain (RGB Dye Clouds)** and **Monochrome Grain** modes.
   - **Automatic Deterministic Frame Animation** without keyframing Seed.

4. **VHS Tape (`core/vhs.cpp`)**
   - Tracking wobble & rolling tracking bar, Head-switching skew, Per-line horizontal jitter, Vertical frame bounce/instability, YIQ Chroma bleed & shift, Tape oxide dropouts (dashes), Vertical streaks, Interlaced scanlines, Flicker, and Tape static — all deterministically animated per frame.

5. **NTSC Analog (`core/vhs.cpp`)**
   - 3.58MHz Composite YIQ subcarrier modulation & demodulation (**Dot Crawl** and **Cross-Color Rainbow** artifacts), asymmetric I/Q bandwidth filtering, analog Luma edge ringing/overshoot, H-Sync phase skew, multipath RF ghosting echo, interlaced scanlines, and animated RF snow.

6. **Channels & Lines (`core/channels.cpp`, `core/lines.cpp`)**
   - True per-channel sub-pixel RGB resampling (Linear & Radial chromatic separation + animated row jitter) and procedural anti-aliased Bezier film scratches/lines.

## Build Instructions (Windows x64 / Visual Studio 2022)

```powershell
cmake -S . -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release --target YMDithers --parallel
```

Output binary: `build/bin/Release/YMDithers.aex`

## Installation

Copy `YMDithers.aex` to:
```text
C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\Plug-ins\
```
Then apply via **Effect > YMDithers > YMDithers**.
