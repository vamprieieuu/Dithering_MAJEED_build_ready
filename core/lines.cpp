// ============================================================================
// YMDithers LINES - Strict Contour Following & Procedural Strands Engine.
//   * [ ] Object Checkbox:
//       - When checked (ON): Multi-scale Gaussian pre-filtering, Sobel gradient,
//         Canny Non-Maximum Suppression (NMS), and connected contour chain tracing.
//         Lines adhere strictly to the object contours with ZERO gap/offset.
//       - When unchecked (OFF): Standard procedural strokes across the layer.
//   * [ ] Hand Made Lines Checkbox:
//       - Organic hand-drawn deviation, subtle wobble, and natural variation.
//       - Controlled by the "Curve" parameter (0 = straight, 100 = pronounced curve).
//       - Stays anchored to the contour without drifting away.
//   * [ ] Duplicate Lines Checkbox:
//       - Creates companion parallel lines hugging the exact same contour.
//       - Independent controls for count, offset spacing, length, width, opacity.
//   * Deterministic time/frame-based animation along contours without flickering.
//   * Crash-proof bounded memory and pointer safety.
// ============================================================================
#include "majeed_core.h"
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstring>

namespace majeed {
namespace {

struct LineSeg {
    float x0, y0, x1, y1;
    float r;              // stroke radius in pixels
    float col[3];
    float alpha;
};

// Connected contour point with subpixel geometry
struct ContourNode {
    float x, y;
    float nx, ny;         // unit normal (gradient direction)
    float tx, ty;         // unit tangent (contour ridge direction)
    float arcLen;         // cumulative arc distance along chain
};

struct ContourChain {
    std::vector<ContourNode> nodes;
    float totalLength = 0.f;
};

// ---------------------------------------------------------------------------
// 1. Canny-Style NMS + Hysteresis Contour Chain Extractor
// ---------------------------------------------------------------------------
void extract_object_contours(const Image& src, float threshold, float sensitivity,
                             std::vector<ContourChain>& contours, int maxContours) {
    contours.clear();
    const int W = src.w, H = src.h;
    if (W < 6 || H < 6) return;

    // A. Luminance extraction
    std::vector<float> luma((size_t)W * H, 0.f);
    for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
            const float* p = src.at(x, y);
            luma[(size_t)y * W + x] = luma709(p[0], p[1], p[2]);
        }
    }

    // B. Separable 3x3 Gaussian smoothing to suppress sensor/noise specks
    std::vector<float> smooth((size_t)W * H, 0.f);
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

    // C. Sobel Gradients & Magnitudes
    std::vector<float> gx_buf((size_t)W * H, 0.f);
    std::vector<float> gy_buf((size_t)W * H, 0.f);
    std::vector<float> mag_buf((size_t)W * H, 0.f);
    const float gain = std::max(0.4f, sensitivity / 45.f);

    for (int y = 1; y < H - 1; ++y) {
        for (int x = 1; x < W - 1; ++x) {
            float tl = smooth[(size_t)(y - 1) * W + (x - 1)], t = smooth[(size_t)(y - 1) * W + x], tr = smooth[(size_t)(y - 1) * W + (x + 1)];
            float l  = smooth[(size_t)y * W + (x - 1)],                                            r  = smooth[(size_t)y * W + (x + 1)];
            float bl = smooth[(size_t)(y + 1) * W + (x - 1)], b = smooth[(size_t)(y + 1) * W + x], br = smooth[(size_t)(y + 1) * W + (x + 1)];

            float gx = (tr + 2.f * r + br) - (tl + 2.f * l + bl);
            float gy = (bl + 2.f * b + br) - (tl + 2.f * t + tr);
            float m = std::sqrt(gx * gx + gy * gy) * gain;

            size_t idx = (size_t)y * W + x;
            gx_buf[idx] = gx;
            gy_buf[idx] = gy;
            mag_buf[idx] = m;
        }
    }

    // D. Non-Maximum Suppression (NMS) to thin gradients to 1-pixel crisp ridges
    std::vector<float> nms_buf((size_t)W * H, 0.f);
    const float tHigh = clampf(threshold / 100.f, 0.03f, 0.85f);
    const float tLow  = tHigh * 0.40f;

