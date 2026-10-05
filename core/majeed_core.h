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
#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#else
#include <thread>
#endif

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
#ifdef _WIN32
    SYSTEM_INFO sysinfo;
    GetSystemInfo(&sysinfo);
    unsigned hc = (unsigned)sysinfo.dwNumberOfProcessors;
    unsigned n = hc == 0 ? 4u : std::min(4u, hc);
    if ((int)n > h) n = (unsigned)h;
    if (n <= 1) { f(0, h); return; }
    struct Task { const F* fn; int y0, y1; };
    Task tasks[4];
    HANDLE handles[4];
    unsigned spawned = 0;
    int per = (h + (int)n - 1) / (int)n;
    auto worker = [](LPVOID param) -> DWORD {
        const Task* t = static_cast<const Task*>(param);
        (*t->fn)(t->y0, t->y1);
        return 0;
    };
    for (unsigned i = 0; i < n - 1; ++i) {
        int y0 = (int)i * per, y1 = std::min(h, y0 + per);
        if (y0 >= y1) break;
        tasks[spawned] = { &f, y0, y1 };
        HANDLE th = CreateThread(nullptr, 0, worker, &tasks[spawned], 0, nullptr);
        if (th) {
            handles[spawned++] = th;
        } else {
            f(y0, y1);
        }
    }
    int last0 = (int)(n - 1) * per;
    if (last0 < h) f(last0, h);
    if (spawned > 0) {
        WaitForMultipleObjects((DWORD)spawned, handles, TRUE, INFINITE);
        for (unsigned i = 0; i < spawned; ++i) {
            CloseHandle(handles[i]);
        }
    }
#else
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
#endif
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
//  LINES & PROCEDURAL CONTOUR STRANDS (lines.cpp)
// =========================================================================
enum LinesComposite { LC_OVER = 0, LC_ADD, LC_SCREEN, LC_MULTIPLY, LC_TRANSPARENT, LC_ON_BLACK };
enum LinesColorMode { LCM_SINGLE = 0, LCM_RANDOM = 1, LCM_SAMPLED = 2 };
enum LinesEdgeDir { LED_ALONG = 0, LED_PERP = 1, LED_RANDOM = 2, LED_CUSTOM = 3 };

struct LinesParams {
    bool   enabled = true;
    double amount = 600;            // Strand count
    double density = 100;
    double length = 50;             // Base strand length in px
    double minLen = 50, maxLen = 150, lengthScale = 100;
    double lengthRand = 40;         // Length randomness (%)
    double angle = 0;               // Direction angle in degrees
    double angleRand = 180;         // Direction randomness (0..180 deg)
    double horizBias = 30, vertBias = 0, diagBias = 0;
    double width = 1.0;             // Strand thickness in px
    double minThick = 0.5, maxThick = 1.5, thickScale = 100;
    double widthRand = 30;          // Thickness randomness (%)
    double posRand = 100;           // Position distribution randomness (%)
    double curvature = 12;          // Strand curvature / bend (%)
    double curvRand = 100;          // Curvature randomness (%)
    int    segments = 4;            // Segments per hair strand for organic flexing
    double kink = 25;               // Kink / angular deflection at joints
    
    // Appearance & Color
    int    colorMode = LCM_SINGLE;  // 0: Single, 1: Sampled from Image, 2: Random
    RGB    color = {1, 1, 1};       // Strand base color
    double colorAmt = 0;            // Color tint amount
    double colorRand = 0;           // Color variation / jitter (%)
    double opacity = 90;            // Strand opacity (%)
    double opacityRand = 25;        // Opacity randomness (%)
    double brightness = 78, brightRand = 35;
    int    composite = LC_OVER;     // Blend mode
    double layerOpacity = 100;      // Master layer opacity (%)
    
    // Spatial Distribution
    double spacing = 0, clustering = 30, clusterSize = 220, distribution = 0;

    // Animation
    bool   autoAnim = true;         // Automatic deterministic animation with frame/time
    double motionAmount = 25;       // Organic sway amplitude (px)
    double motionSpeed = 100;       // Animation speed (%)
    double motionDir = 0;           // Motion direction angle
    double motionRand = 50;         // Motion phase randomness (%)
    double evolutionDeg = 0, evoSpeed = 100;
    double lifetime = 6, fade = 35, fadeRand = 50;
    double jitter = 0.6, jitterSpeed = 12;
    int    seed = 1;
    
    // Object mode (Edge-guided contour following - ZERO gap!)
    bool   objectMode = true;       // [ ] Object checkbox (default ON)
    double edgeThreshold = 25;      // Edge gradient sensitivity threshold (0..100)
    double edgeSensitivity = 75;    // Edge contrast gain (0..100)
    double edgeDensity = 80;        // Density of strands along edges (0..100)
    double edgeSpread = 0;          // Default 0 for strict adhesion to contour
    double edgeOffset = 0.0;        // Small user offset (px, default 0 = directly on contour)
    int    edgeDirection = LED_ALONG; // 0: Along Edge, 1: Perpendicular, 2: Random, 3: Custom Angle

    // Hand Made Lines
    bool   handMade = true;         // [ ] Hand Made Lines checkbox
    double curve = 30;              // Curvature / organic hand-drawn deviation (0..100)

    // Duplicate Lines
    bool   duplicate = false;       // [ ] Duplicate Lines checkbox
    int    duplicateCount = 1;      // 1..4 duplicate companion lines
    double duplicateOffset = 2.5;   // Spacing in pixels hugging the contour
    double duplicateLength = 90;    // Duplicate length (%)
    double duplicateWidth = 0.8;    // Duplicate thickness (px)
    double duplicateOpacity = 75;   // Duplicate opacity (%)
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
    int    mode = 1;                 // 0: preserve RGB, 1: monochrome B&W, 2: duo-tone
    int    levels = 2;               // tones per channel (2..64)
    double size = 1;                 // dither pixel / pattern scale in full-res px
    double threshold = 50;           // threshold / dot density bias (0..100, 50 = neutral)
    double amount = 100;             // MASTER DENSITY / COVERAGE (0..100) - controls number of dots!
    double whiteAmount = 100;        // White dot density in Monochrome mode (0..100)
    double blackAmount = 100;        // Black dot density in Monochrome mode (0..100)
    double strength = 100;           // spread / contrast of threshold
    double contrast = 100, brightness = 0;
    bool   serpentine = true, linear = false, invert = false, preserveAlpha = true;
    bool   pixelate = false;         // Optional pixelation post-dither (default false!)
    bool   animate = false;          // deterministic frame animation for noise/randomness
    double patternScale = 100, patternAngle = 0;    // percent of the algorithm default / added degrees
    double noise = 0;                // extra threshold randomness/jitter (0..100)
    int    seed = 0;
    RGB    dark = {0, 0, 0}, light = {1, 1, 1}, mid = {0.5f, 0.5f, 0.5f};
};
void render_dither(const Image& src, const Image& dst, const DitherParams& p, const FrameCtx& c);

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
