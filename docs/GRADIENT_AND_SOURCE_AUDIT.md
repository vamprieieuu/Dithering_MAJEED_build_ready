# DITHER MAJEED — Gradient and source audit handoff

## Work committed
- Added core/gradient_ramp.h and core/gradient_ramp.cpp: independent gradient-ramp model in namespace majeed, maximum 10 stops, minimum 2, stable IDs, move/add/delete/color edit, hide/show state, linear/smooth/constant interpolation, segment midpoint, opacity, reverse, luminance/R/G/B/alpha source selection, finite-value validation, and source-alpha preservation.
- Added tests/gradient_ramp_tests.cpp covering midpoint interpolation, insertion, hide without deletion, minimum-stop protection, alpha preservation, reverse and constant interpolation.
- Added presets/native-palettes.json with the 8 palette modes found in the TypeScript engine, using exact RGB values converted to hex.
- Fixed the verified green-channel blend bug in core/dither.cpp: the green output now blends against qG instead of qR (commit 5ab4569a7cfda58fdd054dd628dde18a1e81826c).

## Build integration
The existing CMakeLists uses CONFIGURE_DEPENDS globbing for core/*.cpp, so gradient_ramp.cpp is included automatically in the native plugin target. The unit test source is standalone and is not yet registered as a CTest target.

## Source audit snapshot
Reviewed directly: core/dither.cpp (648 lines), core/majeed_core.h, core/lines.cpp (34.6 KB), ae/ymdithers_ae.cpp (616 lines), src/engine/ditherAlgorithms.ts (49 algorithms), src/engine/ditherEngine.ts (731 lines), src/engine/paletteUtils.ts, src/engine/processor.ts (741 lines), src/types.ts, src/App.tsx (1,058 lines), CMakeLists.txt and package.json.

## Findings requiring follow-up
1. Browser processor uses Math.random() for grain, white-noise thresholds and dot-coverage gates; output is not deterministic despite seed-related settings. Introduce a seeded per-render PRNG shared by preview and native reference behavior.
2. The helper named blue_noise_threshold is hash/coordinate decorrelation, not a validated blue-noise rank texture. Keep the pseudo qualifier until spectrum and image tests confirm quality.
3. FrameCtx::frame() assumes 30 fps. Use actual host time_step/time_scale or frame rate before frame-varying effects are exposed.
4. Several full-frame and grid vectors are allocated inside render paths. Profile large frames and plan bounded scratch allocation without shared mutable state under MFR.
5. parallel_rows currently invokes one serial callback; it is not a parallel implementation.
6. The current AE adapter exposes Smart Pre-Render/Smart Render but has no PF_Cmd_EVENT, Drawbot custom UI, or PF_Param_ARBITRARY_DATA gradient editor.
7. README advertises seven aesthetic recipes, but their parameter payloads were not located in inspected source files. The eight palette modes are extracted; the seven recipe names are not importable presets yet.

## Native ECW UI status
The portable Gradient core is not the Drawbot custom UI. The original ECW_Gradient example sources are not present in this repository. To implement a faithful native panel, the original ECW source archive and its license plus exact SDK headers must be available. Required work remains: PF_Cmd_EVENT drawing/hit testing, stop drag/add/delete/hide interactions, ARB flatten/compare/copy/interp persistence, parameter/UI synchronization, undo/redo, save/reopen, MFR isolation and AE runtime verification.

## Verification boundary
The standalone gradient logic was compiled with C++17, warnings-as-errors, and its assertions passed in the working session. The After Effects AEX target was not built or tested in-host in this environment. Do not mark the native panel or final AEX as complete until those host tests pass.
