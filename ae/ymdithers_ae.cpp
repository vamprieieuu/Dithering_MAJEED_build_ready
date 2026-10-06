#include "AEConfig.h"
#include "AE_Effect.h"
#include "AE_EffectSuites.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "entry.h"
#include "majeed_core.h"

#include <cstring>
#include <cstdio>
#include <cmath>
#include <vector>
#include <algorithm>

#define MAJOR_VERSION   1
#define MINOR_VERSION   0
#define BUG_VERSION     0
#define STAGE_VERSION   PF_Stage_RELEASE
#define BUILD_VERSION   1

enum {
    ID_DITHER_GROUP_START = 1,
    ID_DITHER_ENABLE,
    ID_DITHER_ALGORITHM,
    ID_DITHER_COLOR_MODE,
    ID_DITHER_COLOR_BLEND,
    ID_DITHER_AMOUNT,
    ID_DITHER_STRENGTH,
    ID_DITHER_SCALE,
    ID_DITHER_WHITE_AMOUNT,
    ID_DITHER_BLACK_AMOUNT,
    ID_DITHER_LEVELS,
    ID_DITHER_THRESHOLD,
    ID_DITHER_PATTERN_SCALE,
    ID_DITHER_PATTERN_ANGLE,
    ID_DITHER_CONTRAST,
    ID_DITHER_BRIGHTNESS,
    ID_DITHER_RANDOMNESS,
    ID_DITHER_SERPENTINE,
    ID_DITHER_LINEAR_GAMMA,
    ID_DITHER_PIXELATE,
    ID_DITHER_ANIMATE_NOISE,
    ID_DITHER_SEED,
    ID_DITHER_GROUP_END,

    ID_LINES_GROUP_START,
    ID_LINES_ENABLE,
    ID_LINES_AMOUNT,
    ID_LINES_LENGTH,
    ID_LINES_LENGTH_RAND,
    ID_LINES_THICKNESS,
    ID_LINES_THICKNESS_RAND,
    ID_LINES_DIRECTION_ANGLE,
    ID_LINES_DIRECTION_RAND,
    ID_LINES_COLOR,
    ID_LINES_COLOR_MODE,
    ID_LINES_OPACITY,

    ID_OBJECT_GROUP_START,
    ID_OBJECT_ENABLE,
    ID_OBJECT_THRESHOLD,
    ID_OBJECT_SENSITIVITY,
    ID_OBJECT_DIRECTION,
    ID_OBJECT_OFFSET,
    ID_OBJECT_GROUP_END,

    ID_HANDMADE_GROUP_START,
    ID_HANDMADE_ENABLE,
    ID_HANDMADE_CURVE,
    ID_HANDMADE_GROUP_END,

    ID_DUPLICATE_GROUP_START,
    ID_DUPLICATE_ENABLE,
    ID_DUPLICATE_COUNT,
    ID_DUPLICATE_OFFSET,
    ID_DUPLICATE_LENGTH,
    ID_DUPLICATE_WIDTH,
    ID_DUPLICATE_OPACITY,
    ID_DUPLICATE_GROUP_END,

    ID_ANIM_GROUP_START,
    ID_ANIM_AUTO,
    ID_ANIM_SPEED,
    ID_ANIM_RANDOMNESS,
    ID_ANIM_SEED,
    ID_ANIM_GROUP_END,
    ID_LINES_GROUP_END,

    NUM_PARAMS = ID_LINES_GROUP_END
};

static const char* ALGO_CHOICES =
    "Floyd-Steinberg|Floyd-Steinberg Serpentine|Jarvis-Judice-Ninke|Stucki|Atkinson|Burkes|Sierra|Sierra Two Row|Sierra Lite|Fan|Shiau-Fan|Skip Neighbours|Skip1 Neighbours|Skip2 Neighbours|Xerox Grain|"
    "Bayer 2x2|Bayer 4x4|Bayer 8x8|Bayer 16x16|Blue Noise|Interleaved Gradient Noise|White Noise|"
    "Halftone|Halftone 22.5|Halftone 45|Matrix|Square Halftone|Mosaic Halftone|Rekt Block|Row Modulation|Medium Modulation|Heavy Modulation|Column Modulation|Tilt|Bitslash|Variable Hatch|Grid|Cyber|Cross Square|Diamond|Star|Bytewav|Z-Modulation|Circuit|Vertical Stitch|Horizontal Stitch|Clock|Bi-thread|Knit";

