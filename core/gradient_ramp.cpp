#include "gradient_ramp.h"
#include <algorithm>
#include <cmath>
namespace majeed { namespace {
float clamp01(float v,float d=0) noexcept{return std::isfinite(v)?std::max(0.f,std::min(1.f,v)):d;}
GradientRGBA clean(GradientRGBA c) noexcept{c.r=clamp01(c.r);c.g=clamp01(c.g);c.b=clamp01(c.b);c.a=clamp01(c.a,1);return c;}
float midpoint(float t,float m) noexcept{m=std::max(.01f,std::min(.99f,m));return t<m?.5f*t/m:.5f+.5f*(t-m)/(1-m);}
GradientRGBA mix(GradientRGBA a,GradientRGBA b,float t) noexcept{return {a.r+(b.r-a.r)*t,a.g+(b.g-a.g)*t,a.b+(b.b-a.b)*t,a.a+(b.a-a.a)*t};}
void sort(GradientRamp&g) noexcept{std::stable_sort(g.stops.begin(),g.stops.begin()+g.count,[](const auto&a,const auto&b){return a.position<b.position;});}
}
bool validate_gradient(GradientRamp&g) noexcept{if(g.count<2||g.count>10)return false;for(std::size_t i=0;i<g.count;++i){auto&s=g.stops[i];s.position=clamp01(s.position);s.color=clean(s.color);s.opacity=clamp01(s.opacity,1);s.midpoint=std::max(.01f,std::min(.99f,std::isfinite(s.midpoint)?s.midpoint:.5f));for(std::size_t j=0;j<i;++j)if(g.stops[j].stable_id==s.stable_id)return false;}sort(g);return true;}
bool add_gradient_stop(GradientRamp&g,float p,GradientRGBA c,std::uint32_t id) noexcept{if(g.count>=10||!id)return false;for(std::size_t i=0;i<g.count;++i)if(g.stops[i].stable_id==id)return false;g.stops[g.count++]={clamp01(p),clean(c),.5f,1,true,id};sort(g);return true;}
bool move_gradient_stop(GradientRamp&g,std::uint32_t id,float p) noexcept{for(std::size_t i=0;i<g.count;++i)if(g.stops[i].stable_id==id){float lo=i?g.stops[i-1].position:0,hi=i+1<g.count?g.stops[i+1].position:1;g.stops[i].position=std::max(lo,std::min(hi,clamp01(p)));sort(g);return true;}return false;}
bool set_gradient_stop_visible(GradientRamp&g,std::uint32_t id,bool v) noexcept{for(std::size_t i=0;i<g.count;++i)if(g.stops[i].stable_id==id){g.stops[i].visible=v;return true;}return false;}
bool delete_gradient_stop(GradientRamp&g,std::uint32_t id) noexcept{if(g.count<=2)return false;for(std::size_t i=0;i<g.count;++i)if(g.stops[i].stable_id==id){for(std::size_t j=i+1;j<g.count;++j)g.stops[j-1]=g.stops[j];--g.count;return true;}return false;}
bool set_gradient_stop_color(GradientRamp&g,std::uint32_t id,GradientRGBA c) noexcept{for(std::size_t i=0;i<g.count;++i)if(g.stops[i].stable_id==id){g.stops[i].color=clean(c);return true;}return false;}
GradientSample sample_gradient(const GradientRamp&input,float t) noexcept{GradientRamp g=input;if(!validate_gradient(g))return {};t=clamp01(t);if(g.reverse)t=1-t;std::array<GradientStop,10>a{};std::size_t n=0;for(std::size_t i=0;i<g.count;++i)if(g.stops[i].visible)a[n++]=g.stops[i];if(n<2)return {};if(t<=a[0].position)return {clean(a[0].color),true};if(t>=a[n-1].position)return {clean(a[n-1].color),true};for(std::size_t i=0;i+1<n;++i){const auto&l=a[i];const auto&r=a[i+1];if(t>=l.position&&t<=r.position){float u=clamp01((t-l.position)/std::max(1e-6f,r.position-l.position));u=midpoint(u,l.midpoint);if(g.interpolation==GradientInterpolation::Constant)u=0;else if(g.interpolation==GradientInterpolation::Smooth)u=u*u*(3-2*u);GradientRGBA lc=l.color,rc=r.color;lc.a*=l.opacity;rc.a*=r.opacity;return {mix(lc,rc,u),true};}}return {clean(a[n-1].color),true};}
float gradient_source_value(const GradientRGBA&p,GradientSource s) noexcept{switch(s){case GradientSource::Red:return clamp01(p.r);case GradientSource::Green:return clamp01(p.g);case GradientSource::Blue:return clamp01(p.b);case GradientSource::Alpha:return clamp01(p.a);default:return clamp01(.2126f*p.r+.7152f*p.g+.0722f*p.b);}}
GradientRGBA apply_gradient(const GradientRamp&g,const GradientRGBA&p) noexcept{auto r=sample_gradient(g,gradient_source_value(p,g.source));if(!r.valid)return p;r.color.a=p.a;return r.color;}
}
