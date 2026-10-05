// Dithering MAJEED - unified native AE effect.
// The UI is based on MAJEED_FINAL_v5.jsx, but all image processing here is native
// C++ and uses the MAJEED core engines directly (no native AE effects, no helper layers).
#include "MajeedGlue.h"
#include "DitherAlgoList.h"
#include "MajeedLogo.h"
#include "adobesdk/DrawbotSuite.h"
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstring>

using namespace majeed;

#define DITHERING_MAJEED_LIST(F,K,P,C,A,G,E) \
 G(DM_G_DITHER,"Dither") \
 P(DM_ALGO,"Algorithm",MJ_DITHER_ALGO_POPUP,MJ_DITHER_ALGO_COUNT,17) \
 P(DM_MODE,"Color Mode","Preserve Original Colors|Black & White",2,1) \
 F(DM_DITHER,"Amount",0,100,0,100,100,1) \
 F(DM_TONES,"Levels",2,64,2,64,8,0) \
 F(DM_SIZE,"Scale",1,32,1,32,2,0) \
 F(DM_CONTRAST,"Contrast",0,200,0,200,100,1) \
 F(DM_SPREAD,"Spread",0,200,0,200,100,1) \
 K(DM_PIXELATE,"Also pixelate image to Scale",0) \
 E(DM_E_DITHER) \
 G(DM_G_COLOR,"Color / Grade") \
 F(DM_HUE,"Hue",-180,180,-180,180,0,1) \
 F(DM_SAT,"Saturation",-100,100,-100,100,0,1) \
 F(DM_INVERT,"Invert (>=50)",0,100,0,100,0,1) \
 F(DM_GRADE,"Grade Bias",-100,100,-100,100,0,1) \
 K(DM_LIMIT,"Limit palette (Indexed colors)",0) \
 F(DM_INDEX,"Indexed Colors",2,256,2,256,16,0) \
 K(DM_TONAL,"Apply tonal colors",0) \
 C(DM_HIGHS,"Highlights",1,1,1) \
 C(DM_MIDS,"Midtones",0.5,0.5,0.5) \
 C(DM_SHADOWS,"Shadows",0,0,0) \
 E(DM_E_COLOR) \
 G(DM_G_PRE,"Preprocess") \
 F(DM_DENOISE,"Denoise | Noise",-100,100,-100,100,0,1) \
 F(DM_BLUR,"Blur",0,100,0,100,0,1) \
 F(DM_SHARP,"Sharp Strength",0,10,0,10,1,2) \
 F(DM_SHARPR,"Sharp Radius",0.1,20,0.1,20,1,1) \
 E(DM_E_PRE) \
 G(DM_G_GRAIN,"Film Grain") \
 K(DM_GRAIN_ON,"Enable grain",0) \
 F(DM_GRAIN_AMT,"Amount",0,100,0,100,35,1) \
 F(DM_GRAIN_SIZE,"Size",0,100,0,100,30,1) \
 F(DM_GRAIN_SOFT,"Softness",0,100,0,100,40,1) \
 F(DM_GRAIN_COLOR,"Color Grain",0,100,0,100,25,1) \
 F(DM_GRAIN_SHAD,"Shadow Grain",0,200,0,200,100,1) \
 F(DM_GRAIN_HIGH,"Highlight Grain",0,200,0,200,60,1) \
 F(DM_GRAIN_SPEED,"Motion Speed",0,100,0,100,100,1) \
 F(DM_GRAIN_SEED,"Random Seed",0,10000,0,10000,0,0) \
 E(DM_E_GRAIN) \
 G(DM_G_VHS,"VHS Noise") \
 K(DM_VHS_ON,"Enable VHS Noise",0) \
 F(DM_VHS_STATIC,"Static (RGB)",0,100,0,100,35,1) \
 F(DM_VHS_DASH,"Tape Dashes",0,100,0,100,30,1) \
 F(DM_VHS_STREAK,"Vertical Streaks",0,100,0,100,25,1) \
 F(DM_VHS_BLEED,"Color Bleed",0,100,0,100,30,1) \
 F(DM_VHS_TRACK,"Tracking",0,100,0,100,20,1) \
 F(DM_VHS_JITTER,"Jitter",0,100,0,100,15,1) \
 F(DM_VHS_SCAN,"Scanlines",0,100,0,100,30,1) \
 F(DM_VHS_SCAN_SIZE,"Scanline Size",1,20,1,20,3,1) \
 F(DM_VHS_FLICKER,"Flicker",0,100,0,100,20,1) \
 F(DM_VHS_SPEED,"Motion Speed",0,100,0,100,100,1) \
 F(DM_VHS_SEED,"Random Seed",0,10000,0,10000,0,0) \
 E(DM_E_VHS)

