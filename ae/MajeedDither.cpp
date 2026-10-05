// ============================================================================
// YMDithers - unified native After Effects 23.2.1 plugin.
// All image processing is 100% native C++ in ../core (no native AE helper effects,
// no extra layers or solids). Includes:
//   1. Dither & Halftone (49 distinct algorithms, 5 color modes, threshold, pattern scale/angle)
//   2. Color, Tone & Preprocess (Hue/Sat, Grade Bias, Indexed Palette, Tonal Ramp, Denoise/Blur/Sharpen)
//   3. Smart Film Grain (4-64mm resolution-adaptive, H&D luminance response, Color/Monochrome, Auto Animation)
//   4. VHS Tape (Tracking, Head-switch, Vertical bounce, YIQ Chroma bleed, Dashes, Streaks, Scanlines, Auto Animation)
//   5. NTSC Analog (3.58MHz Dot Crawl & Rainbow cross-color, YIQ bandwidth filter, H-Sync skew, RF Ghosting & Snow)
//   6. Channels & Lines (Sub-pixel RGB split, Linear/Radial chromatic separation, Procedural Film Scratches/Lines)
// ============================================================================
#include "MajeedGlue.h"
#include "DitherAlgoList.h"
#include "MajeedLogo.h"
#include "adobesdk/DrawbotSuite.h"
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstring>

using namespace majeed;

