// MAJEED Channels - AE effect definition (core/channels.cpp).
#include "MajeedGlue.h"
using namespace majeed;

#define CH_LIST(F,K,P,C,A,G,E) \
 G(CH_G_SEP,"RGB Separation") \
 F(CH_SEP,"Separation Amount (px)",-100,100,-30,30,4,2) \
 A(CH_ANG,"Separation Angle",0) \
 P(CH_MODE,"Separation Mode","Linear|Radial",2,1) \
 F(CH_JIT,"Row Jitter (px)",0,50,0,20,0,2) \
 F(CH_JITRATE,"Jitter Speed (fps)",1,120,6,60,24,1) \
 F(CH_SEED,"Random Seed",0,100000,0,1000,0,0) \
 E(CH_E_SEP)

MJ_DEFINE_PARAMS(CH_LIST, CH)

static void ch_render(const Image& src, Image& dst, const mj::Vals& v, const FrameCtx& c) {
    ChannelParams p;
    p.sepAmount = v[CH_SEP];
    p.sepAngle = v[CH_ANG];
    p.sepMode = v.pop(CH_MODE);
    p.random = v[CH_JIT];
    p.randomRate = v[CH_JITRATE];
    p.seed = (int)v[CH_SEED];
    render_channels(src, dst, p, c);
}
static const mj::EffectDef CH_DEF = { "YMDithers Channels", CH_specs, CH_COUNT, ch_render,
    "RGB chromatic aberration and displacement." };
MJ_EXPORT_EFFECT(EffectMainChannels, CH_DEF)
