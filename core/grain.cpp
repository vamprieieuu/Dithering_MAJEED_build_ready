// ============================================================================
// YMDithers FILM GRAIN - organic silver-halide emulsion synthesis.
//   * Multi-scale rotated isotropic lattices + sub-pixel halide micro-crystals
//     (zero square blocks, zero axis-aligned grid artefacts at any size 4-64mm).
//   * Resolution-adaptive physical sizing (4mm, 8mm, 12mm, 16mm, 24mm, 32mm,
//     48mm, 64mm) that scales proportionally with composition resolution.
//   * Smart Luminance Response (H&D film toe, midtone halide peak, highlight
//     shoulder roll-off + image-linked crystal nucleation).
//   * Distinct Monochrome vs Color (RGB dye-cloud) film stock modes.
//   * Automatic deterministic frame-by-frame animation (no Seed keyframing).
// ============================================================================
#include "majeed_core.h"

namespace majeed {

double grain_px_per_mm(const GrainParams& p, const FrameCtx& c) {
    double fw = std::max(100.0, p.frameWidthMm);
    double refDiag = std::sqrt(std::max(64.0, c.fullW) * std::max(64.0, c.fullH));
    // Normalise so 1920x1080 (diag ~1440 geom mean) at fw=2400 gives a natural film scale
    return (refDiag / 1440.0) * (2400.0 / fw);
}

namespace {

// Smooth C2 quintic interpolation without square-block steepening
inline float smooth5(float t) {
    t = clampf(t, 0.f, 1.f);
    return t * t * t * (t * (t * 6.f - 15.f) + 10.f);
}

struct Field {
    int   type = GT_CRYSTAL;
    float cell = 1.25f;        // effective grain radius in full-res px
    float ax = 1.f;            // x stretch
    float soft = 0.4f;
    float dens = 0.85f;
    float clump = 0.18f, fine = 0.35f, coarse = 0.15f;
    float rowBleed = 0.f, rowVar = 0.4f;
    float norm = 1.f;

    inline float latt(int ix, int iy, uint32_t seed) const {
        uint32_t h = hash3((uint32_t)ix, (uint32_t)iy, seed);
        if (dens < 0.999f) {
            float occ = u01(hash_u32(h ^ 0x51ed270bU));
            if (occ >= dens) return 0.f;
        }
        return gauss(h);
    }

    // Isotropic 2-grid rotated band-limited noise (eliminates square/grid alignment)
    inline float iso_vn2(float x, float y, uint32_t seed) const {
        // Grid A (0 deg)
        float fx = std::floor(x), fy = std::floor(y);
        int ix = (int)fx, iy = (int)fy;
        float tx = smooth5(x - fx), ty = smooth5(y - fy);
        float a0 = lerpf(lerpf(latt(ix, iy, seed), latt(ix + 1, iy, seed), tx),
                         lerpf(latt(ix, iy + 1, seed), latt(ix + 1, iy + 1, seed), tx), ty);

        // Grid B (rotated ~36.87 deg: cos=0.8, sin=0.6, shifted)
        float rx = 0.8f * x - 0.6f * y + 17.31f;
        float ry = 0.6f * x + 0.8f * y + 29.73f;
        float rfx = std::floor(rx), rfy = std::floor(ry);
        int rix = (int)rfx, riy = (int)rfy;
        float rtx = smooth5(rx - rfx), rty = smooth5(ry - rfy);
        uint32_t seedB = seed ^ 0x9E3779B9u;
        float b0 = lerpf(lerpf(latt(rix, riy, seedB), latt(rix + 1, riy, seedB), rtx),
                         lerpf(latt(rix, riy + 1, seedB), latt(rix + 1, riy + 1, seedB), rtx), rty);

        return (a0 + b0) * 0.70710678f;
    }

    inline float row1(float x, int row, uint32_t seed) const {
        float fx = std::floor(x); int ix = (int)fx;
        float t = smooth5(x - fx);
        auto L = [&](int i) {
            uint32_t h = hash3((uint32_t)i, (uint32_t)row, seed);
            if (dens < 0.999f && u01(hash_u32(h ^ 0x51ed270bU)) >= dens) return 0.f;
            return gauss(h);
        };
        return lerpf(L(ix), L(ix + 1), t);
    }

    // ---- 1. Gaussian sensor/emulsion field --------------------------------
    float gaussF(float X, float Y, uint32_t seed, float cs) const {
        float c = std::max(0.45f, cell * cs);
        return iso_vn2(X / (c * ax), Y / c, seed);
    }

