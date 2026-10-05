// ============================================================================
// YMDithers - Adobe After Effects Effect Plugin (Unified Edition)
// Focused exclusively on:
//   1. DITHER: 49 algorithms, True Dot Density Coverage, White/Black Amounts,
//      continuous halftone screens, sub-pixel accuracy, zero ugly blocks.
//   2. LINES: Strict Contour Following & Procedural Strands with [ ] Object checkbox,
//      [ ] Hand Made Lines with Curve control, and [ ] Duplicate Lines.
// ============================================================================
#include "MajeedGlue.h"
#include "DitherAlgoList.h"
#include "MajeedLogo.h"
#include "adobesdk/DrawbotSuite.h"

using namespace majeed;

#define YMDITHERS_LIST(F,K,P,C,A,G,E) \
 G(DM_G_DITHER,"Dither") \
 P(DM_ALGO,"Algorithm",MJ_DITHER_ALGO_POPUP,MJ_DITHER_ALGO_COUNT,17) \
 P(DM_MODE,"Color Mode","Preserve Original Colors|Monochrome (B&W)",2,2) \
 F(DM_DITHER,"Amount (Dot Density)",0,100,0,100,100,1) \
 F(DM_WHITE_AMT,"White Amount (%)",0,100,0,100,100,1) \
 F(DM_BLACK_AMT,"Black Amount (%)",0,100,0,100,100,1) \
 F(DM_TONES,"Levels (Tones)",2,64,2,32,2,0) \
 F(DM_SIZE,"Scale (Pixel Size)",1,32,1,16,1,0) \
 F(DM_THRESH,"Threshold (Density Bias)",0,100,0,100,50,1) \
 F(DM_SPREAD,"Strength (Spread)",0,200,0,200,100,1) \
 F(DM_PATSCALE,"Pattern Scale (%)",25,400,25,250,100,1) \
 A(DM_PATANGLE,"Pattern Angle",0) \
 F(DM_CONTRAST,"Contrast",0,300,0,200,100,1) \
 F(DM_BRIGHT,"Brightness",-100,100,-100,100,0,1) \
 F(DM_NOISE,"Randomness (Jitter)",0,100,0,100,0,1) \
 K(DM_SERP,"Serpentine Scan",1) \
 K(DM_LINEAR,"Linear Gamma Dither",0) \
 K(DM_PIXELATE,"Pixelate Output to Scale",0) \
 K(DM_ANIM,"Animate Dither Noise",0) \
 F(DM_SEED,"Dither Seed",0,10000,0,10000,0,0) \
 E(DM_E_DITHER) \
 G(DM_G_LINES,"Lines") \
 K(DM_LN_ON,"Enable Lines",1) \
 F(DM_LN_AMT,"Lines Amount",0,10000,0,3000,600,0) \
 F(DM_LN_LEN,"Line Length (px)",2,500,5,200,50,1) \
 F(DM_LN_LEN_RND,"Length Randomness (%)",0,100,0,100,40,1) \
 F(DM_LN_THK,"Line Thickness (px)",0.1,15,0.2,5,1.0,2) \
 F(DM_LN_THK_RND,"Thickness Randomness (%)",0,100,0,100,30,1) \
 A(DM_LN_ANG,"Direction Angle",0) \
 F(DM_LN_ANG_RND,"Direction Randomness (%)",0,180,0,180,180,1) \
 C(DM_LN_COL,"Line Color",1,1,1) \
 P(DM_LN_COL_MODE,"Color Mode","Single Color|Sampled from Image|Random Palette",3,1) \
 F(DM_LN_OPAC,"Lines Opacity (%)",0,100,0,100,90,1) \
 G(DM_G_LN_OBJ,"Object & Edges") \
 K(DM_LN_OBJ,"Object",1) \
 F(DM_LN_EDGE_TH,"Edge Threshold",1,100,5,80,25,1) \
 F(DM_LN_EDGE_SENS,"Edge Sensitivity",1,100,10,100,75,1) \
 P(DM_LN_EDGE_DIR,"Edge Direction","Along Contours|Perpendicular|Random Angle|Custom Angle",4,1) \
 F(DM_LN_EDGE_OFFSET,"Edge Offset (px)",-20,20,-10,10,0.0,2) \
 E(DM_E_LN_OBJ) \
 G(DM_G_LN_HAND,"Hand Made Lines") \
 K(DM_LN_HANDMADE,"Hand Made Lines",1) \
 F(DM_LN_CURVE,"Curve",0,100,0,100,30,1) \
 E(DM_E_LN_HAND) \
 G(DM_G_LN_DUP,"Duplicate Lines") \
 K(DM_LN_DUP,"Duplicate Lines",0) \
 F(DM_LN_DUP_COUNT,"Duplicate Count",1,4,1,3,1,0) \
 F(DM_LN_DUP_OFFSET,"Duplicate Offset (px)",0.5,30,1,15,2.5,1) \
 F(DM_LN_DUP_LEN,"Duplicate Length (%)",10,200,20,150,90,1) \
 F(DM_LN_DUP_THK,"Duplicate Width (px)",0.1,10,0.2,4,0.8,2) \
 F(DM_LN_DUP_OPAC,"Duplicate Opacity (%)",0,100,0,100,75,1) \
 E(DM_E_LN_DUP) \
 G(DM_G_LN_ANIM,"Lines Animation") \
 K(DM_LN_AUTO_ANIM,"Auto Animate",1) \
 F(DM_LN_SPD,"Animation Speed (%)",0,500,0,300,100,1) \
 F(DM_LN_MOT_RND,"Motion Randomness (%)",0,100,0,100,50,1) \
 F(DM_LN_SEED,"Random Seed",0,100000,0,10000,1,0) \
 E(DM_E_LN_ANIM) \
 E(DM_E_LINES)