#define YMDITHERS_LIST(F,K,P,C,A,G,E) \
 G(DM_G_DITHER,"Dither") \
 P(DM_ALGO,"Algorithm",MJ_DITHER_ALGO_POPUP,MJ_DITHER_ALGO_COUNT,17) \
 P(DM_MODE,"Color Mode","Preserve Original Colors|Monochrome (B&W)|Custom Duo-Tone|CMYK Halftone Separation|Tonal Tri-Tone Ramp",5,1) \
 F(DM_DITHER,"Amount",0,100,0,100,100,1) \
 F(DM_TONES,"Levels (Tones)",2,64,2,32,2,0) \
 F(DM_SIZE,"Scale (Pixel Size)",1,32,1,16,2,0) \
 F(DM_THRESH,"Threshold (Density)",0,100,0,100,50,1) \
 F(DM_SPREAD,"Strength (Spread)",0,200,0,200,100,1) \
 F(DM_PATSCALE,"Pattern Scale (%)",25,400,25,250,100,1) \
 A(DM_PATANGLE,"Pattern Angle",0) \
 F(DM_CONTRAST,"Contrast",0,300,0,200,100,1) \
 F(DM_BRIGHT,"Brightness",-100,100,-100,100,0,1) \
 F(DM_NOISE,"Randomness (Jitter)",0,100,0,100,0,1) \
 K(DM_SERP,"Serpentine Scan",1) \
 K(DM_LINEAR,"Linear Gamma Dither",0) \
 K(DM_PIXELATE,"Pixelate Output to Scale",0) \
 K(DM_ANIM,"Animate Dither Noise",0) \
 F(DM_SEED,"Dither Seed",0,10000,0,10000,0,0) \
 E(DM_E_DITHER) \
 G(DM_G_COLOR,"Color & Tone") \
 F(DM_HUE,"Hue Shift",-180,180,-180,180,0,1) \
 F(DM_SAT,"Saturation",-100,100,-100,100,0,1) \
 F(DM_GRADE,"Grade Bias",-100,100,-100,100,0,1) \
 K(DM_INVERT,"Invert Image",0) \
 K(DM_LIMIT,"Limit Palette (Indexed)",0) \
 F(DM_INDEX,"Indexed Colors",2,256,2,64,16,0) \
 K(DM_TONAL,"Apply Tonal Colors",0) \
 C(DM_HIGHS,"Highlights / Light Color",1,1,1) \
 C(DM_MIDS,"Midtones Color",0.5,0.5,0.5) \
 C(DM_SHADOWS,"Shadows / Dark Color",0,0,0) \
 F(DM_DENOISE,"Denoise | Pre-Noise",-100,100,-100,100,0,1) \
 F(DM_BLUR,"Pre-Blur",0,100,0,100,0,1) \
 F(DM_SHARP,"Sharpen Strength",0,10,0,5,0,2) \
 F(DM_SHARPR,"Sharpen Radius",0.1,20,0.1,10,1,1) \
 E(DM_E_COLOR) \
 G(DM_G_GRAIN,"Film Grain") \
 K(DM_GRAIN_ON,"Enable Film Grain",0) \
 P(DM_GRAIN_TYPE,"Grain Structure","Film Crystal (Halide)|Gaussian (Sensor)|Tape (Scanline)|Clustered (fBm)",4,1) \
 P(DM_GRAIN_MODE,"Color Mode","Color Grain (RGB Dye)|Monochrome Grain",2,1) \
 P(DM_GRAIN_PRESET,"Grain Size Preset","4 mm|8 mm|12 mm|16 mm|24 mm|32 mm|48 mm|64 mm|Custom",9,4) \
 F(DM_GRAIN_SIZE,"Custom Size (mm)",4,64,4,64,16,1) \
 F(DM_GRAIN_AMT,"Grain Amount",0,200,0,100,45,1) \
 F(DM_GRAIN_DENS,"Grain Density",0,100,0,100,85,1) \
 F(DM_GRAIN_CONT,"Grain Contrast",0,200,0,200,100,1) \
 F(DM_GRAIN_SOFT,"Grain Softness",0,100,0,100,35,1) \
 F(DM_GRAIN_LUMA,"Luminance Response",0,100,0,100,85,1) \
 F(DM_GRAIN_SHAD,"Shadows Response",0,200,0,200,90,1) \
 F(DM_GRAIN_MID,"Midtones Response",0,200,0,200,100,1) \
 F(DM_GRAIN_HIGH,"Highlights Response",0,200,0,200,45,1) \
 F(DM_GRAIN_COLOR,"Color Response",0,200,0,150,70,1) \
 K(DM_GRAIN_AUTO,"Auto Animate Grain",1) \
 F(DM_GRAIN_SPEED,"Animation Speed (%)",0,200,0,150,100,1) \
 F(DM_GRAIN_SEED,"Grain Seed",0,10000,0,10000,0,0) \
 E(DM_E_GRAIN) \
 G(DM_G_VHS,"VHS Tape") \
 K(DM_VHS_ON,"Enable VHS",0) \
 F(DM_VHS_STATIC,"Tape Static",0,100,0,100,35,1) \
 F(DM_VHS_DASH,"Tape Dashes (Dropouts)",0,100,0,100,30,1) \
 F(DM_VHS_STREAK,"Vertical Streaks",0,100,0,100,25,1) \
 F(DM_VHS_BLEED,"Chroma Bleed",0,100,0,100,35,1) \
 F(DM_VHS_SHIFT,"Chroma Shift (px)",-20,20,-10,10,2.5,1) \
 F(DM_VHS_TRACK,"Tracking Wobble",0,100,0,100,20,1) \
 F(DM_VHS_HEAD,"Head-Switch Skew",0,100,0,100,35,1) \
 F(DM_VHS_JITTER,"Line Jitter",0,100,0,100,15,1) \
 F(DM_VHS_VERT,"Vertical Instability",0,100,0,100,10,1) \
 F(DM_VHS_SCAN,"VHS Scanlines",0,100,0,100,30,1) \
 F(DM_VHS_SCAN_SIZE,"Scanline Pitch (px)",1.5,20,1.5,12,3,1) \
 F(DM_VHS_FLICKER,"Flicker",0,100,0,100,20,1) \
 F(DM_VHS_SPEED,"VHS Speed (%)",0,200,0,200,100,1) \
 F(DM_VHS_SEED,"VHS Seed",0,10000,0,10000,0,0) \
 E(DM_E_VHS) \
 G(DM_G_NTSC,"NTSC Analog") \
 K(DM_NTSC_ON,"Enable NTSC",0) \
 F(DM_NTSC_CRAWL,"Dot Crawl & Rainbow",0,100,0,100,45,1) \
 F(DM_NTSC_BLEED,"YIQ Chroma Bleed",0,100,0,100,45,1) \
 F(DM_NTSC_FREQ,"Subcarrier Freq (%)",25,250,50,200,100,1) \
 F(DM_NTSC_SKEW,"H-Sync Phase Skew",0,100,0,100,20,1) \
 F(DM_NTSC_GHOST,"RF Ghosting (Echo)",0,100,0,100,25,1) \
 F(DM_NTSC_GSHIFT,"Ghost Offset (px)",-60,60,-30,30,12,1) \
 F(DM_NTSC_RING,"Luma Edge Ringing",0,100,0,100,30,1) \
 F(DM_NTSC_DELAY,"Chroma Delay (px)",-20,20,-10,10,2,1) \
 F(DM_NTSC_SCAN,"NTSC Scanlines",0,100,0,100,35,1) \
 F(DM_NTSC_SNOW,"RF Carrier Snow",0,100,0,100,20,1) \
 F(DM_NTSC_SPEED,"NTSC Speed (%)",0,200,0,200,100,1) \
 F(DM_NTSC_SEED,"NTSC Seed",0,10000,0,10000,0,0) \
 E(DM_E_NTSC) \
 G(DM_G_CHLINES,"Channels & Lines") \
 K(DM_CH_ON,"Enable RGB Channels",0) \
 F(DM_CH_SEP,"RGB Separation (px)",-100,100,-30,30,4,2) \
 A(DM_CH_ANG,"Separation Angle",0) \
 P(DM_CH_MODE,"Separation Mode","Linear|Radial",2,1) \
 F(DM_CH_JIT,"Channel Row Jitter (px)",0,50,0,20,0,2) \
 K(DM_LN_ON,"Enable Film Lines",0) \
 F(DM_LN_AMT,"Lines Amount",0,10000,0,3000,600,0) \
 F(DM_LN_LEN,"Line Length (%)",10,300,20,200,100,1) \
 F(DM_LN_THK,"Line Thickness (px)",0.1,10,0.2,4,0.8,2) \
 F(DM_LN_CURV,"Line Curvature",0,100,0,100,12,1) \
 F(DM_LN_OPAC,"Lines Opacity (%)",0,100,0,100,75,1) \
 F(DM_LN_SPD,"Lines Speed (%)",0,200,0,200,100,1) \
 E(DM_E_CHLINES)