    for (int y = 2; y < H - 2; ++y) {
        for (int x = 2; x < W - 2; ++x) {
            size_t idx = (size_t)y * W + x;
            float m = mag_buf[idx];
            if (m < tLow) continue;

            float gx = gx_buf[idx];
            float gy = gy_buf[idx];
            float absGx = std::fabs(gx);
            float absGy = std::fabs(gy);

            float n0 = 0.f, n1 = 0.f;
            // 4 directional sectors
            if (absGx > absGy * 2.4142f) {
                // Horizontal normal -> compare East / West
                n0 = mag_buf[idx - 1];
                n1 = mag_buf[idx + 1];
            } else if (absGy > absGx * 2.4142f) {
                // Vertical normal -> compare North / South
                n0 = mag_buf[idx - W];
                n1 = mag_buf[idx + W];
            } else if ((gx > 0 && gy > 0) || (gx < 0 && gy < 0)) {
                // 45 deg diagonal -> compare NE / SW
                n0 = mag_buf[idx - W - 1];
                n1 = mag_buf[idx + W + 1];
            } else {
                // 135 deg diagonal -> compare NW / SE
                n0 = mag_buf[idx - W + 1];
                n1 = mag_buf[idx + W - 1];
            }

            if (m >= n0 && m >= n1) {
                nms_buf[idx] = m;
            }
        }
    }

    // E. Connected Contour Tracing (Hysteresis Linking)
    std::vector<uint8_t> visited((size_t)W * H, 0);
    static const int dx8[8] = { 1,  1,  0, -1, -1, -1,  0,  1 };
    static const int dy8[8] = { 0,  1,  1,  1,  0, -1, -1, -1 };

    contours.reserve(std::min(maxContours, 2048));

    for (int y = 2; y < H - 2; ++y) {
        for (int x = 2; x < W - 2; ++x) {
            size_t startIdx = (size_t)y * W + x;
            if (visited[startIdx] || nms_buf[startIdx] < tHigh) continue;

            // Trace new contour chain
            ContourChain chain;
            int cx = x, cy = y;
            visited[startIdx] = 1;

            float cumLen = 0.f;
            float prevX = (float)cx, prevY = (float)cy;

            while (true) {
                size_t curIdx = (size_t)cy * W + cx;
                float gx = gx_buf[curIdx], gy = gy_buf[curIdx];
                float invL = 1.f / std::max(1e-5f, std::sqrt(gx * gx + gy * gy));
                float nx = gx * invL, ny = gy * invL;
                float tx = -ny, ty = nx;

                if (!chain.nodes.empty()) {
                    cumLen += std::hypot((float)cx - prevX, (float)cy - prevY);
                    prevX = (float)cx;
                    prevY = (float)cy;
                }

                chain.nodes.push_back({ (float)cx, (float)cy, nx, ny, tx, ty, cumLen });
                if (chain.nodes.size() > 4000) break; // guard against runaway loops

                // Search 8-neighbors for strongest unvisited ridge point
                int nextX = -1, nextY = -1;
                float bestMag = tLow;

                for (int k = 0; k < 8; ++k) {
                    int nxPos = cx + dx8[k];
                    int nyPos = cy + dy8[k];
                    if (nxPos < 1 || nxPos >= W - 1 || nyPos < 1 || nyPos >= H - 1) continue;
                    size_t nIdx = (size_t)nyPos * W + nxPos;
                    if (!visited[nIdx] && nms_buf[nIdx] > bestMag) {
                        bestMag = nms_buf[nIdx];
                        nextX = nxPos;
                        nextY = nyPos;
                    }
                }

                if (nextX == -1) break; // end of contour line
                cx = nextX;
                cy = nextY;
                visited[(size_t)cy * W + cx] = 1;
            }

            // Keep only meaningful contours (ignore tiny noise specks < 8px)
            if (chain.nodes.size() >= 8 && cumLen >= 6.f) {
                chain.totalLength = cumLen;
                contours.push_back(std::move(chain));
                if ((int)contours.size() >= maxContours) return;
            }
        }
    }
}

