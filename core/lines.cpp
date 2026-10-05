// ============================================================================
// YMDithers LINES - High-performance procedural hair & strand simulation.
//   * Procedural hair/strands with multi-segment organic bending and tip taper.
//   * Crash-proof architecture: bounded memory, numerical clamp guards,
//     row-bucketed spatial rasterization (rock solid at high amounts).
//   * Appearance: Single Color, Random Palette, or Sampled from Image at root.
//   * Automatic deterministic motion animation (smooth sway without flicker).
//   * OBJECT mode checkbox: 3x3 Gaussian pre-filter + Sobel edge detection.
//     Spawns strands exclusively along image contours (face, eyes, body, clothes),
//     with edge-tangent or perpendicular alignment.
// ============================================================================
#include "majeed_core.h"
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstring>

namespace majeed {
namespace {

struct StrandSeg {
    float x0, y0, x1, y1;
    float r;              // radius in buffer px
};

struct Strand {
    int segStart, segCount;
    float col[3];
    float alpha;
    float ymin, ymax;
};

// Edge point candidate extracted from image contours
struct EdgePoint {
    float x, y;
    float nx, ny;         // normal unit vector (gradient direction)
    float tx, ty;         // tangent unit vector (contour direction)
    float strength;
};

// Robust 3x3 edge detection with Gaussian pre-filter
void extract_edge_points(const Image& src, float threshold, float sensitivity,
                        std::vector<EdgePoint>& edges, int maxCandidates) {
    edges.clear();
    const int W = src.w, H = src.h;
    if (W < 4 || H < 4) return;

    // 1. Luminance buffer
    std::vector<float> luma((size_t)W * H);
    for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
            const float* p = src.at(x, y);
            luma[(size_t)y * W + x] = luma709(p[0], p[1], p[2]);
        }
    }

    // 2. Pre-filter 3x3 Gaussian smoothing to suppress fine noise/grain
    std::vector<float> smooth((size_t)W * H);
    for (int y = 1; y < H - 1; ++y) {
        for (int x = 1; x < W - 1; ++x) {
            float s = 4.f * luma[(size_t)y * W + x]
                    + 2.f * (luma[(size_t)y * W + (x - 1)] + luma[(size_t)y * W + (x + 1)]
                           + luma[(size_t)(y - 1) * W + x] + luma[(size_t)(y + 1) * W + x])
                    + 1.f * (luma[(size_t)(y - 1) * W + (x - 1)] + luma[(size_t)(y - 1) * W + (x + 1)]
                           + luma[(size_t)(y + 1) * W + (x - 1)] + luma[(size_t)(y + 1) * W + (x + 1)]);
            smooth[(size_t)y * W + x] = s * (1.f / 16.f);
        }
    }

    // 3. Sobel gradient magnitude and orientation
    const float minMag = clampf(threshold / 100.f, 0.02f, 0.85f);
    const float gain = std::max(0.5f, sensitivity / 50.f);

    edges.reserve(std::min(maxCandidates, W * H / 8));
    for (int y = 2; y < H - 2; ++y) {
        for (int x = 2; x < W - 2; ++x) {
            float tl = smooth[(size_t)(y - 1) * W + (x - 1)], t = smooth[(size_t)(y - 1) * W + x], tr = smooth[(size_t)(y - 1) * W + (x + 1)];
            float l  = smooth[(size_t)y * W + (x - 1)],                                            r  = smooth[(size_t)y * W + (x + 1)];
            float bl = smooth[(size_t)(y + 1) * W + (x - 1)], b = smooth[(size_t)(y + 1) * W + x], br = smooth[(size_t)(y + 1) * W + (x + 1)];

            float gx = (tr + 2.f * r + br) - (tl + 2.f * l + bl);
            float gy = (bl + 2.f * b + br) - (tl + 2.f * t + tr);
            float mag = std::sqrt(gx * gx + gy * gy) * gain;

            if (mag >= minMag) {
                float invMag = 1.f / std::max(1e-5f, std::sqrt(gx * gx + gy * gy));
                float nx = gx * invMag;
                float ny = gy * invMag;
                // Tangent is rotated 90 degrees: (-ny, nx)
                edges.push_back({ (float)x, (float)y, nx, ny, -ny, nx, mag });
                if ((int)edges.size() >= maxCandidates) return;
            }
        }
    }
}

} // namespace