MJ_DEFINE_PARAMS(YMDITHERS_LIST, DITHERING_MAJEED)

namespace {

static void copy_image(const Image& src, const Image& dst) {
    if (!src.px || !dst.px || src.w != dst.w || src.h != dst.h) return;
    std::memcpy(dst.px, src.px, (size_t)src.w * src.h * 4 * sizeof(float));
}

static void unified_render(const Image& src, Image& dst, const mj::Vals& v, const FrameCtx& c) {
    const int W = src.w, H = src.h;
    if (W <= 0 || H <= 0) return;

    // Intermediate scratch buffers
    std::vector<float> bufA((size_t)W * H * 4);
    std::vector<float> bufB((size_t)W * H * 4);
    Image A = { W, H, bufA.data() };
    Image FX = { W, H, bufB.data() };

    copy_image(src, A);

    // 1. DITHER STAGE
    DitherParams dp;
    dp.algo = std::max(0, std::min(MJ_DITHER_ALGO_COUNT - 1, v.pop(DM_ALGO)));
    dp.mode = v.pop(DM_MODE);
    dp.amount = v[DM_DITHER];
    dp.whiteAmount = v[DM_WHITE_AMT];
    dp.blackAmount = v[DM_BLACK_AMT];
    dp.levels = (int)v[DM_TONES];
    dp.size = v[DM_SIZE];
    dp.threshold = v[DM_THRESH];
    dp.strength = v[DM_SPREAD];
    dp.patternScale = v[DM_PATSCALE];
    dp.patternAngle = v[DM_PATANGLE];
    dp.contrast = v[DM_CONTRAST];
    dp.brightness = v[DM_BRIGHT];
    dp.noise = v[DM_NOISE];
    dp.serpentine = v.on(DM_SERP);
    dp.linear = v.on(DM_LINEAR);
    dp.pixelate = v.on(DM_PIXELATE);
    dp.animate = v.on(DM_ANIM);
    dp.seed = (int)v[DM_SEED];
    dp.dark = { 0.f, 0.f, 0.f };
    dp.light = { 1.f, 1.f, 1.f };

    render_dither(A, FX, dp, c);
    copy_image(FX, A);

    // 2. LINES STAGE
    if (v.on(DM_LN_ON)) {
        LinesParams lp;
        lp.enabled = true;
        lp.amount = v[DM_LN_AMT];
        lp.length = v[DM_LN_LEN];
        lp.lengthRand = v[DM_LN_LEN_RND];
        lp.width = v[DM_LN_THK];
        lp.widthRand = v[DM_LN_THK_RND];
        lp.angle = v[DM_LN_ANG];
        lp.angleRand = v[DM_LN_ANG_RND];
        lp.color = v.col(DM_LN_COL);
        lp.colorMode = v.pop(DM_LN_COL_MODE);
        lp.opacity = v[DM_LN_OPAC];

        // Object & Edges
        lp.objectMode = v.on(DM_LN_OBJ);
        lp.edgeThreshold = v[DM_LN_EDGE_TH];
        lp.edgeSensitivity = v[DM_LN_EDGE_SENS];
        lp.edgeDirection = v.pop(DM_LN_EDGE_DIR);
        lp.edgeOffset = v[DM_LN_EDGE_OFFSET];

        // Hand Made Lines
        lp.handMade = v.on(DM_LN_HANDMADE);
        lp.curve = v[DM_LN_CURVE];

        // Duplicate Lines
        lp.duplicate = v.on(DM_LN_DUP);
        lp.duplicateCount = (int)v[DM_LN_DUP_COUNT];
        lp.duplicateOffset = v[DM_LN_DUP_OFFSET];
        lp.duplicateLength = v[DM_LN_DUP_LEN];
        lp.duplicateWidth = v[DM_LN_DUP_THK];
        lp.duplicateOpacity = v[DM_LN_DUP_OPAC];

        // Animation
        lp.autoAnim = v.on(DM_LN_AUTO_ANIM);
        lp.motionSpeed = v[DM_LN_SPD];
        lp.motionRand = v[DM_LN_MOT_RND];
        lp.seed = (int)v[DM_LN_SEED];

        render_lines(A, FX, lp, c);
        copy_image(FX, A);
    }

    copy_image(A, dst);
}

// ------------------------------------------------------------------ custom logo UI
static PF_Err DrawLogo(PF_InData* in_data, PF_OutData* out_data, PF_EventExtra* extra) {
    if (!in_data || !extra || !extra->contextH || !*extra->contextH) return PF_Err_NONE;
    if ((*extra->contextH)->w_type != PF_Window_EFFECT) return PF_Err_NONE;
    if (extra->effect_win.area != PF_EA_CONTROL) {
        return PF_Err_NONE;
    }

    DRAWBOT_DrawRef drawing_ref = nullptr;
    DRAWBOT_SurfaceRef surface_ref = nullptr;
    DRAWBOT_SupplierRef supplier_ref = nullptr;
    DRAWBOT_ImageRef image_ref = nullptr;
    DRAWBOT_Suites suites;
    if (AEFX_AcquireDrawbotSuites(in_data, out_data, &suites) != PF_Err_NONE) {
        return PF_Err_NONE;
    }

    PF_EffectCustomUISuite1* ui = nullptr;
    if (AEFX_AcquireSuite(in_data, nullptr, kPFEffectCustomUISuite, kPFEffectCustomUISuiteVersion1, nullptr, (void**)&ui) == PF_Err_NONE && ui) {
        (*ui->PF_GetDrawingReference)(extra->contextH, &drawing_ref);
        AEFX_ReleaseSuite(in_data, nullptr, kPFEffectCustomUISuite, kPFEffectCustomUISuiteVersion1, nullptr);
    }

    if (drawing_ref && suites.drawbot_suiteP) {
        suites.drawbot_suiteP->GetSupplier(drawing_ref, &supplier_ref);
        suites.drawbot_suiteP->GetSurface(drawing_ref, &surface_ref);
    }

    if (supplier_ref && surface_ref && suites.supplier_suiteP && suites.surface_suiteP) {
        DRAWBOT_Boolean prefers_bgra = 0;
        DRAWBOT_Boolean supports_argb = 0;
        if (suites.supplier_suiteP->PrefersPixelLayoutBGRA) {
            suites.supplier_suiteP->PrefersPixelLayoutBGRA(supplier_ref, &prefers_bgra);
        }
        if (suites.supplier_suiteP->SupportsPixelLayoutARGB) {
            suites.supplier_suiteP->SupportsPixelLayoutARGB(supplier_ref, &supports_argb);
        }

        if (prefers_bgra || !supports_argb) {
            std::vector<unsigned char> bgra((size_t)MAJEED_LOGO_W * MAJEED_LOGO_H * 4);
            for (size_t i = 0; i < (size_t)MAJEED_LOGO_W * MAJEED_LOGO_H; ++i) {
                const unsigned char a = MAJEED_LOGO_ARGB[i * 4 + 0];
                const unsigned char r = MAJEED_LOGO_ARGB[i * 4 + 1];
                const unsigned char g = MAJEED_LOGO_ARGB[i * 4 + 2];
                const unsigned char b = MAJEED_LOGO_ARGB[i * 4 + 3];
                bgra[i * 4 + 0] = b;
                bgra[i * 4 + 1] = g;
                bgra[i * 4 + 2] = r;
                bgra[i * 4 + 3] = a;
            }
            suites.supplier_suiteP->NewImageFromBuffer(
                supplier_ref,
                MAJEED_LOGO_W,
                MAJEED_LOGO_H,
                MAJEED_LOGO_W * 4,
                kDRAWBOT_PixelLayout_32BGRA_Straight,
                bgra.data(),
                &image_ref);
        } else {
            suites.supplier_suiteP->NewImageFromBuffer(
                supplier_ref,
                MAJEED_LOGO_W,
                MAJEED_LOGO_H,
                MAJEED_LOGO_W * 4,
                kDRAWBOT_PixelLayout_32ARGB_Straight,
                MAJEED_LOGO_ARGB,
                &image_ref);
        }

        if (image_ref) {
            DRAWBOT_PointF32 origin;
            origin.x = extra->effect_win.current_frame.left + 6.0f;
            origin.y = extra->effect_win.current_frame.top + 4.0f;
            suites.surface_suiteP->DrawImage(surface_ref, image_ref, &origin, 1.0f);
            suites.supplier_suiteP->ReleaseObject((DRAWBOT_ObjectRef)image_ref);
        }
    }

    AEFX_ReleaseDrawbotSuites(in_data, out_data);
    extra->evt_out_flags = PF_EO_HANDLED_EVENT;
    return PF_Err_NONE;
}

static PF_Err DitherEvent(PF_InData* in_data, PF_OutData* out_data, PF_EventExtra* extra) {
    if (extra && extra->e_type == PF_Event_DRAW) return DrawLogo(in_data, out_data, extra);
    return PF_Err_NONE;
}

} // namespace

static const mj::EffectDef DITHERING_MAJEED_DEF = {
    "YMDithers", DITHERING_MAJEED_specs, DITHERING_MAJEED_COUNT, unified_render,
    "YMDithers native dither and procedural contour lines.",
    DitherEvent, true
};

MJ_EXPORT_EFFECT(EffectMain, DITHERING_MAJEED_DEF)
MJ_EXPORT_EFFECT(EffectMainDitheringMAJEED, DITHERING_MAJEED_DEF)

extern "C" DllExport PF_Err PluginDataEntryFunction2(
    PF_PluginDataPtr inPtr,
    PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr,
    const char* inHostName,
    const char* inHostVersion)
{
    (void)inSPBasicSuitePtr;
    (void)inHostName;
    (void)inHostVersion;
    PF_Err result = PF_Err_INVALID_CALLBACK;
    if (inPluginDataCallBackPtr) {
        result = PF_REGISTER_EFFECT_EXT2(
            inPtr,
            inPluginDataCallBackPtr,
            "YMDithers",
            "YMDithers",
            "YMDithers",
            AE_RESERVED_INFO,
            "EffectMain",
            "https://example.invalid/ymdithers");
    }
    return result;
}
