#pragma once
#ifndef DRAWBOT_SUITE_H
#define DRAWBOT_SUITE_H

#include "adobesdk/drawbotsuite/DrawbotSuiteTypes.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AEFX_SuiteHelper.h"

#define kDRAWBOT_DrawSuite "DRAWBOT_DrawSuite"
#define kDRAWBOT_DrawSuite_Version1 1

#define kDRAWBOT_SurfaceSuite "DRAWBOT_SurfaceSuite"
#define kDRAWBOT_SurfaceSuite_Version1 1

#define kDRAWBOT_SupplierSuite "DRAWBOT_SupplierSuite"
#define kDRAWBOT_SupplierSuite_Version1 1

typedef struct DRAWBOT_DrawSuite1 {
    PF_Err (*GetSupplier)(DRAWBOT_DrawRef in_draw_ref, DRAWBOT_SupplierRef* out_supplier_ref);
    PF_Err (*GetSurface)(DRAWBOT_DrawRef in_draw_ref, DRAWBOT_SurfaceRef* out_surface_ref);
} DRAWBOT_DrawSuite1;

typedef struct DRAWBOT_SurfaceSuite1 {
    PF_Err (*DrawImage)(DRAWBOT_SurfaceRef in_surface_ref, DRAWBOT_ImageRef in_image_ref, const DRAWBOT_PointF32* in_origin, float in_alpha);
} DRAWBOT_SurfaceSuite1;

typedef struct DRAWBOT_SupplierSuite1 {
    PF_Err (*PrefersPixelLayoutBGRA)(DRAWBOT_SupplierRef in_supplier_ref, DRAWBOT_Boolean* out_prefers);
    PF_Err (*SupportsPixelLayoutARGB)(DRAWBOT_SupplierRef in_supplier_ref, DRAWBOT_Boolean* out_supports);
    PF_Err (*NewImageFromBuffer)(DRAWBOT_SupplierRef in_supplier_ref, int in_width, int in_height, int in_row_bytes, DRAWBOT_PixelLayout in_layout, const void* in_data, DRAWBOT_ImageRef* out_image_ref);
    PF_Err (*ReleaseObject)(DRAWBOT_ObjectRef in_obj_ref);
} DRAWBOT_SupplierSuite1;

typedef struct {
    DRAWBOT_DrawSuite1* drawbot_suiteP;
    DRAWBOT_SurfaceSuite1* surface_suiteP;
    DRAWBOT_SupplierSuite1* supplier_suiteP;
} DRAWBOT_Suites;

inline PF_Err AEFX_AcquireDrawbotSuites(PF_InData* in_data, PF_OutData* out_data, DRAWBOT_Suites* suites) {
    if (!suites) return PF_Err_BAD_CALLBACK_PARAM;
    suites->drawbot_suiteP = nullptr;
    suites->surface_suiteP = nullptr;
    suites->supplier_suiteP = nullptr;

    AEFX_AcquireSuite(in_data, out_data, kDRAWBOT_DrawSuite, kDRAWBOT_DrawSuite_Version1, nullptr, (void**)&suites->drawbot_suiteP);
    AEFX_AcquireSuite(in_data, out_data, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_Version1, nullptr, (void**)&suites->surface_suiteP);
    AEFX_AcquireSuite(in_data, out_data, kDRAWBOT_SupplierSuite, kDRAWBOT_SupplierSuite_Version1, nullptr, (void**)&suites->supplier_suiteP);
    return PF_Err_NONE;
}

inline PF_Err AEFX_ReleaseDrawbotSuites(PF_InData* in_data, PF_OutData* out_data) {
    AEFX_ReleaseSuite(in_data, out_data, kDRAWBOT_DrawSuite, kDRAWBOT_DrawSuite_Version1);
    AEFX_ReleaseSuite(in_data, out_data, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_Version1);
    AEFX_ReleaseSuite(in_data, out_data, kDRAWBOT_SupplierSuite, kDRAWBOT_SupplierSuite_Version1);
    return PF_Err_NONE;
}

#endif
