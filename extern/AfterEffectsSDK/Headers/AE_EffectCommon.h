#ifndef _H_AE_EFFECTCOMMON
#define _H_AE_EFFECTCOMMON

#include <cstdint>
#include <cstddef>
#include "SPBasic.h"
#include "AE_EffectPixelFormat.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef int32_t     A_long;
typedef uint32_t    A_u_long;
typedef int16_t     A_short;
typedef uint16_t    A_u_short;
typedef uint8_t     A_u_char;
typedef char        A_char;
typedef float       A_Float;
typedef double      A_Double;
typedef int32_t     PF_Fixed;
typedef float       PF_FpShort;
typedef double      PF_FpLong;
typedef int32_t     PF_Err;
typedef int32_t     PF_Boolean;
typedef void*       PF_Handle;

#define PF_Err_NONE                 0
#define PF_Err_OUT_OF_MEMORY        512
#define PF_Err_BAD_CALLBACK_PARAM   515

typedef struct {
    A_u_char alpha, red, green, blue;
} PF_Pixel8, PF_Pixel;

typedef struct {
    A_u_short alpha, red, green, blue;
} PF_Pixel16;

typedef struct {
    PF_FpShort red, green, blue, alpha;
} PF_PixelFloat, PF_Pixel32;

typedef struct {
    A_long left, top, right, bottom;
} PF_Rect;

typedef struct {
    A_long num, den;
} PF_Rational64;

typedef struct PF_EffectWorld {
    A_long          version;
    void*           data;
    A_long          rowbytes;
    A_long          width;
    A_long          height;
    PF_Rect         extent_hint;
    PF_PixelFormat  pixel_format;
    PF_Rational64   pixel_aspect_ratio;
    void*           platform_ref;
} PF_EffectWorld, PF_LayerDef;

#ifdef __cplusplus
}
#endif

#endif // _H_AE_EFFECTCOMMON
