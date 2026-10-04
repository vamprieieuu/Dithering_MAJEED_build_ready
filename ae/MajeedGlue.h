// ============================================================================
// MAJEED - After Effects SDK glue (shared by all effects).
// Table-driven: every effect declares its parameters once (X-macro list) and a
// render function that maps the parameter values onto the native engine in ../core.
// Uses SmartFX (8 / 16 / 32-bit float). NO native AE effects are applied here.
// ============================================================================

#pragma once

#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "AE_EffectCBSuites.h"
#include "AE_EffectSuites.h"
#include "AEFX_SuiteHelper.h"

#include <vector>
#include <cstring>
#include <algorithm>

#include "../core/majeed_core.h"

#define MAJEED_MAJOR 1
#define MAJEED_MINOR 0
#define MAJEED_BUG   0
#define MAJEED_BUILD 1

namespace mj {

// ============================================================================
// Parameter types
// ============================================================================

enum
{
    T_FLOAT,
    T_CHECK,
    T_POPUP,
    T_COLOR,
    T_ANGLE,
    T_GROUP,
    T_GROUP_END
};

struct PSpec
{
    int t;
    const char* name;

    double mn;
    double mx;
    double smn;
    double smx;
    double def;

    int prec;

    const char* popup;
    int npop;

    float r;
    float g;
    float b;
};

static const int MAXP = 96;

// ============================================================================
// X-macro helpers
// ============================================================================

#define MJ_ENUM_F(id,name,mn,mx,smn,smx,def,prec) id,
#define MJ_ENUM_K(id,name,def)                       id,
#define MJ_ENUM_P(id,name,list,n,def)                id,
#define MJ_ENUM_C(id,name,r,g,b)                     id,
#define MJ_ENUM_A(id,name,def)                       id,
#define MJ_ENUM_G(id,name)                           id,
#define MJ_ENUM_E(id)                                id,

#define MJ_SPEC_F(id,name,mn,mx,smn,smx,def,prec) \
    { mj::T_FLOAT, name, mn, mx, smn, smx, def, prec, nullptr, 0, 0, 0, 0 },

#define MJ_SPEC_K(id,name,def) \
    { mj::T_CHECK, name, 0, 1, 0, 1, def, 0, nullptr, 0, 0, 0, 0 },

#define MJ_SPEC_P(id,name,list,n,def) \
    { mj::T_POPUP, name, 1, n, 1, n, def, 0, list, n, 0, 0, 0 },

#define MJ_SPEC_C(id,name,r,g,b) \
    { mj::T_COLOR, name, 0, 1, 0, 1, 0, 0, nullptr, 0, r, g, b },

#define MJ_SPEC_A(id,name,def) \
    { mj::T_ANGLE, name, 0, 0, 0, 0, def, 0, nullptr, 0, 0, 0, 0 },

#define MJ_SPEC_G(id,name) \
    { mj::T_GROUP, name, 0, 0, 0, 0, 0, 0, nullptr, 0, 0, 0, 0 },

#define MJ_SPEC_E(id) \
    { mj::T_GROUP_END, "", 0, 0, 0, 0, 0, 0, nullptr, 0, 0, 0, 0 },

#define MJ_DEFINE_PARAMS(LIST, PFX) \
    enum PFX##_ids \
    { \
        LIST(MJ_ENUM_F, MJ_ENUM_K, MJ_ENUM_P, MJ_ENUM_C, MJ_ENUM_A, MJ_ENUM_G, MJ_ENUM_E) \
        PFX##_COUNT \
    }; \
    static const mj::PSpec PFX##_specs[] = \
    { \
        LIST(MJ_SPEC_F, MJ_SPEC_K, MJ_SPEC_P, MJ_SPEC_C, MJ_SPEC_A, MJ_SPEC_G, MJ_SPEC_E) \
    };

// ============================================================================
// Parameter values
// ============================================================================

struct Vals
{
    double f[MAXP];
    float c[MAXP][3];

