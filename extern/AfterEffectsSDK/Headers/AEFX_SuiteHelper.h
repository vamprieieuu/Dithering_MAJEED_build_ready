#ifndef _H_AEFX_SUITE_HELPER
#define _H_AEFX_SUITE_HELPER

#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AEFX_SuiteHandlerTemplate.h"

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

#endif // _H_AEFX_SUITE_HELPER
