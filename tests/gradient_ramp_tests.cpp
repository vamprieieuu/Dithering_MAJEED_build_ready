#include "../core/gradient_ramp.h"
#include <cassert>
#include <cmath>
using namespace majeed;
int main(){GradientRamp g;g.count=2;g.stops[0]={0,{0,0,0,1},.5f,1,true,1};g.stops[1]={1,{1,1,1,1},.5f,1,true,2};assert(validate_gradient(g));auto m=sample_gradient(g,.5f);assert(m.valid&&std::fabs(m.color.r-.5f)<1e-5f);assert(add_gradient_stop(g,.5f,{1,0,0,1},3));assert(set_gradient_stop_visible(g,3,false)&&g.count==3);assert(delete_gradient_stop(g,3)&&g.count==2);assert(!delete_gradient_stop(g,1));auto o=apply_gradient(g,{.5f,.5f,.5f,.25f});assert(std::fabs(o.a-.25f)<1e-6f);g.reverse=true;assert(sample_gradient(g,0).color.r>.99f);g.interpolation=GradientInterpolation::Constant;assert(sample_gradient(g,.75f).valid);}