    double operator[](int i) const
    {
        return f[i];
    }

    bool on(int i) const
    {
        return f[i] > 0.5;
    }

    int pop(int i) const
    {
        return static_cast<int>(f[i]);
    }

    majeed::RGB col(int i) const
    {
        return {
            c[i][0],
            c[i][1],
            c[i][2]
        };
    }
};

// ============================================================================
// Render / event function types
// ============================================================================

typedef void (*RenderFn)(
    const majeed::Image& src,
    majeed::Image& dst,
    const Vals& v,
    const majeed::FrameCtx& ctx
);

typedef PF_Err (*EventFn)(
    PF_InData* in,
    PF_OutData* out,
    PF_EventExtra* extra
);

struct EffectDef
{
    const char* name;
    const PSpec* specs;
    int nspecs;
    RenderFn render;
    const char* about;

    EventFn event = nullptr;
    bool customUI = false;
};

// ============================================================================
// Parameter setup
// ============================================================================

inline PF_Err ParamsSetup(
    PF_InData* in_data,
    PF_OutData* out,
    const EffectDef& d)
{
    PF_Err err = PF_Err_NONE;

    PF_ParamDef def;
    AEFX_CLR_STRUCT(def);

    int offset = 0;

    if (d.customUI)
    {
        AEFX_CLR_STRUCT(def);

        def.param_type = PF_Param_BUTTON;

        PF_STRNNCPY(
            def.name,
            "",
            sizeof(def.name)
        );

        def.flags =
            PF_ParamFlag_SUPERVISE |
            PF_ParamFlag_CANNOT_TIME_VARY;

        def.ui_flags =
            PF_PUI_CONTROL |
            PF_PUI_DONT_ERASE_CONTROL;

        def.ui_width = 300;
        def.ui_height = 82;

        def.u.button_d.u.namesptr = "";

        def.uu.id = 1;

        ERR(
            PF_ADD_PARAM(
                in_data,
                out,
                1,
                &def
            )
        );

        offset = 1;
    }

    for (int i = 0; i < d.nspecs && !err; ++i)
    {
        const PSpec& s = d.specs[i];

        AEFX_CLR_STRUCT(def);

        const int id = i + 1 + offset;

        switch (s.t)
        {
            case T_FLOAT:
            {
                PF_ADD_FLOAT_SLIDERX(
                    s.name,
                    s.mn,
                    s.mx,
                    s.smn,
                    s.smx,
                    s.def,
                    s.prec,
                    0,
                    0,
                    id
                );
                break;
            }

            case T_CHECK:
            {
                PF_ADD_CHECKBOX(
                    s.name,
                    "On",
                    s.def > 0.5 ? 1 : 0,
                    0,
                    id
                );
                break;
            }

            case T_POPUP:
            {
                PF_ADD_POPUP(
                    s.name,
                    s.npop,
                    static_cast<int>(s.def),
                    s.popup,
                    id
                );
                break;
            }

            case T_COLOR:
            {
                PF_ADD_COLOR(
                    s.name,
                    static_cast<A_u_char>(
                        s.r * 255.0f + 0.5f
                    ),
                    static_cast<A_u_char>(
                        s.g * 255.0f + 0.5f
                    ),
                    static_cast<A_u_char>(
                        s.b * 255.0f + 0.5f
                    ),
                    id
                );
                break;
            }

            case T_ANGLE:
            {
                PF_ADD_ANGLE(
                    s.name,
                    static_cast<int>(s.def),
                    id
                );
                break;
            }

            case T_GROUP:
            {
                PF_ADD_TOPIC(
                    s.name,
                    id
                );
                break;
            }

            case T_GROUP_END:
            {
                PF_END_TOPIC(id);
                break;
            }

            default:
                break;
        }
    }

    out->num_params =
        d.nspecs + 1 + offset;

    return err;
}

// ============================================================================
// Global setup
// ============================================================================

inline PF_Err GlobalSetup(
    PF_InData*,
    PF_OutData* out,
    const EffectDef& d)
{
    out->my_version =
        PF_VERSION(
            MAJEED_MAJOR,
            MAJEED_MINOR,
            MAJEED_BUG,
            PF_Stage_RELEASE,
            MAJEED_BUILD
        );

    out->out_flags =
        PF_OutFlag_DEEP_COLOR_AWARE |
        (d.customUI ? PF_OutFlag_CUSTOM_UI : 0);

    out->out_flags2 =
        PF_OutFlag2_FLOAT_COLOR_AWARE |
        PF_OutFlag2_SUPPORTS_SMART_RENDER |
        PF_OutFlag2_SUPPORTS_THREADED_RENDERING;

    return PF_Err_NONE;
}

// ============================================================================
// SmartFX pre-render
// ============================================================================

inline PF_Err PreRender(
    PF_InData* in,
    PF_OutData*,
    PF_PreRenderExtra* extra)
{
    PF_Err err = PF_Err_NONE;

    PF_RenderRequest req =
        extra->input->output_request;

    PF_CheckoutResult res;

    req.rect.left = 0;
    req.rect.top = 0;
    req.rect.right = in->width;
    req.rect.bottom = in->height;

    req.preserve_rgb_of_zero_alpha = TRUE;

    ERR(
        extra->cb->checkout_layer(
            in->effect_ref,
            0,
            0,
            &req,
            in->current_time,
            in->time_step,
            in->time_scale,
            &res
        )
    );

    if (!err)
    {
        extra->output->result_rect =
            res.result_rect;

        extra->output->max_result_rect =
            res.max_result_rect;

        extra->output->solid = FALSE;

        extra->output->pre_render_data = 0;
    }

    return err;
}

// ============================================================================
// Pixel conversion
// ============================================================================

inline float ch8(A_u_char v)
{
    return static_cast<float>(v) *
           (1.0f / 255.0f);
}

inline float ch16(A_u_short v)
{
    return static_cast<float>(v) *
           (1.0f / 32768.0f);
}

inline void load_image(
    const PF_EffectWorld* w,
    PF_PixelFormat fmt,
    std::vector<float>& buf)
{
    const int W = w->width;
    const int H = w->height;

    buf.resize(
        static_cast<size_t>(W) *
        static_cast<size_t>(H) *
        4
    );

    for (int y = 0; y < H; ++y)
    {
        const char* row =
            reinterpret_cast<const char*>(w->data) +
            static_cast<size_t>(y) *
            static_cast<size_t>(w->rowbytes);

        float* o =
            &buf[
                static_cast<size_t>(y) *
                static_cast<size_t>(W) *
                4
            ];

        for (int x = 0; x < W; ++x, o += 4)
        {
            float a;
            float r;
            float g;
            float b;

            if (fmt == PF_PixelFormat_ARGB32)
            {
                const PF_Pixel8* p =
                    reinterpret_cast<const PF_Pixel8*>(
                        row
                    ) + x;

                a = ch8(p->alpha);
                r = ch8(p->red);
                g = ch8(p->green);
                b = ch8(p->blue);
            }
            else if (fmt == PF_PixelFormat_ARGB64)
            {
                const PF_Pixel16* p =
                    reinterpret_cast<const PF_Pixel16*>(
                        row
                    ) + x;

                a = ch16(p->alpha);
                r = ch16(p->red);
                g = ch16(p->green);
                b = ch16(p->blue);
            }
            else
            {
                const PF_PixelFloat* p =
                    reinterpret_cast<const PF_PixelFloat*>(
                        row
                    ) + x;

                a = p->alpha;
                r = p->red;
                g = p->green;
                b = p->blue;
            }

            if (a > 1.0e-6f)
            {
                r /= a;
                g /= a;
                b /= a;
            }
            else
            {
                r = 0.0f;
                g = 0.0f;
                b = 0.0f;
            }

            o[0] = r;
            o[1] = g;
            o[2] = b;
            o[3] = a;
        }
    }
}

// ============================================================================
// Store image
// ============================================================================

inline void store_image(
    const std::vector<float>& buf,
    int bw,
    int bh,
    PF_EffectWorld* w,
    PF_PixelFormat fmt)
{
    const int W =
        std::min(
            bw,
            static_cast<int>(w->width)
        );

    const int H =
        std::min(
            bh,
            static_cast<int>(w->height)
        );

    for (int y = 0; y < H; ++y)
    {
        char* row =
            reinterpret_cast<char*>(w->data) +
            static_cast<size_t>(y) *
            static_cast<size_t>(w->rowbytes);

        const float* s =
            &buf[
                static_cast<size_t>(y) *
                static_cast<size_t>(bw) *
                4
            ];

        for (int x = 0; x < W; ++x, s += 4)
        {
            const float a =
                majeed::clampf(
                    s[3],
                    0.0f,
                    1.0f
                );

            const float r = s[0] * a;
            const float g = s[1] * a;
            const float b = s[2] * a;

            if (fmt == PF_PixelFormat_ARGB32)
            {
                PF_Pixel8* p =
                    reinterpret_cast<PF_Pixel8*>(
                        row
                    ) + x;

                p->alpha =
                    static_cast<A_u_char>(
                        a * 255.0f + 0.5f
                    );

                p->red =
                    static_cast<A_u_char>(
                        majeed::clampf(
                            r,
                            0.0f,
                            1.0f
                        ) *
                        255.0f +
                        0.5f
                    );

                p->green =
                    static_cast<A_u_char>(
                        majeed::clampf(
                            g,
                            0.0f,
                            1.0f
                        ) *
                        255.0f +
                        0.5f
                    );

                p->blue =
                    static_cast<A_u_char>(
                        majeed::clampf(
                            b,
                            0.0f,
                            1.0f
                        ) *
                        255.0f +
                        0.5f
                    );
            }
            else if (fmt == PF_PixelFormat_ARGB64)
            {
                PF_Pixel16* p =
                    reinterpret_cast<PF_Pixel16*>(
                        row
                    ) + x;

                p->alpha =
                    static_cast<A_u_short>(
                        a * 32768.0f + 0.5f
                    );

                p->red =
                    static_cast<A_u_short>(
                        majeed::clampf(
                            r,
                            0.0f,
                            1.0f
                        ) *
                        32768.0f +
                        0.5f
                    );

                p->green =
                    static_cast<A_u_short>(
                        majeed::clampf(
                            g,
                            0.0f,
                            1.0f
                        ) *
                        32768.0f +
                        0.5f
                    );

                p->blue =
                    static_cast<A_u_short>(
                        majeed::clampf(
                            b,
                            0.0f,
                            1.0f
                        ) *
                        32768.0f +
                        0.5f
                    );
            }
            else
            {
                PF_PixelFloat* p =
                    reinterpret_cast<PF_PixelFloat*>(
                        row
                    ) + x;

                p->alpha = a;
                p->red = r;
                p->green = g;
                p->blue = b;
            }
        }
    }
}

// ============================================================================
// Smart render
// ============================================================================

inline PF_Err SmartRender(
    PF_InData* in_data,
    PF_OutData* out,
    PF_SmartRenderExtra* extra,
    const EffectDef& d)
{
    PF_Err err = PF_Err_NONE;
    PF_Err err2 = PF_Err_NONE;

    PF_EffectWorld* inW = nullptr;
    PF_EffectWorld* outW = nullptr;

    ERR(
        extra->cb->checkout_layer_pixels(
            in_data->effect_ref,
            0,
            &inW
        )
    );

    ERR(
        extra->cb->checkout_output(
            in_data->effect_ref,
            &outW
        )
    );

    if (err || !inW || !outW)
    {
        return err
            ? err
            : PF_Err_INTERNAL_STRUCT_DAMAGED;
    }

    // ------------------------------------------------------------------------
    // Read parameters
    // ------------------------------------------------------------------------

    Vals v;

    std::memset(
        &v,
        0,
        sizeof(v)
    );

    for (int i = 0; i < d.nspecs && !err; ++i)
    {
        const PSpec& s =
            d.specs[i];

        if (s.t == T_GROUP ||
            s.t == T_GROUP_END)
        {
            continue;
        }

        PF_ParamDef pd;
        AEFX_CLR_STRUCT(pd);

        const int param_id =
            i +
            1 +
            (d.customUI ? 1 : 0);

        ERR(
            PF_CHECKOUT_PARAM(
                in_data,
                param_id,
                in_data->current_time,
                in_data->time_step,
                in_data->time_scale,
                &pd
            )
        );

        if (err)
        {
            break;
        }

        switch (s.t)
        {
            case T_FLOAT:
                v.f[i] =
                    pd.u.fs_d.value;
                break;

            case T_CHECK:
                v.f[i] =
                    pd.u.bd.value
                    ? 1.0
                    : 0.0;
                break;

            case T_POPUP:
                v.f[i] =
                    static_cast<double>(
                        pd.u.pd.value - 1
                    );
                break;

            case T_COLOR:
                v.c[i][0] =
                    pd.u.cd.value.red /
                    255.0f;

                v.c[i][1] =
                    pd.u.cd.value.green /
                    255.0f;

                v.c[i][2] =
                    pd.u.cd.value.blue /
                    255.0f;
                break;

            case T_ANGLE:
                v.f[i] =
                    static_cast<double>(
                        pd.u.ad.value
                    ) /
                    65536.0;
                break;

            default:
                break;
        }

        ERR2(
            PF_CHECKIN_PARAM(
                in_data,
                &pd
            )
        );
    }

    if (err)
    {
        return err;
    }

    // ------------------------------------------------------------------------
    // Pixel format
    // ------------------------------------------------------------------------

    PF_PixelFormat fmt =
        PF_PixelFormat_INVALID;

    AEFX_SuiteScoper<PF_WorldSuite2> ws(
        in_data,
        kPFWorldSuite,
        kPFWorldSuiteVersion2,
        out
    );

    ERR(
        ws->PF_GetPixelFormat(
            inW,
            &fmt
        )
    );

    if (err)
    {
        return err;
    }

    // ------------------------------------------------------------------------
    // Frame context
    // ------------------------------------------------------------------------

    majeed::FrameCtx ctx;

    ctx.timeSec =
        in_data->time_scale
        ? static_cast<double>(
              in_data->current_time
          ) /
          static_cast<double>(
              in_data->time_scale
          )
        : 0.0;

    ctx.fps =
        in_data->time_step > 0
        ? static_cast<double>(
              in_data->time_scale
          ) /
          static_cast<double>(
              in_data->time_step
          )
        : 24.0;

    const double sx =
        in_data->downsample_x.num
        ? static_cast<double>(
              in_data->downsample_x.den
          ) /
          static_cast<double>(
              in_data->downsample_x.num
          )
        : 1.0;

    const double sy =
        in_data->downsample_y.num
        ? static_cast<double>(
              in_data->downsample_y.den
          ) /
          static_cast<double>(
              in_data->downsample_y.num
          )
        : 1.0;

    ctx.scaleX = sx;
    ctx.scaleY = sy;

    ctx.originX = 0.0;
    ctx.originY = 0.0;

    ctx.fullW =
        static_cast<double>(
            in_data->width
        ) *
        sx;

    ctx.fullH =
        static_cast<double>(
            in_data->height
        ) *
        sy;

    if (in_data->pixel_aspect_ratio.den)
    {
        ctx.pixelAspect =
            static_cast<double>(
                in_data->pixel_aspect_ratio.num
            ) /
            static_cast<double>(
                in_data->pixel_aspect_ratio.den
            );
    }
    else
    {
        ctx.pixelAspect = 1.0;
    }

    // ------------------------------------------------------------------------
    // Native MAJEED engine
    // ------------------------------------------------------------------------

    std::vector<float> srcBuf;
    std::vector<float> dstBuf;

    load_image(
        inW,
        fmt,
        srcBuf
    );

    dstBuf.assign(
        srcBuf.size(),
        0.0f
    );

    majeed::Image src{
        static_cast<int>(inW->width),
        static_cast<int>(inW->height),
        srcBuf.data()
    };

    majeed::Image dst{
        static_cast<int>(outW->width),
        static_cast<int>(outW->height),
        dstBuf.data()
    };

    d.render(
        src,
        dst,
        v,
        ctx
    );

    store_image(
        dstBuf,
        dst.w,
        dst.h,
        outW,
        fmt
    );

    ERR2(
        extra->cb->checkin_layer_pixels(
            in_data->effect_ref,
            0
        )
    );

    return err;
}

// ============================================================================
// Main dispatch
// ============================================================================

inline PF_Err Dispatch(
    PF_Cmd cmd,
    PF_InData* in,
    PF_OutData* out,
    void* extra,
    const EffectDef& d)
{
    PF_Err err = PF_Err_NONE;

    switch (cmd)
    {
        case PF_Cmd_ABOUT:
        {
            PF_SPRINTF(
                out->return_msg,
                "%s\rMAJEED native engine.\r%s",
                d.name,
                d.about
            );
            break;
        }

        case PF_Cmd_GLOBAL_SETUP:
        {
            err =
                GlobalSetup(
                    in,
                    out,
                    d
                );
            break;
        }

        case PF_Cmd_PARAMS_SETUP:
        {
            err =
                ParamsSetup(
                    in,
                    out,
                    d
                );
            break;
        }

        case PF_Cmd_EVENT:
        {
            if (d.event)
            {
                err =
                    d.event(
                        in,
                        out,
                        static_cast<PF_EventExtra*>(extra)
                    );
            }
            break;
        }

        case PF_Cmd_SMART_PRE_RENDER:
        {
            err =
                PreRender(
                    in,
                    out,
                    static_cast<PF_PreRenderExtra*>(extra)
                );
            break;
        }

        case PF_Cmd_SMART_RENDER:
        {
            err =
                SmartRender(
                    in,
                    out,
                    static_cast<PF_SmartRenderExtra*>(extra),
                    d
                );
            break;
        }

        default:
            break;
    }

    return err;
}

} // namespace mj

// ============================================================================
// Export helper
// ============================================================================

#define MJ_EXPORT_EFFECT(FUNC, DEF)                                      \
    extern "C" DllExport PF_Err FUNC(                                  \
        PF_Cmd cmd,                                                     \
        PF_InData* in_data,                                             \
        PF_OutData* out_data,                                           \
        PF_ParamDef* params[],                                          \
        PF_LayerDef* output,                                             \
        void* extra)                                                     \
    {                                                                    \
        (void)params;                                                    \
        (void)output;                                                    \
                                                                         \
        try                                                              \
        {                                                                \
            return mj::Dispatch(                                        \
                cmd,                                                      \
                in_data,                                                  \
                out_data,                                                 \
                extra,                                                    \
                DEF                                                        \
            );                                                            \
        }                                                                \
        catch (PF_Err e)                                                  \
        {                                                                \
            return e;                                                     \
        }                                                                \
        catch (...)                                                       \
        {                                                                \
            return PF_Err_INTERNAL_STRUCT_DAMAGED;                       \
        }                                                                \
    }
