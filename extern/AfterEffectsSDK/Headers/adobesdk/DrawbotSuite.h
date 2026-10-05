#ifndef _ADOBESDK_DRAWBOT_SUITE_H_
#define _ADOBESDK_DRAWBOT_SUITE_H_

#include "adobesdk/drawbotsuite/DrawbotSuiteTypes.h"
#include "AE_Effect.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct DRAWBOT_DrawbotSuite1 {
    PF_Err (*GetSupplier)(DRAWBOT_DrawRef in_drawref, DRAWBOT_SupplierRef *out_supplier);
    PF_Err (*GetSurface)(DRAWBOT_DrawRef in_drawref, DRAWBOT_SurfaceRef *out_surface);
} DRAWBOT_DrawbotSuite1;

typedef struct DRAWBOT_SupplierSuite1 {
    PF_Err (*PrefersPixelLayoutBGRA)(DRAWBOT_SupplierRef in_supplier, DRAWBOT_Boolean *out_prefers_bgra);
    PF_Err (*SupportsPixelLayoutARGB)(DRAWBOT_SupplierRef in_supplier, DRAWBOT_Boolean *out_supports_argb);
    PF_Err (*NewImageFromBuffer)(DRAWBOT_SupplierRef in_supplier, int width, int height, int rowbytes, DRAWBOT_PixelLayout layout, const void* buffer, DRAWBOT_ImageRef *out_image);
    PF_Err (*ReleaseObject)(DRAWBOT_ObjectRef in_obj);
} DRAWBOT_SupplierSuite1;

typedef struct DRAWBOT_SurfaceSuite1 {
    PF_Err (*DrawImage)(DRAWBOT_SurfaceRef in_surface, DRAWBOT_ImageRef in_image, const DRAWBOT_PointF32* origin, float alpha);
} DRAWBOT_SurfaceSuite1;

typedef struct DRAWBOT_Suites {
    const DRAWBOT_DrawbotSuite1* drawbot_suiteP;
    const DRAWBOT_SupplierSuite1* supplier_suiteP;
    const DRAWBOT_SurfaceSuite1* surface_suiteP;
} DRAWBOT_Suites;

inline PF_Err AEFX_AcquireDrawbotSuites(PF_InData* in_data, PF_OutData* out_data, DRAWBOT_Suites* suites) {
    (void)in_data; (void)out_data; (void)suites;
    return PF_Err_BAD_CALLBACK_PARAM;
}
inline PF_Err AEFX_ReleaseDrawbotSuites(PF_InData* in_data, PF_OutData* out_data) {
    (void)in_data; (void)out_data;
    return PF_Err_NONE;
}

#ifdef __cplusplus
}
#endif

#endif // _ADOBESDK_DRAWBOT_SUITE_H_