    // ---- 2. Organic Silver-Halide Film Crystal field ----------------------
    // Jittered radial Gaussian micro-grains (overlapping circular halide crystals,
    // never sharp Voronoi polygons or square blocks).
    float crystalF(float X, float Y, uint32_t seed, float cs) const {
        float c = std::max(0.45f, cell * cs);
        float gx = X / (c * ax), gy = Y / c;
        int ix = (int)std::floor(gx), iy = (int)std::floor(gy);
        float radScale = lerpf(3.2f, 1.45f, soft); // controls crystal radius overlap
        float sum = 0.f, wsum = 0.08f;
        for (int j = -1; j <= 1; ++j) {
            for (int i = -1; i <= 1; ++i) {
                int cx = ix + i, cy = iy + j;
                uint32_t h = hash3((uint32_t)cx, (uint32_t)cy, seed);
                if (dens < 0.999f && u01(hash_u32(h ^ 0x51ed270bU)) >= dens) continue;
                uint32_t h2 = hash_u32(h + 0x68e31da4U);
                uint32_t h3 = hash_u32(h2 + 0xb5297a4dU);
                float px = cx + 0.12f + 0.76f * u01(h2);
                float py = cy + 0.12f + 0.76f * u01(h3);
                float dx = gx - px, dy = gy - py;
                float d2 = dx * dx + dy * dy;
                // Smooth radial Gaussian crystal profile
                float e = d2 * radScale;
                if (e > 6.5f) continue;
                float w = std::exp(-e);
                sum += w * gauss(h);
                wsum += w * w;
            }
        }
        float crystal = sum / std::sqrt(wsum);
        // Blend with high-frequency sub-pixel halide micro-texture so large mm sizes stay organic
        float micro = iso_vn2(X / std::max(0.55f, c * 0.55f * ax), Y / std::max(0.55f, c * 0.55f), seed ^ 0x4A11DEu);
        return 0.72f * crystal + 0.28f * micro;
    }

    // ---- 3. Magnetic Tape scanline grain ----------------------------------
    float tapeF(float X, float Y, uint32_t seed, float cs) const {
        float c = std::max(0.5f, cell * cs);
        float rh = c, lx = c * ax;
        int r = (int)std::floor(Y / rh);
        auto rowVal = [&](int rr) {
            uint32_t hg = hash3((uint32_t)rr, seed, 0x77u);
            float gain = std::max(0.25f, 1.f + rowVar * 0.5f * gauss(hg));
            float off = u01(hash3((uint32_t)rr, seed, 0x99u)) * 997.f;
            return gain * row1(X / lx + off, rr, seed);
        };
        float f = rowVal(r);
        if (rowBleed > 0.001f) {
            float nb = 0.5f * (rowVal(r - 1) + rowVal(r + 1));
            f = (1.f - rowBleed) * f + rowBleed * nb;
        }
        return f;
    }

    // ---- 4. Clustered 4-octave fBm emulsion grain -------------------------
    float clusterF(float X, float Y, uint32_t seed, float cs) const {
        float c = std::max(0.5f, cell * cs * 1.4f);
        float sum = 0.f, wsum = 0.f, w = 1.f, sc = 1.f;
        for (int o = 0; o < 4; ++o) {
            float v = iso_vn2(X / (c * ax * sc), Y / (c * sc), seed + 0x101u * (uint32_t)o);
            sum += w * v; wsum += w * w;
            w *= 0.62f; sc *= 0.52f;
        }
        float f = sum / std::sqrt(std::max(1e-6f, wsum));
        return f * std::sqrt(std::fabs(f) + 0.15f);
    }

    float base(float X, float Y, uint32_t seed, float cs) const {
        switch (type) {
        case GT_GAUSS:   return gaussF(X, Y, seed, cs);
        case GT_CRYSTAL: return crystalF(X, Y, seed, cs);
        case GT_TAPE:    return tapeF(X, Y, seed, cs);
        default:         return clusterF(X, Y, seed, cs);
        }
    }