static const char* COLOR_MODE_CHOICES =
    "Preserve Original Colors|Monochrome (B&W)|Strong Green|Volcanic / Lava|Strong Red|Game Boy Classic|Cyberpunk Neon|Amber CRT";

static const char* LINES_COLOR_CHOICES =
    "Single Color|Sampled from Image|Random Palette";

static const char* EDGE_DIR_CHOICES =
    "Along Contours|Perpendicular|Random Angle|Custom Angle";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Parameters Setup
// ---------------------------------------------------------------------------
static PF_Err ParamsSetup(PF_InData *in_data, PF_OutData *out_data, PF_ParamDef *params[], PF_LayerDef *output) {
    PF_Err err = PF_Err_NONE;
    PF_ParamDef def;

    auto addGroupStart = [&](const char* name, int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_GROUP_START;
        PF_STRCPY(def.name, name);
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

    auto addGroupEnd = [&](int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_GROUP_END;
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

    auto addCheckbox = [&](const char* name, bool dflt, int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_CHECKBOX;
        PF_STRCPY(def.name, name);
        def.u.bd.value = dflt;
        def.u.bd.dephault = dflt;
        def.u.bd.u.nameptr = name;
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

    auto addFloatSlider = [&](const char* name, double vMin, double vMax, double sMin, double sMax, double dflt, short prec, int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_FLOAT_SLIDER;
        PF_STRCPY(def.name, name);
        def.u.fs_d.valid_min = vMin;
        def.u.fs_d.valid_max = vMax;
        def.u.fs_d.slider_min = sMin;
        def.u.fs_d.slider_max = sMax;
        def.u.fs_d.value = dflt;
        def.u.fs_d.dephault = (PF_FpShort)dflt;
        def.u.fs_d.precision = prec;
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

    auto addPopup = [&](const char* name, int numChoices, int dflt, const char* choices, int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_POPUP;
        PF_STRCPY(def.name, name);
        def.u.pd.num_choices = numChoices;
        def.u.pd.value = dflt;
        def.u.pd.dephault = dflt;
        def.u.pd.u.namesptr = choices;
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

    auto addAngle = [&](const char* name, double dfltDeg, int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_ANGLE;
        PF_STRCPY(def.name, name);
        def.u.ad.value = (PF_Fixed)(dfltDeg * 65536.0);
        def.u.ad.dephault = (PF_Fixed)(dfltDeg * 65536.0);
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

    auto addColor = [&](const char* name, uint8_t r, uint8_t g, uint8_t b, int id) -> PF_Err {
        AEFX_CLR_STRUCT(def);
        def.param_type = PF_Param_COLOR;
        PF_STRCPY(def.name, name);
        def.u.cd.value.red   = r;
        def.u.cd.value.green = g;
        def.u.cd.value.blue  = b;
        def.u.cd.value.alpha = 255;
        def.u.cd.dephault    = def.u.cd.value;
        def.uu.id = id;
        return PF_ADD_PARAM(in_data, -1, &def);
    };

#define ADD_P(expr) do { err = (expr); if (err != PF_Err_NONE) return err; } while(0)

    // Dither Group
    ADD_P(addGroupStart("Dither", ID_DITHER_GROUP_START));
    ADD_P(addCheckbox("Dither ON/OFF", true, ID_DITHER_ENABLE));
    ADD_P(addPopup("Algorithm", 49, 17, ALGO_CHOICES, ID_DITHER_ALGORITHM)); // Bayer 4x4 default
    ADD_P(addPopup("Dither Palette", 8, 2, COLOR_MODE_CHOICES, ID_DITHER_COLOR_MODE)); // Monochrome default
    ADD_P(addCheckbox("Dither Color Blend", false, ID_DITHER_COLOR_BLEND));
    ADD_P(addFloatSlider("Dither Amount (%)", 0.0, 100.0, 0.0, 100.0, 100.0, 1, ID_DITHER_AMOUNT));
    ADD_P(addFloatSlider("Dither Strength", -20.0, 20.0, -20.0, 20.0, 0.0, 1, ID_DITHER_STRENGTH));
    ADD_P(addFloatSlider("Scale Dither (px)", 1.0, 16.0, 1.0, 16.0, 1.0, 0, ID_DITHER_SCALE));
    ADD_P(addFloatSlider("White Amount (%)", 0.0, 100.0, 0.0, 100.0, 100.0, 1, ID_DITHER_WHITE_AMOUNT));
    ADD_P(addFloatSlider("Black Amount (%)", 0.0, 100.0, 0.0, 100.0, 100.0, 1, ID_DITHER_BLACK_AMOUNT));
    ADD_P(addFloatSlider("Levels (Tones)", 2.0, 64.0, 2.0, 32.0, 2.0, 0, ID_DITHER_LEVELS));
    ADD_P(addFloatSlider("Threshold (Density Bias)", 0.0, 100.0, 0.0, 100.0, 50.0, 1, ID_DITHER_THRESHOLD));
    ADD_P(addFloatSlider("Pattern Scale (%)", 25.0, 400.0, 25.0, 250.0, 100.0, 1, ID_DITHER_PATTERN_SCALE));
    ADD_P(addAngle("Pattern Angle", 0.0, ID_DITHER_PATTERN_ANGLE));
    ADD_P(addFloatSlider("Contrast", 0.0, 300.0, 0.0, 200.0, 100.0, 1, ID_DITHER_CONTRAST));
    ADD_P(addFloatSlider("Brightness", -100.0, 100.0, -100.0, 100.0, 0.0, 1, ID_DITHER_BRIGHTNESS));
    ADD_P(addFloatSlider("Randomness (Jitter)", 0.0, 100.0, 0.0, 100.0, 0.0, 1, ID_DITHER_RANDOMNESS));
    ADD_P(addCheckbox("Serpentine Scan", true, ID_DITHER_SERPENTINE));
    ADD_P(addCheckbox("Linear Gamma Dither", false, ID_DITHER_LINEAR_GAMMA));
    ADD_P(addCheckbox("Pixelate Output to Scale", false, ID_DITHER_PIXELATE));
    ADD_P(addCheckbox("Animate Dither Noise", false, ID_DITHER_ANIMATE_NOISE));
    ADD_P(addFloatSlider("Dither Seed", 0.0, 10000.0, 0.0, 10000.0, 0.0, 0, ID_DITHER_SEED));
    ADD_P(addGroupEnd(ID_DITHER_GROUP_END));

    // Lines Group
    ADD_P(addGroupStart("Lines", ID_LINES_GROUP_START));
    // Requirement 6: LINES = OFF BY DEFAULT!
    ADD_P(addCheckbox("Enable Lines", false, ID_LINES_ENABLE));
    ADD_P(addFloatSlider("Lines Amount", 0.0, 10000.0, 0.0, 3000.0, 600.0, 0, ID_LINES_AMOUNT));
    ADD_P(addFloatSlider("Line Length (px)", 2.0, 500.0, 5.0, 200.0, 50.0, 1, ID_LINES_LENGTH));
    ADD_P(addFloatSlider("Length Randomness (%)", 0.0, 100.0, 0.0, 100.0, 40.0, 1, ID_LINES_LENGTH_RAND));
    ADD_P(addFloatSlider("Line Thickness (px)", 0.1, 15.0, 0.2, 5.0, 1.0, 2, ID_LINES_THICKNESS));
    ADD_P(addFloatSlider("Thickness Randomness (%)", 0.0, 100.0, 0.0, 100.0, 30.0, 1, ID_LINES_THICKNESS_RAND));
    ADD_P(addAngle("Direction Angle", 0.0, ID_LINES_DIRECTION_ANGLE));
    ADD_P(addFloatSlider("Direction Randomness (%)", 0.0, 180.0, 0.0, 180.0, 180.0, 1, ID_LINES_DIRECTION_RAND));
    ADD_P(addColor("Line Color", 255, 255, 255, ID_LINES_COLOR));
    ADD_P(addPopup("Color Mode", 3, 1, LINES_COLOR_CHOICES, ID_LINES_COLOR_MODE));
    ADD_P(addFloatSlider("Lines Opacity (%)", 0.0, 100.0, 0.0, 100.0, 90.0, 1, ID_LINES_OPACITY));

    // Object & Edges Group
    ADD_P(addGroupStart("Object & Edges", ID_OBJECT_GROUP_START));
    // Requirement 6: OBJECT = OFF BY DEFAULT!
    ADD_P(addCheckbox("Object", false, ID_OBJECT_ENABLE));
    ADD_P(addFloatSlider("Edge Threshold", 1.0, 100.0, 5.0, 80.0, 25.0, 1, ID_OBJECT_THRESHOLD));
    ADD_P(addFloatSlider("Edge Sensitivity", 1.0, 100.0, 10.0, 100.0, 75.0, 1, ID_OBJECT_SENSITIVITY));
    ADD_P(addPopup("Edge Direction", 4, 1, EDGE_DIR_CHOICES, ID_OBJECT_DIRECTION));
    ADD_P(addFloatSlider("Edge Offset (px)", -20.0, 20.0, -10.0, 10.0, 0.0, 2, ID_OBJECT_OFFSET));
    ADD_P(addGroupEnd(ID_OBJECT_GROUP_END));

    // Hand Made Lines Group
    ADD_P(addGroupStart("Hand Made Lines", ID_HANDMADE_GROUP_START));
    ADD_P(addCheckbox("Hand Made Lines", true, ID_HANDMADE_ENABLE));
    ADD_P(addFloatSlider("Curve", 0.0, 100.0, 0.0, 100.0, 30.0, 1, ID_HANDMADE_CURVE));
    ADD_P(addGroupEnd(ID_HANDMADE_GROUP_END));

    // Duplicate Lines Group
    ADD_P(addGroupStart("Duplicate Lines", ID_DUPLICATE_GROUP_START));
    ADD_P(addCheckbox("Duplicate Lines", false, ID_DUPLICATE_ENABLE));
    ADD_P(addFloatSlider("Duplicate Count", 1.0, 4.0, 1.0, 3.0, 1.0, 0, ID_DUPLICATE_COUNT));
    ADD_P(addFloatSlider("Duplicate Offset (px)", 0.5, 30.0, 1.0, 15.0, 2.5, 1, ID_DUPLICATE_OFFSET));
    ADD_P(addFloatSlider("Duplicate Length (%)", 10.0, 200.0, 20.0, 150.0, 90.0, 1, ID_DUPLICATE_LENGTH));
    ADD_P(addFloatSlider("Duplicate Width (px)", 0.1, 10.0, 0.2, 4.0, 0.8, 2, ID_DUPLICATE_WIDTH));
    ADD_P(addFloatSlider("Duplicate Opacity (%)", 0.0, 100.0, 0.0, 100.0, 75.0, 1, ID_DUPLICATE_OPACITY));
    ADD_P(addGroupEnd(ID_DUPLICATE_GROUP_END));

    // Lines Animation Group
    ADD_P(addGroupStart("Lines Animation", ID_ANIM_GROUP_START));
    ADD_P(addCheckbox("Auto Animate", true, ID_ANIM_AUTO));
    ADD_P(addFloatSlider("Animation Speed (%)", 0.0, 500.0, 0.0, 300.0, 100.0, 1, ID_ANIM_SPEED));
    ADD_P(addFloatSlider("Motion Randomness (%)", 0.0, 100.0, 0.0, 100.0, 50.0, 1, ID_ANIM_RANDOMNESS));
    ADD_P(addFloatSlider("Random Seed", 0.0, 100000.0, 0.0, 10000.0, 1.0, 0, ID_ANIM_SEED));
    ADD_P(addGroupEnd(ID_ANIM_GROUP_END));

    ADD_P(addGroupEnd(ID_LINES_GROUP_END));

#undef ADD_P

    // num_params MUST include the implicit main layer parameter (index 0)
    out_data->num_params = NUM_PARAMS + 1;
    return err;
}

// ---------------------------------------------------------------------------
// Smart Render Pipeline
// ---------------------------------------------------------------------------
static PF_Err SmartPreRender(PF_InData *in_data, PF_OutData *out_data, PF_PreRenderExtra *extra) {
    PF_Err err = PF_Err_NONE;
    if (!extra || !extra->input || !extra->output || !extra->cb) return PF_Err_BAD_CALLBACK_PARAM;

    PF_RenderRequest req = extra->input->output_request;
    PF_CheckoutResult result;
    if (extra->cb->checkout_layer) {
        err = extra->cb->checkout_layer(in_data->effect_ref, 0, 0, &req, in_data->current_time, in_data->time_step, in_data->time_scale, &result);
    }
    extra->output->result_rect = result.result_rect;
    extra->output->max_result_rect = result.max_result_rect;
    return err;
}

static PF_Err SmartRender(PF_InData *in_data, PF_OutData *out_data, PF_SmartRenderExtra *extra) {
    if (!in_data || !out_data || !extra || !extra->cb || !extra->input) return PF_Err_BAD_CALLBACK_PARAM;

    PF_EffectWorld *input_world = nullptr;
    PF_EffectWorld *output_world = nullptr;

    if (extra->cb->checkout_layer_pixels) {
        extra->cb->checkout_layer_pixels(in_data->effect_ref, 0, &input_world);
    }
    if (extra->cb->checkout_output) {
        extra->cb->checkout_output(in_data->effect_ref, &output_world);
    }

    if (!input_world || !output_world || !input_world->data || !output_world->data) {
        if (extra->cb->checkin_layer_pixels) {
            extra->cb->checkin_layer_pixels(in_data->effect_ref, 0);
        }
        return PF_Err_NONE;
    }

    const int W = input_world->width;
    const int H = input_world->height;
    if (W <= 0 || H <= 0) {
        if (extra->cb->checkin_layer_pixels) {
            extra->cb->checkin_layer_pixels(in_data->effect_ref, 0);
        }
        return PF_Err_NONE;
    }

    try {
        // Query parameters safely using checkout helpers
        auto getSlider = [&](int idx, double defVal) -> double {
            PF_ParamDef p;
            AEFX_CLR_STRUCT(p);
            if (PF_CHECKOUT_PARAM(in_data, idx, in_data->current_time, in_data->time_step, in_data->time_scale, &p) == PF_Err_NONE) {
                double v = p.u.fs_d.value;
                PF_CHECKIN_PARAM(in_data, &p);
                return v;
            }
            return defVal;
        };

        auto getCheckbox = [&](int idx, bool defVal) -> bool {
            PF_ParamDef p;
            AEFX_CLR_STRUCT(p);
            if (PF_CHECKOUT_PARAM(in_data, idx, in_data->current_time, in_data->time_step, in_data->time_scale, &p) == PF_Err_NONE) {
                bool v = (p.u.bd.value != 0);
                PF_CHECKIN_PARAM(in_data, &p);
                return v;
            }
            return defVal;
        };

        auto getPopup = [&](int idx, int defVal) -> int {
            PF_ParamDef p;
            AEFX_CLR_STRUCT(p);
            if (PF_CHECKOUT_PARAM(in_data, idx, in_data->current_time, in_data->time_step, in_data->time_scale, &p) == PF_Err_NONE) {
                int v = p.u.pd.value;
                PF_CHECKIN_PARAM(in_data, &p);
                return v;
            }
            return defVal;
        };

        auto getAngle = [&](int idx, double defVal) -> double {
            PF_ParamDef p;
            AEFX_CLR_STRUCT(p);
            if (PF_CHECKOUT_PARAM(in_data, idx, in_data->current_time, in_data->time_step, in_data->time_scale, &p) == PF_Err_NONE) {
                double v = (double)p.u.ad.value / 65536.0;
                PF_CHECKIN_PARAM(in_data, &p);
                return v;
            }
            return defVal;
        };

        auto getColor = [&](int idx) -> majeed::Color {
            PF_ParamDef p;
            AEFX_CLR_STRUCT(p);
            majeed::Color c = { 1.f, 1.f, 1.f };
            if (PF_CHECKOUT_PARAM(in_data, idx, in_data->current_time, in_data->time_step, in_data->time_scale, &p) == PF_Err_NONE) {
                c.r = (float)p.u.cd.value.red / 255.f;
                c.g = (float)p.u.cd.value.green / 255.f;
                c.b = (float)p.u.cd.value.blue / 255.f;
                PF_CHECKIN_PARAM(in_data, &p);
            }
            return c;
        };

        majeed::DitherParams dp;
        dp.enabled       = getCheckbox(ID_DITHER_ENABLE, true);
        dp.algorithm     = getPopup(ID_DITHER_ALGORITHM, 17);
        dp.colorMode     = getPopup(ID_DITHER_COLOR_MODE, 2);
        dp.colorBlend    = getCheckbox(ID_DITHER_COLOR_BLEND, false);
        dp.amount        = getSlider(ID_DITHER_AMOUNT, 100.0);
        dp.strength      = getSlider(ID_DITHER_STRENGTH, 0.0);
        dp.scale         = getSlider(ID_DITHER_SCALE, 1.0);
        dp.whiteAmount   = getSlider(ID_DITHER_WHITE_AMOUNT, 100.0);
        dp.blackAmount   = getSlider(ID_DITHER_BLACK_AMOUNT, 100.0);
        dp.levels        = getSlider(ID_DITHER_LEVELS, 2.0);
        dp.threshold     = getSlider(ID_DITHER_THRESHOLD, 50.0);
        dp.patternScale  = getSlider(ID_DITHER_PATTERN_SCALE, 100.0);
        dp.patternAngle  = getAngle(ID_DITHER_PATTERN_ANGLE, 0.0);
        dp.contrast      = getSlider(ID_DITHER_CONTRAST, 100.0);
        dp.brightness    = getSlider(ID_DITHER_BRIGHTNESS, 0.0);
        dp.randomness    = getSlider(ID_DITHER_RANDOMNESS, 0.0);
        dp.serpentine    = getCheckbox(ID_DITHER_SERPENTINE, true);
        dp.linearGamma   = getCheckbox(ID_DITHER_LINEAR_GAMMA, false);
        dp.pixelate      = getCheckbox(ID_DITHER_PIXELATE, false);
        dp.animateNoise  = getCheckbox(ID_DITHER_ANIMATE_NOISE, false);
        dp.seed          = getSlider(ID_DITHER_SEED, 0.0);

        majeed::LinesParams lp;
        lp.enabled          = getCheckbox(ID_LINES_ENABLE, false); // DEFAULT OFF
        lp.amount           = getSlider(ID_LINES_AMOUNT, 600.0);
        lp.length           = getSlider(ID_LINES_LENGTH, 50.0);
        lp.lengthRand       = getSlider(ID_LINES_LENGTH_RAND, 40.0);
        lp.width            = getSlider(ID_LINES_THICKNESS, 1.0);
        lp.widthRand        = getSlider(ID_LINES_THICKNESS_RAND, 30.0);
        lp.angle            = getAngle(ID_LINES_DIRECTION_ANGLE, 0.0);
        lp.angleRand        = getSlider(ID_LINES_DIRECTION_RAND, 180.0);
        lp.color            = getColor(ID_LINES_COLOR);
        lp.colorMode        = getPopup(ID_LINES_COLOR_MODE, 1) - 1;
        lp.opacity          = getSlider(ID_LINES_OPACITY, 90.0);

        lp.objectMode       = getCheckbox(ID_OBJECT_ENABLE, false); // DEFAULT OFF
        lp.edgeThreshold    = getSlider(ID_OBJECT_THRESHOLD, 25.0);
        lp.edgeSensitivity  = getSlider(ID_OBJECT_SENSITIVITY, 75.0);
        lp.edgeDirection    = getPopup(ID_OBJECT_DIRECTION, 1) - 1;
        lp.edgeOffset       = getSlider(ID_OBJECT_OFFSET, 0.0);

        lp.handMade         = getCheckbox(ID_HANDMADE_ENABLE, true);
        lp.curve            = getSlider(ID_HANDMADE_CURVE, 30.0);

        lp.duplicate        = getCheckbox(ID_DUPLICATE_ENABLE, false);
        lp.duplicateCount   = (int)getSlider(ID_DUPLICATE_COUNT, 1.0);
        lp.duplicateOffset  = getSlider(ID_DUPLICATE_OFFSET, 2.5);
        lp.duplicateLength  = getSlider(ID_DUPLICATE_LENGTH, 90.0);
        lp.duplicateWidth   = getSlider(ID_DUPLICATE_WIDTH, 0.8);
        lp.duplicateOpacity = getSlider(ID_DUPLICATE_OPACITY, 75.0);

        lp.autoAnim         = getCheckbox(ID_ANIM_AUTO, true);
        lp.motionSpeed      = getSlider(ID_ANIM_SPEED, 100.0);
        lp.motionRand       = getSlider(ID_ANIM_RANDOMNESS, 50.0);
        lp.seed             = (int)getSlider(ID_ANIM_SEED, 1.0);

        // Convert input world to normalized RGBA float buffer
        std::vector<float> srcBuf((size_t)W * H * 4);
        std::vector<float> dstBuf((size_t)W * H * 4);

        short bitdepth = extra->input ? extra->input->bitdepth : 8;

        if (bitdepth == 32) {
            // 32-bit float RGBA
            for (int y = 0; y < H; ++y) {
                const PF_PixelFloat* srcRow = (const PF_PixelFloat*)((const char*)input_world->data + y * input_world->rowbytes);
                float* dstRow = srcBuf.data() + (size_t)y * W * 4;
                for (int x = 0; x < W; ++x) {
                    dstRow[x * 4 + 0] = srcRow[x].red;
                    dstRow[x * 4 + 1] = srcRow[x].green;
                    dstRow[x * 4 + 2] = srcRow[x].blue;
                    dstRow[x * 4 + 3] = srcRow[x].alpha;
                }
            }
        } else if (bitdepth == 16) {
            // 16-bit ARGB
            const float inv16 = 1.0f / 32768.0f;
            for (int y = 0; y < H; ++y) {
                const PF_Pixel16* srcRow = (const PF_Pixel16*)((const char*)input_world->data + y * input_world->rowbytes);
                float* dstRow = srcBuf.data() + (size_t)y * W * 4;
                for (int x = 0; x < W; ++x) {
                    dstRow[x * 4 + 0] = (float)srcRow[x].red * inv16;
                    dstRow[x * 4 + 1] = (float)srcRow[x].green * inv16;
                    dstRow[x * 4 + 2] = (float)srcRow[x].blue * inv16;
                    dstRow[x * 4 + 3] = (float)srcRow[x].alpha * inv16;
                }
            }
        } else {
            // 8-bit ARGB
            const float inv8 = 1.0f / 255.0f;
            for (int y = 0; y < H; ++y) {
                const PF_Pixel8* srcRow = (const PF_Pixel8*)((const char*)input_world->data + y * input_world->rowbytes);
                float* dstRow = srcBuf.data() + (size_t)y * W * 4;
                for (int x = 0; x < W; ++x) {
                    dstRow[x * 4 + 0] = (float)srcRow[x].red * inv8;
                    dstRow[x * 4 + 1] = (float)srcRow[x].green * inv8;
                    dstRow[x * 4 + 2] = (float)srcRow[x].blue * inv8;
                    dstRow[x * 4 + 3] = (float)srcRow[x].alpha * inv8;
                }
            }
        }

        majeed::Image srcImg = { W, H, srcBuf.data() };
        majeed::Image dstImg = { W, H, dstBuf.data() };
        majeed::FrameCtx ctx;
        ctx.timeSec = (in_data->time_scale > 0) ? ((double)in_data->current_time / (double)in_data->time_scale) : 0.0;

        // Process Dither
        majeed::render_dither(srcImg, dstImg, dp, ctx);

        // Process Lines if enabled (Default is OFF)
        if (lp.enabled && lp.amount > 0.1 && lp.opacity > 0.1) {
            lp.edgeRef = &srcImg; // Clean source reference for contour detection
            std::vector<float> linesSrc = dstBuf;
            majeed::Image linesSrcImg = { W, H, linesSrc.data() };
            majeed::render_lines(linesSrcImg, dstImg, lp, ctx);
        }

        // Write back to output world
        if (bitdepth == 32) {
            for (int y = 0; y < H; ++y) {
                PF_PixelFloat* dstRow = (PF_PixelFloat*)((char*)output_world->data + y * output_world->rowbytes);
                const float* sRow = dstBuf.data() + (size_t)y * W * 4;
                for (int x = 0; x < W; ++x) {
                    dstRow[x].red   = sRow[x * 4 + 0];
                    dstRow[x].green = sRow[x * 4 + 1];
                    dstRow[x].blue  = sRow[x * 4 + 2];
                    dstRow[x].alpha = sRow[x * 4 + 3];
                }
            }
        } else if (bitdepth == 16) {
            for (int y = 0; y < H; ++y) {
                PF_Pixel16* dstRow = (PF_Pixel16*)((char*)output_world->data + y * output_world->rowbytes);
                const float* sRow = dstBuf.data() + (size_t)y * W * 4;
                for (int x = 0; x < W; ++x) {
                    dstRow[x].red   = (A_u_short)std::round(majeed::clampf(sRow[x * 4 + 0], 0.f, 1.f) * 32768.f);
                    dstRow[x].green = (A_u_short)std::round(majeed::clampf(sRow[x * 4 + 1], 0.f, 1.f) * 32768.f);
                    dstRow[x].blue  = (A_u_short)std::round(majeed::clampf(sRow[x * 4 + 2], 0.f, 1.f) * 32768.f);
                    dstRow[x].alpha = (A_u_short)std::round(majeed::clampf(sRow[x * 4 + 3], 0.f, 1.f) * 32768.f);
                }
            }
        } else {
            for (int y = 0; y < H; ++y) {
                PF_Pixel8* dstRow = (PF_Pixel8*)((char*)output_world->data + y * output_world->rowbytes);
                const float* sRow = dstBuf.data() + (size_t)y * W * 4;
                for (int x = 0; x < W; ++x) {
                    dstRow[x].red   = (A_u_char)std::round(majeed::clampf(sRow[x * 4 + 0], 0.f, 1.f) * 255.f);
                    dstRow[x].green = (A_u_char)std::round(majeed::clampf(sRow[x * 4 + 1], 0.f, 1.f) * 255.f);
                    dstRow[x].blue  = (A_u_char)std::round(majeed::clampf(sRow[x * 4 + 2], 0.f, 1.f) * 255.f);
                    dstRow[x].alpha = (A_u_char)std::round(majeed::clampf(sRow[x * 4 + 3], 0.f, 1.f) * 255.f);
                }
            }
        }
    } catch (...) {
        // Crash protection: if exception occurs, fallback to direct copy
        for (int y = 0; y < H; ++y) {
            std::memcpy((char*)output_world->data + y * output_world->rowbytes,
                        (const char*)input_world->data + y * input_world->rowbytes,
                        std::min((size_t)input_world->rowbytes, (size_t)output_world->rowbytes));
        }
    }

    if (extra->cb->checkin_layer_pixels) {
        extra->cb->checkin_layer_pixels(in_data->effect_ref, 0);
    }
    return PF_Err_NONE;
}

// ---------------------------------------------------------------------------
// EffectMain Entry Point
// ---------------------------------------------------------------------------
extern "C" DllExport PF_Err EffectMain(
    PF_Cmd          cmd,
    PF_InData       *in_data,
    PF_OutData      *out_data,
    PF_ParamDef     *params[],
    PF_LayerDef     *output,
    void            *extra
) {
    PF_Err err = PF_Err_NONE;

    try {
        switch (cmd) {
            case PF_Cmd_ABOUT:
                if (out_data) {
                    std::strncpy(out_data->return_msg,
                        "YMDithers Studio v7\n"
                        "Native Retro Dithering, Halftone Screens & Procedural Contour Lines.\n"
                        "Copyright (C) 2026 YMDithers.",
                        sizeof(out_data->return_msg) - 1);
                }
                break;

            case PF_Cmd_GLOBAL_SETUP:
                if (out_data) {
                    out_data->my_version = PF_VERSION(MAJOR_VERSION, MINOR_VERSION, BUG_VERSION, STAGE_VERSION, BUILD_VERSION);
                    out_data->out_flags  = 0x02008004;
                    out_data->out_flags2 = 0x08001400;
                }
                break;

            case PF_Cmd_PARAMS_SETUP:
                err = ParamsSetup(in_data, out_data, params, output);
                break;

            case PF_Cmd_SMART_PRE_RENDER:
                err = SmartPreRender(in_data, out_data, (PF_PreRenderExtra*)extra);
                break;

            case PF_Cmd_SMART_RENDER:
                err = SmartRender(in_data, out_data, (PF_SmartRenderExtra*)extra);
                break;

            case PF_Cmd_QUERY_DYNAMIC_FLAGS:
                break;

            default:
                break;
        }
    } catch (...) {
        err = PF_Err_NONE; // Guarantee zero unhandled exception crashes
    }

    return err;
}

// Optional metadata export for CC 2015+
extern "C" DllExport int PluginDataEntryFunction2(
    void* inPtr,
    void* outPtr,
    int inFlags,
    int inReserved
) {
    return 0;
}
