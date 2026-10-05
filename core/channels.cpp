// ============================================================================
// YMDithers CHANNELS - Chromatic aberration & channel displacement.
// ============================================================================
#include "majeed_core.h"
#include <cmath>
#include <algorithm>

namespace majeed {

void render_channels(const Image& src, const Image& dst, const ChannelParams& p, const FrameCtx& c) {
    if (!src.px || !dst.px || src.w <= 0 || src.h <= 0) return;
    const int W = src.w, H = src.h;
    const double rad = p.sepAngle * (3.14159265358979323846 / 180.0);
    const float cosA = (float)std::cos(rad);
    const float sinA = (float)std::sin(rad);
    const float sep = (float)p.sepAmount;
    const float cx = (float)W * 0.5f;
    const float cy = (float)H * 0.5f;
    const float maxR = std::max(1.f, std::sqrt(cx * cx + cy * cy));

    const int rawFrame = c.frame();
    const double fps = c.fps > 0.1 ? c.fps : 24.0;
    const double jFps = p.randomRate > 0.1 ? p.randomRate : 24.0;
    const int jFrame = (int)std::floor((double)rawFrame * (jFps / fps) + 1e-4);
    const uint32_t seed = hash_u32((uint32_t)p.seed + 0x3A51u);

    parallel_rows(H, [&](int y0, int y1) {
        for (int y = y0; y < y1; ++y) {
            float rowJit = 0.f;
            if (p.random > 0.001) {
                rowJit = s11(hash3((uint32_t)y, (uint32_t)jFrame, seed)) * (float)p.random;
            }

            for (int x = 0; x < W; ++x) {
                float rDx = 0.f, rDy = 0.f;
                float bDx = 0.f, bDy = 0.f;

                if (p.sepMode == 1) { // Radial
                    float vx = ((float)x - cx) / maxR;
                    float vy = ((float)y - cy) / maxR;
                    rDx = vx * sep;
                    rDy = vy * sep;
                    bDx = -vx * sep;
                    bDy = -vy * sep;
                } else { // Linear
                    rDx = cosA * sep;
                    rDy = sinA * sep;
                    bDx = -cosA * sep;
                    bDy = -sinA * sep;
                }

                float rPix[4], gPix[4], bPix[4];
                sample_bilinear(src, (float)x - rDx + rowJit, (float)y - rDy, rPix);
                sample_bilinear(src, (float)x, (float)y, gPix);
                sample_bilinear(src, (float)x - bDx - rowJit, (float)y - bDy, bPix);

                float* o = dst.at(x, y);
                o[0] = clampf(rPix[0], 0.f, 1.f);
                o[1] = clampf(gPix[1], 0.f, 1.f);
                o[2] = clampf(bPix[2], 0.f, 1.f);
                o[3] = gPix[3];
            }
        }
    });
}

} // namespace majeed
