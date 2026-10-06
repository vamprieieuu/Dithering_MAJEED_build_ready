#ifndef _MAJEED_CORE_H_
#define _MAJEED_CORE_H_

#include <string.h>
#include <cstring>
#include <cstdint>
#include <cmath>
#include <algorithm>
#include <vector>
#include <functional>

namespace majeed {

struct Color {
    float r = 1.f, g = 1.f, b = 1.f;
};

enum LinesColorMode {
    LCM_SINGLE  = 0,
    LCM_SAMPLED = 1,
    LCM_RANDOM  = 2
};

enum LinesEdgeDir {
    LED_ALONG   = 0,
    LED_PERP    = 1,
    LED_RANDOM  = 2,
    LED_CUSTOM  = 3
};

struct Image {
    int w = 0;
    int h = 0;
    float* px = nullptr; // RGBA float buffer (4 floats per pixel)

    inline float* at(int x, int y) const {
        x = std::max(0, std::min(w - 1, x));
        y = std::max(0, std::min(h - 1, y));
        return px + ((size_t)y * w + x) * 4;
    }
};

struct LinesParams {
    bool enabled = false; // Requirement 6: DEFAULT OFF
    double amount = 600.0;
    double length = 50.0;
    double lengthRand = 40.0;
    double width = 1.0;
    double widthRand = 30.0;
    double angle = 0.0;
    double angleRand = 180.0;
    Color color = { 1.f, 1.f, 1.f };
    int colorMode = LCM_SINGLE;
    double opacity = 90.0;

    // Object mode
    bool objectMode = false; // Requirement 6: DEFAULT OFF
    const Image* edgeRef = nullptr;
    double edgeThreshold = 25.0;
    double edgeSensitivity = 75.0;
    int edgeDirection = LED_ALONG;
    double edgeOffset = 0.0;

    // Hand made lines
    bool handMade = true;
    double curve = 30.0;

    // Duplicate lines
    bool duplicate = false;
    int duplicateCount = 1;
    double duplicateOffset = 2.5;
    double duplicateLength = 90.0;
    double duplicateWidth = 0.8;
    double duplicateOpacity = 75.0;

    // Animation
    bool autoAnim = true;
    double motionSpeed = 100.0;
    double motionRand = 50.0;
    double motionAmount = 100.0;
    int seed = 1;
};

enum DitherPaletteMode {
    DPM_PRESERVE       = 1,
    DPM_MONOCHROME     = 2,
    DPM_STRONG_GREEN   = 3,
    DPM_VOLCANIC_LAVA  = 4,
    DPM_STRONG_RED     = 5,
    DPM_GAME_BOY       = 6,
    DPM_CYBERPUNK      = 7,
    DPM_AMBER_CRT      = 8
};

struct DitherParams {
    int algorithm = 17;        // 1-indexed (Bayer 4x4 default)
    int colorMode = 2;        // 1 = Preserve, 2 = Monochrome, 3 = Strong Green, 4 = Volcanic, 5 = Strong Red, etc.
    double amount = 100.0;     // Dither Amount: 0..100%
    double strength = 0.0;     // Dither Strength: -20..+20 (default 0.0)
    double scale = 1.0;        // Dither Scale: 1..16 (default 1.0)
    double whiteAmount = 100.0;
    double blackAmount = 100.0;
    double levels = 2.0;
    double threshold = 50.0;
    double patternScale = 100.0;
    double patternAngle = 0.0;
    double contrast = 100.0;
    double brightness = 0.0;
    double randomness = 0.0;
    bool serpentine = true;
    bool linearGamma = false;
    bool pixelate = false;
    bool animateNoise = false;
    double seed = 0.0;
};

struct FrameCtx {
    double timeSec = 0.0;
    inline int frame() const {
        return (int)std::floor(timeSec * 30.0);
    }
};

inline float clampf(float v, float mn, float mx) {
    return std::max(mn, std::min(mx, v));
}

inline float lerpf(float a, float b, float t) {
    return a + (b - a) * t;
}

inline float luma709(float r, float g, float b) {
    return 0.2126f * r + 0.7152f * g + 0.0722f * b;
}

inline uint32_t hash_u32(uint32_t x) {
    x ^= x >> 16;
    x *= 0x7feb352du;
    x ^= x >> 15;
    x *= 0x846ca68bu;
    x ^= x >> 16;
    return x;
}

inline uint32_t hash2(uint32_t a, uint32_t b) {
    return hash_u32(a ^ hash_u32(b + 0x9e3779b9u));
}

inline uint32_t hash3(uint32_t a, uint32_t b, uint32_t c) {
    return hash2(hash2(a, b), c);
}

inline float u01(uint32_t h) {
    return (float)(h & 0x00ffffff) * (1.0f / 16777216.0f);
}

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>

template <typename Func>
inline void parallel_rows(int count, Func f) {
    if (count <= 1) {
        f(0, count);
        return;
    }
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    int numThreads = std::max(1, std::min(8, (int)sysInfo.dwNumberOfProcessors));
    if (numThreads <= 1) {
        f(0, count);
        return;
    }
    struct ThreadData {
        Func* f;
        int start;
        int end;
    };
    std::vector<ThreadData> tdata((size_t)numThreads);
    std::vector<HANDLE> handles;
    handles.reserve((size_t)numThreads);

    int chunkSize = (count + numThreads - 1) / numThreads;
    for (int t = 0; t < numThreads; ++t) {
        tdata[t].f = &f;
        tdata[t].start = t * chunkSize;
        tdata[t].end = std::min(count, (t + 1) * chunkSize);
        if (tdata[t].start < tdata[t].end) {
            HANDLE h = CreateThread(nullptr, 0, [](LPVOID param) -> DWORD {
                ThreadData* td = (ThreadData*)param;
                (*(td->f))(td->start, td->end);
                return 0;
            }, &tdata[t], 0, nullptr);
            if (h) handles.push_back(h);
            else (*(tdata[t].f))(tdata[t].start, tdata[t].end);
        }
    }
    if (!handles.empty()) {
        WaitForMultipleObjects((DWORD)handles.size(), handles.data(), TRUE, INFINITE);
        for (HANDLE h : handles) CloseHandle(h);
    }
}
#else
template <typename Func>
inline void parallel_rows(int count, Func f) {
    f(0, count);
}
#endif

void render_lines(const Image& src, const Image& dst, const LinesParams& p, const FrameCtx& c);
void render_dither(const Image& src, const Image& dst, const DitherParams& p, const FrameCtx& c);

} // namespace majeed

#endif // _MAJEED_CORE_H_
