#include "majeed_core.h"
#include <cmath>
#include <vector>
#include <algorithm>

namespace majeed {
namespace {

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
    // Void-and-cluster approximation with Golden ratio
    float v = std::fmod(r + (float)x * 0.75487766f + (float)y * 0.56984029f, 1.0f);
    return v < 0.f ? v + 1.f : v;
}

// Continuous Halftone and Screen generation
inline float screen_threshold(int algo, int x, int y, float angleDeg, float scalePct) {
    float rad = angleDeg * 0.0174532925f;
    float cosA = std::cos(rad), sinA = std::sin(rad);
    float sc = std::max(0.2f, scalePct / 100.0f);
    float u = (cosA * (float)x - sinA * (float)y) / (4.0f * sc);
    float v = (sinA * (float)x + cosA * (float)y) / (4.0f * sc);
    int iu = (int)std::floor(u), iv = (int)std::floor(v);
    float fu = u - (float)iu, fv = v - (float)iv;

    switch (algo) {
        // Halftone dots (0, 22.5, 45 deg)
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
            return std::fmod(std::abs(u + v), 1.0f);
        case 35: // Bitslash (-45)
            return std::fmod(std::abs(u - v), 1.0f);
        case 36: // Variable Hatch
            return std::fmod(std::abs(u * 1.5f + std::sin(v * 2.0f) * 0.5f), 1.0f);
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
            return std::fmod(std::abs(std::sin(u * 3.14159f) + std::sin(v * 6.28318f) * 0.5f), 1.0f);
        case 43: // Z-Modulation
            return std::fmod(std::abs((float)(iu ^ iv) * 0.2f + fu), 1.0f);
        case 44: // Circuit
            return ((iu & 3) == 0 || (iv & 3) == 0) ? 0.3f : 0.7f;
        case 45: // Vertical Stitch
            return std::fmod(fv + ((iu & 1) ? 0.5f : 0.0f), 1.0f);
        case 46: // Horizontal Stitch
            return std::fmod(fu + ((iv & 1) ? 0.5f : 0.0f), 1.0f);
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
            k = { {1, 0, 7.f}, {-1, 1, 1.f}, {0, 1, 3.f}, {1, 1, 5.f} };
            divisor = 16.0f;
            break;
        case 11: // Shiau-Fan
            k = { {1, 0, 8.f}, {-1, 1, 1.f}, {0, 1, 2.f}, {1, 1, 5.f} };
            divisor = 16.0f;
            break;
        case 12: // Skip Neighbours
            k = { {2, 0, 7.f}, {-2, 1, 3.f}, {0, 1, 5.f}, {2, 1, 1.f} };
            divisor = 16.0f;
            break;
        case 13: // Skip1 Neighbours
            k = { {2, 0, 4.f}, {-2, 2, 2.f}, {0, 2, 6.f}, {2, 2, 4.f} };
            divisor = 16.0f;
            break;
        case 14: // Skip2 Neighbours
            k = { {3, 0, 5.f}, {-1, 2, 4.f}, {1, 2, 7.f} };
            divisor = 16.0f;
            break;
        case 15: // Xerox Grain
            k = { {1, 0, 6.f}, {0, 1, 4.f}, {1, 1, 2.f} };
            divisor = 12.0f;
            break;
        default:
            k = { {1, 0, 7.f}, {-1, 1, 3.f}, {0, 1, 5.f}, {1, 1, 1.f} };
            divisor = 16.0f;
            break;
    }
}

} // namespace

