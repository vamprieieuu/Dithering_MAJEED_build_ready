#ifndef _H_AEFX_SUITE_HELPER
#define _H_AEFX_SUITE_HELPER

#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AEFX_SuiteHandlerTemplate.h"
#include "adobesdk/DrawbotSuite.h"

inline PF_Err AEFX_AcquireSuite(PF_InData *in_data, PF_OutData *out_data, const char *name, int32_t version, const char *err_str, void **suite) {
    (void)out_data; (void)err_str;
    if (!in_data || !in_data->pica_basicP || !suite) return PF_Err_BAD_CALLBACK_PARAM;
    return (PF_Err)in_data->pica_basicP->AcquireSuite(name, version, (const void**)suite);
}

inline PF_Err AEFX_ReleaseSuite(PF_InData *in_data, PF_OutData *out_data, const char *name, int32_t version, const char *err_str = nullptr) {
    (void)out_data; (void)err_str;
    if (!in_data || !in_data->pica_basicP) return PF_Err_BAD_CALLBACK_PARAM;
    return (PF_Err)in_data->pica_basicP->ReleaseSuite(name, version);
}

inline PF_Err AEFX_AcquireDrawbotSuites(PF_InData *in_data, PF_OutData *out_data, DRAWBOT_Suites *suiteP) {
    PF_Err err = PF_Err_NONE;
    (void)out_data;
    if (!suiteP) return PF_Err_BAD_CALLBACK_PARAM;

    suiteP->drawbot_suiteP = nullptr;
    suiteP->supplier_suiteP = nullptr;
    suiteP->surface_suiteP = nullptr;
    suiteP->path_suiteP = nullptr;
    suiteP->pen_suiteP = nullptr;
    suiteP->image_suiteP = nullptr;

    err = AEFX_AcquireSuite(in_data, nullptr, kDRAWBOT_DrawSuite, kDRAWBOT_DrawSuite_VersionCurrent, nullptr, (void**)&suiteP->drawbot_suiteP);
    if (!err) {
        err = AEFX_AcquireSuite(in_data, nullptr, kDRAWBOT_SupplierSuite, kDRAWBOT_SupplierSuite_VersionCurrent, nullptr, (void**)&suiteP->supplier_suiteP);
    }
    if (!err) {
        err = AEFX_AcquireSuite(in_data, nullptr, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_VersionCurrent, nullptr, (void**)&suiteP->surface_suiteP);
        if (err || !suiteP->surface_suiteP) {
            err = AEFX_AcquireSuite(in_data, nullptr, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_Version1, nullptr, (void**)&suiteP->surface_suiteP);
        }
    }
    if (!err) {
        err = AEFX_AcquireSuite(in_data, nullptr, kDRAWBOT_PathSuite, kDRAWBOT_PathSuite_VersionCurrent, nullptr, (void**)&suiteP->path_suiteP);
    }
    return err;
}

inline PF_Err AEFX_ReleaseDrawbotSuites(PF_InData *in_data, PF_OutData *out_data) {
    (void)out_data;
    AEFX_ReleaseSuite(in_data, nullptr, kDRAWBOT_DrawSuite, kDRAWBOT_DrawSuite_VersionCurrent, nullptr);
    AEFX_ReleaseSuite(in_data, nullptr, kDRAWBOT_SupplierSuite, kDRAWBOT_SupplierSuite_VersionCurrent, nullptr);
    if (AEFX_ReleaseSuite(in_data, nullptr, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_VersionCurrent, nullptr) != PF_Err_NONE) {
        AEFX_ReleaseSuite(in_data, nullptr, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_Version1, nullptr);
    }
    AEFX_ReleaseSuite(in_data, nullptr, kDRAWBOT_PathSuite, kDRAWBOT_PathSuite_VersionCurrent, nullptr);
    return PF_Err_NONE;
}

#endif // _H_AEFX_SUITE_HELPER
