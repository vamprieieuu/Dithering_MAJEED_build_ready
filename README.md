# Dithering MAJEED

Unified native After Effects effect for AE 23.2.1 / Windows x64.

## Included
- 49 MAJEED dithering algorithms from the native C++ engine.
- Dither controls from `reference/MAJEED_FINAL_v5.jsx`.
- Color / Grade controls, including tonal colors and indexed palette limiting.
- Preprocess controls: denoise/noise, blur, sharpen.
- Procedural film grain controls using the MAJEED grain engine.
- VHS Noise controls using the MAJEED VHS engine.
- Embedded user-supplied sticker artwork as the Effect Controls custom header/logo.
- No helper layers, adjustment layers, solids, or native AE effects are required by the processing engine.

## Target
Adobe After Effects 23.2.1 on Windows 11 / x64.

## Build
Requires Windows + Visual Studio 2022/MSVC and the included After Effects SDK.
The generated binary target is `Dithering MAJEED.aex`.

## Build status
The source is prepared for a Windows/MSVC build. The GitHub Actions verification step checks for the actual output filename `Dithering MAJEED.aex`.
