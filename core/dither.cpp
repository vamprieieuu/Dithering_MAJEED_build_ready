#include "majeed_core.h"
#include <cmath>
#include <vector>
#include <algorithm>
#include <cstring>

namespace majeed {
namespace {

struct RGBPixel {
    float r, g, b;
};

// 1. Monochrome B&W (2-step)
static const RGBPixel PALETTE_MONOCHROME[2] = {
    { 0.0f, 0.0f, 0.0f },
    { 1.0f, 1.0f, 1.0f }
};

// 2. Strong Green (Matrix Terminal / Phosphor CRT, 4-step)
static const RGBPixel PALETTE_STRONG_GREEN[4] = {
    { 0.02f, 0.05f, 0.02f }, // Deep terminal obsidian
    { 0.05f, 0.35f, 0.12f }, // Forest phosphor
    { 0.00f, 0.88f, 0.30f }, // Vivid Matrix green
    { 0.70f, 1.00f, 0.50f }  // Overdriven phosphor beam
};

// 3. Volcanic / Lava (Basalt, Magma, Solar Gold, 4-step)
static const RGBPixel PALETTE_VOLCANIC_LAVA[4] = {
    { 0.07f, 0.03f, 0.06f }, // Basalt obsidian
    { 0.60f, 0.08f, 0.08f }, // Incandescent crimson
    { 0.98f, 0.44f, 0.06f }, // Molten magma orange
    { 1.00f, 0.94f, 0.52f }  // Liquid solar gold
};

// 4. Strong Red (Cyber Abyss / Virtual Boy, 4-step)
static const RGBPixel PALETTE_STRONG_RED[4] = {
    { 0.04f, 0.00f, 0.02f }, // Deep abyss
    { 0.55f, 0.04f, 0.16f }, // Blood ruby
    { 1.00f, 0.02f, 0.16f }, // Neon scarlet
    { 1.00f, 0.86f, 0.88f }  // Hot coral highlight
};

// 5. Game Boy Classic (4-step Retro Olive)
static const RGBPixel PALETTE_GAME_BOY[4] = {
    { 0.06f, 0.22f, 0.06f }, // Darkest olive
    { 0.19f, 0.38f, 0.19f }, // Deep moss
    { 0.55f, 0.67f, 0.06f }, // Apple olive
    { 0.61f, 0.74f, 0.06f }  // Mint glow
};

// 6. Cyberpunk Neon (4-step Midnight, Magenta, Cyan, Gold)
static const RGBPixel PALETTE_CYBERPUNK[4] = {
    { 0.02f, 0.04f, 0.12f }, // Midnight navy
    { 0.75f, 0.05f, 0.50f }, // Electric magenta
    { 0.00f, 0.92f, 0.88f }, // Neon cyan
    { 0.98f, 0.98f, 0.60f }  // Lemon neon
};

// 7. Amber CRT (4-step Warm Phosphor Amber)
static const RGBPixel PALETTE_AMBER_CRT[4] = {
    { 0.10f, 0.04f, 0.01f }, // Deep shadow
    { 0.50f, 0.22f, 0.00f }, // Warm rust
    { 0.90f, 0.48f, 0.10f }, // Amber phosphor
    { 1.00f, 0.86f, 0.40f }  // Blazing amber core
};

// Bayer threshold matrices (normalized to 0..1)
static const float BAYER2[2][2] = {
    { 0.0f/4.0f, 2.0f/4.0f },
    { 3.0f/4.0f, 1.0f/4.0f }
};

static const float BAYER4[4][4] = {
    {  0.f/16.f,  8.f/16.f,  2.f/16.f, 10.f/16.f },
    { 12.f/16.f,  4.f/16.f, 14.f/16.f,  6.f/16.f },
    {  3.f/16.f, 11.f/16.f,  1.f/16.f,  9.f/16.f },
    { 15.f/16.f,  7.f/16.f, 13.f/16.f,  5.f/16.f }
};

static const float BAYER8[8][8] = {
    {  0.f/64.f, 32.f/64.f,  8.f/64.f, 40.f/64.f,  2.f/64.f, 34.f/64.f, 10.f/64.f, 42.f/64.f },
    { 48.f/64.f, 16.f/64.f, 56.f/64.f, 24.f/64.f, 50.f/64.f, 18.f/64.f, 58.f/64.f, 26.f/64.f },
    { 12.f/64.f, 44.f/64.f,  4.f/64.f, 36.f/64.f, 14.f/64.f, 46.f/64.f,  6.f/64.f, 38.f/64.f },
    { 60.f/64.f, 28.f/64.f, 52.f/64.f, 20.f/64.f, 62.f/64.f, 30.f/64.f, 54.f/64.f, 22.f/64.f },
    {  3.f/64.f, 35.f/64.f, 11.f/64.f, 43.f/64.f,  1.f/64.f, 33.f/64.f,  9.f/64.f, 41.f/64.f },
    { 51.f/64.f, 19.f/64.f, 59.f/64.f, 27.f/64.f, 49.f/64.f, 17.f/64.f, 57.f/64.f, 25.f/64.f },
    { 15.f/64.f, 47.f/64.f,  7.f/64.f, 39.f/64.f, 13.f/64.f, 45.f/64.f,  5.f/64.f, 37.f/64.f },
    { 63.f/64.f, 31.f/64.f, 55.f/64.f, 23.f/64.f, 61.f/64.f, 29.f/64.f, 53.f/64.f, 21.f/64.f }
};

// Jimenez Interleaved Gradient Noise
inline float ign_threshold(int x, int y, int frame) {
    float fx = (float)x, fy = (float)y + (float)frame * 5.588238f;
    float m = 0.06711056f * fx + 0.00583715f * fy;
    return std::fmod(52.9829189f * std::fmod(m, 1.0f), 1.0f);
}

// Pseudo Blue Noise
inline float blue_noise_threshold(int x, int y, uint32_t seed) {
    uint32_t h = hash3((uint32_t)x, (uint32_t)y, seed);
    float r = u01(h);
    float v = std::fmod(r + (float)x * 0.75487766f + (float)y * 0.56984029f, 1.0f);
    return v < 0.f ? v + 1.f : v;
}

inline float safe_mod1(float v) {
    float m = std::fmod(v, 1.0f);
    return (m < 0.f) ? (m + 1.0f) : m;
}

// Continuous Halftone and Screen generation
inline float screen_threshold(int algo, int x, int y, float angleDeg, float scalePct) {
    float effAngle = angleDeg;
    if (algo == 24) effAngle += 22.5f;
    else if (algo == 25) effAngle += 45.0f;
    float rad = effAngle * 0.0174532925f;
    float cosA = std::cos(rad), sinA = std::sin(rad);
    float sc = std::max(0.2f, scalePct / 100.0f);
    float u = (cosA * (float)x - sinA * (float)y) / (4.0f * sc);
    float v = (sinA * (float)x + cosA * (float)y) / (4.0f * sc);
    int iu = (int)std::floor(u), iv = (int)std::floor(v);
    float fu = u - (float)iu, fv = v - (float)iv;

    switch (algo) {
        case 23: // Halftone 0 deg
        case 24: // Halftone 22.5 deg
        case 25: { // Halftone 45 deg
            float dx = fu - 0.5f, dy = fv - 0.5f;
            return clampf(std::hypot(dx, dy) * 1.4142f, 0.f, 1.f);
        }
        case 26: // Matrix
            return clampf((std::abs(fu - 0.5f) + std::abs(fv - 0.5f)), 0.f, 1.f);
        case 27: // Square Halftone
            return clampf(std::max(std::abs(fu - 0.5f), std::abs(fv - 0.5f)) * 2.0f, 0.f, 1.f);
        case 28: // Mosaic
            return ((iu ^ iv) & 1) ? 0.35f : 0.65f;
        case 29: // Rekt Block
            return (((int)std::floor(u * 0.5f) + (int)std::floor(v * 0.5f)) & 1) ? 0.25f : 0.75f;
        case 30: // Row Modulation
            return clampf(std::abs(std::sin(v * 3.14159f)), 0.f, 1.f);
        case 31: // Medium Modulation
            return clampf((std::sin(u * 3.14159f) * 0.5f + std::cos(v * 3.14159f) * 0.5f) + 0.5f, 0.f, 1.f);
        case 32: // Heavy Modulation
            return clampf(std::sin(u * 6.28318f) * std::cos(v * 6.28318f) * 0.5f + 0.5f, 0.f, 1.f);
        case 33: // Column Modulation
            return clampf(std::abs(std::sin(u * 3.14159f)), 0.f, 1.f);
        case 34: // Tilt (+45 engraving)
            return safe_mod1(std::abs(u + v));
        case 35: // Bitslash (-45)
            return safe_mod1(std::abs(u - v));
        case 36: // Variable Hatch
            return safe_mod1(std::abs(u * 1.5f + std::sin(v * 2.0f) * 0.5f));
        case 37: // Grid
            return (std::abs(fu - 0.5f) > 0.4f || std::abs(fv - 0.5f) > 0.4f) ? 0.2f : 0.8f;
        case 38: // Cyber
            return (((iu * 3 + iv * 7) & 15) / 15.0f);
        case 39: // Cross Square
            return clampf((std::abs(fu - 0.5f) * std::abs(fv - 0.5f)) * 4.0f, 0.f, 1.f);
        case 40: // Diamond
            return clampf(std::abs(fu - 0.5f) + std::abs(fv - 0.5f), 0.f, 1.f);
        case 41: // Star
            return clampf(std::min(std::abs(fu - 0.5f), std::abs(fv - 0.5f)) * 2.0f + std::hypot(fu - 0.5f, fv - 0.5f), 0.f, 1.f);
        case 42: // Bytewav
            return safe_mod1(std::abs(std::sin(u * 3.14159f) + std::sin(v * 6.28318f) * 0.5f));
        case 43: // Z-Modulation
            return safe_mod1(std::abs((float)(iu ^ iv) * 0.2f + fu));
        case 44: // Circuit
            return ((iu & 3) == 0 || (iv & 3) == 0) ? 0.3f : 0.7f;
        case 45: // Vertical Stitch
            return safe_mod1(fv + ((iu & 1) ? 0.5f : 0.0f));
        case 46: // Horizontal Stitch
            return safe_mod1(fu + ((iv & 1) ? 0.5f : 0.0f));
        case 47: // Clock
            return clampf(std::atan2(fv - 0.5f, fu - 0.5f) / 6.28318f + 0.5f, 0.f, 1.f);
        case 48: // Bi-thread
            return clampf((std::sin(u * 3.14159f) + std::cos(v * 3.14159f)) * 0.25f + 0.5f, 0.f, 1.f);
        case 49: // Knit
            return clampf(std::abs(std::sin(u * 3.14159f + std::sin(v * 3.14159f))), 0.f, 1.f);
        default:
            return BAYER4[y & 3][x & 3];
    }
}

// Error Diffusion kernel definition
struct ErrorKernel {
    int dx, dy;
    float weight;
};

void get_diffusion_kernel(int algo, std::vector<ErrorKernel>& k, float& divisor) {
    k.clear();
    divisor = 1.0f;
    switch (algo) {
        case 1: // Floyd-Steinberg
        case 2: // Floyd-Steinberg Serpentine
            k = { {1, 0, 7.f}, {-1, 1, 3.f}, {0, 1, 5.f}, {1, 1, 1.f} };
            divisor = 16.0f;
            break;
        case 3: // Jarvis-Judice-Ninke
            k = { {1, 0, 7.f}, {2, 0, 5.f},
                  {-2, 1, 3.f}, {-1, 1, 5.f}, {0, 1, 7.f}, {1, 1, 5.f}, {2, 1, 3.f},
                  {-2, 2, 1.f}, {-1, 2, 3.f}, {0, 2, 5.f}, {1, 2, 3.f}, {2, 2, 1.f} };
            divisor = 48.0f;
            break;
        case 4: // Stucki
            k = { {1, 0, 8.f}, {2, 0, 4.f},
                  {-2, 1, 2.f}, {-1, 1, 4.f}, {0, 1, 8.f}, {1, 1, 4.f}, {2, 1, 2.f},
                  {-2, 2, 1.f}, {-1, 2, 2.f}, {0, 2, 4.f}, {1, 2, 2.f}, {2, 2, 1.f} };
            divisor = 42.0f;
            break;
        case 5: // Atkinson
            k = { {1, 0, 1.f}, {2, 0, 1.f}, {-1, 1, 1.f}, {0, 1, 1.f}, {1, 1, 1.f}, {0, 2, 1.f} };
            divisor = 8.0f;
            break;
        case 6: // Burkes
            k = { {1, 0, 8.f}, {2, 0, 4.f},
                  {-2, 1, 2.f}, {-1, 1, 4.f}, {0, 1, 8.f}, {1, 1, 4.f}, {2, 1, 2.f} };
            divisor = 32.0f;
            break;
        case 7: // Sierra
            k = { {1, 0, 5.f}, {2, 0, 3.f},
                  {-2, 1, 2.f}, {-1, 1, 4.f}, {0, 1, 5.f}, {1, 1, 4.f}, {2, 1, 2.f},
                  {-1, 2, 2.f}, {0, 2, 3.f}, {1, 2, 2.f} };
            divisor = 32.0f;
            break;
        case 8: // Sierra Two Row
            k = { {1, 0, 4.f}, {2, 0, 3.f},
                  {-2, 1, 1.f}, {-1, 1, 2.f}, {0, 1, 3.f}, {1, 1, 2.f}, {2, 1, 1.f} };
            divisor = 16.0f;
            break;
        case 9: // Sierra Lite
            k = { {1, 0, 2.f}, {-1, 1, 1.f}, {0, 1, 1.f} };
            divisor = 4.0f;
            break;
        case 10: // Fan
            k = { {1, 0, 7.f}, {-1, 1, 1.f}, {-1, 1, 1.f}, {0, 1, 2.f}, {1, 1, 4.f}, {2, 1, 2.f} };
            divisor = 16.0f;
            break;
        case 11: // Shiau-Fan
            k = { {1, 0, 4.f}, {-2, 1, 1.f}, {-1, 1, 1.f}, {0, 1, 2.f} };
            divisor = 8.0f;
            break;
        case 12: // Skip Neighbours
            k = { {2, 0, 1.f}, {0, 2, 1.f} };
            divisor = 2.0f;
            break;
        case 13: // Skip1
            k = { {2, 0, 2.f}, {-1, 2, 1.f}, {1, 2, 1.f} };
            divisor = 4.0f;
            break;
        case 14: // Skip2
            k = { {2, 0, 3.f}, {-2, 2, 1.f}, {0, 2, 2.f}, {2, 2, 2.f} };
            divisor = 8.0f;
            break;
        case 15: // Xerox Grain
            k = { {1, 0, 4.f}, {-1, 1, 2.f}, {0, 1, 3.f}, {1, 1, 1.f} };
            divisor = 10.0f;
            break;
        default:
            k = { {1, 0, 7.f}, {-1, 1, 3.f}, {0, 1, 5.f}, {1, 1, 1.f} };
            divisor = 16.0f;
            break;
    }
}

// Multi-tone Palette Quantizer with Dither Strength & Threshold Tuning
inline void quantize_palette_pixel(
    int colorMode,
    float luma,
    float threshMod,
    float strFactor,
    float inR, float inG, float inB,
    float& outR, float& outG, float& outB
) {
    if (colorMode == DPM_PRESERVE) {
        // Preserve Original Colors (RGB channel thresholding)
        float spread = (threshMod - 0.5f) * (0.8f + strFactor * 0.35f);
        outR = (inR + spread >= 0.5f) ? 1.0f : 0.0f;
        outG = (inG + spread >= 0.5f) ? 1.0f : 0.0f;
        outB = (inB + spread >= 0.5f) ? 1.0f : 0.0f;
        return;
    }

    if (colorMode == DPM_MONOCHROME) {
        float isWhite = (luma >= threshMod) ? 1.0f : 0.0f;
        outR = outG = outB = isWhite;
        return;
    }

    const RGBPixel* pal = PALETTE_MONOCHROME;
    int numColors = 2;

    switch (colorMode) {
        case DPM_STRONG_GREEN:
            pal = PALETTE_STRONG_GREEN;
            numColors = 4;
            break;
        case DPM_VOLCANIC_LAVA:
            pal = PALETTE_VOLCANIC_LAVA;
            numColors = 4;
            break;
        case DPM_STRONG_RED:
            pal = PALETTE_STRONG_RED;
            numColors = 4;
            break;
        case DPM_GAME_BOY:
            pal = PALETTE_GAME_BOY;
            numColors = 4;
            break;
        case DPM_CYBERPUNK:
            pal = PALETTE_CYBERPUNK;
            numColors = 4;
            break;
        case DPM_AMBER_CRT:
            pal = PALETTE_AMBER_CRT;
            numColors = 4;
            break;
        default:
            pal = PALETTE_MONOCHROME;
            numColors = 2;
            break;
    }

    // Step-quantization with threshold spread
    float spread = (threshMod - 0.5f) * (0.7f + strFactor * 0.35f);
    float targetVal = clampf(luma + spread, 0.0f, 1.0f);
    int pIdx = clampf((int)std::floor(targetVal * (float)numColors), 0, numColors - 1);
    outR = pal[pIdx].r;
    outG = pal[pIdx].g;
    outB = pal[pIdx].b;
}

inline void apply_color_blend(float qR, float qG, float qB, float sR, float sG, float sB, int colorMode,
                              float& outR, float& outG, float& outB) {
    float qLuma = luma709(qR, qG, qB);
    if (colorMode == DPM_MONOCHROME) {
        float mod = (qLuma >= 0.5f) ? 1.35f : 0.45f;
        outR = clampf(sR * mod, 0.f, 1.f);
        outG = clampf(sG * mod, 0.f, 1.f);
        outB = clampf(sB * mod, 0.f, 1.f);
    } else {
        float tone = (qLuma >= 0.5f) ? 1.25f : 0.55f;
        outR = clampf(lerpf(sR * tone, qR, 0.45f), 0.f, 1.f);
        outG = clampf(lerpf(sG * tone, qR, 0.45f), 0.f, 1.f);
        outB = clampf(lerpf(sB * tone, qB, 0.45f), 0.f, 1.f);
    }
}

} // namespace

// ---------------------------------------------------------------------------
// Main Render Dither Pipeline - Clean, Real & Crash-Proof
// ---------------------------------------------------------------------------
void render_dither(const Image& src, const Image& dst, const DitherParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;

    // Requirement 3: Dither ON/OFF
    if (!p.enabled) {
        std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));
        return;
    }

    try {
        const float contrast = clampf((float)(p.contrast / 100.0), 0.0f, 3.0f);
        const float brightness = clampf((float)(p.brightness / 100.0), -1.0f, 1.0f);
        const float jitter = clampf((float)(p.randomness / 100.0), 0.0f, 1.0f);
        const float bias = (float)((p.threshold - 50.0) / 100.0);
        const uint32_t seedVal = hash_u32((uint32_t)p.seed * 2654435761u + 0x9e3779b9u);

        // Requirement 1: Dither Strength
        // 0 = base effect / no extra boost; as value increases, dither strength becomes progressively stronger
        const float strengthVal = (float)p.strength;
        float strMult = 1.0f;
        if (strengthVal > 0.0f) {
            strMult = 1.0f + strengthVal * 0.15f;
        } else if (strengthVal < 0.0f) {
            strMult = std::max(0.05f, 1.0f + strengthVal * 0.045f);
        }
        const float strFactor = clampf(strengthVal / 20.0f, -1.0f, 1.0f);

        // Required Dither Amount in [0..100%]:
        // Governs actual density/coverage of dithered pixels
        const float ditherCoverage = clampf((float)(p.amount / 100.0), 0.0f, 1.0f);

        // Requirement 2: Scale Dither [1..16]
        const int ditherScale = std::max(1, std::min(16, (int)std::round(p.scale)));

        // Error diffusion branch (algorithms 1..15)
        if (p.algorithm >= 1 && p.algorithm <= 15) {
            std::vector<ErrorKernel> kernel;
            float divisor = 1.0f;
            get_diffusion_kernel(p.algorithm, kernel, divisor);
            const float invDiv = (divisor > 0.001f) ? (1.0f / divisor) : 1.0f;
            const bool serpentine = p.serpentine || (p.algorithm == 2);

            // Downsampled diffusion grid according to ditherScale
            const int gw = std::max(1, (W + ditherScale - 1) / ditherScale);
            const int gh = std::max(1, (H + ditherScale - 1) / ditherScale);
            const size_t gridPixels = (size_t)gw * gh;

            std::vector<float> gridR(gridPixels, 0.f);
            std::vector<float> gridG(gridPixels, 0.f);
            std::vector<float> gridB(gridPixels, 0.f);
            std::vector<float> gridLuma(gridPixels, 0.f);

            for (int gy = 0; gy < gh; ++gy) {
                int yStart = gy * ditherScale;
                int yEnd = std::min(H, yStart + ditherScale);
                for (int gx = 0; gx < gw; ++gx) {
                    int xStart = gx * ditherScale;
                    int xEnd = std::min(W, xStart + ditherScale);
                    float rAcc = 0.f, gAcc = 0.f, bAcc = 0.f;
                    int count = 0;
                    for (int y = yStart; y < yEnd; ++y) {
                        for (int x = xStart; x < xEnd; ++x) {
                            const float* sp = src.at(x, y);
                            rAcc += sp[0]; gAcc += sp[1]; bAcc += sp[2];
                            count++;
                        }
                    }
                    float invC = (count > 0) ? (1.f / (float)count) : 1.f;
                    float rAvg = rAcc * invC;
                    float gAvg = gAcc * invC;
                    float bAvg = bAcc * invC;

                    // Apply contrast & brightness
                    rAvg = clampf((rAvg - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                    gAvg = clampf((gAvg - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                    bAvg = clampf((bAvg - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                    if (p.linearGamma) {
                        rAvg = std::pow(rAvg, 2.2f);
                        gAvg = std::pow(gAvg, 2.2f);
                        bAvg = std::pow(bAvg, 2.2f);
                    }

                    size_t gIdx = (size_t)gy * gw + gx;
                    gridR[gIdx] = rAvg;
                    gridG[gIdx] = gAvg;
                    gridB[gIdx] = bAvg;
                    gridLuma[gIdx] = luma709(rAvg, gAvg, bAvg);
                }
            }

            // Xerox Toner Edge Boost (Algo 15)
            if (p.algorithm == 15 && gw > 2 && gh > 2) {
                std::vector<float> origL(gridLuma);
                for (int gy = 1; gy < gh - 1; ++gy) {
                    for (int gx = 1; gx < gw - 1; ++gx) {
                        size_t gIdx = (size_t)gy * gw + gx;
                        float cVal = origL[gIdx];
                        float lap = 4.f * cVal - origL[(size_t)(gy - 1) * gw + gx]
                                              - origL[(size_t)(gy + 1) * gw + gx]
                                              - origL[(size_t)gy * gw + (gx - 1)]
                                              - origL[(size_t)gy * gw + (gx + 1)];
                        float toner = (u01(hash3((uint32_t)gx, (uint32_t)gy, seedVal)) - 0.5f) * 0.12f;
                        gridLuma[gIdx] = clampf(cVal + lap * 0.55f + toner, 0.f, 1.f);
                    }
                }
            }

            // Error buffer on grid
            std::vector<float> errBuf(gridPixels * 3, 0.f);
            std::vector<RGBPixel> outGrid(gridPixels);

            for (int gy = 0; gy < gh; ++gy) {
                const bool rightToLeft = serpentine && ((gy & 1) == 1);
                for (int i = 0; i < gw; ++i) {
                    int gx = rightToLeft ? (gw - 1 - i) : i;
                    size_t gIdx = (size_t)gy * gw + gx;

                    float inR = clampf(gridR[gIdx] + errBuf[gIdx * 3 + 0], 0.f, 1.f);
                    float inG = clampf(gridG[gIdx] + errBuf[gIdx * 3 + 1], 0.f, 1.f);
                    float inB = clampf(gridB[gIdx] + errBuf[gIdx * 3 + 2], 0.f, 1.f);
                    float luma = clampf(gridLuma[gIdx] + luma709(errBuf[gIdx * 3], errBuf[gIdx * 3 + 1], errBuf[gIdx * 3 + 2]), 0.f, 1.f);

                    float baseThresh = 0.5f + bias;
                    if (jitter > 0.001f) {
                        float j = (u01(hash3((uint32_t)gx, (uint32_t)gy, seedVal)) - 0.5f) * jitter * 0.4f;
                        baseThresh += j;
                    }
                    float threshMod = 0.5f + (baseThresh - 0.5f) * strMult;
                    threshMod = clampf(threshMod, 0.02f, 0.98f);

                    float qR = 0.f, qG = 0.f, qB = 0.f;
                    quantize_palette_pixel(p.colorMode, luma, threshMod, strFactor, inR, inG, inB, qR, qG, qB);

                    // Diffuse error
                    float errWeight = 1.0f + (strMult - 1.0f) * 0.35f;
                    float errR = (inR - qR) * errWeight;
                    float errG = (inG - qG) * errWeight;
                    float errB = (inB - qB) * errWeight;

                    for (const auto& ek : kernel) {
                        int nx = gx + (rightToLeft ? -ek.dx : ek.dx);
                        int ny = gy + ek.dy;
                        if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
                            size_t nIdx = ((size_t)ny * gw + nx) * 3;
                            float w = ek.weight * invDiv;
                            errBuf[nIdx + 0] += errR * w;
                            errBuf[nIdx + 1] += errG * w;
                            errBuf[nIdx + 2] += errB * w;
                        }
                    }

                    outGrid[gIdx] = { qR, qG, qB };
                }
            }

            // Scatter back to full resolution destination
            for (int y = 0; y < H; ++y) {
                int gy = std::min(gh - 1, y / ditherScale);
                for (int x = 0; x < W; ++x) {
                    int gx = std::min(gw - 1, x / ditherScale);
                    size_t gIdx = (size_t)gy * gw + gx;
                    size_t idx = ((size_t)y * W + x) * 4;

                    uint32_t ditherRnd = hash3((uint32_t)x, (uint32_t)y, seedVal ^ 0x9e3779b9u);
                    float sampleProb = u01(ditherRnd);

                    if (sampleProb < ditherCoverage) {
                        float finalR = outGrid[gIdx].r;
                        float finalG = outGrid[gIdx].g;
                        float finalB = outGrid[gIdx].b;
                        if (p.colorBlend) {
                            apply_color_blend(finalR, finalG, finalB, src.px[idx + 0], src.px[idx + 1], src.px[idx + 2], p.colorMode,
                                              finalR, finalG, finalB);
                        }
                        dst.px[idx + 0] = finalR;
                        dst.px[idx + 1] = finalG;
                        dst.px[idx + 2] = finalB;
                    } else {
                        dst.px[idx + 0] = src.px[idx + 0];
                        dst.px[idx + 1] = src.px[idx + 1];
                        dst.px[idx + 2] = src.px[idx + 2];
                    }
                    dst.px[idx + 3] = src.px[idx + 3];
                }
            }
        }
        // Ordered & Pattern Screens branch (algorithms 16..49)
        else {
            parallel_rows(H, [&](int y0, int y1) {
                for (int y = y0; y < y1; ++y) {
                    int sy = y / ditherScale;
                    for (int x = 0; x < W; ++x) {
                        int sx = x / ditherScale;
                        size_t idx = ((size_t)y * W + x) * 4;

                        // Sample representative pixel from cell for uniform block scaling
                        int sampleX = std::min(W - 1, sx * ditherScale + ditherScale / 2);
                        int sampleY = std::min(H - 1, sy * ditherScale + ditherScale / 2);
                        size_t sampleIdx = ((size_t)sampleY * W + sampleX) * 4;

                        float r = src.px[sampleIdx], g = src.px[sampleIdx + 1], b = src.px[sampleIdx + 2], a = src.px[idx + 3];

                        float rAdj = clampf((r - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                        float gAdj = clampf((g - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                        float bAdj = clampf((b - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                        if (p.linearGamma) {
                            rAdj = std::pow(rAdj, 2.2f);
                            gAdj = std::pow(gAdj, 2.2f);
                            bAdj = std::pow(bAdj, 2.2f);
                        }

                        float luma = luma709(rAdj, gAdj, bAdj);

                        // Threshold computation on scaled cell coordinates (sx, sy)
                        float rawThresh = 0.5f;
                        switch (p.algorithm) {
                            case 16: // Bayer 2x2
                                rawThresh = BAYER2[sy & 1][sx & 1];
                                break;
                            case 17: // Bayer 4x4
                                rawThresh = BAYER4[sy & 3][sx & 3];
                                break;
                            case 18: // Bayer 8x8
                                rawThresh = BAYER8[sy & 7][sx & 7];
                                break;
                            case 19: { // Bayer 16x16
                                int bx = sx & 15, by = sy & 15;
                                int b8x = bx & 7, b8y = by & 7;
                                float base = BAYER8[b8y][b8x];
                                int sub = ((bx >> 3) | ((by >> 3) << 1));
                                rawThresh = clampf(base + (float)sub * (1.0f / 256.0f), 0.f, 1.f);
                                break;
                            }
                            case 20: // Blue Noise
                                rawThresh = blue_noise_threshold(sx, sy, seedVal);
                                break;
                            case 21: // Interleaved Gradient Noise
                                rawThresh = ign_threshold(sx, sy, p.animateNoise ? c.frame() : 0);
                                break;
                            case 22: // White Noise
                                rawThresh = u01(hash3((uint32_t)sx, (uint32_t)sy, seedVal));
                                break;
                            default: // Continuous Halftones and Screens (23..49)
                                rawThresh = screen_threshold(p.algorithm, sx, sy, (float)p.patternAngle, (float)p.patternScale);
                                break;
                        }

                        // Jitter & bias
                        rawThresh += bias;
                        if (jitter > 0.001f) {
                            rawThresh += (u01(hash3((uint32_t)sx, (uint32_t)sy, seedVal ^ 0x51A8Du)) - 0.5f) * jitter * 0.4f;
                        }

                        // Requirement 1: Dither Strength modulation
                        float threshMod = 0.5f + (rawThresh - 0.5f) * strMult;
                        threshMod = clampf(threshMod, 0.01f, 0.99f);

                        // Quantize palette pixel
                        float qR = 0.f, qG = 0.f, qB = 0.f;
                        quantize_palette_pixel(p.colorMode, luma, threshMod, strFactor, rAdj, gAdj, bAdj, qR, qG, qB);

                        // Coverage check for Dither Amount
                        uint32_t ditherRnd = hash3((uint32_t)x, (uint32_t)y, seedVal ^ 0x9e3779b9u);
                        float sampleProb = u01(ditherRnd);

                        if (sampleProb < ditherCoverage) {
                            float finalR = qR;
                            float finalG = qG;
                            float finalB = qB;
                            if (p.colorBlend) {
                                apply_color_blend(finalR, finalG, finalB, src.px[idx + 0], src.px[idx + 1], src.px[idx + 2], p.colorMode,
                                                  finalR, finalG, finalB);
                            }
                            dst.px[idx + 0] = finalR;
                            dst.px[idx + 1] = finalG;
                            dst.px[idx + 2] = finalB;
                        } else {
                            dst.px[idx + 0] = src.px[idx + 0];
                            dst.px[idx + 1] = src.px[idx + 1];
                            dst.px[idx + 2] = src.px[idx + 2];
                        }
                        dst.px[idx + 3] = a;
                    }
                }
            });
        }
    } catch (...) {
        std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));
    }
}

} // namespace majeed
