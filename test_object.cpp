
#include "majeed_core.h"
#include <iostream>
#include <vector>

int main() {
    int W = 500, H = 500;
    std::vector<float> buf(W * H * 4, 0.0f);
    // Draw a white circle in the middle
    for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
            float dx = x - 250;
            float dy = y - 250;
            if (dx*dx + dy*dy < 100*100) {
                buf[(y*W + x)*4 + 0] = 1.0f;
                buf[(y*W + x)*4 + 1] = 1.0f;
                buf[(y*W + x)*4 + 2] = 1.0f;
                buf[(y*W + x)*4 + 3] = 1.0f;
            }
        }
    }

    majeed::Image src = { W, H, buf.data() };
    std::vector<float> dstBuf = buf;
    majeed::Image dst = { W, H, dstBuf.data() };

    majeed::LinesParams lp;
    lp.enabled = true;
    lp.amount = 600.0;
    lp.objectMode = true; // Object ON
    lp.edgeThreshold = 25.0;
    lp.edgeSensitivity = 75.0;
    lp.length = 50.0;
    lp.width = 2.0;
    lp.opacity = 90.0;
    lp.color = { 1.0f, 0.0f, 0.0f }; // Red lines

    majeed::FrameCtx ctx;
    ctx.timeSec = 0.0;

    majeed::render_lines(src, dst, lp, ctx);

    // Count how many red pixels were drawn
    int redCount = 0;
    for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
            float r = dst.at(x, y)[0];
            float g = dst.at(x, y)[1];
            float b = dst.at(x, y)[2];
            if (r > 0.8f && g < 0.2f && b < 0.2f) {
                redCount++;
            }
        }
    }
    std::cout << "Red pixels drawn with Object=ON: " << redCount << std::endl;
    return 0;
}
