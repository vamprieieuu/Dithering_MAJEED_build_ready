#ifndef _ADOBESDK_DRAWBOTSUITE_TYPES_H_
#define _ADOBESDK_DRAWBOTSUITE_TYPES_H_

#ifdef __cplusplus
extern "C" {
#endif

typedef void* DRAWBOT_DrawRef;
typedef void* DRAWBOT_SupplierRef;
typedef void* DRAWBOT_SurfaceRef;
typedef void* DRAWBOT_ImageRef;
typedef void* DRAWBOT_ObjectRef;
typedef void* DRAWBOT_PathRef;
typedef unsigned char DRAWBOT_Boolean;

typedef enum {
    kDRAWBOT_PixelLayout_BGRA = 0,
    kDRAWBOT_PixelLayout_ARGB = 1,
    kDRAWBOT_PixelLayout_RGBA = 2,
    kDRAWBOT_PixelLayout_32BGRA_Straight = 0,
    kDRAWBOT_PixelLayout_32ARGB_Straight = 1,
    kDRAWBOT_PixelLayout_32RGBA_Straight = 2,
    kDRAWBOT_PixelLayout_32BGRA_Premul = 3,
    kDRAWBOT_PixelLayout_32ARGB_Premul = 4,
    kDRAWBOT_PixelLayout_32RGBA_Premul = 5
} DRAWBOT_PixelLayout;

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

#ifdef __cplusplus
}
#endif

#endif // _ADOBESDK_DRAWBOTSUITE_TYPES_H_
