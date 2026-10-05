#pragma once
#include <cstdint>

enum {
    kDRAWBOT_PixelLayout_32ARGB_Straight = 0,
    kDRAWBOT_PixelLayout_32BGRA_Straight = 1
};
typedef int32_t DRAWBOT_PixelLayout;
typedef unsigned char DRAWBOT_Boolean;
typedef int32_t DRAWBOT_Error;

typedef struct _DRAWBOT_DrawRef* DRAWBOT_DrawRef;
typedef struct _DRAWBOT_SurfaceRef* DRAWBOT_SurfaceRef;
typedef struct _DRAWBOT_SupplierRef* DRAWBOT_SupplierRef;
typedef struct _DRAWBOT_ImageRef* DRAWBOT_ImageRef;
typedef struct _DRAWBOT_ObjectRef* DRAWBOT_ObjectRef;
typedef struct _DRAWBOT_PathRef* DRAWBOT_PathRef;

struct DRAWBOT_PointF32 {
    float x;
    float y;
};

struct DRAWBOT_RectF32 {
    float left;
    float top;
    float right;
    float bottom;
};

struct DRAWBOT_ColorRGBA {
    float red;
    float green;
    float blue;
    float alpha;
};
