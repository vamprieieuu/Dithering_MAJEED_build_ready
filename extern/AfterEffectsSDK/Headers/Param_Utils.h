#pragma once
#include <string.h>
#include "AEConfig.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"

#ifndef PF_STRNNCPY
#define PF_STRNNCPY(dst, src, count) \
    do { \
        strncpy((dst), (src), (count)); \
        (dst)[(count) - 1] = 0; \
    } while (0)
#endif

#ifndef AEFX_CLR_STRUCT
#define AEFX_CLR_STRUCT(var) memset(&(var), 0, sizeof(var))
#endif

#define PF_ADD_FLOAT_SLIDERX(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, DFLT, PREC, DISP, FLAGS, ID) \
    do { \
        def.param_type = PF_Param_FLOAT_SLIDER; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.u.fs_d.valid_min = (PF_FpShort)(VALID_MIN); \
        def.u.fs_d.valid_max = (PF_FpShort)(VALID_MAX); \
        def.u.fs_d.slider_min = (PF_FpShort)(SLIDER_MIN); \
        def.u.fs_d.slider_max = (PF_FpShort)(SLIDER_MAX); \
        def.u.fs_d.value = (PF_FpLong)(DFLT); \
        def.u.fs_d.dephault = (PF_FpShort)(DFLT); \
        def.u.fs_d.precision = (A_short)(PREC); \
        def.u.fs_d.display_flags = (PF_ValueDisplayFlags)(DISP); \
        def.u.fs_d.fs_flags = 0; \
        def.flags = (FLAGS); \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)

#define PF_ADD_CHECKBOX(NAME1, NAME2, DFLT, FLAGS, ID) \
    do { \
        def.param_type = PF_Param_CHECKBOX; \
        PF_STRNNCPY(def.name, (NAME1), sizeof(def.name)); \
        def.u.bd.value = (PF_Boolean)(DFLT); \
        def.u.bd.dephault = (PF_Boolean)(DFLT); \
        def.u.bd.u.nameptr = (NAME2); \
        def.flags = (FLAGS); \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)

#define PF_ADD_POPUP(NAME, NUM_CHOICES, DFLT, CHOICES_STR, ID) \
    do { \
        def.param_type = PF_Param_POPUP; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.u.pd.num_choices = (A_short)(NUM_CHOICES); \
        def.u.pd.dephault = (A_short)(DFLT); \
        def.u.pd.value = (PF_ParamValue)(DFLT); \
        def.u.pd.u.namesptr = (CHOICES_STR); \
        def.flags = 0; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)

#define PF_ADD_COLOR(NAME, RED, GREEN, BLUE, ID) \
    do { \
        def.param_type = PF_Param_COLOR; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.u.cd.value.red = (A_u_char)(RED); \
        def.u.cd.value.green = (A_u_char)(GREEN); \
        def.u.cd.value.blue = (A_u_char)(BLUE); \
        def.u.cd.value.alpha = 255; \
        def.u.cd.dephault = def.u.cd.value; \
        def.flags = 0; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)

#define PF_ADD_ANGLE(NAME, DFLT, ID) \
    do { \
        def.param_type = PF_Param_ANGLE; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.u.ad.value = (PF_Fixed)((DFLT) * 65536.0); \
        def.u.ad.dephault = def.u.ad.value; \
        def.flags = 0; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)

#define PF_ADD_TOPIC(NAME, ID) \
    do { \
        def.param_type = PF_Param_GROUP_START; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = 0; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)

#define PF_END_TOPIC(ID) \
    do { \
        def.param_type = PF_Param_GROUP_END; \
        def.flags = 0; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