MJ_DEFINE_PARAMS(DITHERING_MAJEED_LIST, DITHERING_MAJEED)

namespace {

static inline float clamp01(float v) { return majeed::clampf(v, 0.f, 1.f); }
static inline float lerp3(float a, float b, float t) { return a + (b - a) * t; }

static void rgb_to_hsv(float r, float g, float b, float& h, float& s, float& v) {
    float mx = std::max(r, std::max(g, b)), mn = std::min(r, std::min(g, b));
    v = mx; float d = mx - mn; s = mx <= 1e-6f ? 0.f : d / mx;
    if (d <= 1e-6f) { h = 0.f; return; }
    if (mx == r) h = (g - b) / d;
    else if (mx == g) h = 2.f + (b - r) / d;
    else h = 4.f + (r - g) / d;
    h /= 6.f; if (h < 0.f) h += 1.f;
}
static void hsv_to_rgb(float h, float s, float v, float& r, float& g, float& b) {
    h = h - std::floor(h); float x = h * 6.f; int i = (int)std::floor(x); float f = x - i;
    float p = v * (1.f - s), q = v * (1.f - s * f), t = v * (1.f - s * (1.f - f));
    switch (i % 6) { case 0:r=v;g=t;b=p;break; case 1:r=q;g=v;b=p;break; case 2:r=p;g=v;b=t;break; case 3:r=p;g=q;b=v;break; case 4:r=t;g=p;b=v;break; default:r=v;g=p;b=q;break; }
}

static void copy_image(const Image& src, Image& dst) {
    std::memcpy(dst.px, src.px, (size_t)src.w * src.h * 4 * sizeof(float));
}

static void apply_color(Image& im, double hueDeg, double satPct, bool invert, double gradeBias,
                        bool limitPalette, int indexColors, bool tonal, RGB hi, RGB mid, RGB sh) {
    const float hue = (float)(hueDeg / 360.0);
    const float sat = (float)(1.0 + satPct / 100.0);
    const float gb = (float)(gradeBias / 100.0);
    const int colors = std::max(2, std::min(256, indexColors));
    for (int y=0; y<im.h; ++y) for (int x=0; x<im.w; ++x) {
        float* p = im.at(x,y); float h,s,v; rgb_to_hsv(p[0],p[1],p[2],h,s,v);
        h += hue; s = clamp01(s * sat);
        if (invert) v = 1.f - v;
        v = clamp01(v + gb * 0.5f);
        // Grade bias is deliberately gentle: it changes the midpoint more than endpoints.
        v = clamp01((v - 0.5f) * (1.f + gb * 0.5f) + 0.5f);
        hsv_to_rgb(h,s,v,p[0],p[1],p[2]);
        if (limitPalette) {
            float q = (float)(colors - 1);
            p[0] = std::round(clamp01(p[0]) * q) / q;
            p[1] = std::round(clamp01(p[1]) * q) / q;
            p[2] = std::round(clamp01(p[2]) * q) / q;
        }
        if (tonal) {
            float l = majeed::luma709(p[0],p[1],p[2]);
            RGB c;
            if (l < 0.5f) { float t=l*2.f; c={lerp3(sh.r,mid.r,t),lerp3(sh.g,mid.g,t),lerp3(sh.b,mid.b,t)}; }
            else { float t=(l-0.5f)*2.f; c={lerp3(mid.r,hi.r,t),lerp3(mid.g,hi.g,t),lerp3(mid.b,hi.b,t)}; }
            p[0]=c.r; p[1]=c.g; p[2]=c.b;
        }
    }
}

static void box_blur(const Image& src, Image& dst, int radius) {
    if (radius <= 0) { copy_image(src,dst); return; }
    radius = std::min(radius, 24);
    std::vector<float> tmp((size_t)src.w*src.h*4);
    Image t{src.w,src.h,tmp.data()};
    parallel_rows(src.h,[&](int y0,int y1){
        for(int y=y0;y<y1;++y) for(int x=0;x<src.w;++x){
            double a[4]={0,0,0,0}; int n=0;
            for(int k=-radius;k<=radius;++k){ int xx=std::max(0,std::min(src.w-1,x+k)); const float* p=src.at(xx,y); for(int c=0;c<4;++c)a[c]+=p[c]; ++n; }
            float* o=t.at(x,y); for(int c=0;c<4;++c)o[c]=(float)(a[c]/n);
        }
    });
    parallel_rows(src.h,[&](int y0,int y1){
        for(int y=y0;y<y1;++y) for(int x=0;x<src.w;++x){
            double a[4]={0,0,0,0}; int n=0;
            for(int k=-radius;k<=radius;++k){ int yy=std::max(0,std::min(src.h-1,y+k)); const float* p=t.at(x,yy); for(int c=0;c<4;++c)a[c]+=p[c]; ++n; }
            float* o=dst.at(x,y); for(int c=0;c<4;++c)o[c]=(float)(a[c]/n);
        }
    });
}

static void apply_preprocess(const Image& src, Image& dst, double denoise, double blur, double sharp, double sharpRadius) {
    std::vector<float> a((size_t)src.w*src.h*4), b((size_t)src.w*src.h*4);
    Image A{src.w,src.h,a.data()}, B{src.w,src.h,b.data()}; copy_image(src,A);
    // Denoise/noise: a signed value. Positive = smooth, negative = add deterministic grain-like noise.
    if (std::fabs(denoise) > 0.01) {
        if (denoise > 0) { box_blur(A,B,std::max(1,(int)std::round(1.0+denoise/35.0))); float t=(float)(denoise/100.0); for(size_t i=0;i<a.size();i+=4){for(int c=0;c<3;++c)A.px[i+c]=lerp3(A.px[i+c],B.px[i+c],t);} }
        else { float amt=(float)(-denoise/100.0)*0.12f; for(int y=0;y<src.h;++y)for(int x=0;x<src.w;++x){float* p=A.at(x,y); uint32_t h=hash3((uint32_t)x,(uint32_t)y,0x4E4F4953u); float n=s11(h)*amt; for(int c=0;c<3;++c)p[c]=clamp01(p[c]+n);} }
    }
    if (blur > 0.01) { box_blur(A,B,std::max(1,(int)std::round(blur/12.0))); copy_image(B,A); }
    if (sharp > 0.001) {
        box_blur(A,B,std::max(1,(int)std::round(sharpRadius/2.0))); float k=(float)std::min(4.0,sharp); 
        for(size_t i=0;i<a.size();i+=4) for(int c=0;c<3;++c) A.px[i+c]=clamp01(A.px[i+c]+(A.px[i+c]-B.px[i+c])*k);
    }
    copy_image(A,dst);
}

static void pixelate_image(const Image& src, Image& dst, int block) {
    block = std::max(1, std::min(64, block));
    if (block <= 1) { copy_image(src,dst); return; }
    parallel_rows(src.h,[&](int y0,int y1){
        for(int y=y0;y<y1;++y) for(int x=0;x<src.w;++x){
            int x0=(x/block)*block, y0b=(y/block)*block;
            int x1=std::min(src.w,x0+block), y1b=std::min(src.h,y0b+block);
            double a[4]={0,0,0,0}; int n=0;
            for(int yy=y0b;yy<y1b;++yy) for(int xx=x0;xx<x1;++xx){const float* p=src.at(xx,yy);for(int c=0;c<4;++c)a[c]+=p[c];++n;}
            float* o=dst.at(x,y); for(int c=0;c<4;++c)o[c]=(float)(a[c]/n);
        }
    });
}

static void mix_into(Image& dst, const Image& src, const Image& fx, float amount) {
    amount=clamp01(amount); for(int y=0;y<dst.h;++y)for(int x=0;x<dst.w;++x){float* o=dst.at(x,y);const float* a=src.at(x,y);const float* b=fx.at(x,y);for(int c=0;c<3;++c)o[c]=lerp3(a[c],b[c],amount);o[3]=a[3];}
}

static void unified_render(const Image& src, Image& dst, const mj::Vals& v, const FrameCtx& c) {
    const int W=src.w,H=src.h;
    std::vector<float> a((size_t)W*H*4), b((size_t)W*H*4), fx((size_t)W*H*4);
    Image A{W,H,a.data()}, B{W,H,b.data()}, FX{W,H,fx.data()};
    copy_image(src,A);

    apply_color(A,v[DM_HUE],v[DM_SAT],v[DM_INVERT]>=50.0,v[DM_GRADE],v.on(DM_LIMIT),(int)std::round(v[DM_INDEX]),v.on(DM_TONAL),v.col(DM_HIGHS),v.col(DM_MIDS),v.col(DM_SHADOWS));
    apply_preprocess(A,B,v[DM_DENOISE],v[DM_BLUR],v[DM_SHARP],v[DM_SHARPR]);
    copy_image(B,A);

    DitherParams dp; dp.algo=v.pop(DM_ALGO); dp.mode=v.pop(DM_MODE); dp.levels=(int)std::round(v[DM_TONES]); dp.size=v[DM_SIZE]; dp.amount=v[DM_DITHER]; dp.strength=v[DM_SPREAD]; dp.contrast=v[DM_CONTRAST]; dp.brightness=0; dp.serpentine=false; dp.noise=0; dp.seed=0; dp.linear=false; dp.invert=false; dp.patternScale=100; dp.patternAngle=0; dp.preserveAlpha=true;
    dp.dark={0,0,0}; dp.light={1,1,1};
    render_dither(A,FX,dp,c);
    copy_image(FX,A);
    if(v.on(DM_PIXELATE)) { pixelate_image(A,B,std::max(1,(int)std::round(v[DM_SIZE]))); copy_image(B,A); }

    if(v.on(DM_GRAIN_ON)) {
        GrainParams gp; gp.type=GT_CRYSTAL; gp.sizeMm=4.0+60.0*(v[DM_GRAIN_SIZE]/100.0); gp.frameWidthMm=std::max(50.0,c.fullW); gp.amount=v[DM_GRAIN_AMT]; gp.softness=v[DM_GRAIN_SOFT]; gp.colorAmt=v[DM_GRAIN_COLOR]; gp.shadows=v[DM_GRAIN_SHAD]; gp.highlights=v[DM_GRAIN_HIGH]; gp.seed=(int)v[DM_GRAIN_SEED]; gp.evoSpeed=(v[DM_GRAIN_SPEED]/100.0)*24.0; gp.saturation=100; gp.rgbGrain=100; gp.blend=BM_ADD_SIGNED; gp.density=100; gp.contrast=100; gp.sharpness=30; gp.aspect=100; gp.opacity=100;
        render_grain(A,FX,gp,c); copy_image(FX,A);
    }

    if(v.on(DM_VHS_ON)) {
        VHSParams vp; vp.staticAmount=v[DM_VHS_STATIC]; vp.dashes=v[DM_VHS_DASH]; vp.streaks=v[DM_VHS_STREAK]; vp.bleed=v[DM_VHS_BLEED]; vp.trackAmount=v[DM_VHS_TRACK]; vp.jitterAmount=v[DM_VHS_JITTER]; vp.scanlines=v[DM_VHS_SCAN]; vp.scanPeriod=v[DM_VHS_SCAN_SIZE]; vp.scanSharp=50; vp.flicker=v[DM_VHS_FLICKER]; vp.speed=v[DM_VHS_SPEED]; vp.seed=(int)v[DM_VHS_SEED]; vp.saturation=100;
        render_vhs(A,FX,vp,c); copy_image(FX,A);
    }
    copy_image(A,dst);
}

// ------------------------------------------------------------------ custom logo UI
static PF_Err DrawLogo(PF_InData* in_data, PF_OutData* out_data, PF_EventExtra* extra) {
    if (!in_data || !extra || !extra->contextH || !*extra->contextH) return PF_Err_NONE;
    if ((*extra->contextH)->w_type != PF_Window_EFFECT) return PF_Err_NONE;
    if (extra->effect_win.area != PF_EA_CONTROL) return PF_Err_NONE;

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
    if(extra && extra->e_type==PF_Event_DRAW) return DrawLogo(in_data,out_data,extra);
    return PF_Err_NONE;
}

} // namespace

static const mj::EffectDef DITHERING_MAJEED_DEF = {
    "Dithering MAJEED", DITHERING_MAJEED_specs, DITHERING_MAJEED_COUNT, unified_render,
    "MAJEED native dither, color/grade, preprocess, procedural film grain and VHS noise.",
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
            "Dithering MAJEED",
            "Dithering MAJEED",
            "MAJEED",
            AE_RESERVED_INFO,
            "EffectMain",
            "https://example.invalid/majeed");
    }
    return result;
}