MJ_DEFINE_PARAMS(YMDITHERS_LIST, DITHERING_MAJEED)

namespace {

static inline float clamp01(float v) { return majeed::clampf(v, 0.f, 1.f); }
static inline float lerp3(float a, float b, float t) { return a + (b - a) * t; }

static void rgb_to_hsv(float r, float g, float b, float& h, float& s, float& v) {
    float mx = std::max(r, std::max(g, b)), mn = std::min(r, std::min(g, b));
    v = mx; float d = mx - mn; s = mx <= 1e-6f ? 0.f : d / mx;
    if (d <= 1e-6f) { h = 0.f; return; }
    if (mx == r) h = (g - b) / d;
    else if (mx == g) h = 2.f + (b - r) / d;
    else h = 4.f + (r - g) / d;
    h /= 6.f; if (h < 0.f) h += 1.f;
}
static void hsv_to_rgb(float h, float s, float v, float& r, float& g, float& b) {
    h = h - std::floor(h); float x = h * 6.f; int i = (int)std::floor(x); float f = x - i;
    float p = v * (1.f - s), q = v * (1.f - s * f), t = v * (1.f - s * (1.f - f));
    switch (i % 6) { case 0:r=v;g=t;b=p;break; case 1:r=q;g=v;b=p;break; case 2:r=p;g=v;b=t;break; case 3:r=p;g=q;b=v;break; case 4:r=t;g=p;b=v;break; default:r=v;g=p;b=q;break; }
}

static void copy_image(const Image& src, Image& dst) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    std::memcpy(dst.px, src.px, (size_t)src.w * src.h * 4 * sizeof(float));
}

