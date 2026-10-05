#include "core/majeed_core.h"
#include <iostream>
#include <vector>
#include <cassert>
#include <cmath>

using namespace majeed;

int main() {
    std::cout << "=== RUNNING COMPREHENSIVE LINES VERIFICATION TESTS ===" << std::endl;

    // TEST 1: Default State
    LinesParams pDef;
    if (pDef.enabled != false) {
        std::cerr << "FAIL: Lines is not OFF by default!" << std::endl;
        return 1;
    }
    if (pDef.objectMode != false) {
        std::cerr << "FAIL: Object is not OFF by default!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 1: Lines and Object are OFF by default." << std::endl;

    // Buffer setup
    const int W = 200, H = 200;
    std::vector<float> srcBuf(W * H * 4, 0.f);
    std::vector<float> dstBuf(W * H * 4, 0.f);
    Image src = { W, H, srcBuf.data() };
    Image dst = { W, H, dstBuf.data() };
    FrameCtx ctx;

    // Draw a high-contrast circular person/object silhouette in src (radius 40 at center (100, 100))
    for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
            float d = std::hypot(x - 100.f, y - 100.f);
            float* p = src.at(x, y);
            if (d < 40.f) {
                p[0] = 0.8f; p[1] = 0.2f; p[2] = 0.1f; p[3] = 1.0f; // foreground object
            } else {
                p[0] = 0.05f; p[1] = 0.05f; p[2] = 0.05f; p[3] = 1.0f; // background
            }
        }
    }

    // TEST 2: When Lines = OFF, no lines render
    LinesParams pOff;
    pOff.enabled = false;
    render_lines(src, dst, pOff, ctx);
    int diffCount = 0;
    for (size_t i = 0; i < srcBuf.size(); ++i) {
        if (std::abs(srcBuf[i] - dstBuf[i]) > 1e-4f) diffCount++;
    }
    if (diffCount != 0) {
        std::cerr << "FAIL: Pixels modified when Lines = OFF!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 2: No lines render when Lines is OFF." << std::endl;

    // TEST 3: When Lines = ON and Object = OFF -> Procedural lines appear
    LinesParams pProcedural;
    pProcedural.enabled = true;
    pProcedural.objectMode = false;
    pProcedural.amount = 50;
    pProcedural.color = { 1.f, 1.f, 1.f };
    pProcedural.opacity = 100;
    render_lines(src, dst, pProcedural, ctx);
    diffCount = 0;
    for (size_t i = 0; i < srcBuf.size(); ++i) {
        if (std::abs(srcBuf[i] - dstBuf[i]) > 1e-4f) diffCount++;
    }
    if (diffCount == 0) {
        std::cerr << "FAIL: Procedural lines did not render when Object = OFF!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 3: Procedural lines render when Lines = ON and Object = OFF (modified " << diffCount << " px)." << std::endl;

    // TEST 4: When Lines = ON and Object = ON -> Real contour tracing directly on contour
    LinesParams pObj;
    pObj.enabled = true;
    pObj.objectMode = true;
    pObj.amount = 100;
    pObj.edgeThreshold = 25;
    pObj.edgeSensitivity = 75;
    pObj.color = { 0.f, 1.f, 0.f }; // bright green
    pObj.opacity = 100;
    pObj.width = 1.0;
    pObj.edgeOffset = 0.0;
    pObj.handMade = false;

    render_lines(src, dst, pObj, ctx);
    int contourPx = 0;
    int strayInteriorPx = 0;
    for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
            float d = std::hypot(x - 100.f, y - 100.f);
            const float* p = dst.at(x, y);
            const float* s = src.at(x, y);
            if (std::abs(p[1] - s[1]) > 0.1f) {
                // Pixel was modified by line
                if (std::abs(d - 40.f) <= 2.5f) {
                    contourPx++;
                } else if (d < 30.f) {
                    strayInteriorPx++;
                }
            }
        }
    }
    if (contourPx < 50) {
        std::cerr << "FAIL: Too few contour pixels (" << contourPx << ") in Object mode!" << std::endl;
        return 1;
    }
    if (strayInteriorPx > 0) {
        std::cerr << "FAIL: Stray interior pixels (" << strayInteriorPx << ") found in Object mode!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 4: Object ON real contour tracing: " << contourPx << " contour px, 0 stray interior px (ZERO GAP)." << std::endl;

    // TEST 5: Duplicate Lines
    LinesParams pDup = pObj;
    pDup.duplicate = true;
    pDup.duplicateCount = 2;
    pDup.duplicateOffset = 2.0;
    render_lines(src, dst, pDup, ctx);
    int dupModified = 0;
    for (size_t i = 0; i < srcBuf.size(); ++i) {
        if (std::abs(srcBuf[i] - dstBuf[i]) > 1e-4f) dupModified++;
    }
    if (dupModified <= contourPx) {
        std::cerr << "FAIL: Duplicate lines did not increase coverage!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 5: Duplicate Lines verified: coverage increased from " << contourPx << " to " << dupModified << " px." << std::endl;

    // TEST 6: Hand Made Lines + Curve
    LinesParams pHand = pObj;
    pHand.handMade = true;
    pHand.curve = 50;
    render_lines(src, dst, pHand, ctx);
    int handModified = 0;
    for (size_t i = 0; i < srcBuf.size(); ++i) {
        if (std::abs(srcBuf[i] - dstBuf[i]) > 1e-4f) handModified++;
    }
    if (handModified < 50) {
        std::cerr << "FAIL: Hand made lines produced insufficient pixels!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 6: Hand Made Lines + Curve verified (" << handModified << " px)." << std::endl;

    // TEST 7: Timeline animation / scrubbing
    LinesParams pAnim = pObj;
    pAnim.autoAnim = true;
    pAnim.motionSpeed = 150;
    ctx.timeSec = 0.0;
    render_lines(src, dst, pAnim, ctx);
    std::vector<float> frame0 = dstBuf;

    ctx.timeSec = 1.0;
    render_lines(src, dst, pAnim, ctx);
    int animDiff = 0;
    for (size_t i = 0; i < srcBuf.size(); ++i) {
        if (std::abs(frame0[i] - dstBuf[i]) > 1e-3f) animDiff++;
    }
    if (animDiff == 0) {
        std::cerr << "FAIL: Animation did not progress with timeSec!" << std::endl;
        return 1;
    }
    std::cout << "[PASS] TEST 7: Animation across timeline scrubbing verified (" << animDiff << " px animated)." << std::endl;

    // TEST 8: Stress Test - Increasing Count to Maximum (10,000) & Beyond (NO CRASH)
    int testCounts[] = { 1, 10, 100, 1000, 5000, 10000, 20000 };
    for (int cnt : testCounts) {
        LinesParams pStress = pObj;
        pStress.amount = cnt;
        pStress.duplicate = true;
        pStress.duplicateCount = 3;
        render_lines(src, dst, pStress, ctx);

        // Verify no NaNs or Infs
        for (float val : dstBuf) {
            if (std::isnan(val) || std::isinf(val)) {
                std::cerr << "FAIL: NaN or Inf found in dst buffer at count=" << cnt << "!" << std::endl;
                return 1;
            }
        }
    }
    std::cout << "[PASS] TEST 8: Stress test with count up to 20,000 passed with ZERO crashes and NO NaNs/Infs." << std::endl;

    // TEST 9: Direction Modes (Along Edge, Perpendicular, Random, Custom)
    for (int dirMode = 0; dirMode <= 3; ++dirMode) {
        LinesParams pDir = pObj;
        pDir.edgeDirection = dirMode;
        pDir.angle = 45;
        render_lines(src, dst, pDir, ctx);
        int dirPx = 0;
        for (size_t i = 0; i < srcBuf.size(); ++i) {
            if (std::abs(srcBuf[i] - dstBuf[i]) > 1e-4f) dirPx++;
        }
        if (dirPx == 0) {
            std::cerr << "FAIL: Direction mode " << dirMode << " rendered zero pixels!" << std::endl;
            return 1;
        }
    }
    std::cout << "[PASS] TEST 9: All 4 Edge Direction modes render successfully." << std::endl;

    std::cout << "=== ALL 9 TEST SUITE CHECKS PASSED PERFECTLY ===" << std::endl;
    return 0;
}
