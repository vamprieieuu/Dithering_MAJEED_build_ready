#ifndef _H_AE_EFFECTPIXELFORMAT
#define _H_AE_EFFECTPIXELFORMAT

#include <cstdint>

typedef uint32_t PF_PixelFormat;

enum {
    PF_PixelFormat_INVALID = 0,
    PF_PixelFormat_ARGB32  = 0x61726762, /* 'argb' - 8-bit ARGB */
    PF_PixelFormat_ARGB64  = 0x61653136, /* 'ae16' - 16-bit ARGB */
    PF_PixelFormat_ARGB128 = 0x61653332  /* 'ae32' - 32-bit Float RGBA */
};

#endif // _H_AE_EFFECTPIXELFORMAT