void render_dither(const Image& src, const Image& dst, const DitherParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;

    // Requirement 5: Dither Amount must control actual dot density & coverage
    // If Amount <= 0, source image is fully preserved!
    if (p.amount <= 0.01) {
        std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));
        return;
    }

    try {
        const float ditherCoverage = clampf((float)(p.amount / 100.0), 0.0f, 1.0f);
        const float whiteDensity = clampf((float)(p.whiteAmount / 100.0), 0.0f, 1.0f);
        const float blackDensity = clampf((float)(p.blackAmount / 100.0), 0.0f, 1.0f);
        const float bias = clampf((float)((p.threshold - 50.0) / 100.0), -0.5f, 0.5f);
        const float contrast = clampf((float)(p.contrast / 100.0), 0.0f, 3.0f);
        const float brightness = clampf((float)(p.brightness / 100.0), -1.0f, 1.0f);
        const float jitter = clampf((float)(p.randomness / 100.0), 0.0f, 1.0f);
        const uint32_t seedVal = hash_u32((uint32_t)p.seed * 31337u + (p.animateNoise ? (uint32_t)c.frame() * 101u : 0u));

        // Error diffusion branch (algorithms 1..15)
        if (p.algorithm >= 1 && p.algorithm <= 15) {
            std::vector<ErrorKernel> kernel;
            float divisor = 16.0f;
            get_diffusion_kernel(p.algorithm, kernel, divisor);
            const float invDiv = 1.0f / divisor;

            // Working float buffer for error diffusion
            std::vector<float> errBuf((size_t)W * H * 4);
            for (size_t i = 0; i < (size_t)W * H * 4; ++i) {
                errBuf[i] = src.px[i];
            }

            const bool useSerp = p.serpentine && (p.algorithm == 2 || p.serpentine);
            for (int y = 0; y < H; ++y) {
                bool rightToLeft = useSerp && (y & 1);
                int xStart = rightToLeft ? W - 1 : 0;
                int xEnd = rightToLeft ? -1 : W;
                int xStep = rightToLeft ? -1 : 1;

                for (int x = xStart; x != xEnd; x += xStep) {
                    size_t idx = ((size_t)y * W + x) * 4;
                    float origR = src.px[idx], origG = src.px[idx + 1], origB = src.px[idx + 2], alpha = src.px[idx + 3];
                    float r = errBuf[idx], g = errBuf[idx + 1], b = errBuf[idx + 2];

                    // Contrast & brightness
                    auto adjustL = [&](float v) {
                        float vAdj = (v - 0.5f) * contrast + 0.5f + brightness;
                        return clampf(vAdj, 0.f, 1.f);
                    };

                    r = adjustL(r); g = adjustL(g); b = adjustL(b);
                    if (p.linearGamma) {
                        r = std::pow(r, 2.2f); g = std::pow(g, 2.2f); b = std::pow(b, 2.2f);
                    }

                    float luma = luma709(r, g, b);
                    float thresh = 0.5f + bias;
                    if (jitter > 0.001f) {
                        float j = (u01(hash3((uint32_t)x, (uint32_t)y, seedVal)) - 0.5f) * jitter * 0.4f;
                        thresh += j;
                    }

                    // Evaluate dithered output vs source
                    // Requirement 5: dither density selection
                    uint32_t ditherRnd = hash3((uint32_t)x, (uint32_t)y, seedVal ^ 0x9e3779b9u);
                    float sampleProb = u01(ditherRnd);

                    float quantR, quantG, quantB;
                    if (p.colorMode == 2) { // Monochrome B&W
                        float isWhite = (luma >= thresh) ? 1.0f : 0.0f;
                        // Requirement 5: Black & White amount control actual density
                        if (isWhite > 0.5f) {
                            if (sampleProb > whiteDensity) isWhite = luma; // preserve source tone if suppressed
                        } else {
                            if (sampleProb > blackDensity) isWhite = luma;
                        }
                        quantR = quantG = quantB = isWhite;
                    } else { // Preserve Original Colors
                        quantR = (r >= thresh) ? 1.0f : 0.0f;
                        quantG = (g >= thresh) ? 1.0f : 0.0f;
                        quantB = (b >= thresh) ? 1.0f : 0.0f;
                    }

                    float errR = r - quantR;
                    float errG = g - quantG;
                    float errB = b - quantB;

                    // Distribute error
                    for (const auto& ek : kernel) {
                        int nx = x + (rightToLeft ? -ek.dx : ek.dx);
                        int ny = y + ek.dy;
                        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                            size_t nIdx = ((size_t)ny * W + nx) * 4;
                            float w = ek.weight * invDiv;
                            errBuf[nIdx]     += errR * w;
                            errBuf[nIdx + 1] += errG * w;
                            errBuf[nIdx + 2] += errB * w;
                        }
                    }

                    // Requirement 5: Dither Amount controls actual coverage / detail
                    if (sampleProb < ditherCoverage) {
                        dst.px[idx]     = quantR;
                        dst.px[idx + 1] = quantG;
                        dst.px[idx + 2] = quantB;
                    } else {
                        dst.px[idx]     = origR;
                        dst.px[idx + 1] = origG;
                        dst.px[idx + 2] = origB;
                    }
                    dst.px[idx + 3] = alpha;
                }
            }
        }
        // Ordered & Pattern Screens branch (algorithms 16..49)
        else {
            parallel_rows(H, [&](int y0, int y1) {
                for (int y = y0; y < y1; ++y) {
                    for (int x = 0; x < W; ++x) {
                        size_t idx = ((size_t)y * W + x) * 4;
                        float r = src.px[idx], g = src.px[idx + 1], b = src.px[idx + 2], a = src.px[idx + 3];

                        float rAdj = clampf((r - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                        float gAdj = clampf((g - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                        float bAdj = clampf((b - 0.5f) * contrast + 0.5f + brightness, 0.f, 1.f);
                        if (p.linearGamma) {
                            rAdj = std::pow(rAdj, 2.2f);
                            gAdj = std::pow(gAdj, 2.2f);
                            bAdj = std::pow(bAdj, 2.2f);
                        }

                        float luma = luma709(rAdj, gAdj, bAdj);

                        // Threshold computation based on algorithm
                        float thresh = 0.5f;
                        switch (p.algorithm) {
                            case 16: // Bayer 2x2
                                thresh = BAYER2[y & 1][x & 1];
                                break;
                            case 17: // Bayer 4x4
                                thresh = BAYER4[y & 3][x & 3];
                                break;
                            case 18: // Bayer 8x8
                                thresh = BAYER8[y & 7][x & 7];
                                break;
                            case 19: { // Bayer 16x16
                                int bx = x & 15, by = y & 15;
                                int b8x = bx & 7, b8y = by & 7;
                                float base = BAYER8[b8y][b8x];
                                int sub = ((bx >> 3) | ((by >> 3) << 1));
                                thresh = clampf(base + (float)sub * (1.0f / 256.0f), 0.f, 1.f);
                                break;
                            }
                            case 20: // Blue Noise
                                thresh = blue_noise_threshold(x, y, seedVal);
                                break;
                            case 21: // Interleaved Gradient Noise
                                thresh = ign_threshold(x, y, p.animateNoise ? c.frame() : 0);
                                break;
                            case 22: // White Noise
                                thresh = u01(hash3((uint32_t)x, (uint32_t)y, seedVal));
                                break;
                            default: // Continuous Halftones and Screens (23..49)
                                thresh = screen_threshold(p.algorithm, x, y, (float)p.patternAngle, (float)p.patternScale);
                                break;
                        }

                        thresh += bias;
                        if (jitter > 0.001f) {
                            thresh += (u01(hash3((uint32_t)x, (uint32_t)y, seedVal ^ 0x51A8Du)) - 0.5f) * jitter * 0.4f;
                        }

                        uint32_t ditherRnd = hash3((uint32_t)x, (uint32_t)y, seedVal ^ 0x9e3779b9u);
                        float sampleProb = u01(ditherRnd);

                        float quantR, quantG, quantB;
                        if (p.colorMode == 2) { // Monochrome B&W
                            float isWhite = (luma >= thresh) ? 1.0f : 0.0f;
                            if (isWhite > 0.5f) {
                                if (sampleProb > whiteDensity) isWhite = luma;
                            } else {
                                if (sampleProb > blackDensity) isWhite = luma;
                            }
                            quantR = quantG = quantB = isWhite;
                        } else { // Preserve Original Colors
                            quantR = (rAdj >= thresh) ? 1.0f : 0.0f;
                            quantG = (gAdj >= thresh) ? 1.0f : 0.0f;
                            quantB = (bAdj >= thresh) ? 1.0f : 0.0f;
                        }

                        // Requirement 5: Dither Amount controls actual coverage / detail
                        if (sampleProb < ditherCoverage) {
                            dst.px[idx]     = quantR;
                            dst.px[idx + 1] = quantG;
                            dst.px[idx + 2] = quantB;
                        } else {
                            dst.px[idx]     = r;
                            dst.px[idx + 1] = g;
                            dst.px[idx + 2] = b;
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
