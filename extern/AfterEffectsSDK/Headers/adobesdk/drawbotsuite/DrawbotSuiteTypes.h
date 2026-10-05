#pragma once
#ifndef DRAWBOT_SUITE_TYPES_H
#define DRAWBOT_SUITE_TYPES_H

#include <stdint.h>

typedef void* DRAWBOT_DrawRef;
typedef void* DRAWBOT_SurfaceRef;
typedef void* DRAWBOT_SupplierRef;
typedef void* DRAWBOT_ImageRef;
typedef void* DRAWBOT_ObjectRef;
typedef void* DRAWBOT_PathRef;
typedef int32_t DRAWBOT_Boolean;

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
    kDRAWBOT_PixelLayout_32BGRA_Straight = 1
} DRAWBOT_PixelLayout;

#endif