void render_lines(const Image& src, const Image& dst, const LinesParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;

    // Strict safety limits to prevent crashes or unbounded resource exhaustion
    const int maxStrandsAllowed = 16000;
    const int count = (int)std::max(0.0, std::min(p.amount, (double)maxStrandsAllowed));
    if (count <= 0) {
        std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));
        return;
    }

    const uint32_t seed = hash_u32((uint32_t)p.seed * 19937u + 0x51A8Du);
    const double animTime = p.autoAnim ? (c.timeSec * (p.motionSpeed / 100.0)) : 0.0;
    const int animFrame = c.frame();

    // 1. Edge extraction if Object mode is enabled
    std::vector<EdgePoint> edges;
    if (p.objectMode) {
        extract_edge_points(src, (float)p.edgeThreshold, (float)p.edgeSensitivity, edges, 65536);
        if (edges.empty()) {
            // No strong edges found -> graceful fallback to image copy
            std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));
            return;
        }
    }

    // 2. Generate hair strands procedurally
    std::vector<StrandSeg> segs;
    std::vector<Strand> strands;
    const int numSegs = std::max(1, std::min(6, p.segments));
    segs.reserve((size_t)count * (numSegs + 1));
    strands.reserve((size_t)count);

    double effLen = p.length;
    if (p.lengthScale != 100.0 || p.minLen != 80.0 || p.maxLen != 600.0) {
        effLen = (p.minLen + p.maxLen) * 0.5 * (p.lengthScale / 100.0);
    }
    const float baseLen = (float)std::max(2.0, effLen);
    const float lenRnd = (float)clampf((float)(p.lengthRand / 100.0), 0.f, 1.f);

    double effThick = p.width;
    if (p.thickScale != 100.0 || p.minThick != 0.5 || p.maxThick != 1.2) {
        effThick = (p.minThick + p.maxThick) * 0.5 * (p.thickScale / 100.0);
    }
    const float baseThick = (float)clampf((float)effThick, 0.2f, 15.f);
    const float thkRnd = (float)clampf((float)(p.widthRand / 100.0), 0.f, 1.f);
    const float baseAngle = (float)(p.angle * 0.017453292519943295);
    const float angleSpread = (float)(clampf((float)p.angleRand, 0.f, 180.f) * 0.017453292519943295);
    const float baseCurv = (float)(p.curvature / 100.0);
    const float curvRnd = (float)clampf((float)(p.curvRand / 100.0), 0.f, 1.f);
    const float kinkMax = (float)(p.kink * 0.017453292519943295);
    const float motAmt = (float)std::max(0.0, p.motionAmount);
    const float motRnd = (float)clampf((float)(p.motionRand / 100.0), 0.f, 1.f);
    const float masterAlpha = (float)clampf((float)(p.opacity / 100.0 * (p.layerOpacity / 100.0)), 0.f, 1.f);
    const float opacRnd = (float)clampf((float)(p.opacityRand / 100.0), 0.f, 1.f);
    const float colRnd = (float)clampf((float)(p.colorRand / 100.0), 0.f, 1.f);
    const float edgeSpread = (float)p.edgeSpread;

    for (int i = 0; i < count; ++i) {
        uint32_t h = hash3(seed, (uint32_t)i, (uint32_t)(animFrame * (p.autoAnim ? 1 : 0)));
        auto rnd = [&](uint32_t sub) { return u01(hash2(h, sub)); };

        // Root position (x0, y0)
        float rx = 0.f, ry = 0.f;
        float dirAngle = baseAngle;

        if (p.objectMode && !edges.empty()) {
            // Pick an edge point with density bias
            uint32_t eIdx = hash3(seed, (uint32_t)i, 0xED6Eu) % (uint32_t)edges.size();
            const EdgePoint& ep = edges[eIdx];
            // Density filtering
            if (rnd(1) > (float)(p.edgeDensity / 100.0)) continue;

            float scatter = (rnd(2) * 2.f - 1.f) * edgeSpread;
            rx = clampf(ep.x + ep.nx * scatter, 0.f, (float)(W - 1));
            ry = clampf(ep.y + ep.ny * scatter, 0.f, (float)(H - 1));

            // Direction according to edge mode
            if (p.edgeDirection == LED_ALONG) {
                float baseDir = std::atan2(ep.ty, ep.tx);
                if (rnd(3) < 0.5f) baseDir += 3.14159265f;
                dirAngle = baseDir + (rnd(4) * 2.f - 1.f) * angleSpread;
            } else if (p.edgeDirection == LED_PERP) {
                float baseDir = std::atan2(ep.ny, ep.nx);
                if (rnd(3) < 0.5f) baseDir += 3.14159265f;
                dirAngle = baseDir + (rnd(4) * 2.f - 1.f) * angleSpread;
            } else if (p.edgeDirection == LED_RANDOM) {
                dirAngle = rnd(4) * 6.2831853f;
            } else {
                dirAngle = baseAngle + (rnd(4) * 2.f - 1.f) * angleSpread;
            }
        } else {
            rx = rnd(10) * (float)W;
            ry = rnd(11) * (float)H;
            dirAngle = baseAngle + (rnd(12) * 2.f - 1.f) * angleSpread;
        }

        // Length and thickness with randomness
        float strandL = baseLen * (1.f + (rnd(15) * 2.f - 1.f) * lenRnd);
        strandL = std::max(2.f, strandL);
        float strandThick = baseThick * (1.f + (rnd(16) * 2.f - 1.f) * thkRnd);
        strandThick = clampf(strandThick, 0.2f, 20.f);

        // Curvature and kink
        float curv = baseCurv * (1.f + (rnd(17) * 2.f - 1.f) * curvRnd);
        if (rnd(18) < 0.5f) curv = -curv;

        // Color calculation
        float strandCol[3] = { p.color.r, p.color.g, p.color.b };
        if (p.colorMode == LCM_SAMPLED) {
            int sx = std::max(0, std::min(W - 1, (int)std::floor(rx)));
            int sy = std::max(0, std::min(H - 1, (int)std::floor(ry)));
            const float* s = src.at(sx, sy);
            strandCol[0] = s[0]; strandCol[1] = s[1]; strandCol[2] = s[2];
        } else if (p.colorMode == LCM_RANDOM) {
            strandCol[0] = rnd(21);
            strandCol[1] = rnd(22);
            strandCol[2] = rnd(23);
        }
        if (colRnd > 0.001f) {
            float cJit = (rnd(24) * 2.f - 1.f) * colRnd;
            for (int k = 0; k < 3; ++k) strandCol[k] = clampf(strandCol[k] + cJit, 0.f, 1.f);
        }

        // Opacity
        float alpha = masterAlpha * (1.f - rnd(25) * opacRnd);
        alpha = clampf(alpha, 0.01f, 1.f);

        // Motion sway animation
        float sway = 0.f;
        if (motAmt > 0.01f) {
            float phase = rnd(26) * 6.2831853f * motRnd;
            float freq = 2.0f + rnd(27) * 1.5f;
            sway = std::sin((float)(animTime * freq + phase)) * motAmt;
        }

        // Generate curved polyline segments
        int segFirst = (int)segs.size();
        float px = rx, py = ry;
        float curAngle = dirAngle;
        float segLen = strandL / (float)numSegs;
        float ymin = ry, ymax = ry;
        float xmin = rx, xmax = rx;

        for (int s = 0; s < numSegs; ++s) {
            float frac = (float)s / (float)numSegs;
            float currentThick = strandThick * (1.f - frac * 0.45f); // subtle organic tip taper
            float turn = curv * (1.f + frac * 0.5f) + (rnd(30 + s) * 2.f - 1.f) * kinkMax * 0.35f;
            curAngle += turn;

            float nx = px + std::cos(curAngle) * segLen + (s == numSegs - 1 ? sway * 0.3f : 0.f);
            float ny = py + std::sin(curAngle) * segLen + (s == numSegs - 1 ? sway * 0.2f : 0.f);

            // Bounding box update
            xmin = std::min(xmin, std::min(px, nx));
            xmax = std::max(xmax, std::max(px, nx));
            ymin = std::min(ymin, std::min(py, ny));
            ymax = std::max(ymax, std::max(py, ny));

            segs.push_back({ px, py, nx, ny, currentThick * 0.5f });
            px = nx; py = ny;
        }

        float pad = strandThick * 0.5f + 1.5f;
        if (xmax + pad < 0 || xmin - pad >= W || ymax + pad < 0 || ymin - pad >= H) {
            segs.resize(segFirst);
            continue;
        }

        Strand st;
        st.segStart = segFirst;
        st.segCount = (int)segs.size() - segFirst;
        st.col[0] = strandCol[0]; st.col[1] = strandCol[1]; st.col[2] = strandCol[2];
        st.alpha = alpha;
        st.ymin = ymin - pad;
        st.ymax = ymax + pad;
        strands.push_back(st);
    }

    // 3. Rasterise into accumulation buffer using row-banded parallel threads
    std::vector<float> acc((size_t)W * H * 4, 0.f);
    parallel_rows(H, [&](int y0, int y1) {
        for (const Strand& st : strands) {
            if (st.ymax < (float)y0 || st.ymin > (float)y1) continue;

            for (int s = 0; s < st.segCount; ++s) {
                const StrandSeg& sg = segs[st.segStart + s];
                float r = sg.r + 0.75f;
                int bx0 = std::max(0, (int)std::floor(std::min(sg.x0, sg.x1) - r));
                int bx1 = std::min(W - 1, (int)std::ceil(std::max(sg.x0, sg.x1) + r));
                int by0 = std::max(y0, (int)std::floor(std::min(sg.y0, sg.y1) - r));
                int by1 = std::min(y1 - 1, (int)std::ceil(std::max(sg.y0, sg.y1) + r));
                if (bx0 > bx1 || by0 > by1) continue;

                float vx = sg.x1 - sg.x0, vy = sg.y1 - sg.y0;
                float len2 = vx * vx + vy * vy;
                float invLen2 = len2 > 1e-6f ? 1.f / len2 : 0.f;

                for (int y = by0; y <= by1; ++y) {
                    float py = (float)y + 0.5f - sg.y0;
                    for (int x = bx0; x <= bx1; ++x) {
                        float px = (float)x + 0.5f - sg.x0;
                        float u = clampf((px * vx + py * vy) * invLen2, 0.f, 1.f);
                        float dx = px - u * vx, dy = py - u * vy;
                        float dist = std::sqrt(dx * dx + dy * dy);

                        float cov = clampf(1.f - (dist - (sg.r - 0.5f)), 0.f, 1.f);
                        if (cov <= 0.f) continue;

                        float a = cov * st.alpha;
                        float* q = &acc[((size_t)y * W + x) * 4];
                        q[0] = q[0] * (1.f - a) + st.col[0] * a;
                        q[1] = q[1] * (1.f - a) + st.col[1] * a;
                        q[2] = q[2] * (1.f - a) + st.col[2] * a;
                        q[3] = q[3] + a * (1.f - q[3]);
                    }
                }
            }
        }
    });

    // 4. Composite onto destination image
    parallel_rows(H, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            for (int x = 0; x < W; ++x) {
                const float* s = src.at(x, y);
                const float* q = &acc[((size_t)y * W + x) * 4];
                float* o = dst.at(x, y);
                float A = q[3];

                switch (p.composite) {
                case LC_OVER:
                    for (int k = 0; k < 3; ++k) o[k] = s[k] * (1.f - A) + q[k];
                    o[3] = s[3];
                    break;
                case LC_ADD:
                    for (int k = 0; k < 3; ++k) o[k] = clampf(s[k] + q[k], 0.f, 1.f);
                    o[3] = s[3];
                    break;
                case LC_SCREEN:
                    for (int k = 0; k < 3; ++k) o[k] = 1.f - (1.f - s[k]) * (1.f - q[k]);
                    o[3] = s[3];
                    break;
                case LC_MULTIPLY:
                    for (int k = 0; k < 3; ++k) o[k] = s[k] * (1.f - A + q[k]);
                    o[3] = s[3];
                    break;
                case LC_TRANSPARENT:
                    for (int k = 0; k < 3; ++k) o[k] = A > 1e-4f ? q[k] / A : 0.f;
                    o[3] = A;
                    break;
                default: // LC_ON_BLACK
                    for (int k = 0; k < 3; ++k) o[k] = q[k];
                    o[3] = 1.f;
                    break;
                }
            }
        }
    });
}

} // namespace majeed
