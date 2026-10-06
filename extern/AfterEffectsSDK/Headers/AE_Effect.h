#ifndef _H_AE_EFFECT
#define _H_AE_EFFECT

#include "AE_EffectCommon.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    PF_Cmd_ABOUT                   = 0,
    PF_Cmd_GLOBAL_SETUP             = 1,
    PF_Cmd_INTERNAL                 = 2,
    PF_Cmd_PARAMS_SETUP             = 4,
    PF_Cmd_SEQUENCE_SETUP           = 5,
    PF_Cmd_SEQUENCE_SETDOWN         = 6,
    PF_Cmd_SEQUENCE_RESETUP         = 7,
    PF_Cmd_FRAME_SETUP              = 8,
    PF_Cmd_RENDER                   = 9,
    PF_Cmd_FRAME_SETDOWN            = 10,
    PF_Cmd_USER_CHANGED_PARAM       = 11,
    PF_Cmd_UPDATE_PARAMS_UI         = 12,
    PF_Cmd_QUERY_DYNAMIC_FLAGS      = 15,
    PF_Cmd_SMART_PRE_RENDER         = 23,
    PF_Cmd_SMART_RENDER             = 24
} PF_Cmd;

enum {
    PF_OutFlag_NONE                 = 0,
    PF_OutFlag_PIX_INDEPENDENT      = 1 << 2,
    PF_OutFlag_WIDE_TIME_INPUT      = 1 << 19,
    PF_OutFlag_DEEP_COLOR_AWARE     = 1 << 25
};

enum {
    PF_OutFlag2_NONE                        = 0,
    PF_OutFlag2_FLOAT_COLOR_AWARE           = 1 << 10,
    PF_OutFlag2_SUPPORTS_SMART_RENDER       = 1 << 12,
    PF_OutFlag2_SUPPORTS_THREADED_RENDERING = 1 << 27
};

typedef enum {
    PF_Param_NONE           = 0,
    PF_Param_SLIDER         = 1,
    PF_Param_CHECKBOX       = 2,
    PF_Param_COLOR          = 3,
    PF_Param_FLOAT_SLIDER   = 4,
    PF_Param_POPUP          = 5,
    PF_Param_ANGLE          = 6,
    PF_Param_GROUP_START    = 7,
    PF_Param_GROUP_END      = 8
} PF_ParamType;

typedef struct {
    A_long value;
    A_long valid_min, valid_max;
    A_long slider_min, slider_max;
    A_long dflt;
} PF_SliderDef;

typedef struct {
    PF_Boolean value;
    PF_Boolean dflt;
    const char* u_name;
} PF_CheckboxDef;

typedef struct {
    PF_Pixel value;
    PF_Pixel dflt;
} PF_ColorDef;

typedef struct {
    PF_FpLong value;
    PF_FpLong valid_min, valid_max;
    PF_FpLong slider_min, slider_max;
    PF_FpLong dflt;
    A_short precision;
    A_short display_flags;
    PF_FpLong step;
} PF_FloatSliderDef;

typedef struct {
    A_long value;
    A_long num_choices;
    A_long dflt;
    const char* choices;
} PF_PopupDef;

typedef struct {
    PF_Fixed value;
    PF_Fixed dflt;
} PF_AngleDef;

typedef struct {
    const char* name;
} PF_GroupStartDef;

typedef struct {
    A_long dummy;
} PF_GroupEndDef;

typedef struct PF_ParamDef {
    PF_ParamType    param_type;
    A_char          name[32];
    A_long          flags;
    A_long          ui_flags;
    A_long          ui_width;
    A_long          ui_height;
    union {
        PF_SliderDef        sd;
        PF_CheckboxDef      bd;
        PF_ColorDef         cd;
        PF_FloatSliderDef   fs_d;
        PF_PopupDef         pd;
        PF_AngleDef         ad;
        PF_GroupStartDef    start_d;
        PF_GroupEndDef      end_d;
    } u;
} PF_ParamDef;

typedef struct {
    SPBasicSuite*   pica_basicP;
    A_long          my_version;
    PF_Rect         extent_hint;
    A_long          total_time;
    A_long          time_step;
    A_long          time_scale;
    A_long          current_time;
    A_long          current_frame;
    PF_Rational64   pixel_aspect_ratio;
    void*           global_data;
    void*           sequence_data;
    void*           frame_data;
    void*           inter_data;
    void*           extra;
} PF_InData;

typedef struct {
    A_long          my_version;
    A_long          num_params;
    A_long          out_flags;
    A_long          out_flags2;
    A_char          return_msg[256];
    void*           global_data;
    void*           sequence_data;
    void*           frame_data;
    A_long          width;
    A_long          height;
    PF_Rect         origin;
} PF_OutData;

typedef PF_Err (*PF_ParamDefCallback)(PF_InData*, A_long, PF_ParamDef*);

#ifdef __cplusplus
}
#endif

#endif // _H_AE_EFFECT
