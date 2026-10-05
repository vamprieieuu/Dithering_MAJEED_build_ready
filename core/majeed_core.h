// ============================================================================
// YMDithers native engine - SDK independent core.
// All pixel work of every YMDithers effect lives here. The After Effects glue in
// ../ae only converts AE buffers <-> float RGBA and forwards parameters.
// ============================================================================
#pragma once
#include <cstdint>
#include <cmath>
#include <cstddef>
#include <cstring>
#include <vector>
#include <algorithm>
#include <thread>

namespace majeed {

// ---------------------------------------------------------------- image ----
// Straight (non-premultiplied) float RGBA, 0..1 nominal (values may overshoot).
struct Image {
    int w = 0, h = 0;
    float* px = nullptr;
    // Image is a non-owning view: a const Image still allows writing pixels through it.
    float* at(int x, int y) const { return px + (size_t(y) * w + x) * 4; }
};

// Per-render context. Everything is expressed in FULL-RESOLUTION layer pixels so
// that half/quarter-res previews look identical to a full-res render.
struct FrameCtx {
    double timeSec   = 0.0;
    double fps       = 24.0;
    double scaleX    = 1.0;   // full-res pixels per buffer pixel (downsample factor)
    double scaleY    = 1.0;
    double originX   = 0.0;   // full-res layer position of buffer pixel (0,0)
    double originY   = 0.0;
    double fullW     = 1920;  // full-res layer size (used for mm -> px conversion)
    double fullH     = 1080;
    double pixelAspect = 1.0;
    int    frame() const { return (int)std::floor(timeSec * (fps > 0.1 ? fps : 24.0) + 0.5); }
};

// ------------------------------------------------------------- utilities ---
template <class F> inline void parallel_rows(int h, F f) {
    if (h <= 0) return;
    if (h < 64) { f(0, h); return; }
    unsigned hc = std::thread::hardware_concurrency();
    unsigned n = hc == 0 ? 4u : std::min(4u, hc);
    if ((int)n > h) n = (unsigned)h;
    if (n <= 1) { f(0, h); return; }
    std::vector<std::thread> th;
    th.reserve(n - 1);
    int per = (h + (int)n - 1) / (int)n;
    for (unsigned i = 0; i < n - 1; ++i) {
        int y0 = (int)i * per, y1 = std::min(h, y0 + per);
        if (y0 >= y1) break;
        try {
            th.emplace_back([=, &f] { f(y0, y1); });
        } catch (...) {
            f(y0, y1);
        }
    }
    int last0 = (int)(n - 1) * per;
    if (last0 < h) f(last0, h);
    for (auto& t : th) {
        if (t.joinable()) t.join();
    }
}

inline float clampf(float v, float a, float b) {
    if (!(v == v)) return a; // NaN guard
    return v < a ? a : (v > b ? b : v);
}
inline float lerpf(float a, float b, float t) { return a + (b - a) * t; }
inline float smoothstepf(float a, float b, float x) {
    float denom = b - a;
    if (std::fabs(denom) < 1e-6f) return x >= b ? 1.f : 0.f;
    float t = clampf((x - a) / denom, 0.f, 1.f);
    return t * t * (3.f - 2.f * t);
}
inline float luma709(float r, float g, float b) { return 0.2126f * r + 0.7152f * g + 0.0722f * b; }

// ------------------------------------------------------------ hashing / rng
inline uint32_t hash_u32(uint32_t x) {
    x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x;
}
inline uint32_t hash2(uint32_t a, uint32_t b) {
    return hash_u32(a * 0x9E3779B1U + hash_u32(b ^ 0x85ebca6bU));
}
inline uint32_t hash3(uint32_t a, uint32_t b, uint32_t c) {
    return hash_u32(a * 0x9E3779B1U ^ hash_u32(b + (0x85ebca6bU ^ hash_u32(c + 0xc2b2ae35U))));
}
inline uint32_t hash4(uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    return hash_u32(hash3(a, b, c) + d * 0x27d4eb2fU);
}
inline float u01(uint32_t h) { return (float)(h >> 8) * (1.0f / 16777216.0f); }           // [0,1)
inline float s11(uint32_t h) { return u01(h) * 2.f - 1.f; }                                // [-1,1)
// ~N(0,1) from one 32-bit hash (sum of four bytes, CLT).
inline float gauss(uint32_t h) {
    int s = (int)(h & 255u) + (int)((h >> 8) & 255u) + (int)((h >> 16) & 255u) + (int)(h >> 24);
    return (float)(s - 510) * (1.0f / 147.8f);
}
// Sequential rng for setup code
struct Rng {
    uint32_t s;
    explicit Rng(uint32_t seed) : s(hash_u32(seed ^ 0xA511E9B3u)) {}
    uint32_t next() { s = hash_u32(s + 0x9E3779B9U); return s; }
    float f() { return u01(next()); }
};

// -------------------------------------------------------------- noise -----
inline float shape_interp(float t, float softness /*0 hard .. 1 smooth*/) {
    t = clampf(t, 0.f, 1.f);
    float q = t * t * t * (t * (t * 6.f - 15.f) + 10.f);       // quintic
    float k = 1.f + (1.f - softness) * 14.f;                    // steepen when hard
    return clampf((q - 0.5f) * k + 0.5f, 0.f, 1.f);
}
inline float lattice_g(int ix, int iy, uint32_t seed) { return gauss(hash3((uint32_t)ix, (uint32_t)iy, seed)); }
inline float vnoise2(float x, float y, uint32_t seed, float softness) {
    float fx = std::floor(x), fy = std::floor(y);
    int ix = (int)fx, iy = (int)fy;
    float tx = shape_interp(x - fx, softness), ty = shape_interp(y - fy, softness);
    float a = lattice_g(ix, iy, seed), b = lattice_g(ix + 1, iy, seed);
    float c = lattice_g(ix, iy + 1, seed), d = lattice_g(ix + 1, iy + 1, seed);
    return lerpf(lerpf(a, b, tx), lerpf(c, d, tx), ty);
}
inline float vnoise1(float x, uint32_t seed, uint32_t seed2, float softness) {
    float fx = std::floor(x);
    int ix = (int)fx;
    float t = shape_interp(x - fx, softness);
    return lerpf(gauss(hash3((uint32_t)ix, seed2, seed)), gauss(hash3((uint32_t)(ix + 1), seed2, seed)), t);
}

// ------------------------------------------------------------ colour ------
struct RGB { float r, g, b; };
inline void rgb2yiq(float r, float g, float b, float& y, float& i, float& q) {
    y = 0.299f * r + 0.587f * g + 0.114f * b;
    i = 0.5959f * r - 0.2746f * g - 0.3213f * b;
    q = 0.2115f * r - 0.5227f * g + 0.3112f * b;
}
inline void yiq2rgb(float y, float i, float q, float& r, float& g, float& b) {
    r = y + 0.9557f * i + 0.6199f * q;
    g = y - 0.2716f * i - 0.6469f * q;
    b = y - 1.1082f * i + 1.7051f * q;
}

// Blend modes for Grain.
enum BlendMode {
    BM_ADD_SIGNED = 0, BM_NORMAL, BM_OVERLAY, BM_SOFT_LIGHT, BM_HARD_LIGHT, BM_LINEAR_LIGHT,
    BM_MULTIPLY, BM_SCREEN, BM_DIFFERENCE, BM_LIGHTEN, BM_DARKEN, BM_GRAIN_ONLY, BM_COUNT
};
// b = base [0,1]; l = grain layer value [0,1] (0.5 neutral); d = signed deviation (l = 0.5 + 0.5 d)
inline float blend_channel(int mode, float b, float l, float d) {
    switch (mode) {
    case BM_ADD_SIGNED:   return b + d * 0.5f;
    case BM_NORMAL:       return l;
    case BM_OVERLAY:      return b < 0.5f ? 2.f * b * l : 1.f - 2.f * (1.f - b) * (1.f - l);
    case BM_SOFT_LIGHT: {
        float g = b <= 0.25f ? ((16.f * b - 12.f) * b + 4.f) * b : std::sqrt(std::max(b, 0.f));
        return l <= 0.5f ? b - (1.f - 2.f * l) * b * (1.f - b) : b + (2.f * l - 1.f) * (g - b);
    }
    case BM_HARD_LIGHT:   return l < 0.5f ? 2.f * b * l : 1.f - 2.f * (1.f - b) * (1.f - l);
    case BM_LINEAR_LIGHT: return b + 2.f * l - 1.f;
    case BM_MULTIPLY:     return b * l * 2.f;                    // 0.5 grey == neutral
    case BM_SCREEN:       return 1.f - (1.f - b) * (1.f - (l - 0.5f) * 2.f) ;   // 0.5 grey == neutral
    case BM_DIFFERENCE:   return std::fabs(b - l);
    case BM_LIGHTEN:      return std::max(b, l);
    case BM_DARKEN:       return std::min(b, l);
    case BM_GRAIN_ONLY:   return l;
    }
    return b;
}

// =========================================================================
//  GRAIN  (grain.cpp)
// =========================================================================
enum GrainType { GT_GAUSS = 0, GT_CRYSTAL = 1, GT_TAPE = 2, GT_CLUSTER = 3 };
struct GrainParams {
    int    type = GT_CRYSTAL;
    double sizeMm = 16.0;           // 4 .. 64 mm
    double frameWidthMm = 2400.0;   // physical width the layer width represents
    double amount = 45, density = 85, contrast = 100, brightness = 0;
    double sharpness = 40, softness = 35, threshold = 0, distribution = 0, clumping = 18;
    double fine = 35, coarse = 15, aspect = 100, specks = 0;
    double shadows = 90, midtones = 100, highlights = 45;
    double lumaResponse = 85;       // 0 = flat overlay, 100 = authentic film toe/shoulder response
    double colorResponse = 60;      // chromatic dye-cloud response in Color mode
    int    seed = 0;
    double evolutionDeg = 0, evoSpeed = 24; bool smoothEvo = false;
    bool   autoAnim = true;         // automatic deterministic frame animation without keyframing seed
    double opacity = 100; int blend = BM_OVERLAY;
    bool   mono = false;
    double rgbGrain = 100, redAmt = 100, greenAmt = 100, blueAmt = 100;
    double colorVar = 15, colorRand = 10, chanVar = 10, saturation = 100;
    double rgbSep = 0;                       // px offset of R / B grain fields (x)
    RGB    grainColor = {1, 1, 1}; double colorAmt = 0;  // tint of the grain itself
    // Tape type only: row structure
    double rowBleed = 0;                     // vertical bleed between scanline rows (0..100)
    double rowVar = 40;                      // per-row gain variation (0..100)
};
double grain_px_per_mm(const GrainParams& p, const FrameCtx& c);   // mm -> full-res px
void render_grain(const Image& src, const Image& dst, const GrainParams& p, const FrameCtx& c);

// =========================================================================
//  RANDOM LINES  (lines.cpp)
// =========================================================================
enum LinesComposite { LC_OVER = 0, LC_ADD, LC_SCREEN, LC_MULTIPLY, LC_TRANSPARENT, LC_ON_BLACK };
struct LinesParams {
    double amount = 1800, density = 100;
    double minLen = 60, maxLen = 420, lengthScale = 100;          // px @ full res
    double minThick = 0.5, maxThick = 1.2, thickScale = 100;
    double angle = 0, angleRand = 180;
    double curvature = 8, curvRand = 100;
    int    segments = 2; double kink = 35;                          // polyline scribble
    double opacity = 100, opacityRand = 60;
    double brightness = 70, brightRand = 35;
    double spacing = 0, clustering = 30, clusterSize = 220, distribution = 0;
    double horizBias = 0, vertBias = 0, diagBias = 0;
    int    seed = 1; double evolutionDeg = 0, evoSpeed = 100;
    double lifetime = 6.0;                                          // seconds
    double motionAmount = 40, motionSpeed = 100, motionDir = 0, motionRand = 100;
    double jitter = 0.6, jitterSpeed = 12;
    double fade = 35, fadeRand = 50;
    RGB    color = {1, 1, 1}; double colorAmt = 0;                  // colour of the lines
    int    composite = LC_OVER;
    double layerOpacity = 100;                                      // global opacity
};
void render_lines(const Image& src, const Image& dst, const LinesParams& p, const FrameCtx& c);

// =========================================================================
//  DITHER  (dither.cpp)
// =========================================================================
enum DitherKind { DK_ERROR, DK_BAYER, DK_BLUE, DK_IGN, DK_WHITE, DK_SCREEN };
struct DitherAlgoInfo {
    const char* name; DitherKind kind;
    int param;           // error: kernel id, bayer: matrix size, screen: spot function id
    double cell;         // default cell period in dither pixels (screens)
    double angle;        // default screen angle in degrees
    const char* desc;
};
int dither_algo_count();
const DitherAlgoInfo& dither_algo(int i);
int dither_algo_find(const char* name);   // -1 if not found
struct DitherParams {
    int    algo = 16;                // default Bayer 4x4 (0-based index 16)
    int    mode = 0;                 // 0 preserve RGB, 1 monochrome B&W, 2 duo-tone (dark/light), 3 CMYK halftone separation, 4 tonal tritone ramp
    int    levels = 2;               // tones per channel (2..64)
    double size = 2;                 // dither pixel size in full-res px
    double threshold = 50;           // threshold / dot density bias (0..100, 50 = neutral)
    double amount = 100, strength = 100, contrast = 100, brightness = 0;
    bool   serpentine = true, linear = false, invert = false, preserveAlpha = true;
    bool   animate = false;          // deterministic frame animation for noise/randomness
    double patternScale = 100, patternAngle = 0;    // percent of the algorithm default / added degrees
    double noise = 0;                // extra threshold randomness/jitter (0..100)
    int    seed = 0;
    RGB    dark = {0, 0, 0}, light = {1, 1, 1}, mid = {0.5f, 0.5f, 0.5f};
};
void render_dither(const Image& src, const Image& dst, const DitherParams& p, const FrameCtx& c);

// =========================================================================
//  VHS  (vhs.cpp)
// =========================================================================
struct VHSParams {
    double trackAmount = 20, trackSize = 40, trackSpeed = 50, headSwitch = 40, headHeight = 6;
    double jitterAmount = 15, jitterRate = 100, vertInstability = 10;
    double bleed = 35, bleedShift = 2.5, lumaSoft = 15;
    double rSepX = 1.5, bSepX = -1.5;
    double staticAmount = 35, staticSize = 100;
    double dashes = 30, dashLength = 100, dashRows = 2;
    double streaks = 25, streakWidth = 2;
    double scanlines = 30, scanPeriod = 3, scanSharp = 50, interlace = 35;
    double flicker = 20;
    double saturation = 100;
    double speed = 100; int seed = 0;
};
void render_vhs(const Image& src, const Image& dst, const VHSParams& p, const FrameCtx& c);

// =========================================================================
//  NTSC  (vhs.cpp)
// =========================================================================
struct NTSCParams {
    double chromaBleed = 45;         // YIQ I/Q bandwidth limiting smear (0..100)
    double dotCrawl = 40;            // 3.58MHz subcarrier dot crawl & rainbow cross-color (0..100)
    double carrierFreq = 100;        // Subcarrier frequency scale (25..250%)
    double phaseSkew = 20;           // Horizontal sync phase distortion & line warp (0..100)
    double ghosting = 25;            // Multipath RF echo / ghosting (0..100)
    double ghostShift = 12;          // RF ghost offset in pixels (-60..60)
    double ringing = 30;             // Analog luma overshoot / ringing on sharp edges (0..100)
    double scanlines = 35;           // NTSC 525-line CRT scanlines (0..100)
    double scanPitch = 3.0;          // Scanline pitch in pixels (1.5..16)
    double rfNoise = 20;             // Analog RF snow / carrier noise (0..100)
    double colorSep = 2.0;           // Chroma delay / Y-C registration offset (px)
    double speed = 100;              // Automatic temporal animation speed (%)
    int    seed = 0;
};
void render_ntsc(const Image& src, const Image& dst, const NTSCParams& p, const FrameCtx& c);

// =========================================================================
//  CHANNELS  (channels.cpp)
// =========================================================================
struct ChannelParams {
    double rX = 0, rY = 0, gX = 0, gY = 0, bX = 0, bY = 0;      // per-channel offset (px)
    double sepAmount = 0, sepAngle = 0; int sepMode = 0;        // 0 linear 1 radial
    double rGain = 100, gGain = 100, bGain = 100;
    double random = 0, randomRate = 24; int seed = 0;           // per-row / per-frame channel jitter (px)
    double colorAmt = 100, hue = 0;                             // colour amount (=saturation) / hue shift deg
    RGB    tint = {1, 1, 1}; double tintAmt = 0;
    double brightness = 0, contrast = 100; bool invert = false;
};
void render_channels(const Image& src, const Image& dst, const ChannelParams& p, const FrameCtx& c);

// shared bilinear sampler (edge clamped & bounds-safe)
inline void sample_bilinear(const Image& im, float x, float y, float* out4) {
    if (!im.px || im.w <= 0 || im.h <= 0) {
        out4[0] = out4[1] = out4[2] = out4[3] = 0.f;
        return;
    }
    x = clampf(x, 0.f, (float)(im.w - 1));
    y = clampf(y, 0.f, (float)(im.h - 1));
    int x0 = std::max(0, std::min(im.w - 1, (int)x));
    int y0 = std::max(0, std::min(im.h - 1, (int)y));
    int x1 = std::min(x0 + 1, im.w - 1);
    int y1 = std::min(y0 + 1, im.h - 1);
    float fx = clampf(x - x0, 0.f, 1.f);
    float fy = clampf(y - y0, 0.f, 1.f);
    const float *a = im.at(x0, y0), *b = im.at(x1, y0), *c = im.at(x0, y1), *d = im.at(x1, y1);
    for (int k = 0; k < 4; ++k)
        out4[k] = lerpf(lerpf(a[k], b[k], fx), lerpf(c[k], d[k], fx), fy);
}

} // namespace majeed