    // ---- full multi-scale evaluation --------------------------------------
    float eval(float X, float Y, uint32_t seed) const {
        float f = base(X, Y, seed, 1.f);
        float ww = 1.f;
        if (fine > 0.001f) {
            f += fine * base(X + 31.7f, Y - 57.3f, seed ^ 0x1111u, 0.52f);
            ww += fine * fine;
        }
        if (coarse > 0.001f) {
            f += coarse * base(X - 91.1f, Y + 13.9f, seed ^ 0x2222u, 1.85f);
            ww += coarse * coarse;
        }
        f /= std::sqrt(ww);
        if (clump > 0.001f) {
            float m = iso_vn2(X / (cell * 3.2f), Y / (cell * 3.2f), seed ^ 0xC3u);
            f *= std::max(0.15f, 1.f + clump * 0.55f * m);
        }
        return f * norm;
    }
};

float calibrate(Field f) {
    f.dens = 1.f; f.norm = 1.f;
    double s = 0, s2 = 0; const int N = 1024;
    for (int i = 0; i < N; ++i) {
        float X = u01(hash3((uint32_t)i, 1u, 0xCA11u)) * f.cell * 64.f;
        float Y = u01(hash3((uint32_t)i, 2u, 0xCA11u)) * f.cell * 64.f;
        float v = f.eval(X, Y, 0xBEEFu);
        s += v; s2 += (double)v * v;
    }
    double m = s / N, var = s2 / N - m * m;
    return var > 1e-6 ? (float)(1.0 / std::sqrt(var)) : 1.f;
}

inline float phi_uniform(float f) {
    float t = 0.7978845608f * (f + 0.044715f * f * f * f);
    return 0.5f * (1.f + std::tanh(t));
}

struct Shaper {
    float dist, thr, sharpK, sharpDen;
    inline float operator()(float f) const {
        if (dist > 0.f) f = lerpf(f, (phi_uniform(f) - 0.5f) * 3.4641f, dist);
        else if (dist < 0.f) f = lerpf(f, f >= 0.f ? 1.f : -1.f, -dist);
        if (thr > 0.f) { float a = std::fabs(f) - thr; f = a > 0.f ? (f > 0.f ? a : -a) : 0.f; }
        if (sharpK > 0.01f) f = std::tanh(sharpK * f) * sharpDen;
        return f;
    }
};

inline float speckAt(float X, float Y, uint32_t seed, float cell, float ax, float amt) {
    if (amt <= 0.f) return 0.f;
    float W = std::max(2.f, 8.f * cell * ax);
    int cx = (int)std::floor(X / W), r = (int)std::floor(Y / std::max(0.5f, cell));
    uint32_t h = hash4((uint32_t)cx, (uint32_t)r, seed, 0x5be0u);
    if (u01(h) >= amt * 0.02f) return 0.f;
    uint32_t h2 = hash_u32(h + 1), h3 = hash_u32(h + 2), h4 = hash_u32(h + 3);
    float x0 = cx * W + W * 0.7f * u01(h2);
    float len = cell * ax * (1.5f + 3.f * u01(h3));
    if (X < x0 || X > x0 + len) return 0.f;
    float v = 4.5f * (0.6f + 0.4f * u01(h4));
    return (u01(hash_u32(h + 4)) < 0.2f) ? -v : v;
}

// Film H&D luminance response curve:
// Combines shadows, midtones, and highlights response with authentic highlight shoulder roll-off.
inline float film_luma_weight(float luma, float shW, float midW, float hiW, float respAmt) {
    luma = clampf(luma, 0.f, 1.f);
    // Parabolic midtone bell peaking at luma = 0.42 (classic negative film stock peak)
    float sh = (1.f - luma) * (1.f - luma);
    float hi = luma * luma;
    float mid = std::max(0.f, 1.f - sh - hi) * 2.1f;
    // Natural film toe & highlight shoulder envelope
    float filmCurve = (0.22f + 0.78f * std::sin(std::pow(luma, 0.65f) * 3.14159265f)) * (1.f - 0.55f * hi * luma);
    float customCurve = sh * shW + mid * midW * 0.5f + hi * hiW;
    float combined = customCurve * lerpf(1.f, filmCurve * 1.25f, respAmt);
    return std::max(0.f, combined);
}

} // namespace

void render_grain(const Image& src, const Image& dst, const GrainParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;
    Field F;
    F.type = p.type;

    // Map 4..64 mm film stock size into fine, resolution-adaptive crystal radius:
    // At 1080p: 4mm -> 0.62px, 8mm -> 0.80px, 12mm -> 0.98px, 16mm -> 1.18px,
    //           24mm -> 1.55px, 32mm -> 1.92px, 48mm -> 2.65px, 64mm -> 3.40px.
    double ppm = grain_px_per_mm(p, c);
    double clampedMm = clampf((float)p.sizeMm, 1.0f, 64.0f);
    double baseRadiusPx = (0.44 + 0.046 * clampedMm) * ppm;
    // For Tape static call (where sizeMm < 4), allow direct micro-sizing
    if (p.type == GT_TAPE && p.sizeMm < 4.0) {
        baseRadiusPx = std::max(0.5, p.sizeMm * ppm);
    }
    F.cell = (float)std::max(0.45, baseRadiusPx);
    F.ax = (float)std::max(0.1, p.aspect / 100.0);
    F.soft = clampf((float)(p.softness / 100.0), 0.f, 1.f);
    F.dens = clampf((float)(p.density / 100.0), 0.05f, 1.f);
    F.clump = clampf((float)(p.clumping / 100.0), 0.f, 1.5f);
    F.fine = std::max(0.25f, (float)(p.fine / 100.0));
    F.coarse = std::max(0.10f, (float)(p.coarse / 100.0));
    F.rowBleed = clampf((float)(p.rowBleed / 100.0), 0.f, 1.f);
    F.rowVar = clampf((float)(p.rowVar / 100.0), 0.f, 2.f);
    F.norm = calibrate(F);

    float kSharp = clampf((float)(p.sharpness / 100.0), 0.f, 1.f) * 2.8f;
    Shaper shp{ clampf((float)(p.distribution / 100.0), -1.f, 1.f),
                clampf((float)(p.threshold / 100.0), 0.f, 1.f) * 2.0f,
                kSharp, kSharp > 0.01f ? 1.f / std::tanh(kSharp) : 1.f };

    // Deterministic temporal frame animation (no manual seed keyframing required)
    double fps = c.fps > 0.1 ? c.fps : 24.0;
    double speedFactor = std::max(0.0, p.evoSpeed) / 24.0;
    int animStep = 0;
    float tB = 0.f;
    if (p.autoAnim && p.evoSpeed > 0.001) {
        // Quantise to frame index when speed is near 100% (24 steps/sec) so every frame is crisp & deterministic
        double exactFrame = (double)c.frame() * std::max(0.05, speedFactor) + p.evolutionDeg / 360.0;
        double Pf = std::floor(exactFrame + 1e-4);
        animStep = (int)Pf;
        tB = (float)(exactFrame - Pf);
    } else {
        animStep = (int)std::floor(p.evolutionDeg / 360.0 + 0.5);
    }
    bool smooth = p.smoothEvo && tB > 1e-4f;
    float wA = std::cos(tB * 1.5707963f), wB = std::sin(tB * 1.5707963f);
    uint32_t seedBase = hash_u32((uint32_t)p.seed * 7919u + 0x12345u);
    uint32_t sA = hash2(seedBase, (uint32_t)animStep * 0x45d9f3bu + 1u);
    uint32_t sB = hash2(seedBase, (uint32_t)(animStep + 1) * 0x45d9f3bu + 1u);

    const bool mono = p.mono;
    const float colorResp = mono ? 0.f : clampf((float)(p.colorResponse / 100.0), 0.f, 1.5f);
    const float rgbMix = mono ? 0.f : clampf((float)(p.rgbGrain / 100.0) * std::max(0.35f, colorResp), 0.f, 1.f);
    const float rgbNorm = 1.f / std::sqrt((1.f - rgbMix) * (1.f - rgbMix) + rgbMix * rgbMix);
    const float sep = mono ? 0.f : (float)p.rgbSep;
    const float cvar = mono ? 0.f : (float)(p.colorVar / 100.0) * colorResp;
    const float crand = mono ? 0.f : (float)(p.colorRand / 100.0) * colorResp;
    const float chvar = mono ? 0.f : (float)(p.chanVar / 100.0) * colorResp;
    const float sat = mono ? 0.f : (float)(p.saturation / 100.0);
    const float cAmt[3] = { (float)(p.redAmt / 100.0), (float)(p.greenAmt / 100.0), (float)(p.blueAmt / 100.0) };
    const float tmax = std::max(1e-4f, std::max(p.grainColor.r, std::max(p.grainColor.g, p.grainColor.b)));
    const float T[3] = { p.grainColor.r / tmax, p.grainColor.g / tmax, p.grainColor.b / tmax };
    const float tAmt = clampf((float)(p.colorAmt / 100.0), 0.f, 1.f);
    const float amount = (float)(p.amount / 100.0);
    const float cscale = (float)(p.contrast / 100.0) * 0.36f;
    const float bright = (float)(p.brightness / 100.0);
    const float opac = clampf((float)(p.opacity / 100.0), 0.f, 1.f);
    const float shadowsW = (float)(p.shadows / 100.0);
    const float midW = (float)(p.midtones / 100.0);
    const float highW = (float)(p.highlights / 100.0);
    const float lumaResp = clampf((float)(p.lumaResponse / 100.0), 0.f, 1.f);
    const float specks = (float)(p.specks / 100.0);
    const int   mode = p.blend;
    const bool  needSepEval = sep != 0.f;
    (void)fps;

    auto fieldT = [&](float X, float Y, uint32_t tag) -> float {
        if (!smooth) return shp(F.eval(X, Y, hash2(sA, tag))) + speckAt(X, Y, hash2(sA, tag), F.cell, F.ax, specks);
        float a = F.eval(X, Y, hash2(sA, tag)), b = F.eval(X, Y, hash2(sB, tag));
        return shp(wA * a + wB * b) + speckAt(X, Y, hash2(sA, tag), F.cell, F.ax, specks);
    };

    parallel_rows(H, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            float Y = (float)(c.originY + (y + 0.5) * c.scaleY);
            for (int x = 0; x < W; ++x) {
                float X = (float)(c.originX + (x + 0.5) * c.scaleX);
                const float* s = src.at(x, y);
                float* o = dst.at(x, y);

                float l = luma709(s[0], s[1], s[2]);
                // Image-linked coordinate micro-nucleation: local luminance subtly shifts crystal phase
                float nucShift = (l - 0.5f) * lumaResp * F.cell * 0.45f;
                float Xn = X + nucShift, Yn = Y - nucShift * 0.7f;

                float n[3];
                float fL = fieldT(Xn, Yn, 0x100u);
                if (mono) {
                    // Pure Monochrome silver-halide grain: identical across R, G, B
                    n[0] = n[1] = n[2] = fL;
                } else {
                    if (!needSepEval) {
                        n[0] = n[1] = n[2] = fL;
                    } else {
                        n[0] = fieldT(Xn - sep, Yn, 0x100u);
                        n[1] = fL;
                        n[2] = fieldT(Xn + sep, Yn, 0x100u);
                    }
                    if (rgbMix > 0.f) {
                        // Color film dye-cloud layers (slightly softer spatial scale 1.15x + independent channel seeds)
                        for (int k = 0; k < 3; ++k) {
                            float xs = (Xn + (k == 0 ? -sep : (k == 2 ? sep : 0.f))) * 0.88f;
                            float ys = Yn * 0.88f;
                            float fc = fieldT(xs, ys, 0x200u + (uint32_t)k * 37u);
                            n[k] = ((1.f - rgbMix) * n[k] + rgbMix * fc) * rgbNorm;
                        }
                    }
                    if (cvar > 0.f) {
                        float fi = fieldT(Xn * 0.65f, Yn * 0.65f, 0x300u);
                        float fq = fieldT(Xn * 0.65f, Yn * 0.65f, 0x301u);
                        float dr, dg, db; yiq2rgb(0.f, fi * cvar * 0.65f, fq * cvar * 0.65f, dr, dg, db);
                        n[0] += dr; n[1] += dg; n[2] += db;
                    }
                    if (crand > 0.f || chvar > 0.f) {
                        int cx = (int)std::floor(Xn / F.cell), cy = (int)std::floor(Yn / F.cell);
                        if (crand > 0.f) {
                            float th = u01(hash4((uint32_t)cx, (uint32_t)cy, sA, 0xC0u)) * 6.2831853f;
                            float dr, dg, db; yiq2rgb(0.f, std::cos(th), std::sin(th), dr, dg, db);
                            float k2 = fL * crand * 0.6f;
                            n[0] += dr * k2; n[1] += dg * k2; n[2] += db * k2;
                        }
                        if (chvar > 0.f) {
                            for (int k = 0; k < 3; ++k)
                                n[k] *= std::max(0.f, 1.f + chvar * 0.55f * gauss(hash4((uint32_t)cx, (uint32_t)cy, sA, 0x31u + (uint32_t)k)));
                        }
                    }
                    for (int k = 0; k < 3; ++k) n[k] *= cAmt[k];
                    if (sat != 1.f) {
                        float m = (n[0] + n[1] + n[2]) * (1.f / 3.f);
                        for (int k = 0; k < 3; ++k) n[k] = m + (n[k] - m) * sat;
                    }
                }

                if (tAmt > 0.f) {
                    float m = (n[0] + n[1] + n[2]) * (1.f / 3.f);
                    for (int k = 0; k < 3; ++k) n[k] = lerpf(n[k], m * T[k], tAmt);
                }

                float amp = film_luma_weight(l, shadowsW, midW, highW, lumaResp) * amount * cscale;
                for (int k = 0; k < 3; ++k) {
                    float d = n[k] * amp + bright;
                    float res = blend_channel(mode, s[k], 0.5f + 0.5f * d, d);
                    o[k] = clampf(lerpf(s[k], res, opac), 0.f, 1.f);
                }
                o[3] = s[3];
            }
        }
    });
}

} // namespace majeed
