#ifndef _H_AE_EFFECTSUITES
#define _H_AE_EFFECTSUITES

#include "AE_Effect.h"

#ifdef __cplusplus
extern "C" {
#endif

#define kPFSmartRenderSuite             "PF SmartRender Suite"
#define kPFSmartRenderSuiteVersion1     1

typedef void* PF_RenderRequestP;
typedef void* PF_PreRenderNodeP;

typedef struct {
    PF_Err (*PF_CheckoutWorld)(PF_InData *in_data, A_long index, A_long what_time, const void *req, PF_EffectWorld **world);
    PF_Err (*PF_CheckinWorld)(PF_InData *in_data, A_long index, PF_EffectWorld *world);
} PF_SmartRenderSuite1;

typedef struct {
    struct {
        PF_PreRenderNodeP   pre_render_node;
    } input;
    struct {
        PF_Rect             result_rect;
        A_long              solid_depth;
        PF_Rect             max_result_rect;
    } output;
    struct {
        PF_Err (*checkout_layer)(PF_InData *in_data, A_long index, A_long unique_id, const void *req, A_long what_time, void *reserved);
    } callbacks;
} PF_PreRenderExtra;

typedef struct {
    struct {
        PF_PreRenderNodeP   pre_render_node;
        PF_PixelFormat      pixel_format;
    } input;
    struct {
        PF_EffectWorld*     output_worldP;
    } output;
    struct {
        PF_Err (*checkout_layer_pixels)(PF_InData *in_data, A_long index, PF_EffectWorld **world);
        PF_Err (*checkin_layer_pixels)(PF_InData *in_data, A_long index);
    } callbacks;
} PF_SmartRenderExtra;

#ifdef __cplusplus
}
#endif

#endif // _H_AE_EFFECTSUITES
