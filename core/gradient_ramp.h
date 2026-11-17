#pragma once
#include <array>
#include <cstddef>
#include <cstdint>
namespace majeed {
constexpr std::size_t kMaxGradientStops=10,kMinGradientStops=2;
enum class GradientInterpolation:std::uint8_t{Linear,Smooth,Constant};
enum class GradientSource:std::uint8_t{Luminance,Red,Green,Blue,Alpha};
struct GradientRGBA{float r{0},g{0},b{0},a{1};};
struct GradientStop{float position{0};GradientRGBA color{};float midpoint{.5f},opacity{1};bool visible{true};std::uint32_t stable_id{0};};
struct GradientRamp{std::array<GradientStop,kMaxGradientStops> stops{};std::size_t count{2};GradientInterpolation interpolation{GradientInterpolation::Linear};GradientSource source{GradientSource::Luminance};bool reverse{false};};
struct GradientSample{GradientRGBA color{};bool valid{false};};
bool validate_gradient(GradientRamp&) noexcept;bool add_gradient_stop(GradientRamp&,float,GradientRGBA,std::uint32_t) noexcept;bool move_gradient_stop(GradientRamp&,std::uint32_t,float) noexcept;bool set_gradient_stop_visible(GradientRamp&,std::uint32_t,bool) noexcept;bool delete_gradient_stop(GradientRamp&,std::uint32_t) noexcept;bool set_gradient_stop_color(GradientRamp&,std::uint32_t,GradientRGBA) noexcept;GradientSample sample_gradient(const GradientRamp&,float) noexcept;float gradient_source_value(const GradientRGBA&,GradientSource) noexcept;GradientRGBA apply_gradient(const GradientRamp&,const GradientRGBA&) noexcept;
}
