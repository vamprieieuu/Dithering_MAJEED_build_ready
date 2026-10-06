#ifndef _H_PARAM_UTILS
#define _H_PARAM_UTILS

#include "AE_Effect.h"
#include <cstring>

#define PF_ADD_PARAM(IN_DATA, INDEX, PARAM_DEF) \
    do { \
        if ((IN_DATA) && (IN_DATA)->extra) { \
            PF_Err _p_err = (*(PF_ParamDefCallback)((IN_DATA)->extra))((IN_DATA), (INDEX), (PARAM_DEF)); \
            if (_p_err) err = _p_err; \
        } \
    } while (0)

#endif // _H_PARAM_UTILS
