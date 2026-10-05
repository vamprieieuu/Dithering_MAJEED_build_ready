#pragma once
#include <cstdint>
#include "adobesdk/drawbotsuite/DrawbotSuiteTypes.h"

#define kDRAWBOT_DrawSuite "Drawbot Draw Suite"
#define kDRAWBOT_DrawSuite_VersionCurrent 1

#define kDRAWBOT_SupplierSuite "Drawbot Supplier Suite"
#define kDRAWBOT_SupplierSuite_VersionCurrent 1

#define kDRAWBOT_SurfaceSuite "Drawbot Surface Suite"
#define kDRAWBOT_SurfaceSuite_VersionCurrent 2
#define kDRAWBOT_SurfaceSuite_Version1 1

#define kDRAWBOT_PathSuite "Drawbot Path Suite"
#define kDRAWBOT_PathSuite_VersionCurrent 1

struct DRAWBOT_DrawSuite1 {
    DRAWBOT_Error (*GetSupplier)(DRAWBOT_DrawRef in_draw_ref, DRAWBOT_SupplierRef *out_supplier_ref);
    DRAWBOT_Error (*GetSurface)(DRAWBOT_DrawRef in_draw_ref, DRAWBOT_SurfaceRef *out_surface_ref);
};

struct DRAWBOT_SupplierSuite1 {
    DRAWBOT_Error (*PrefersPixelLayoutBGRA)(DRAWBOT_SupplierRef in_supplier_ref, DRAWBOT_Boolean *out_prefers_bgra);
    DRAWBOT_Error (*SupportsPixelLayoutARGB)(DRAWBOT_SupplierRef in_supplier_ref, DRAWBOT_Boolean *out_supports_argb);
    DRAWBOT_Error (*NewImageFromBuffer)(DRAWBOT_SupplierRef in_supplier_ref, int32_t width, int32_t height, int32_t row_bytes, DRAWBOT_PixelLayout pixel_layout, const void *pixel_buffer, DRAWBOT_ImageRef *out_image_ref);
    DRAWBOT_Error (*ReleaseObject)(DRAWBOT_ObjectRef in_obj_ref);
};

struct DRAWBOT_SurfaceSuite1 {
    DRAWBOT_Error (*DrawImage)(DRAWBOT_SurfaceRef in_surface_ref, DRAWBOT_ImageRef in_image_ref, const DRAWBOT_PointF32 *in_origin, float in_alpha);
};

struct DRAWBOT_PathSuite1 {
    void* unused;
};

struct DRAWBOT_Suites {
    DRAWBOT_DrawSuite1* drawbot_suiteP;
    DRAWBOT_SupplierSuite1* supplier_suiteP;
    DRAWBOT_SurfaceSuite1* surface_suiteP;
    DRAWBOT_PathSuite1* path_suiteP;
    void* pen_suiteP;
    void* image_suiteP;
};