static void apply_color(Image& im, double hueDeg, double satPct, bool invert, double gradeBias,
                        bool limitPalette, int indexColors, bool tonal, RGB hi, RGB mid, RGB sh) {
    const bool hasHueSat = std::fabs(hueDeg) > 0.01 || std::fabs(satPct) > 0.01;
    const bool hasGrade = std::fabs(gradeBias) > 0.01;
    if (!hasHueSat && !invert && !hasGrade && !limitPalette && !tonal) return;

    const float hue = (float)(hueDeg / 360.0);
    const float sat = (float)(1.0 + satPct / 100.0);
    const float gb = (float)(gradeBias / 100.0);
    const int colors = std::max(2, std::min(256, indexColors));
    parallel_rows(im.h, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            for (int x = 0; x < im.w; ++x) {
                float* p = im.at(x, y);
                if (hasHueSat || invert || hasGrade) {
                    float h, s, v;
                    rgb_to_hsv(p[0], p[1], p[2], h, s, v);
                    h += hue;
                    s = clamp01(s * sat);
                    if (invert) v = 1.f - v;
                    if (hasGrade) {
                        v = clamp01(v + gb * 0.45f);
                        v = clamp01((v - 0.5f) * (1.f + gb * 0.45f) + 0.5f);
                    }
                    hsv_to_rgb(h, s, v, p[0], p[1], p[2]);
                }
                if (limitPalette) {
                    float q = (float)(colors - 1);
                    p[0] = std::round(clamp01(p[0]) * q) / q;
                    p[1] = std::round(clamp01(p[1]) * q) / q;
                    p[2] = std::round(clamp01(p[2]) * q) / q;
                }
                if (tonal) {
                    float l = majeed::luma709(p[0], p[1], p[2]);
                    RGB c;
                    if (l < 0.5f) {
                        float t = l * 2.f;
                        c = { lerp3(sh.r, mid.r, t), lerp3(sh.g, mid.g, t), lerp3(sh.b, mid.b, t) };
                    } else {
                        float t = (l - 0.5f) * 2.f;
                        c = { lerp3(mid.r, hi.r, t), lerp3(mid.g, hi.g, t), lerp3(mid.b, hi.b, t) };
                    }
                    p[0] = c.r; p[1] = c.g; p[2] = c.b;
                }
            }
        }
    });
}

static void box_blur(const Image& src, Image& dst, int radius) {
    if (radius <= 0) { copy_image(src, dst); return; }
    radius = std::min(radius, 24);
    std::vector<float> tmp((size_t)src.w * src.h * 4);
    Image t{ src.w, src.h, tmp.data() };
    parallel_rows(src.h, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y)
            for (int x = 0; x < src.w; ++x) {
                double a[4] = { 0, 0, 0, 0 }; int n = 0;
                for (int k = -radius; k <= radius; ++k) {
                    int xx = std::max(0, std::min(src.w - 1, x + k));
                    const float* p = src.at(xx, y);
                    for (int c = 0; c < 4; ++c) a[c] += p[c];
                    ++n;
                }
                float* o = t.at(x, y);
                for (int c = 0; c < 4; ++c) o[c] = (float)(a[c] / n);
            }
    });
    parallel_rows(src.h, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y)
            for (int x = 0; x < src.w; ++x) {
                double a[4] = { 0, 0, 0, 0 }; int n = 0;
                for (int k = -radius; k <= radius; ++k) {
                    int yy = std::max(0, std::min(src.h - 1, y + k));
                    const float* p = t.at(x, yy);
                    for (int c = 0; c < 4; ++c) a[c] += p[c];
                    ++n;
                }
                float* o = dst.at(x, y);
                for (int c = 0; c < 4; ++c) o[c] = (float)(a[c] / n);
            }
    });
}

