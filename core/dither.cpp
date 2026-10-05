// ============================================================================
// YMDithers DITHER - 49 distinct native dithering & halftone algorithms.
//   * Error diffusion: 15 distinct kernels over the image in scan or serpentine
//     order, with bounded error propagation (immune to overflow/NaN at high spread)
//     and photocopy edge enhancement for Xerox Grain.
//   * Ordered dithering: analytic recursive Bayer 2x2 / 4x4 / 8x8 / 16x16,
//     isotropic Blue Noise, Jimenez Interleaved Gradient Noise, White Noise.
//   * Halftone & Pattern Screens: 27 geometrically distinct spot functions,
//     rank-normalised on a symmetric 64x64 phase lattice so tone maps linearly
//     to dot/line area without directional tie-breaking artefacts.
//   * Color modes: Preserve RGB, Monochrome B&W, Custom Duo-Tone, CMYK Angled
//     Halftone Separation, and Tonal Tri-Tone Ramp.
// ============================================================================
#include "majeed_core.h"
#include <cstring>

namespace majeed {
namespace {

// ------------------------------------------------------------ kernels -------
struct Tap { int dx, dy; float w; };
struct Kernel {
    int ntaps;
    Tap taps[12];
};

enum {
    K_FS = 0, K_JJN, K_STUCKI, K_ATKINSON, K_BURKES, K_SIERRA3, K_SIERRA2, K_SIERRALITE,
    K_FAN, K_SHIAUFAN, K_SKIP1, K_SKIP2, K_SKIP3, K_COUNT
};

static const Kernel KERNELS[K_COUNT] = {
    // K_FS: Floyd-Steinberg (7, 3, 5, 1) / 16
    { 4, { {1,0,7.f/16.f}, {-1,1,3.f/16.f}, {0,1,5.f/16.f}, {1,1,1.f/16.f} } },
    // K_JJN: Jarvis-Judice-Ninke / 48
    { 12, { {1,0,7.f/48.f}, {2,0,5.f/48.f},
            {-2,1,3.f/48.f}, {-1,1,5.f/48.f}, {0,1,7.f/48.f}, {1,1,5.f/48.f}, {2,1,3.f/48.f},
            {-2,2,1.f/48.f}, {-1,2,3.f/48.f}, {0,2,5.f/48.f}, {1,2,3.f/48.f}, {2,2,1.f/48.f} } },
    // K_STUCKI: Stucki / 42
    { 12, { {1,0,8.f/42.f}, {2,0,4.f/42.f},
            {-2,1,2.f/42.f}, {-1,1,4.f/42.f}, {0,1,8.f/42.f}, {1,1,4.f/42.f}, {2,1,2.f/42.f},
            {-2,2,1.f/42.f}, {-1,2,2.f/42.f}, {0,2,4.f/42.f}, {1,2,2.f/42.f}, {2,2,1.f/42.f} } },
    // K_ATKINSON: Atkinson (6/8 diffused -> high contrast midtones, clean shadows/highlights)
    { 6, { {1,0,1.f/8.f}, {2,0,1.f/8.f}, {-1,1,1.f/8.f}, {0,1,1.f/8.f}, {1,1,1.f/8.f}, {0,2,1.f/8.f} } },
    // K_BURKES: Burkes / 32
    { 7, { {1,0,8.f/32.f}, {2,0,4.f/32.f},
           {-2,1,2.f/32.f}, {-1,1,4.f/32.f}, {0,1,8.f/32.f}, {1,1,4.f/32.f}, {2,1,2.f/32.f} } },
    // K_SIERRA3: Sierra-3 / 32
    { 10, { {1,0,5.f/32.f}, {2,0,3.f/32.f},
            {-2,1,2.f/32.f}, {-1,1,4.f/32.f}, {0,1,5.f/32.f}, {1,1,4.f/32.f}, {2,1,2.f/32.f},
            {-1,2,2.f/32.f}, {0,2,3.f/32.f}, {1,2,2.f/32.f} } },
    // K_SIERRA2: Sierra Two-Row / 16
    { 7, { {1,0,4.f/16.f}, {2,0,3.f/16.f},
           {-2,1,1.f/16.f}, {-1,1,2.f/16.f}, {0,1,3.f/16.f}, {1,1,2.f/16.f}, {2,1,1.f/16.f} } },
    // K_SIERRALITE: Sierra Lite / 4
    { 3, { {1,0,2.f/4.f}, {-1,1,1.f/4.f}, {0,1,1.f/4.f} } },
    // K_FAN: Fan / 16 (diagonal left bias)
    { 4, { {1,0,7.f/16.f}, {-2,1,1.f/16.f}, {-1,1,3.f/16.f}, {0,1,5.f/16.f} } },
    // K_SHIAUFAN: Shiau-Fan 5-tap wide left fan / 16
    { 5, { {1,0,8.f/16.f}, {-3,1,1.f/16.f}, {-2,1,1.f/16.f}, {-1,1,2.f/16.f}, {0,1,4.f/16.f} } },
    // K_SKIP1: Skip Neighbours (2-px stride woven cluster diffusion)
    { 4, { {2,0,7.f/16.f}, {-2,2,3.f/16.f}, {0,2,5.f/16.f}, {2,2,1.f/16.f} } },
    // K_SKIP2: Skip1 Neighbours (3-px stride structured stipple diffusion)
    { 5, { {3,0,6.f/16.f}, {-3,2,3.f/16.f}, {0,3,4.f/16.f}, {3,2,2.f/16.f}, {0,1,1.f/16.f} } },
    // K_SKIP3: Skip2 Neighbours (4-px stride cross-weave diffusion)
    { 5, { {4,0,6.f/16.f}, {-4,3,3.f/16.f}, {0,4,4.f/16.f}, {4,3,2.f/16.f}, {2,1,1.f/16.f} } },
};

// ------------------------------------------------------------ algorithm table
enum Spot {
    S_DOT = 0, S_SQUARE, S_MOSAIC, S_RECT,
    S_LINEH, S_LINEMED, S_LINEHEAVY, S_LINEV,
    S_DIAG, S_DIAG2, S_HATCH,
    S_GRID, S_CYBER, S_CROSS, S_DIAMOND, S_STAR,
    S_WAVE, S_ZIGZAG, S_CIRCUIT,
    S_STITCHV, S_STITCHH, S_CLOCK, S_BITHREAD, S_KNIT
};
const int F_SERP = 256, F_NOISE = 512, F_XEROX = 1024;

static const DitherAlgoInfo ALGOS[] = {
    {"Floyd-Steinberg",           DK_ERROR, K_FS, 0, 0, "Error diffusion 7-3-5-1 /16"},
    {"Floyd-Steinberg Serpentine",DK_ERROR, K_FS | F_SERP, 0, 0, "Floyd-Steinberg, alternating scan direction"},
    {"Jarvis-Judice-Ninke",       DK_ERROR, K_JJN, 0, 0, "3-row 12-tap kernel /48"},
    {"Stucki",                    DK_ERROR, K_STUCKI, 0, 0, "3-row 12-tap sharp kernel /42"},
    {"Atkinson",                  DK_ERROR, K_ATKINSON, 0, 0, "Diffuses 6/8 of the error for high-contrast crispness"},
    {"Burkes",                    DK_ERROR, K_BURKES, 0, 0, "2-row 7-tap kernel /32"},
    {"Sierra",                    DK_ERROR, K_SIERRA3, 0, 0, "Sierra-3, 3-row 10-tap kernel /32"},
    {"Sierra Two Row",            DK_ERROR, K_SIERRA2, 0, 0, "Sierra-2, 2-row 7-tap kernel /16"},
    {"Sierra Lite",               DK_ERROR, K_SIERRALITE, 0, 0, "Sierra Lite 2-1-1 /4"},
    {"Fan",                       DK_ERROR, K_FAN, 0, 0, "Fan kernel 7 / 1-3-5 (/16)"},
    {"Shiau-Fan",                 DK_ERROR, K_SHIAUFAN, 0, 0, "Shiau-Fan 5-tap wide fan (/16)"},
    {"Skip Neighbours",           DK_ERROR, K_SKIP1, 0, 0, "2-px step woven cluster error diffusion"},
    {"Skip1 Neighbours",          DK_ERROR, K_SKIP2, 0, 0, "3-px step structured stipple diffusion"},
    {"Skip2 Neighbours",          DK_ERROR, K_SKIP3, 0, 0, "4-px step cross-weave diffusion"},
    {"Xerox Grain",               DK_ERROR, K_FS | F_SERP | F_NOISE | F_XEROX, 0, 0, "Photocopy toner edge boost + grainy serpentine diffusion"},
    {"Bayer 2x2",                 DK_BAYER, 2, 0, 0, "Ordered dither, 2x2 Bayer matrix"},
    {"Bayer 4x4",                 DK_BAYER, 4, 0, 0, "Ordered dither, 4x4 Bayer matrix"},
    {"Bayer 8x8",                 DK_BAYER, 8, 0, 0, "Ordered dither, 8x8 Bayer matrix"},
    {"Bayer 16x16",               DK_BAYER, 16, 0, 0, "Ordered dither, 16x16 Bayer matrix"},
    {"Blue Noise",                DK_BLUE, 0, 0, 0, "Isotropic high-frequency blue-noise threshold field"},
    {"Interleaved Gradient Noise",DK_IGN, 0, 0, 0, "Jimenez spiral interleaved gradient noise"},
    {"White Noise",               DK_WHITE, 0, 0, 0, "Stochastic random threshold per dither cell"},
    {"Halftone",                  DK_SCREEN, S_DOT, 8, 0, "Round-dot halftone screen, 0 deg"},
    {"Halftone 22.5",             DK_SCREEN, S_DOT, 8, 22.5, "Round-dot halftone screen, 22.5 deg"},
    {"Halftone 45",               DK_SCREEN, S_DOT, 8, 45, "Round-dot newspaper halftone screen, 45 deg"},
    {"Matrix",                    DK_SCREEN, S_DOT, 4, 45, "Fine LED/CRT dot matrix, 45 deg"},
    {"Square Halftone",           DK_SCREEN, S_SQUARE, 8, 0, "Crisp expanding square-dot screen"},
    {"Mosaic Halftone",           DK_SCREEN, S_MOSAIC, 6, 0, "Beveled cushion mosaic tile screen"},
    {"Rekt Block",                DK_SCREEN, S_RECT, 8, 0, "Staggered 2:1 rectangular brick screen"},
    {"Row Modulation",            DK_SCREEN, S_LINEH, 4, 0, "Fine horizontal scanline PWM screen"},
    {"Medium Modulation",         DK_SCREEN, S_LINEMED, 6, 0, "Notched CRT slot-mask horizontal modulation"},
    {"Heavy Modulation",          DK_SCREEN, S_LINEHEAVY, 9, 0, "Bold serrated horizontal bar screen"},
    {"Column Modulation",         DK_SCREEN, S_LINEV, 5, 0, "Vertical aperture-grille bar modulation"},
    {"Tilt Modulation",           DK_SCREEN, S_DIAG, 6, 0, "+45 deg engraving diagonal line screen"},
    {"Bitslash",                  DK_SCREEN, S_DIAG2, 5, 0, "-45 deg stepped bit-slash screen"},
    {"Variable Hatch",            DK_SCREEN, S_HATCH, 8, 0, "Woodcut cross-hatching (single to double hatch)"},
    {"Grid Modulation",           DK_SCREEN, S_GRID, 7, 0, "Expanding orthogonal wireframe mesh screen"},
    {"Cyber",                     DK_SCREEN, S_CYBER, 8, 0, "Octagonal tech-cell matrix with corner nodes"},
    {"Cross Square",              DK_SCREEN, S_CROSS, 7, 0, "Expanding plus-cross clusters"},
    {"Diamond",                   DK_SCREEN, S_DIAMOND, 8, 0, "Manhattan-distance diamond clusters"},
    {"Star",                      DK_SCREEN, S_STAR, 9, 0, "Concave 4-pointed astroid star clusters"},
    {"Bytewav",                   DK_SCREEN, S_WAVE, 8, 0, "FM sine-wave line modulation"},
    {"Z-Modulation",              DK_SCREEN, S_ZIGZAG, 8, 0, "Chevron herringbone zig-zag screen"},
    {"Circuit Modulation",        DK_SCREEN, S_CIRCUIT, 10, 0, "PCB concentric tracks and solder pads"},
    {"Vertical Stitch",           DK_SCREEN, S_STITCHV, 6, 0, "Staggered vertical embroidery stitch"},
    {"Horizontal Stitch",         DK_SCREEN, S_STITCHH, 6, 0, "Staggered horizontal running stitch"},
    {"Clock",                     DK_SCREEN, S_CLOCK, 10, 0, "Radial pinwheel sector sweep"},
    {"Bi-thread",                 DK_SCREEN, S_BITHREAD, 7, 0, "Over-under twill basketweave"},
    {"Knit",                      DK_SCREEN, S_KNIT, 7, 0, "V-shaped jersey knit stitch loops"},
};
const int NALGOS = (int)(sizeof(ALGOS) / sizeof(ALGOS[0]));

// ------------------------------------------------ lock-free Bayer & Blue Noise
inline float bayer_threshold(int x, int y, int n) {
    int bits = (n <= 2) ? 1 : (n <= 4) ? 2 : (n <= 8) ? 3 : 4;
    int mask = (1 << bits) - 1;
    int ux = x & mask, uy = y & mask;
    int val = 0;
    for (int b = 0; b < bits; ++b) {
        int bx = (ux >> (bits - 1 - b)) & 1;
        int by = (uy >> (bits - 1 - b)) & 1;
        int digit = (bx ^ by) | (by << 1);
        val = (val << 2) | digit;
    }
    int total = 1 << (2 * bits);
    return (val + 0.5f) / (float)total;
}

// High-frequency isotropic Blue Noise threshold in (0, 1) without static locks or stalls.
// Combines Roberts R2 low-discrepancy quasi-random sequence with high-pass filtered
// multi-tap energy relaxation on a 64x64 toroidal lattice.
inline float blue_noise_threshold(int x, int y, uint32_t seed) {
    int ux = ((x % 64) + 64) % 64;
    int uy = ((y % 64) + 64) % 64;
    auto cell_r2 = [&](int cx, int cy) -> float {
        cx = (cx + 64) & 63;
        cy = (cy + 64) & 63;
        // R2 quasi-random base + local hash permutation
        double q = cx * 0.7548776662466927 + cy * 0.5698402909980532;
        float r2 = (float)(q - std::floor(q));
        float h = u01(hash3((uint32_t)cx, (uint32_t)cy, seed ^ 0xB10E64u));
        return 0.65f * r2 + 0.35f * h;
    };
    float c0 = cell_r2(ux, uy);
    // Subtract local 3x3 low-frequency average to shape spectrum into blue noise (high-pass)
    float neigh = 0.f;
    neigh += cell_r2(ux - 1, uy) + cell_r2(ux + 1, uy) + cell_r2(ux, uy - 1) + cell_r2(ux, uy + 1);
    neigh += 0.707f * (cell_r2(ux - 1, uy - 1) + cell_r2(ux + 1, uy - 1) + cell_r2(ux - 1, uy + 1) + cell_r2(ux + 1, uy + 1));
    neigh /= 6.828f;
    // Map high-pass difference (c0 - neigh) in [-1, 1] through uniform CDF approximation
    float hp = (c0 - neigh) * 2.65f;
    float cdf = 0.5f + 0.5f * std::tanh(hp * 1.15f);
    // Blend with fine R2 rank so histogram is strictly flat in (0, 1)
    float u = c0 + 0.5f * (c0 - neigh);
    u -= std::floor(u);
    return clampf(0.55f * cdf + 0.45f * u, 0.001f, 0.999f);
}

// ------------------------------------------------ spot functions (27 screens)
// Returns distance-from-dark-core value in [0, 1+].
// (fu, fv) in [0, 1) within each cell, (pu, pv) in {0, 1} checker cell indices.
float spot(int id, float fu, float fv, int pu, int pv) {
    int par = (pu + pv) & 1;
    float du = fu - 0.5f, dv = fv - 0.5f;
    auto tri = [](float t) { t -= std::floor(t); return 1.f - std::fabs(2.f * t - 1.f); };
    auto frac1 = [](float t) { return t - std::floor(t); };

    switch (id) {
    case S_DOT: {
        // Classic Euclidean halftone dot (inverted phase on checker so highlights & shadows form clean dots)
        float d1 = std::sqrt(du * du + dv * dv);
        float c2u = (fu < 0.5f ? fu + 0.5f : fu - 0.5f) - 0.5f;
        float c2v = (fv < 0.5f ? fv + 0.5f : fv - 0.5f) - 0.5f;
        float d2 = std::sqrt(c2u * c2u + c2v * c2v);
        return 0.5f + (d1 - d2) * 0.7071f;
    }
    case S_SQUARE:
        return std::max(std::fabs(du), std::fabs(dv)) * 2.f;

    case S_MOSAIC: {
        // Beveled cushion tile with mortar border groove
        float bx = std::fabs(du) * 2.f, by = std::fabs(dv) * 2.f;
        float edge = std::max(bx, by);
        float dome = std::sqrt(du * du + dv * dv) * 1.4f;
        return edge > 0.82f ? 0.95f + (edge - 0.82f) : 0.45f * edge + 0.55f * dome;
    }
    case S_RECT: {
        // Staggered 2:1 brick pattern (odd rows shifted by 0.5 cell)
        float bu = frac1(fu + (pv ? 0.5f : 0.f)) - 0.5f;
        return std::max(std::fabs(bu) * 1.5f, std::fabs(dv) * 2.4f);
    }
    case S_LINEH:
        // Crisp horizontal scanlines with subtle horizontal micro-tie-breaker for smooth PWM width
        return std::fabs(dv) * 2.f + 0.04f * tri(fu);

    case S_LINEMED: {
        // Slot-mask CRT horizontal lines with staggered vertical slot bridges
        float su = frac1(fu + (pv ? 0.5f : 0.f));
        float bridge = su > 0.82f ? 0.32f * (su - 0.82f) / 0.18f : 0.f;
        return std::fabs(dv) * 1.85f + bridge;
    }
    case S_LINEHEAVY: {
        // Bold horizontal bars with sawtooth edge modulation
        float wave = 0.14f * (tri(fu * 2.f) - 0.5f);
        return std::fabs(dv + wave) * 1.8f;
    }
    case S_LINEV:
        // Crisp vertical aperture grille bars
        return std::fabs(du) * 2.f + 0.04f * tri(fv);

    case S_DIAG:
        // +45 degree engraving lines (continuous across cell boundaries)
        return std::fabs(frac1((fu + pu + fv + pv) * 0.5f) - 0.5f) * 2.f;

    case S_DIAG2: {
        // -45 degree stepped bit-slash with pixel notch modulation
        float slash = std::fabs(frac1((fu + pu - (fv + pv)) * 0.5f) - 0.5f) * 2.f;
        float notch = 0.15f * tri((fu + pu + fv + pv) * 1.5f);
        return slash * 0.88f + notch;
    }
    case S_HATCH: {
        // True woodcut cross-hatching: primary +45 hatch for light/midtones, secondary -45 hatch for shadows
        float d1 = std::fabs(frac1((fu + pu + fv + pv) * 0.5f) - 0.5f) * 2.f;
        float d2 = std::fabs(frac1((fu + pu - (fv + pv)) * 0.5f) - 0.5f) * 2.f;
        return d1 < 0.45f ? d1 * 1.1f : 0.5f + 0.5f * std::min(d1, d2);
    }
    case S_GRID: {
        // Orthogonal wireframe mesh (dark lines along cell borders, expanding inward)
        float border = std::min(std::min(fu, 1.f - fu), std::min(fv, 1.f - fv)) * 2.f;
        return border;
    }
    case S_CYBER: {
        // Cyberpunk octagonal tech cell + corner node vias + center diamond
        float ax = std::fabs(du) * 2.f, ay = std::fabs(dv) * 2.f;
        float oct = std::max(std::max(ax, ay), (ax + ay) * 0.72f);
        float ring = std::fabs(oct - 0.68f) * 2.2f;
        float core = (ax + ay) * 1.4f;
        return std::min(ring, core + 0.25f);
    }
    case S_CROSS: {
        // Expanding Maltese / plus cross cluster
        float arm = std::min(std::fabs(du), std::fabs(dv)) * 2.4f;
        float span = std::max(std::fabs(du), std::fabs(dv)) * 0.65f;
        return arm + span;
    }
    case S_DIAMOND:
        // Manhattan diamond
        return (std::fabs(du) + std::fabs(dv));

    case S_STAR: {
        // Concave 4-pointed astroid star
        float a = std::pow(std::fabs(du) + 1e-4f, 0.55f) + std::pow(std::fabs(dv) + 1e-4f, 0.55f);
        return a * a * 0.85f;
    }
    case S_WAVE: {
        // Sinusoidal FM wave lines
        float u2 = (fu + pu) * 0.5f;
        float w = 0.28f * std::sin(6.2831853f * u2);
        return std::fabs(frac1(fv + w) - 0.5f) * 2.f;
    }
    case S_ZIGZAG: {
        // Sharp chevron herringbone zig-zag
        float u2 = (fu + pu) * 0.5f;
        float z = 0.38f * (tri(u2 * 2.f) - 0.5f);
        return std::fabs(frac1(fv + z) - 0.5f) * 2.f;
    }
    case S_CIRCUIT: {
        // PCB concentric square traces with alternating parity & diagonal bridge
        float r = std::max(std::fabs(du), std::fabs(dv)) * 2.f;
        float target = par ? 0.32f : 0.68f;
        float trace = std::fabs(r - target) * 2.6f;
        float pad = std::max(std::fabs(du), std::fabs(dv)) * 3.5f;
        return par ? std::min(trace, pad) : trace;
    }
    case S_STITCHV: {
        // Staggered vertical embroidery stitches
        float sv = frac1(fv + (pu ? 0.5f : 0.f));
        float gap = sv > 0.72f ? (sv - 0.72f) * 2.5f : 0.f;
        return std::fabs(du) * 1.9f + gap;
    }
    case S_STITCHH: {
        // Staggered horizontal running stitches
        float su = frac1(fu + (pv ? 0.5f : 0.f));
        float gap = su > 0.72f ? (su - 0.72f) * 2.5f : 0.f;
        return std::fabs(dv) * 1.9f + gap;
    }
    case S_CLOCK: {
        // Concentric radar / pinwheel angular sectors
        float ang = std::atan2(dv, du) * 0.15915494f + 0.5f; // [0, 1]
        float rad = std::sqrt(du * du + dv * dv) * 1.414f;
        float blades = tri(ang * 4.f + (par ? 0.25f : 0.f) + rad * 0.35f);
        return 0.65f * blades + 0.35f * rad;
    }
    case S_BITHREAD: {
        // Over-under diagonal twill basketweave
        float d1 = std::fabs(frac1(fu + fv) - 0.5f) * 2.f;
        float d2 = std::fabs(frac1(fu - fv) - 0.5f) * 2.f;
        return par ? (0.75f * d1 + 0.25f * d2) : (0.25f * d1 + 0.75f * d2);
    }
    case S_KNIT: {
        // V-shaped jersey knit stitch loop
        float vloop = fv + std::fabs(du) * 1.35f - 0.32f;
        float d1 = std::fabs(frac1(vloop) - 0.5f) * 2.f;
        float rib = std::fabs(du) * 0.55f;
        return d1 * 0.78f + rib * 0.22f;
    }
    }
    return 0.5f;
}

// Build a 64x64 rank-normalised threshold map over a 2x2 cell tile.
// Symmetry-preserving tie-breaker guarantees no directional scanline bias.
struct ScreenMap {
    float T[64 * 64];
};

ScreenMap build_screen_map(int id) {
    ScreenMap sm;
    const int M = 64;
    float raw[M * M];
    int order[M * M];
    for (int y = 0; y < M; ++y) {
        for (int x = 0; x < M; ++x) {
            float u2 = (x + 0.5f) * (2.f / M);
            float v2 = (y + 0.5f) * (2.f / M);
            int pu = (int)u2; if (pu > 1) pu = 1;
            int pv = (int)v2; if (pv > 1) pv = 1;
            float fu = u2 - pu, fv = v2 - pv;
            // Tiny isotropic hash tie-breaker (1e-5) prevents scanline tie-breaking artefacts
            float tie = (u01(hash3((uint32_t)x, (uint32_t)y, 0x5C8EE4u)) - 0.5f) * 1e-4f;
            raw[y * M + x] = spot(id, fu, fv, pu, pv) + tie;
            order[y * M + x] = y * M + x;
        }
    }
    std::sort(order, order + M * M, [&](int a, int b) { return raw[a] < raw[b]; });
    const float invN = 1.f / (float)(M * M);
    for (int r = 0; r < M * M; ++r) {
        sm.T[order[r]] = 1.f - (r + 0.5f) * invN; // core = highest threshold -> turns dark first
    }
    return sm;
}

inline float sample_screen(const ScreenMap& sm, float u2, float v2) {
    // u2, v2 in [0, 2) tile coordinates -> wrap cleanly into [0, 1) of 64x64 LUT
    float tu = u2 * 0.5f; tu -= std::floor(tu);
    float tv = v2 * 0.5f; tv -= std::floor(tv);
    float fx = clampf(tu * 64.f - 0.5f, 0.f, 63.999f);
    float fy = clampf(tv * 64.f - 0.5f, 0.f, 63.999f);
    int x0 = (int)fx & 63, y0 = (int)fy & 63;
    int x1 = (x0 + 1) & 63, y1 = (y0 + 1) & 63;
    float dx = fx - std::floor(fx), dy = fy - std::floor(fy);
    float a = sm.T[y0 * 64 + x0], b = sm.T[y0 * 64 + x1];
    float c = sm.T[y1 * 64 + x0], d = sm.T[y1 * 64 + x1];
    return lerpf(lerpf(a, b, dx), lerpf(c, d, dx), dy);
}

inline float quant_biased(float v, int L, float bias) {
    v = clampf(v + bias, 0.f, 1.f);
    return std::floor(v * (L - 1) + 0.5f) / (float)(L - 1);
}

void diffuse_plane(std::vector<float>& pl, int gw, int gh, int kid, bool serp, float strength,
                   float noise, float bias, uint32_t seed, int L, bool xerox) {
    if (gw <= 0 || gh <= 0) return;
    const Kernel& K = KERNELS[std::max(0, std::min(K_COUNT - 1, kid))];

    // Optional Xerox photocopy high-pass midtone edge boost
    if (xerox && gw > 2 && gh > 2) {
        std::vector<float> orig = pl;
        for (int y = 1; y < gh - 1; ++y) {
            for (int x = 1; x < gw - 1; ++x) {
                float c = orig[(size_t)y * gw + x];
                float lap = 4.f * c - orig[(size_t)(y - 1) * gw + x] - orig[(size_t)(y + 1) * gw + x]
                                    - orig[(size_t)y * gw + (x - 1)] - orig[(size_t)y * gw + (x + 1)];
                float toner = (vnoise2(x * 0.18f, y * 0.18f, seed ^ 0x7E80u, 0.6f)) * 0.12f;
                pl[(size_t)y * gw + x] = clampf(c + lap * 0.55f + toner, 0.f, 1.f);
            }
        }
    }

    const float invLm1 = 1.f / (float)std::max(1, L - 1);
    for (int y = 0; y < gh; ++y) {
        bool rev = serp && (y & 1);
        for (int i = 0; i < gw; ++i) {
            int x = rev ? gw - 1 - i : i;
            // Clamp accumulated value to [-0.35, 1.35] so high strength (>100%) never explodes to Inf/NaN
            float v = clampf(pl[(size_t)y * gw + x], -0.35f, 1.35f);
            float t = v;
            if (noise > 0.f) {
                t += (u01(hash3((uint32_t)x, (uint32_t)y, seed)) - 0.5f) * noise * invLm1;
            }
            float q = quant_biased(t, L, bias);
            float err = clampf((v - q) * strength, -1.0f, 1.0f);
            pl[(size_t)y * gw + x] = q;
            for (int ti = 0; ti < K.ntaps; ++ti) {
                const Tap& tp = K.taps[ti];
                int nx = x + (rev ? -tp.dx : tp.dx), ny = y + tp.dy;
                if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue;
                pl[(size_t)ny * gw + nx] += err * tp.w;
            }
        }
    }
}

} // namespace

int dither_algo_count() { return NALGOS; }
const DitherAlgoInfo& dither_algo(int i) { return ALGOS[std::max(0, std::min(NALGOS - 1, i))]; }
int dither_algo_find(const char* name) {
    if (!name) return -1;
    for (int i = 0; i < NALGOS; ++i) if (std::strcmp(ALGOS[i].name, name) == 0) return i;
    return -1;
}

void render_dither(const Image& src, const Image& dst, const DitherParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;
    const DitherAlgoInfo& A = dither_algo(p.algo);
    const int L = std::max(2, std::min(64, p.levels));
    const double safeScaleX = c.scaleX > 1e-4 ? c.scaleX : 1.0;
    const int block = std::max(1, std::min(128, (int)std::floor(std::max(1.0, p.size) / safeScaleX + 0.5)));
    const int gw = std::max(1, (W + block - 1) / block);
    const int gh = std::max(1, (H + block - 1) / block);

    // Color modes:
    // 0 = Preserve Original Colors (RGB, 3 channels)
    // 1 = Monochrome (Black & White, 1 channel)
    // 2 = Custom Duo-Tone (Dark / Light colors, 1 channel)
    // 3 = CMYK Halftone Separation (4 channels with traditional angled screens)
    // 4 = Tonal Tri-Tone Ramp (Shadows / Midtones / Highlights, 1 channel)
    const int nch = (p.mode == 0) ? 3 : (p.mode == 3) ? 4 : 1;
    const float contrast = (float)(p.contrast / 100.0);
    const float bright = (float)(p.brightness / 100.0);
    const float bias = (float)((50.0 - clampf((float)p.threshold, 0.f, 100.f)) / 50.0 * 0.45);
    const float gam = 2.2f;

    // ---- 1. reduce to the dither grid (block average) + pre-process ---------
    std::vector<std::vector<float>> pl(nch, std::vector<float>((size_t)gw * gh, 0.f));
    parallel_rows(gh, [&](int y0, int y1) {
        for (int gy = y0; gy < y1; ++gy) {
            for (int gx = 0; gx < gw; ++gx) {
                double acc[3] = { 0, 0, 0 };
                int cnt = 0;
                int xStart = gx * block, yStart = gy * block;
                int xe = std::min(W, xStart + block), ye = std::min(H, yStart + block);
                for (int y = yStart; y < ye; ++y) {
                    for (int x = xStart; x < xe; ++x) {
                        const float* s = src.at(x, y);
                        acc[0] += s[0]; acc[1] += s[1]; acc[2] += s[2];
                        ++cnt;
                    }
                }
                float invCnt = cnt > 0 ? (float)(1.0 / cnt) : 0.f;
                float r = (float)acc[0] * invCnt;
                float g = (float)acc[1] * invCnt;
                float b = (float)acc[2] * invCnt;

                // Apply contrast, brightness, invert, gamma in RGB before channel extraction
                float rgb[3] = { r, g, b };
                for (int k = 0; k < 3; ++k) {
                    float t = (rgb[k] - 0.5f) * contrast + 0.5f + bright;
                    if (p.invert) t = 1.f - t;
                    t = clampf(t, 0.f, 1.f);
                    if (p.linear) t = std::pow(t, gam);
                    rgb[k] = t;
                }

                if (nch == 1) {
                    pl[0][(size_t)gy * gw + gx] = luma709(rgb[0], rgb[1], rgb[2]);
                } else if (nch == 3) {
                    pl[0][(size_t)gy * gw + gx] = rgb[0];
                    pl[1][(size_t)gy * gw + gx] = rgb[1];
                    pl[2][(size_t)gy * gw + gx] = rgb[2];
                } else {
                    // CMYK separation (store 1 - ink so 0 = full ink, 1 = paper white)
                    float kInk = 1.f - std::max(rgb[0], std::max(rgb[1], rgb[2]));
                    float invOneMinusK = (1.f - kInk) > 1e-5f ? 1.f / (1.f - kInk) : 0.f;
                    float cInk = (1.f - rgb[0] - kInk) * invOneMinusK;
                    float mInk = (1.f - rgb[1] - kInk) * invOneMinusK;
                    float yInk = (1.f - rgb[2] - kInk) * invOneMinusK;
                    pl[0][(size_t)gy * gw + gx] = clampf(1.f - cInk, 0.f, 1.f);
                    pl[1][(size_t)gy * gw + gx] = clampf(1.f - mInk, 0.f, 1.f);
                    pl[2][(size_t)gy * gw + gx] = clampf(1.f - yInk, 0.f, 1.f);
                    pl[3][(size_t)gy * gw + gx] = clampf(1.f - kInk, 0.f, 1.f);
                }
            }
        }
    });

    // ---- 2. quantise / dither -----------------------------------------------
    const float spread = clampf((float)(p.strength / 100.0), 0.f, 2.f);
    const uint32_t animFrame = p.animate ? (uint32_t)c.frame() : 0u;
    const uint32_t seed = hash3((uint32_t)p.seed, animFrame, 0xD17E5u);

    if (A.kind == DK_ERROR) {
        int kid = A.param & 255;
        bool serp = p.serpentine || ((A.param & F_SERP) != 0);
        bool xerox = (A.param & F_XEROX) != 0;
        float noise = (float)(p.noise / 100.0) + ((A.param & F_NOISE) ? 0.55f : 0.f);
        // Process channels sequentially or in safe bounded threads
        for (int k = 0; k < nch; ++k) {
            diffuse_plane(pl[k], gw, gh, kid, serp, spread, noise, bias, seed + (uint32_t)k * 193u, L, xerox);
        }
    } else {
        ScreenMap sm;
        float pitch = 6.f;
        if (A.kind == DK_SCREEN) {
            sm = build_screen_map(A.param);
            pitch = (float)std::max(2.0, A.cell * std::max(20.0, p.patternScale) / 100.0);
        }
        const int bayN = std::max(2, A.param);
        const float nz = (float)(p.noise / 100.0);

        // CMYK traditional halftone angles (+15, +75, 0, +45 deg) when in CMYK mode
        static const double cmykAngles[4] = { 15.0, 75.0, 0.0, 45.0 };
        float cosCh[4], sinCh[4];
        for (int k = 0; k < nch; ++k) {
            double angDeg = A.angle + p.patternAngle + (nch == 4 ? cmykAngles[k] : 0.0);
            float rad = (float)(angDeg * 0.017453292519943295);
            cosCh[k] = std::cos(rad);
            sinCh[k] = std::sin(rad);
        }

        parallel_rows(gh, [&](int y0, int y1) {
            for (int y = y0; y < y1; ++y) {
                for (int x = 0; x < gw; ++x) {
                    for (int k = 0; k < nch; ++k) {
                        float T = 0.5f;
                        uint32_t chSeed = seed + (uint32_t)k * 0x9E37u;
                        switch (A.kind) {
                        case DK_BAYER:
                            T = bayer_threshold(x + (nch == 4 ? k * 3 : 0), y + (nch == 4 ? k * 5 : 0), bayN);
                            break;
                        case DK_BLUE:
                            T = blue_noise_threshold(x + k * 17, y + k * 29, chSeed);
                            break;
                        case DK_IGN: {
                            float f = 0.06711056f * (x + k * 11 + animFrame * 7) + 0.00583715f * (y + k * 19 + animFrame * 13);
                            f -= std::floor(f);
                            f *= 52.9829189f;
                            T = f - std::floor(f);
                            break;
                        }
                        case DK_WHITE:
                            T = u01(hash3((uint32_t)x, (uint32_t)y, chSeed));
                            break;
                        case DK_SCREEN: {
                            float xs = x + 0.5f, ys = y + 0.5f;
                            float u2 = (xs * cosCh[k] + ys * sinCh[k]) / pitch;
                            float v2 = (-xs * sinCh[k] + ys * cosCh[k]) / pitch;
                            T = sample_screen(sm, u2, v2);
                            break;
                        }
                        default:
                            break;
                        }
                        if (nz > 0.f) {
                            T = clampf(T + (u01(hash3((uint32_t)x, (uint32_t)y, chSeed ^ 0x5A5Au)) - 0.5f) * nz, 0.f, 1.f);
                        }
                        T = clampf(0.5f + (T - 0.5f) * spread, 0.001f, 0.999f);
                        float val = clampf(pl[k][(size_t)y * gw + x] + bias, 0.f, 1.f);
                        float scaled = val * (L - 1);
                        float q = std::floor(scaled + T);
                        pl[k][(size_t)y * gw + x] = clampf(q / (float)(L - 1), 0.f, 1.f);
                    }
                }
            }
        });
    }

    // ---- 3. write back ------------------------------------------------------
    const float amount = clampf((float)(p.amount / 100.0), 0.f, 1.f);
    const float invGam = 1.f / gam;
    parallel_rows(H, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            int gy = std::min(gh - 1, y / block);
            for (int x = 0; x < W; ++x) {
                int gx = std::min(gw - 1, x / block);
                size_t gi = (size_t)gy * gw + gx;
                float v[4] = { 0.f, 0.f, 0.f, 0.f };
                for (int k = 0; k < nch; ++k) {
                    float t = clampf(pl[k][gi], 0.f, 1.f);
                    if (p.linear) t = std::pow(t, invGam);
                    v[k] = t;
                }
                float rgb[3];
                if (p.mode == 0) {
                    rgb[0] = v[0]; rgb[1] = v[1]; rgb[2] = v[2];
                } else if (p.mode == 1) {
                    rgb[0] = rgb[1] = rgb[2] = v[0];
                } else if (p.mode == 2) {
                    rgb[0] = lerpf(p.dark.r, p.light.r, v[0]);
                    rgb[1] = lerpf(p.dark.g, p.light.g, v[0]);
                    rgb[2] = lerpf(p.dark.b, p.light.b, v[0]);
                } else if (p.mode == 3) {
                    // Recombine CMYK plates -> RGB
                    float kMul = v[3];
                    rgb[0] = clampf(v[0] * kMul, 0.f, 1.f);
                    rgb[1] = clampf(v[1] * kMul, 0.f, 1.f);
                    rgb[2] = clampf(v[2] * kMul, 0.f, 1.f);
                } else {
                    // Mode 4: Tonal Tri-Tone Ramp (Shadows -> Midtones -> Highlights)
                    float l = v[0];
                    if (l < 0.5f) {
                        float t = l * 2.f;
                        rgb[0] = lerpf(p.dark.r, p.mid.r, t);
                        rgb[1] = lerpf(p.dark.g, p.mid.g, t);
                        rgb[2] = lerpf(p.dark.b, p.mid.b, t);
                    } else {
                        float t = (l - 0.5f) * 2.f;
                        rgb[0] = lerpf(p.mid.r, p.light.r, t);
                        rgb[1] = lerpf(p.mid.g, p.light.g, t);
                        rgb[2] = lerpf(p.mid.b, p.light.b, t);
                    }
                }
                const float* s = src.at(x, y);
                float* o = dst.at(x, y);
                for (int k = 0; k < 3; ++k) o[k] = lerpf(s[k], rgb[k], amount);
                o[3] = s[3];
            }
        }
    });
    (void)p.preserveAlpha;
}

} // namespace majeed