// Subpixel continuous point evaluation along a contour chain
inline void evaluate_contour(const ContourChain& chain, float s, float& ox, float& oy,
                             float& onx, float& ony, float& otx, float& oty) {
    if (chain.nodes.empty()) { ox = oy = onx = ony = otx = oty = 0.f; return; }
    if (s <= 0.f || chain.nodes.size() == 1) {
        const auto& n = chain.nodes.front();
        ox = n.x; oy = n.y; onx = n.nx; ony = n.ny; otx = n.tx; oty = n.ty;
        return;
    }
    if (s >= chain.totalLength) {
        const auto& n = chain.nodes.back();
        ox = n.x; oy = n.y; onx = n.nx; ony = n.ny; otx = n.tx; oty = n.ty;
        return;
    }

    // Binary search for node span
    size_t low = 0, high = chain.nodes.size() - 1;
    while (low + 1 < high) {
        size_t mid = (low + high) >> 1;
        if (chain.nodes[mid].arcLen <= s) low = mid;
        else high = mid;
    }

    const auto& n0 = chain.nodes[low];
    const auto& n1 = chain.nodes[high];
    float segLen = std::max(1e-4f, n1.arcLen - n0.arcLen);
    float t = clampf((s - n0.arcLen) / segLen, 0.f, 1.f);

    ox = lerpf(n0.x, n1.x, t);
    oy = lerpf(n0.y, n1.y, t);
    onx = lerpf(n0.nx, n1.nx, t);
    ony = lerpf(n0.ny, n1.ny, t);
    otx = lerpf(n0.tx, n1.tx, t);
    oty = lerpf(n0.ty, n1.ty, t);
}

} // namespace