static void apply_preprocess(const Image& src, Image& dst, double denoise, double blur, double sharp, double sharpRadius, int frame) {
    if (std::fabs(denoise) <= 0.01 && blur <= 0.01 && sharp <= 0.001) {
        copy_image(src, dst);
        return;
    }
    std::vector<float> a((size_t)src.w * src.h * 4), b((size_t)src.w * src.h * 4);
    Image A{ src.w, src.h, a.data() }, B{ src.w, src.h, b.data() };
    copy_image(src, A);
    if (std::fabs(denoise) > 0.01) {
        if (denoise > 0) {
            box_blur(A, B, std::max(1, (int)std::round(1.0 + denoise / 35.0)));
            float t = (float)(denoise / 100.0);
            for (size_t i = 0; i < a.size(); i += 4)
                for (int c = 0; c < 3; ++c) A.px[i + c] = lerp3(A.px[i + c], B.px[i + c], t);
        } else {
            float amt = (float)(-denoise / 100.0) * 0.14f;
            uint32_t fseed = 0x4E4F4953u + (uint32_t)frame * 19937u;
            for (int y = 0; y < src.h; ++y)
                for (int x = 0; x < src.w; ++x) {
                    float* p = A.at(x, y);
                    uint32_t h = hash3((uint32_t)x, (uint32_t)y, fseed);
                    float n = s11(h) * amt;
                    for (int c = 0; c < 3; ++c) p[c] = clamp01(p[c] + n);
                }
        }
    }
    if (blur > 0.01) {
        box_blur(A, B, std::max(1, (int)std::round(blur / 12.0)));
        copy_image(B, A);
    }
    if (sharp > 0.001) {
        box_blur(A, B, std::max(1, (int)std::round(sharpRadius / 2.0)));
        float k = (float)std::min(4.0, sharp);
        for (size_t i = 0; i < a.size(); i += 4)
            for (int c = 0; c < 3; ++c) A.px[i + c] = clamp01(A.px[i + c] + (A.px[i + c] - B.px[i + c]) * k);
    }
    copy_image(A, dst);
}

static void pixelate_image(const Image& src, Image& dst, int block) {
    block = std::max(1, std::min(64, block));
    if (block <= 1) { copy_image(src, dst); return; }
    parallel_rows(src.h, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y)
            for (int x = 0; x < src.w; ++x) {
                int x0 = (x / block) * block, y0b = (y / block) * block;
                int x1 = std::min(src.w, x0 + block), y1b = std::min(src.h, y0b + block);
                double a[4] = { 0, 0, 0, 0 }; int n = 0;
                for (int yy = y0b; yy < y1b; ++yy)
                    for (int xx = x0; xx < x1; ++xx) {
                        const float* p = src.at(xx, yy);
                        for (int c = 0; c < 4; ++c) a[c] += p[c];
                        ++n;
                    }
                float* o = dst.at(x, y);
                for (int c = 0; c < 4; ++c) o[c] = (float)(a[c] / std::max(1, n));
            }
    });
}

