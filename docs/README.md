# YMDithers — Native After Effects 23.2.1 Plugin Architecture

`YMDithers.aex` is a self-contained Windows x64 SmartFX plugin (`Effect > YMDithers > YMDithers`). All pixels are rendered by the native C++ engine in `core/` without using any built-in After Effects helper effects or extra layers.

| Module | Source | Capabilities |
|---|---|---|
| Dither & Halftone | `core/dither.cpp` | 15 bounded error-diffusion kernels, analytical Bayer 2-16, isotropic Blue Noise, IGN, White Noise, 27 rank-normalized halftone/pattern screens, 5 color modes (RGB, B&W, Duo-Tone, CMYK Separation, Tri-Tone). |
| Smart Film Grain | `core/grain.cpp` | 4-64mm resolution-adaptive silver-halide grain, rotated dual-grid isotropic synthesis, H&D luminance response (Shadows/Midtones/Highlights), Color (RGB dye clouds) & Monochrome modes, automatic deterministic frame animation. |
| VHS Tape | `core/vhs.cpp` | Tracking wobble, head-switch skew, vertical frame instability, per-line jitter, YIQ chroma bleed, tape dropouts, vertical streaks, scanlines, flicker, and tape static. |
| NTSC Analog | `core/vhs.cpp` | 3.58MHz YIQ composite subcarrier modulation/demodulation (dot crawl & rainbow cross-color), I/Q low-pass filtering, luma edge ringing, H-sync skew, RF ghosting, and RF carrier snow. |
| Channels & Lines | `core/channels.cpp`, `core/lines.cpp` | Sub-pixel RGB channel separation (Linear/Radial), per-row jitter, and procedural Bezier film scratches/lines. |
