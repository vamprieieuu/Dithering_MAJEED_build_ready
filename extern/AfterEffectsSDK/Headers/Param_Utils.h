#ifndef _H_PARAM_UTILS
#define _H_PARAM_UTILS

#include "AE_Effect.h"
#include <string.h>

#ifndef PF_STRNNCPY
#define PF_STRNNCPY(DST, SRC, LEN) do { strncpy((DST), (SRC), (LEN)-1); (DST)[(LEN)-1] = '\0'; } while (0)
#endif

#ifndef PF_ADD_PARAM
#define PF_ADD_PARAM(IN_DATA, INDEX, DEF) \
    ((IN_DATA)->inter.add_param((IN_DATA)->effect_ref, (INDEX), (DEF)))
#endif

#ifndef PF_CHECKOUT_PARAM
#define PF_CHECKOUT_PARAM(IN_DATA, INDEX, TIME, STEP, SCALE, PARAM) \
    ((IN_DATA)->inter.checkout_param((IN_DATA)->effect_ref, (INDEX), (TIME), (STEP), (SCALE), (PARAM)))
#endif

#ifndef PF_CHECKIN_PARAM
#define PF_CHECKIN_PARAM(IN_DATA, PARAM) \
    ((IN_DATA)->inter.checkin_param((IN_DATA)->effect_ref, (PARAM)))
#endif

#ifndef PF_ADD_FLOAT_SLIDERX
#define PF_ADD_FLOAT_SLIDERX(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, DFLT, PREC, DISP, FLAGS, ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_FLOAT_SLIDER; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = (FLAGS); \
        def.uu.id = (ID); \
        def.u.fs_d.valid_min = (VALID_MIN); \
        def.u.fs_d.valid_max = (VALID_MAX); \
        def.u.fs_d.slider_min = (SLIDER_MIN); \
        def.u.fs_d.slider_max = (SLIDER_MAX); \
        def.u.fs_d.value = (DFLT); \
        def.u.fs_d.dephault = (DFLT); \
        def.u.fs_d.precision = (PREC); \
        def.u.fs_d.display_flags = (DISP); \
        def.u.fs_d.fs_flags = 0; \
        def.u.fs_d.curve_tolerance = 0; \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#ifndef PF_ADD_CHECKBOX
#define PF_ADD_CHECKBOX(NAME, LABEL, DFLT, FLAGS, ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_CHECKBOX; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = (FLAGS); \
        def.uu.id = (ID); \
        def.u.bd.value = (DFLT); \
        def.u.bd.dephault = (DFLT); \
        def.u.bd.u.nameptr = (LABEL); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#ifndef PF_ADD_POPUP
#define PF_ADD_POPUP(NAME, NUM_CHOICES, DFLT, STRING_LIST, ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_POPUP; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = 0; \
        def.uu.id = (ID); \
        def.u.pd.num_choices = (NUM_CHOICES); \
        def.u.pd.value = (DFLT); \
        def.u.pd.dephault = (DFLT); \
        def.u.pd.u.namesptr = (STRING_LIST); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#ifndef PF_ADD_COLOR
#define PF_ADD_COLOR(NAME, RED, GREEN, BLUE, ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_COLOR; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = 0; \
        def.uu.id = (ID); \
        def.u.cd.value.red = (A_u_char)(RED); \
        def.u.cd.value.green = (A_u_char)(GREEN); \
        def.u.cd.value.blue = (A_u_char)(BLUE); \
        def.u.cd.value.alpha = 255; \
        def.u.cd.dephault = def.u.cd.value; \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#ifndef PF_ADD_ANGLE
#define PF_ADD_ANGLE(NAME, DFLT, ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_ANGLE; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = 0; \
        def.uu.id = (ID); \
        def.u.ad.value = (PF_Fixed)((DFLT) * 65536.0); \
        def.u.ad.dephault = def.u.ad.value; \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#ifndef PF_ADD_TOPIC
#define PF_ADD_TOPIC(NAME, ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_GROUP_START; \
        PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
        def.flags = PF_ParamFlag_START_COLLAPSED; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#ifndef PF_END_TOPIC
#define PF_END_TOPIC(ID) \
    do { \
        AEFX_CLR_STRUCT(def); \
        def.param_type = PF_Param_GROUP_END; \
        def.flags = 0; \
        def.uu.id = (ID); \
        ERR(PF_ADD_PARAM(in_data, -1, &def)); \
    } while (0)
#endif

#endif // _H_PARAM_UTILS