static void unified_render(const Image& src, Image& dst, const mj::Vals& v, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;
    std::vector<float> a((size_t)W * H * 4), b((size_t)W * H * 4), fx((size_t)W * H * 4);
    Image A{ W, H, a.data() }, B{ W, H, b.data() }, FX{ W, H, fx.data() };
    copy_image(src, A);

    // 1. Color, Tone & Preprocess
    apply_color(A, v[DM_HUE], v[DM_SAT], v.on(DM_INVERT), v[DM_GRADE],
                v.on(DM_LIMIT), (int)std::round(v[DM_INDEX]),
                v.on(DM_TONAL), v.col(DM_HIGHS), v.col(DM_MIDS), v.col(DM_SHADOWS));
    apply_preprocess(A, B, v[DM_DENOISE], v[DM_BLUR], v[DM_SHARP], v[DM_SHARPR], c.frame());
    copy_image(B, A);

    // 2. Dither & Halftone
    if (v[DM_DITHER] > 0.01) {
        DitherParams dp;
        dp.algo = v.pop(DM_ALGO);
        dp.mode = v.pop(DM_MODE);
        dp.levels = (int)std::round(v[DM_TONES]);
        dp.size = v[DM_SIZE];
        dp.threshold = v[DM_THRESH];
        dp.amount = v[DM_DITHER];
        dp.strength = v[DM_SPREAD];
        dp.patternScale = v[DM_PATSCALE];
        dp.patternAngle = v[DM_PATANGLE];
        dp.contrast = v[DM_CONTRAST];
        dp.brightness = v[DM_BRIGHT];
        dp.noise = v[DM_NOISE];
        dp.serpentine = v.on(DM_SERP);
        dp.linear = v.on(DM_LINEAR);
        dp.invert = false; // already handled in Color & Tone
        dp.animate = v.on(DM_ANIM);
        dp.seed = (int)v[DM_SEED];
        dp.preserveAlpha = true;
        dp.light = v.col(DM_HIGHS);
        dp.mid = v.col(DM_MIDS);
        dp.dark = v.col(DM_SHADOWS);
        render_dither(A, FX, dp, c);
        copy_image(FX, A);
    }
    if (v.on(DM_PIXELATE)) {
        pixelate_image(A, B, std::max(1, (int)std::round(v[DM_SIZE] / std::max(0.1, c.scaleX))));
        copy_image(B, A);
    }

    // 3. Smart Film Grain (4mm - 64mm resolution-adaptive, H&D luminance response, Color/Monochrome, Auto Animation)
    if (v.on(DM_GRAIN_ON)) {
        GrainParams gp;
        // Map popup: 0 = Film Crystal (GT_CRYSTAL), 1 = Gaussian (GT_GAUSS), 2 = Tape (GT_TAPE), 3 = Clustered (GT_CLUSTER)
        int gtypePop = v.pop(DM_GRAIN_TYPE);
        gp.type = (gtypePop == 0) ? GT_CRYSTAL : (gtypePop == 1) ? GT_GAUSS : (gtypePop == 2) ? GT_TAPE : GT_CLUSTER;
        // Preset sizes: 4, 8, 12, 16, 24, 32, 48, 64 mm, or Custom
        static const double grainPresets[] = { 4.0, 8.0, 12.0, 16.0, 24.0, 32.0, 48.0, 64.0 };
        int pr = v.pop(DM_GRAIN_PRESET);
        gp.sizeMm = (pr >= 0 && pr < 8) ? grainPresets[pr] : v[DM_GRAIN_SIZE];
        gp.frameWidthMm = 2400.0; // Resolution-adaptive reference width (NOT c.fullW!)
        gp.mono = (v.pop(DM_GRAIN_MODE) == 1);
        gp.amount = v[DM_GRAIN_AMT];
        gp.density = v[DM_GRAIN_DENS];
        gp.contrast = v[DM_GRAIN_CONT];
        gp.softness = v[DM_GRAIN_SOFT];
        gp.sharpness = std::max(10.0, 80.0 - v[DM_GRAIN_SOFT] * 0.6);
        gp.lumaResponse = v[DM_GRAIN_LUMA];
        gp.shadows = v[DM_GRAIN_SHAD];
        gp.midtones = v[DM_GRAIN_MID];
        gp.highlights = v[DM_GRAIN_HIGH];
        gp.colorResponse = v[DM_GRAIN_COLOR];
        gp.rgbGrain = gp.mono ? 0.0 : std::min(100.0, v[DM_GRAIN_COLOR]);
        gp.colorVar = gp.mono ? 0.0 : v[DM_GRAIN_COLOR] * 0.25;
        gp.colorRand = gp.mono ? 0.0 : v[DM_GRAIN_COLOR] * 0.15;
        gp.chanVar = gp.mono ? 0.0 : v[DM_GRAIN_COLOR] * 0.15;
        gp.autoAnim = v.on(DM_GRAIN_AUTO);
        gp.evoSpeed = (v[DM_GRAIN_SPEED] / 100.0) * 24.0;
        gp.seed = (int)v[DM_GRAIN_SEED];
        gp.blend = BM_ADD_SIGNED;
        gp.opacity = 100.0;
        render_grain(A, FX, gp, c);
        copy_image(FX, A);
    }

    // 4. VHS Tape
    if (v.on(DM_VHS_ON)) {
        VHSParams vp;
        vp.staticAmount = v[DM_VHS_STATIC];
        vp.dashes = v[DM_VHS_DASH];
        vp.streaks = v[DM_VHS_STREAK];
        vp.bleed = v[DM_VHS_BLEED];
        vp.bleedShift = v[DM_VHS_SHIFT];
        vp.trackAmount = v[DM_VHS_TRACK];
        vp.headSwitch = v[DM_VHS_HEAD];
        vp.jitterAmount = v[DM_VHS_JITTER];
        vp.vertInstability = v[DM_VHS_VERT];
        vp.scanlines = v[DM_VHS_SCAN];
        vp.scanPeriod = v[DM_VHS_SCAN_SIZE];
        vp.scanSharp = 50;
        vp.flicker = v[DM_VHS_FLICKER];
        vp.speed = v[DM_VHS_SPEED];
        vp.seed = (int)v[DM_VHS_SEED];
        vp.saturation = 100;
        render_vhs(A, FX, vp, c);
        copy_image(FX, A);
    }

    // 5. NTSC Analog
    if (v.on(DM_NTSC_ON)) {
        NTSCParams np;
        np.dotCrawl = v[DM_NTSC_CRAWL];
        np.chromaBleed = v[DM_NTSC_BLEED];
        np.carrierFreq = v[DM_NTSC_FREQ];
        np.phaseSkew = v[DM_NTSC_SKEW];
        np.ghosting = v[DM_NTSC_GHOST];
        np.ghostShift = v[DM_NTSC_GSHIFT];
        np.ringing = v[DM_NTSC_RING];
        np.colorSep = v[DM_NTSC_DELAY];
        np.scanlines = v[DM_NTSC_SCAN];
        np.rfNoise = v[DM_NTSC_SNOW];
        np.speed = v[DM_NTSC_SPEED];
        np.seed = (int)v[DM_NTSC_SEED];
        render_ntsc(A, FX, np, c);
        copy_image(FX, A);
    }

    // 6. Channels & Lines
    if (v.on(DM_CH_ON)) {
        ChannelParams cp;
        cp.sepAmount = v[DM_CH_SEP];
        cp.sepAngle = v[DM_CH_ANG];
        cp.sepMode = v.pop(DM_CH_MODE);
        cp.random = v[DM_CH_JIT];
        cp.randomRate = 24.0;
        cp.seed = (int)v[DM_SEED] + 31;
        render_channels(A, FX, cp, c);
        copy_image(FX, A);
    }
    if (v.on(DM_LN_ON)) {
        LinesParams lp;
        lp.amount = v[DM_LN_AMT];
        lp.lengthScale = v[DM_LN_LEN];
        lp.minThick = std::max(0.1, v[DM_LN_THK] * 0.6);
        lp.maxThick = std::max(0.2, v[DM_LN_THK] * 1.4);
        lp.curvature = v[DM_LN_CURV];
        lp.opacity = v[DM_LN_OPAC];
        lp.evoSpeed = v[DM_LN_SPD];
        lp.motionSpeed = v[DM_LN_SPD];
        lp.seed = (int)v[DM_SEED] + 73;
        render_lines(A, FX, lp, c);
        copy_image(FX, A);
    }

    copy_image(A, dst);
}

