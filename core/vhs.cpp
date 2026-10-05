// ============================================================================
// YMDithers VHS & NTSC - analogue tape and broadcast television simulation.
//  VHS:
//   1 geometry   : per-scanline horizontal displacement (wobble, rolling tear band,
//                  head-switching skew, per-line jitter) + vertical frame bounce
//                  + R/G/B channel offsets
//   2 chroma     : YIQ; horizontal chroma bleed (box smear), chroma shift, luma softening
//   3 artefacts  : tape dashes (per-row procedural drop-outs), vertical streaks,
//                  scanline modulation with interlace phase, flicker
//   4 noise      : scan-line grain (GT_TAPE generator of the grain engine)
//  NTSC:
//   1 composite  : 3.58MHz YIQ subcarrier modulation & demodulation (true dot crawl
//                  & cross-color rainbowinging on fine luma transitions)
//   2 bandwidth  : asymmetric I/Q low-pass filtering + analog luma edge ringing
//   3 RF & sync  : horizontal sync phase skew, multipath RF ghosting echo,
//                  interlaced CRT scanlines, and animated RF snow
// ============================================================================
#include "majeed_core.h"

namespace majeed {

void render_vhs(const Image& src, const Image& dst, const VHSParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;
    const double safeSx = c.scaleX > 1e-4 ? c.scaleX : 1.0;
    const double safeSy = c.scaleY > 1e-4 ? c.scaleY : 1.0;
    const float isx = (float)(1.0 / safeSx), isy = (float)(1.0 / safeSy);
    const float fullH = (float)std::max(16.0, c.fullH), fullW = (float)std::max(16.0, c.fullW);
    const double spd = std::max(0.0, p.speed) / 100.0;
    const double fps = c.fps > 0.1 ? c.fps : 24.0;
    const int rawFrame = c.frame();
    const double t = (double)rawFrame / fps * spd;
    const int frame = (int)std::floor((double)rawFrame * spd + 1e-4);
    const uint32_t seed = hash_u32((uint32_t)p.seed + 0x7A9Eu);
    const int jFrame = (int)std::floor((double)rawFrame * (std::max(0.0, p.jitterRate) / 100.0) * std::max(0.2, spd) + 1e-4);

    // ---------------- 1. per-row displacement & vertical bounce --------------
    std::vector<float> dx(H, 0.f);
    float dyBounce = 0.f;
    {
        float wl = std::max(4.f, fullH * (float)(p.trackSize / 100.0) * 0.12f);
        double tearPhase = (t * 0.18 * std::max(5.0, p.trackSpeed) / 50.0) + u01(hash_u32(seed + 5));
        float tearY = (float)(tearPhase - std::floor(tearPhase)) * fullH;
        float tearH = std::max(4.f, fullH * 0.065f);
        float tearAmt = (float)p.trackAmount * 1.6f * s11(hash3(seed, (uint32_t)std::floor(tearPhase), 9));
        float hsH = std::max(1.f, fullH * (float)(p.headHeight / 100.0));
        float gShake = s11(hash3(seed, (uint32_t)jFrame, 3)) * (float)p.jitterAmount * 0.06f;

        // Vertical frame sync instability (occasional vertical sync hop + subtle hum)
        if (p.vertInstability > 0.01) {
            float vHum = std::sin((float)(t * 6.2831853 * 2.0)) * 0.35f;
            uint32_t vh = hash3(seed, (uint32_t)frame, 0x514Cu);
            float vSpike = u01(vh) < 0.25f ? s11(hash_u32(vh + 1)) * 2.2f : s11(vh) * 0.4f;
            dyBounce = (vHum + vSpike) * (float)(p.vertInstability * 0.18) * isy;
        }

        for (int y = 0; y < H; ++y) {
            float Y = (float)(c.originY + (y + 0.5) * safeSy);
            float d = vnoise1(Y / wl + (float)(t * std::max(5.0, p.trackSpeed) / 100.0 * 1.9), seed, 1, 1.f) * (float)p.trackAmount * 0.6f;
            float dt = std::fabs(Y - tearY) / tearH;
            if (dt < 1.f) d += tearAmt * (1.f - dt * dt);
            float hy = (Y - (fullH - hsH)) / hsH;
            if (hy > 0.f) {
                d += (float)p.headSwitch * hy * hy * (0.6f + 0.4f * s11(hash3(seed, (uint32_t)frame, 11)))
                   + s11(hash3(seed, (uint32_t)(frame * 977 + y), 12)) * (float)p.headSwitch * 0.18f * hy;
            }
            uint32_t jh = hash3((uint32_t)(int)Y, (uint32_t)jFrame, seed ^ 0x1234u);
            if (u01(jh) < 0.35f) d += s11(hash_u32(jh + 1)) * (float)p.jitterAmount * 0.14f;
            d += gShake;
            dx[y] = d * isx;
        }
    }

    // Animated subtle chromatic drift
    float chromaDrift = (float)std::sin(t * 5.3) * 0.45f * isx;
    const float rOff = ((float)p.rSepX + chromaDrift) * isx;
    const float bOff = ((float)p.bSepX - chromaDrift) * isx;

    std::vector<float> A((size_t)W * H * 4), B((size_t)W * H * 4);
    Image tmp{ W, H, A.data() };
    parallel_rows(H, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            float sy = clampf((float)y - dyBounce, 0.f, (float)(H - 1));
            int sy0 = std::max(0, std::min(H - 1, (int)sy));
            int sy1 = std::min(H - 1, sy0 + 1);
            float fy = sy - sy0;
            const float* row0 = src.at(0, sy0);
            const float* row1 = src.at(0, sy1);
            auto rowSample = [&](float xx, int k) {
                xx = clampf(xx, 0.f, (float)(W - 1));
                int x0 = std::max(0, std::min(W - 1, (int)xx));
                int x1 = std::min(x0 + 1, W - 1);
                float f = xx - x0;
                float v0 = lerpf(row0[x0 * 4 + k], row0[x1 * 4 + k], f);
                float v1 = lerpf(row1[x0 * 4 + k], row1[x1 * 4 + k], f);
                return lerpf(v0, v1, fy);
            };
            for (int x = 0; x < W; ++x) {
                float* o = tmp.at(x, y);
                float bx = x - dx[y];
                o[0] = rowSample(bx - rOff, 0);
                o[1] = rowSample(bx, 1);
                o[2] = rowSample(bx + bOff, 2);
                o[3] = src.at(x, y)[3];
            }
        }
    });

    // ---------------- 2. chroma bleed / luma soften ---------------------------
    const int rc = std::min(W / 2, (int)std::ceil((float)(p.bleed / 100.0) * 14.f * isx));
    const int rl = std::min(W / 2, (int)std::ceil((float)(p.lumaSoft / 100.0) * 2.8f * isx));
    const int sh = (int)std::floor((float)p.bleedShift * isx + 0.5f);
    const float sat = (float)(p.saturation / 100.0);
    Image out2{ W, H, B.data() };
    parallel_rows(H, [&](int y0, int y1) {
        std::vector<float> Yv(W), Iv(W), Qv(W), Ib(W), Qb(W), Yb(W);
        for (int y = y0; y < y1; ++y) {
            for (int x = 0; x < W; ++x) { const float* s = tmp.at(x, y); rgb2yiq(s[0], s[1], s[2], Yv[x], Iv[x], Qv[x]); }
            auto box = [&](const std::vector<float>& in, std::vector<float>& outv, int r) {
                if (r <= 0) { outv = in; return; }
                double sum = 0; int cnt = 0;
                for (int i = -r; i <= r; ++i) { int xi = std::min(W - 1, std::max(0, i)); sum += in[xi]; ++cnt; }
                for (int x = 0; x < W; ++x) {
                    outv[x] = (float)(sum / cnt);
                    int add = std::min(W - 1, x + r + 1), sub = std::max(0, x - r);
                    sum += in[add] - in[sub];
                }
            };
            box(Iv, Ib, rc); box(Qv, Qb, rc); box(Yv, Yb, rl);
            for (int x = 0; x < W; ++x) {
                int xs = std::min(W - 1, std::max(0, x - sh));
                // Add subtle Luma edge overshoot before recombining
                float yVal = Yb[x] + (Yv[x] - Yb[x]) * 0.35f;
                float r, g, b; yiq2rgb(yVal, Ib[xs] * sat, Qb[xs] * sat, r, g, b);
                float* o = out2.at(x, y);
                o[0] = clampf(r, 0.f, 1.f);
                o[1] = clampf(g, 0.f, 1.f);
                o[2] = clampf(b, 0.f, 1.f);
                o[3] = tmp.at(x, y)[3];
            }
        }
    });

    // ---------------- 3. dashes, streaks, scanlines, flicker ------------------
    struct Dash { float x0, x1, v; };
    const float dashP = (float)(p.dashes / 100.0);
    const float rowH = std::max(1.f, (float)p.dashRows);
    const float per = std::max(1.5f, (float)p.scanPeriod), sDepth = (float)(p.scanlines / 100.0) * 0.8f;
    const float sExp = 1.f + (float)(p.scanSharp / 100.0) * 3.f;
    const float flick = (float)(p.flicker / 100.0);
    const float gFlick = 1.f + flick * 0.12f * gauss(hash3(seed, (uint32_t)frame, 21));
    const float stW = std::max(1.f, (float)p.streakWidth);
    const float stP = (float)(p.streaks / 100.0);
    const int slowT = (int)std::floor(t * 3.0);
    parallel_rows(H, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            float Y = (float)(c.originY + (y + 0.5) * safeSy);
            int band = (int)std::floor(Y / rowH);
            Dash ds[3]; int nd = 0;
            if (dashP > 0.f) {
                for (int j = 0; j < 3; ++j) {
                    uint32_t h = hash4((uint32_t)band, (uint32_t)frame, seed, 0xDA5u + (uint32_t)j);
                    if (u01(h) >= dashP * 0.14f) continue;
                    float x0 = u01(hash_u32(h + 1)) * fullW;
                    float u2 = u01(hash_u32(h + 2));
                    float len = (10.f + 160.f * u2 * u2) * (float)(p.dashLength / 100.0);
                    float v = (u01(hash_u32(h + 3)) < 0.85f ? 1.f : -1.f) * (0.14f + 0.45f * u01(hash_u32(h + 4)));
                    ds[nd++] = { x0, x0 + len, v };
                }
            }
            float sl = 1.f;
            if (sDepth > 0.f) {
                float ph = 0.5f * (float)(frame & 1) * (float)(p.interlace / 100.0);
                float s = 0.5f + 0.5f * std::cos(6.2831853f * (Y / per + ph));
                sl = 1.f - sDepth * (1.f - std::pow(s, sExp));
            }
            float fl = gFlick * (1.f + flick * 0.05f * std::sin(6.2831853f * (Y / fullH * 1.5f - (float)t * 0.9f)));
            for (int x = 0; x < W; ++x) {
                float X = (float)(c.originX + (x + 0.5) * safeSx);
                float* o = out2.at(x, y);
                float add = 0.f;
                for (int j = 0; j < nd; ++j) {
                    if (X >= ds[j].x0 && X <= ds[j].x1) {
                        float e = std::min(smoothstepf(ds[j].x0, ds[j].x0 + 4.f, X), smoothstepf(ds[j].x1, ds[j].x1 - 4.f, X));
                        add += ds[j].v * e;
                    }
                }
                if (stP > 0.f) {
                    int col = (int)std::floor(X / stW);
                    uint32_t h = hash3((uint32_t)col, (uint32_t)slowT, seed ^ 0x57u);
                    if (u01(h) < 0.06f * stP + 0.01f) {
                        float env = vnoise1(Y / (fullH * 0.4f) + u01(hash_u32(h + 7)) * 50.f, seed, (uint32_t)col, 1.f);
                        env = std::max(0.f, env - 0.2f);
                        add += gauss(hash_u32(h + 9)) * env * 0.22f * stP;
                    }
                }
                for (int k = 0; k < 3; ++k) o[k] = clampf((o[k] + add) * sl * fl, 0.f, 1.f);
            }
        }
    });

    // ---------------- 4. tape static -----------------------------------------
    if (p.staticAmount > 0.0) {
        GrainParams g;
        g.type = GT_TAPE; g.frameWidthMm = 2400.0;
        g.sizeMm = 1.6 * std::max(10.0, p.staticSize) / 100.0;
        g.aspect = 240; g.amount = p.staticAmount * 1.35;
        g.density = 100; g.sharpness = 55; g.softness = 30; g.rgbGrain = 40; g.rowVar = 60; g.specks = 12;
        g.blend = BM_ADD_SIGNED; g.seed = p.seed + 991;
        g.evoSpeed = 24.0 * std::max(0.1, spd); g.evolutionDeg = 0; g.autoAnim = true;
        g.shadows = 100; g.midtones = 100; g.highlights = 100; g.lumaResponse = 30;
        render_grain(out2, out2, g, c);
    }
    std::memcpy(dst.px, out2.px, (size_t)W * H * 4 * sizeof(float));
}

