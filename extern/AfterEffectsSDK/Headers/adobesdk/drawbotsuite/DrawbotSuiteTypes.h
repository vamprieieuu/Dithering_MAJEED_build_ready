#ifndef _DRAWBOT_SUITE_TYPES_H_
#define _DRAWBOT_SUITE_TYPES_H_

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef void* DRAWBOT_DrawRef;
typedef void* DRAWBOT_SurfaceRef;
typedef void* DRAWBOT_SupplierRef;
typedef void* DRAWBOT_ImageRef;
typedef void* DRAWBOT_ObjectRef;
typedef void* DRAWBOT_PathRef;
typedef uint32_t DRAWBOT_Boolean;

typedef struct {
    float x;
    float y;
} DRAWBOT_PointF32;

typedef struct {
    float red;
    float green;
    float blue;
    float alpha;
} DRAWBOT_ColorRGBA;

typedef enum {
    kDRAWBOT_PixelLayout_32ARGB_Straight = 0,
    kDRAWBOT_PixelLayout_32BGRA_Straight = 1,
    kDRAWBOT_PixelLayout_32ARGB_Premul   = 2,
    kDRAWBOT_PixelLayout_32BGRA_Premul   = 3
} DRAWBOT_PixelLayout;

#ifdef __cplusplus
}
#endif

#endif // _DRAWBOT_SUITE_TYPES_H_