// ------------------------------------------------------------------ custom logo UI
static PF_Err DrawLogo(PF_InData* in_data, PF_OutData* out_data, PF_EventExtra* extra) {
    if (!in_data || !extra || !extra->contextH || !*extra->contextH) return PF_Err_NONE;
    if ((*extra->contextH)->w_type != PF_Window_EFFECT) return PF_Err_NONE;
    if (extra->effect_win.area != PF_EA_CONTROL) return PF_Err_NONE;

    DRAWBOT_DrawRef drawing_ref = nullptr;
    DRAWBOT_SurfaceRef surface_ref = nullptr;
    DRAWBOT_SupplierRef supplier_ref = nullptr;
    DRAWBOT_ImageRef image_ref = nullptr;
    DRAWBOT_Suites suites;
    if (AEFX_AcquireDrawbotSuites(in_data, out_data, &suites) != PF_Err_NONE) {
        return PF_Err_NONE;
    }

    PF_EffectCustomUISuite1* ui = nullptr;
    if (AEFX_AcquireSuite(in_data, nullptr, kPFEffectCustomUISuite, kPFEffectCustomUISuiteVersion1, nullptr, (void**)&ui) == PF_Err_NONE && ui) {
        (*ui->PF_GetDrawingReference)(extra->contextH, &drawing_ref);
        AEFX_ReleaseSuite(in_data, nullptr, kPFEffectCustomUISuite, kPFEffectCustomUISuiteVersion1, nullptr);
    }

    if (drawing_ref && suites.drawbot_suiteP) {
        suites.drawbot_suiteP->GetSupplier(drawing_ref, &supplier_ref);
        suites.drawbot_suiteP->GetSurface(drawing_ref, &surface_ref);
    }

    if (supplier_ref && surface_ref && suites.supplier_suiteP && suites.surface_suiteP) {
        DRAWBOT_Boolean prefers_bgra = 0;
        DRAWBOT_Boolean supports_argb = 0;
        if (suites.supplier_suiteP->PrefersPixelLayoutBGRA) {
            suites.supplier_suiteP->PrefersPixelLayoutBGRA(supplier_ref, &prefers_bgra);
        }
        if (suites.supplier_suiteP->SupportsPixelLayoutARGB) {
            suites.supplier_suiteP->SupportsPixelLayoutARGB(supplier_ref, &supports_argb);
        }

        if (prefers_bgra || !supports_argb) {
            std::vector<unsigned char> bgra((size_t)MAJEED_LOGO_W * MAJEED_LOGO_H * 4);
            for (size_t i = 0; i < (size_t)MAJEED_LOGO_W * MAJEED_LOGO_H; ++i) {
                const unsigned char a = MAJEED_LOGO_ARGB[i * 4 + 0];
                const unsigned char r = MAJEED_LOGO_ARGB[i * 4 + 1];
                const unsigned char g = MAJEED_LOGO_ARGB[i * 4 + 2];
                const unsigned char b = MAJEED_LOGO_ARGB[i * 4 + 3];
                bgra[i * 4 + 0] = b;
                bgra[i * 4 + 1] = g;
                bgra[i * 4 + 2] = r;
                bgra[i * 4 + 3] = a;
            }
            suites.supplier_suiteP->NewImageFromBuffer(
                supplier_ref,
                MAJEED_LOGO_W,
                MAJEED_LOGO_H,
                MAJEED_LOGO_W * 4,
                kDRAWBOT_PixelLayout_32BGRA_Straight,
                bgra.data(),
                &image_ref);
        } else {
            suites.supplier_suiteP->NewImageFromBuffer(
                supplier_ref,
                MAJEED_LOGO_W,
                MAJEED_LOGO_H,
                MAJEED_LOGO_W * 4,
                kDRAWBOT_PixelLayout_32ARGB_Straight,
                MAJEED_LOGO_ARGB,
                &image_ref);
        }

        if (image_ref) {
            DRAWBOT_PointF32 origin;
            origin.x = extra->effect_win.current_frame.left + 6.0f;
            origin.y = extra->effect_win.current_frame.top + 4.0f;
            suites.surface_suiteP->DrawImage(surface_ref, image_ref, &origin, 1.0f);
            suites.supplier_suiteP->ReleaseObject((DRAWBOT_ObjectRef)image_ref);
        }
    }

    AEFX_ReleaseDrawbotSuites(in_data, out_data);
    extra->evt_out_flags = PF_EO_HANDLED_EVENT;
    return PF_Err_NONE;
}