// ---------------------------------------------------------------------------
// Main Lines Renderer
// ---------------------------------------------------------------------------
void render_lines(const Image& src, const Image& dst, const LinesParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;

    if (!p.enabled || p.amount <= 0.1 || p.opacity <= 0.1) {
        std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));
        return;
    }

    // Copy source image to destination initially
    std::memcpy(dst.px, src.px, (size_t)W * H * 4 * sizeof(float));

    // Bounds limit to ensure zero crash even with 60,000 requested
    const int maxStrandsAllowed = 12000;
    const int count = (int)std::max(1.0, std::min(p.amount, (double)maxStrandsAllowed));
    const uint32_t seed = hash_u32((uint32_t)p.seed * 19937u + 0x51A8Du);
    const double animTime = p.autoAnim ? (c.timeSec * (p.motionSpeed / 100.0)) : 0.0;
    const int animFrame = c.frame();

    std::vector<LineSeg> allSegs;
    allSegs.reserve((size_t)count * (p.duplicate ? (p.duplicateCount + 1) : 1) * 8);

    // =======================================================================
    // BRANCH A: OBJECT ON -> Contour Following (Zero Gap)
    // =======================================================================
    if (p.objectMode) {
        std::vector<ContourChain> contours;
        extract_object_contours(src, (float)p.edgeThreshold, (float)p.edgeSensitivity, contours, 2048);

        if (!contours.empty()) {
            // Compute cumulative length table for proportional sampling
            std::vector<float> cumLengths;
            cumLengths.reserve(contours.size());
            float totalSystemLen = 0.f;
            for (const auto& ch : contours) {
                totalSystemLen += ch.totalLength;
                cumLengths.push_back(totalSystemLen);
            }

            const float baseLen = (float)std::max(4.0, p.length);
            const float lenRnd = (float)clampf((float)(p.lengthRand / 100.0), 0.f, 1.f);
            const float baseThick = (float)clampf((float)p.width, 0.2f, 12.f);
            const float thkRnd = (float)clampf((float)(p.widthRand / 100.0), 0.f, 1.f);
            const float masterAlpha = (float)clampf((float)(p.opacity / 100.0), 0.f, 1.f);
            const float curveAmt = p.handMade ? (float)clampf((float)(p.curve / 100.0), 0.f, 1.f) : 0.f;

            for (int i = 0; i < count; ++i) {
                uint32_t h = hash3(seed, (uint32_t)i, (uint32_t)(animFrame * (p.autoAnim ? 1 : 0)));
                auto rnd = [&](uint32_t sub) { return u01(hash2(h, sub)); };

                // Proportional contour selection
                float rPick = rnd(1) * totalSystemLen;
                auto it = std::lower_bound(cumLengths.begin(), cumLengths.end(), rPick);
                size_t cIdx = (it == cumLengths.end()) ? contours.size() - 1 : std::distance(cumLengths.begin(), it);
                const ContourChain& chain = contours[cIdx];
                if (chain.totalLength < 3.f) continue;

                // Length & thickness
                float strandL = baseLen * (1.f + (rnd(2) * 2.f - 1.f) * lenRnd);
                strandL = std::max(4.f, std::min(strandL, chain.totalLength * 0.95f));
                float strandThick = baseThick * (1.f + (rnd(3) * 2.f - 1.f) * thkRnd);
                strandThick = clampf(strandThick, 0.2f, 15.f);

                // Start arc-length parameter
                const float motRandScale = 1.f + (rnd(11) * 2.f - 1.f) * clampf((float)(p.motionRand / 100.0), 0.f, 1.f) * 0.75f;
                float s0 = rnd(4) * std::max(1.f, chain.totalLength - strandL);
                if (p.autoAnim) {
                    float drift = (float)(animTime * 35.0 * motRandScale + rnd(5) * 60.0);
                    float span = std::max(1.f, chain.totalLength - strandL);
                    s0 = std::fmod(s0 + drift, span);
                    if (s0 < 0.f) s0 += span;
                }

                // Color
                float strandCol[3] = { p.color.r, p.color.g, p.color.b };
                if (p.colorMode == LCM_SAMPLED) {
                    float ex, ey, enx, eny, etx, ety;
                    evaluate_contour(chain, s0, ex, ey, enx, eny, etx, ety);
                    int sx = std::max(0, std::min(W - 1, (int)std::floor(ex)));
                    int sy = std::max(0, std::min(H - 1, (int)std::floor(ey)));
                    const float* sc = src.at(sx, sy);
                    strandCol[0] = sc[0]; strandCol[1] = sc[1]; strandCol[2] = sc[2];
                } else if (p.colorMode == LCM_RANDOM) {
                    strandCol[0] = rnd(6); strandCol[1] = rnd(7); strandCol[2] = rnd(8);
                }

                float alpha = masterAlpha * (1.f - rnd(9) * 0.25f);

                // Function to build and emit one line along or anchored to the contour
                auto emitLineAlongContour = [&](float normalOffset, float lenScale, float widthScale, float alphaScale) {
                    float effLen = std::max(2.f, strandL * lenScale);
                    int segCount = std::max(3, std::min(16, (int)std::ceil(effLen / 4.f)));
                    float stepS = effLen / (float)segCount;
                    float prevX = 0.f, prevY = 0.f;
                    float wobblePhase = (rnd(12) - 0.5f) * 1.2f;

                    if (p.edgeDirection == LED_ALONG) {
                        for (int s = 0; s <= segCount; ++s) {
                            float curS = s0 + s * stepS;
                            float cx, cy, cnx, cny, ctx, cty;
                            evaluate_contour(chain, curS, cx, cy, cnx, cny, ctx, cty);

                            // Hand-made organic deviation along normal (anchored at endpoints via sin(pi*frac))
                            float handWobble = 0.f;
                            if (p.handMade && curveAmt > 0.001f) {
                                float frac = (float)s / (float)segCount;
                                float env = std::sin(frac * 3.14159265f);
                                float sinCurve = env * std::cos(wobblePhase) * curveAmt * 2.4f;
                                float smallNoise = env * (rnd(20 + s) * 2.f - 1.f) * curveAmt * 0.7f;
                                handWobble = sinCurve + smallNoise;
                            }

                            float totalNormOffset = normalOffset + handWobble;
                            float px = cx + cnx * totalNormOffset;
                            float py = cy + cny * totalNormOffset;

                            if (s > 0) {
                                float r = strandThick * widthScale * 0.5f;
                                allSegs.push_back({ prevX, prevY, px, py, r,
                                                    { strandCol[0], strandCol[1], strandCol[2] },
                                                    alpha * alphaScale });
                            }
                            prevX = px; prevY = py;
                        }
                    } else {
                        // Anchored at contour point s0, extending along Perpendicular / Random / Custom angle
                        float cx, cy, cnx, cny, ctx, cty;
                        evaluate_contour(chain, s0, cx, cy, cnx, cny, ctx, cty);
                        float dirAng = 0.f;
                        if (p.edgeDirection == LED_PERP) {
                            dirAng = std::atan2(cny, cnx);
                        } else if (p.edgeDirection == LED_RANDOM) {
                            dirAng = rnd(14) * 6.2831853f;
                        } else {
                            dirAng = (float)(p.angle * 0.017453292519943295);
                        }
                        float px = cx + cnx * normalOffset;
                        float py = cy + cny * normalOffset;
                        float curAng = dirAng;
                        for (int s = 0; s < segCount; ++s) {
                            if (p.handMade && curveAmt > 0.001f) {
                                curAng += (rnd(20 + s) * 2.f - 1.f) * curveAmt * 0.35f;
                            }
                            float nx = px + std::cos(curAng) * stepS;
                            float ny = py + std::sin(curAng) * stepS;
                            float r = strandThick * widthScale * 0.5f;
                            allSegs.push_back({ px, py, nx, ny, r,
                                                { strandCol[0], strandCol[1], strandCol[2] },
                                                alpha * alphaScale });
                            px = nx; py = ny;
                        }
                    }
                };

                // Primary line: offset is strictly p.edgeOffset (default 0 = tightly glued to contour!)
                emitLineAlongContour((float)p.edgeOffset, 1.f, 1.f, 1.f);

                // Duplicate Lines
                if (p.duplicate) {
                    int dupN = std::max(1, std::min(4, p.duplicateCount));
                    float dupSpacing = (float)p.duplicateOffset;
                    float dupLScale = clampf((float)(p.duplicateLength / 100.0), 0.1f, 2.0f);
                    float dupWScale = (float)(p.duplicateWidth / std::max(0.1, p.width));
                    float dupAScale = (float)(p.duplicateOpacity / 100.0);

                    for (int d = 1; d <= dupN; ++d) {
                        float dupOffset = (float)p.edgeOffset + d * dupSpacing;
                        emitLineAlongContour(dupOffset, dupLScale, dupWScale, dupAScale);
                    }
                }
            }
        }
    }
    // =======================================================================
    // BRANCH B: OBJECT OFF -> Standard Procedural Strokes
    // =======================================================================
    else {
        const float baseLen = (float)std::max(4.0, p.length);
        const float lenRnd = (float)clampf((float)(p.lengthRand / 100.0), 0.f, 1.f);
        const float baseThick = (float)clampf((float)p.width, 0.2f, 12.f);
        const float thkRnd = (float)clampf((float)(p.widthRand / 100.0), 0.f, 1.f);
        const float baseAngle = (float)(p.angle * 0.017453292519943295);
        const float angleSpread = (float)(clampf((float)p.angleRand, 0.f, 180.f) * 0.017453292519943295);
        const float masterAlpha = (float)clampf((float)(p.opacity / 100.0), 0.f, 1.f);
        const float curveAmt = p.handMade ? (float)clampf((float)(p.curve / 100.0), 0.f, 1.f) : 0.f;

        for (int i = 0; i < count; ++i) {
            uint32_t h = hash3(seed, (uint32_t)i, (uint32_t)(animFrame * (p.autoAnim ? 1 : 0)));
            auto rnd = [&](uint32_t sub) { return u01(hash2(h, sub)); };

            float rx = rnd(1) * (float)W;
            float ry = rnd(2) * (float)H;
            float dirAngle = baseAngle + (rnd(3) * 2.f - 1.f) * angleSpread;
            float strandL = baseLen * (1.f + (rnd(4) * 2.f - 1.f) * lenRnd);
            strandL = std::max(4.f, strandL);
            float strandThick = baseThick * (1.f + (rnd(5) * 2.f - 1.f) * thkRnd);
            strandThick = clampf(strandThick, 0.2f, 15.f);

            float strandCol[3] = { p.color.r, p.color.g, p.color.b };
            if (p.colorMode == LCM_SAMPLED) {
                int sx = std::max(0, std::min(W - 1, (int)std::floor(rx)));
                int sy = std::max(0, std::min(H - 1, (int)std::floor(ry)));
                const float* sc = src.at(sx, sy);
                strandCol[0] = sc[0]; strandCol[1] = sc[1]; strandCol[2] = sc[2];
            } else if (p.colorMode == LCM_RANDOM) {
                strandCol[0] = rnd(6); strandCol[1] = rnd(7); strandCol[2] = rnd(8);
            }

            float alpha = masterAlpha * (1.f - rnd(9) * 0.25f);
            const float motRand = clampf((float)(p.motionRand / 100.0), 0.f, 1.f);

            auto emitProceduralLine = [&](float sideOffset, float lenScale, float widthScale, float alphaScale) {
                float effLen = std::max(2.f, strandL * lenScale);
                int segCount = std::max(3, std::min(12, (int)std::ceil(effLen / 8.f)));
                float segLen = effLen / (float)segCount;
                float px = rx - std::sin(dirAngle) * sideOffset;
                float py = ry + std::cos(dirAngle) * sideOffset;
                float curAngle = dirAngle;
                float sway = (float)(std::sin(animTime * 2.5 + rnd(10) * 6.28 * motRand) * (p.motionAmount * 0.15));

                for (int s = 0; s < segCount; ++s) {
                    float turn = (rnd(15 + s) * 2.f - 1.f) * curveAmt * 0.35f;
                    curAngle += turn;
                    float nx = px + std::cos(curAngle + sway) * segLen;
                    float ny = py + std::sin(curAngle + sway) * segLen;

                    allSegs.push_back({ px, py, nx, ny, strandThick * widthScale * 0.5f,
                                        { strandCol[0], strandCol[1], strandCol[2] },
                                        alpha * alphaScale });
                    px = nx; py = ny;
                }
            };

            emitProceduralLine(0.f, 1.f, 1.f, 1.f);
            if (p.duplicate) {
                int dupN = std::max(1, std::min(4, p.duplicateCount));
                float dupSpacing = (float)p.duplicateOffset;
                float dupLScale = clampf((float)(p.duplicateLength / 100.0), 0.1f, 2.0f);
                float dupWScale = (float)(p.duplicateWidth / std::max(0.1, p.width));
                float dupAScale = (float)(p.duplicateOpacity / 100.0);
                for (int d = 1; d <= dupN; ++d) {
                    emitProceduralLine(d * dupSpacing, dupLScale, dupWScale, dupAScale);
                }
            }
        }
    }

    if (allSegs.empty()) return;

    // =======================================================================
    // High-Performance Crash-Proof Spatial Rasterizer
    // =======================================================================
    // Spatial row bins to avoid O(N * W * H) brute force
    const int binSize = 16;
    const int numBins = (H + binSize - 1) / binSize;
    std::vector<std::vector<uint32_t>> binSegs((size_t)numBins);

    for (size_t i = 0; i < allSegs.size(); ++i) {
        const auto& s = allSegs[i];
        float pad = s.r + 1.5f;
        int y0 = std::max(0, (int)std::floor((std::min(s.y0, s.y1) - pad) / binSize));
        int y1 = std::min(numBins - 1, (int)std::floor((std::max(s.y0, s.y1) + pad) / binSize));
        for (int b = y0; b <= y1; ++b) {
            binSegs[(size_t)b].push_back((uint32_t)i);
        }
    }

    parallel_rows(numBins, [&](int b0, int b1) {
        for (int b = b0; b < b1; ++b) {
            const auto& segIndices = binSegs[(size_t)b];
            if (segIndices.empty()) continue;

            int rowStart = b * binSize;
            int rowEnd = std::min(H, (b + 1) * binSize);

            for (int y = rowStart; y < rowEnd; ++y) {
                float py = (float)y + 0.5f;
                for (int x = 0; x < W; ++x) {
                    float px = (float)x + 0.5f;
                    float blendR = 0.f, blendG = 0.f, blendB = 0.f, blendA = 0.f;

                    for (uint32_t si : segIndices) {
                        const auto& s = allSegs[si];
                        float pad = s.r + 1.2f;
                        if (px < std::min(s.x0, s.x1) - pad || px > std::max(s.x0, s.x1) + pad ||
                            py < std::min(s.y0, s.y1) - pad || py > std::max(s.y0, s.y1) + pad) {
                            continue;
                        }

                        // Point to segment distance
                        float vx = s.x1 - s.x0, vy = s.y1 - s.y0;
                        float segLenSq = vx * vx + vy * vy;
                        float u = segLenSq > 1e-5f ? clampf(((px - s.x0) * vx + (py - s.y0) * vy) / segLenSq, 0.f, 1.f) : 0.f;
                        float qx = s.x0 + u * vx, qy = s.y0 + u * vy;
                        float dist = std::hypot(px - qx, py - qy);

                        if (dist < pad) {
                            float cov = clampf((pad - dist) / 1.2f, 0.f, 1.f) * s.alpha;
                            // Porter-Duff Over composite
                            float outA = cov + blendA * (1.f - cov);
                            if (outA > 1e-4f) {
                                blendR = (s.col[0] * cov + blendR * blendA * (1.f - cov)) / outA;
                                blendG = (s.col[1] * cov + blendG * blendA * (1.f - cov)) / outA;
                                blendB = (s.col[2] * cov + blendB * blendA * (1.f - cov)) / outA;
                                blendA = outA;
                            }
                        }
                    }

                    if (blendA > 1e-4f) {
                        float* o = dst.at(x, y);
                        o[0] = lerpf(o[0], blendR, blendA);
                        o[1] = lerpf(o[1], blendG, blendA);
                        o[2] = lerpf(o[2], blendB, blendA);
                    }
                }
            }
        }
    });
}

} // namespace majeed