// ============================================================================
//  NTSC Composite Analog Television Engine
// ============================================================================
void render_ntsc(const Image& src, const Image& dst, const NTSCParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;
    const double safeSx = c.scaleX > 1e-4 ? c.scaleX : 1.0;
    const double safeSy = c.scaleY > 1e-4 ? c.scaleY : 1.0;
    const float isx = (float)(1.0 / safeSx);
    const double spd = std::max(0.0, p.speed) / 100.0;
    const int frame = (int)std::floor((double)c.frame() * std::max(0.05, spd) + 1e-4);
    const uint32_t seed = hash_u32((uint32_t)p.seed + 0x4E545343u);

    const float skewAmt = (float)(p.phaseSkew / 100.0) * 8.0f * isx;
    const float ghostAmt = (float)(p.ghosting / 100.0) * 0.42f;
    const float ghostDx = (float)p.ghostShift * isx;
    const float bleedAmt = clampf((float)(p.chromaBleed / 100.0), 0.f, 1.f);
    const float crawlAmt = clampf((float)(p.dotCrawl / 100.0), 0.f, 1.5f);
    const float ringAmt = clampf((float)(p.ringing / 100.0), 0.f, 1.5f);
    const float scanAmt = clampf((float)(p.scanlines / 100.0), 0.f, 1.f) * 0.75f;
    const float scanPer = std::max(1.5f, (float)p.scanPitch);
    const float rfAmt = clampf((float)(p.rfNoise / 100.0), 0.f, 1.5f) * 0.28f;
    const int   chromaDelay = (int)std::floor(p.colorSep * isx + 0.5);
    const int   rI = std::min(W / 2, std::max(1, (int)std::ceil(bleedAmt * 7.f * isx)));
    const int   rQ = std::min(W / 2, std::max(1, (int)std::ceil(bleedAmt * 14.f * isx)));
    // Subcarrier angular frequency (NTSC ~ pi/2 per pixel, scaled by carrierFreq)
    const float omega = 1.5707963f * (float)std::max(20.0, p.carrierFreq) / 100.0f;

    parallel_rows(H, [&](int y0, int y1) {
        std::vector<float> Y(W), I(W), Q(W), comp(W), Yd(W), Id(W), Qd(W);
        for (int y = y0; y < y1; ++y) {
            float fullY = (float)(c.originY + (y + 0.5) * safeSy);
            int scanRow = (int)std::floor(fullY);

            // 1. Horizontal sync phase skew + multipath RF ghosting
            float syncWave = std::sin(fullY * 0.045f + (float)frame * 0.35f) * 0.5f
                           + s11(hash3((uint32_t)scanRow, (uint32_t)frame, seed)) * 0.5f;
            float rowShift = syncWave * skewAmt;

            for (int x = 0; x < W; ++x) {
                float sx = (float)x - rowShift;
                float main4[4];
                sample_bilinear(src, sx, (float)y, main4);
                if (ghostAmt > 0.001f) {
                    float gh4[4];
                    sample_bilinear(src, sx - ghostDx, (float)y, gh4);
                    for (int k = 0; k < 3; ++k) {
                        main4[k] = clampf(main4[k] + (gh4[k] - 0.5f) * ghostAmt, 0.f, 1.f);
                    }
                }
                rgb2yiq(main4[0], main4[1], main4[2], Y[x], I[x], Q[x]);
            }

            // 2. NTSC 3.58MHz Composite Subcarrier Modulation & Demodulation (Dot Crawl & Rainbow Cross-Color)
            // Phase alternates 180 deg every scanline and every frame (standard NTSC 2-frame / 2-line phase inversion)
            float rowPhase = ((scanRow + frame) & 1) ? 3.14159265f : 0.f;
            for (int x = 0; x < W; ++x) {
                float ph = omega * (float)x + rowPhase;
                float cs = std::cos(ph), sn = std::sin(ph);
                // Add RF snow directly onto the composite waveform
                float rf = rfAmt > 0.f ? gauss(hash4((uint32_t)x, (uint32_t)y, (uint32_t)frame, seed ^ 0x8F01u)) * rfAmt : 0.f;
                comp[x] = Y[x] + I[x] * cs + Q[x] * sn + rf;
            }

            // Demodulate composite signal via 3-tap comb/notch filter to produce authentic dot crawl & rainbowinging
            for (int x = 0; x < W; ++x) {
                int xm1 = std::max(0, x - 1), xp1 = std::min(W - 1, x + 1);
                int xm2 = std::max(0, x - 2), xp2 = std::min(W - 1, x + 2);
                float lumaNotch = 0.25f * comp[xm1] + 0.5f * comp[x] + 0.25f * comp[xp1];
                float chromaResid = comp[x] - lumaNotch;
                float ph = omega * (float)x + rowPhase;
                float cs = std::cos(ph), sn = std::sin(ph);

                // Blend clean YIQ with composite-demodulated YIQ according to dotCrawl amount
                Yd[x] = lerpf(Y[x], lumaNotch + chromaResid * 0.45f, crawlAmt);
                // Luma high-frequency transition leaking into I/Q produces classic NTSC rainbowinging
                float lumaEdge = Y[xp1] - Y[xm1];
                Id[x] = I[x] + crawlAmt * (chromaResid * cs * 0.85f + lumaEdge * cs * 0.65f);
                Qd[x] = Q[x] + crawlAmt * (chromaResid * sn * 0.85f + lumaEdge * sn * 0.65f);

                // Analog Luma overshoot / ringing (negative second derivative boost at horizontal step edges)
                if (ringAmt > 0.001f) {
                    float lap = 2.f * Yd[x] - 0.6f * (Y[xm1] + Y[xp1]) - 0.4f * (Y[xm2] + Y[xp2]);
                    Yd[x] += lap * ringAmt * 0.42f;
                }
            }

            // 3. Asymmetric YIQ Bandwidth Limiting (I = 1.3MHz, Q = 0.4MHz box low-pass)
            auto boxFilter = [&](const std::vector<float>& in, std::vector<float>& outv, int r) {
                if (r <= 0 || bleedAmt <= 0.001f) { outv = in; return; }
                double sum = 0; int cnt = 0;
                for (int i = -r; i <= r; ++i) { sum += in[std::min(W - 1, std::max(0, i))]; ++cnt; }
                for (int x = 0; x < W; ++x) {
                    outv[x] = (float)(sum / cnt);
                    int add = std::min(W - 1, x + r + 1), sub = std::max(0, x - r);
                    sum += in[add] - in[sub];
                }
            };
            boxFilter(Id, I, rI);
            boxFilter(Qd, Q, rQ);

            // 4. Interlaced CRT scanline envelope + Y-C registration delay
            float sl = 1.f;
            if (scanAmt > 0.001f) {
                float fieldPh = 0.5f * (float)(frame & 1);
                float s = 0.5f + 0.5f * std::cos(6.2831853f * (fullY / scanPer + fieldPh));
                sl = 1.f - scanAmt * (1.f - s * s);
            }

            for (int x = 0; x < W; ++x) {
                int xc = std::min(W - 1, std::max(0, x - chromaDelay));
                float r, g, b;
                yiq2rgb(Yd[x], I[xc], Q[xc], r, g, b);
                // Subtle CRT shadow-mask phosphor triad modulation
                float triad = 1.f + scanAmt * 0.08f * std::cos(6.2831853f * ((x % 3) / 3.f));
                float* o = dst.at(x, y);
                o[0] = clampf(r * sl * triad, 0.f, 1.f);
                o[1] = clampf(g * sl * triad, 0.f, 1.f);
                o[2] = clampf(b * sl * triad, 0.f, 1.f);
                o[3] = src.at(x, y)[3];
            }
        }
    });
}

} // namespace majeed