static PF_Err DitherEvent(PF_InData* in_data, PF_OutData* out_data, PF_EventExtra* extra) {
    if (extra && extra->e_type == PF_Event_DRAW) return DrawLogo(in_data, out_data, extra);
    return PF_Err_NONE;
}

} // namespace

static const mj::EffectDef DITHERING_MAJEED_DEF = {
    "YMDithers", DITHERING_MAJEED_specs, DITHERING_MAJEED_COUNT, unified_render,
    "YMDithers native dither, halftone, organic film grain, VHS, NTSC, channels and lines.",
    DitherEvent, true
};

MJ_EXPORT_EFFECT(EffectMain, DITHERING_MAJEED_DEF)
MJ_EXPORT_EFFECT(EffectMainDitheringMAJEED, DITHERING_MAJEED_DEF)

extern "C" DllExport PF_Err PluginDataEntryFunction2(
    PF_PluginDataPtr inPtr,
    PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr,
    const char* inHostName,
    const char* inHostVersion)
{
    (void)inSPBasicSuitePtr;
    (void)inHostName;
    (void)inHostVersion;
    PF_Err result = PF_Err_INVALID_CALLBACK;
    if (inPluginDataCallBackPtr) {
        result = PF_REGISTER_EFFECT_EXT2(
            inPtr,
            inPluginDataCallBackPtr,
            "YMDithers",
            "YMDithers",
            "YMDithers",
            AE_RESERVED_INFO,
            "EffectMain",
            "https://example.invalid/ymdithers");
    }
    return result;
}
