//! The scroll edge effect: content dissolves under a floating bar.
//!
//! Apple's `UIScrollEdgeEffect` (UIKit, iOS 26) blurs what scrolls under the
//! top or bottom edge of a scroll view, strongest at the edge and sharp a few
//! points in, so the content leaves the screen through a ramp rather than a
//! cut. The effect appears as content starts to scroll under the bar and
//! hardens with it; at rest at the top there is nothing to dissolve.
//!
//! This is a shader over a strip of the page: it samples the backdrop at an
//! increasing radius toward the edge, and composites it with an alpha ramp, so
//! the sharp content underneath is replaced by its blurred self at the edge and
//! survives away from it. On a machine without a GPU shader it draws a frosted
//! strip instead.

use nsh_core::{
    element::{dark, shaders_available},
    geometry::px,
    prelude::*,
    shader::Shader,
};

use std::sync::OnceLock;

const SOURCE: &str = r#"
struct Uniforms {
  reveal: f32,
  blur: f32,
  strength: f32,
  bottom: f32,
  falloff: f32,
  lift: f32,
  dark: f32,
  taps: f32,
  veil: f32,
  bg: vec4f,
}

const GOLDEN: f32 = 2.39996323;

fn backdrop_at(p: vec2f) -> vec4f {
  let size = max(nsh.size, vec2f(1.0));
  let uv = p / size + vec2f(0.5);
  let pad = vec2f(nsh.overflow) * 0.98 / size;
  let c = sample_backdrop(clamp(uv, -pad, vec2f(1.0) + pad));
  if (c.a > 0.0) {
    return c;
  }
  let mirrored = vec2f(
    select(select(uv.x, 2.0 - uv.x, uv.x > 1.0), -uv.x, uv.x < 0.0),
    select(select(uv.y, 2.0 - uv.y, uv.y > 1.0), -uv.y, uv.y < 0.0),
  );
  return sample_backdrop(clamp(mirrored, vec2f(0.0), vec2f(1.0)));
}

fn shade(uv: vec2f) -> vec4f {
  let size = nsh.size;
  if (size.x < 1.0 || size.y < 1.0) {
    return vec4f(0.0);
  }
  let reveal = clamp(uniforms.reveal, 0.0, 1.0);
  if (reveal <= 0.0) {
    return vec4f(0.0);
  }
  // 0 at the edge the effect hangs from, 1 at the far side of the strip.
  let t = clamp(select(uv.y, 1.0 - uv.y, uniforms.bottom > 0.5), 0.0, 1.0);
  let ramp = pow(1.0 - t, uniforms.falloff) * reveal;
  // The blur grows at the edge and hardens as the content scrolls under.
  let radius = uniforms.blur * (0.25 + 0.75 * (1.0 - t)) * reveal;
  let p = uv * size - size * 0.5;
  let jitter = fract(sin(dot(floor(p), vec2f(12.9898, 78.233))) * 43758.5453) * 0.5;
  let count = max(min(uniforms.taps, 17.0), 1.0);
  var sum = vec3f(0.0);
  if (radius > 0.05) {
    for (var i = 0; i < 17; i = i + 1) {
      if (f32(i) >= count) {
        break;
      }
      let fi = f32(i) + 0.5;
      let angle = fi * GOLDEN + jitter;
      let at = p + vec2f(cos(angle), sin(angle)) * (pow(fi / count, 0.8) * radius);
      sum = sum + backdrop_at(at).rgb;
    }
    sum = sum / count;
  } else {
    sum = backdrop_at(p).rgb;
  }
  // A breath of the material's lift in the dark appearance: the ramp reads as
  // glass, not as a smudge.
  sum = sum + vec3f(uniforms.lift * uniforms.dark * ramp);
  // The content also fades into the page's own background at the edge: a
  // blur alone leaves text sharp enough to read through the controls.
  let veil = pow(1.0 - t, 1.3) * uniforms.veil * reveal;
  sum = mix(sum, uniforms.bg.rgb, clamp(veil, 0.0, 1.0));
  let alpha = clamp(ramp * uniforms.strength + veil, 0.0, 1.0);
  return vec4f(clamp(sum, vec3f(0.0), vec3f(1.0)), alpha);
}
"#;

/// The compiled program, `None` when this build cannot compile shaders.
fn program() -> Option<Shader> {
    static PROGRAM: OnceLock<Option<Shader>> = OnceLock::new();
    PROGRAM.get_or_init(|| Shader::compile(SOURCE).ok()).clone()
}

/// The shader's WGSL source, for the test that proves it compiles.
#[doc(hidden)]
pub fn source() -> &'static str {
    SOURCE
}

/// A scroll edge effect, as the floating bars draw it.
#[derive(Debug, Clone, PartialEq)]
pub struct ScrollEdgeSpec {
    edge: Edge,
    height: f32,
    blur: f32,
    strength: f32,
    falloff: f32,
    lift: f32,
    veil: f32,
    background: Hsla,
    material_only: bool,
    reveal: Option<AnimatedNode>,
}

/// Which edge the effect hangs from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Edge {
    /// The top of the screen: the effect is strongest at row 0.
    #[default]
    Top,
    /// The bottom of the screen: strongest at the last row.
    Bottom,
}

impl ScrollEdgeSpec {
    /// An effect at `edge` of `height` points, over the backdrop.
    pub fn new(edge: Edge, height: f32) -> Self {
        Self {
            edge,
            height,
            blur: 20.0,
            strength: 0.97,
            falloff: 1.0,
            lift: 0.02,
            veil: 0.18,
            background: rgba(0x0000_0000).into(),
            material_only: false,
            reveal: None,
        }
    }

    /// How far the effect reaches, in points.
    pub fn height(mut self, height: f32) -> Self {
        self.height = height;
        self
    }

    /// The blur radius at the strong edge, in points.
    pub fn blur(mut self, blur: f32) -> Self {
        self.blur = blur;
        self
    }

    /// The page's background, which the effect fades the content into.
    pub fn background(mut self, background: Hsla) -> Self {
        self.background = background;
        self
    }

    /// Draws the blur-only fallback (the "material" side of a comparison).
    pub fn material_only(mut self, only: bool) -> Self {
        self.material_only = only;
        self
    }

    /// 0 hides the effect (content at rest at the top), 1 is the full ramp.
    pub fn reveal(mut self, reveal: &AnimatedNode) -> Self {
        self.reveal = Some(reveal.clone());
        self
    }

    /// The strip's height, in points.
    pub fn spacing(&self) -> f32 {
        self.height
    }
}

/// The effect's layer: a strip of `height` at its edge, over the content.
pub fn layer(spec: &ScrollEdgeSpec) -> impl IntoElement {
    let bottom = spec.edge == Edge::Bottom;
    let height = spec.height;
    let blur = spec.blur;
    let strength = spec.strength;
    let falloff = spec.falloff;
    let lift = spec.lift;
    let veil = spec.veil;
    let background = spec.background;
    let reveal = spec.reveal.clone();
    let material_only = spec.material_only;
    let hash = spec.clone();
    when(
        move || !material_only && shaders_available() && program().is_some(),
        move || {
            let mut effect = shader_effect().max_sample_offset(px(blur.max(1.0)));
            let Some(program) = program() else {
                return view().absolute().inset_0();
            };
            effect = effect
                .source(program)
                .uniform("blur", blur)
                .uniform("strength", strength)
                .uniform("falloff", falloff)
                .uniform("lift", lift)
                .uniform("veil", veil)
                .uniform("bg", background)
                .uniform("taps", 13.0_f32)
                .uniform("bottom", if bottom { 1.0_f32 } else { 0.0 })
                .uniform("dark", move || if dark() { 1.0_f32 } else { 0.0 });
            if let Some(node) = reveal {
                effect = effect.uniform("reveal", &node);
            } else {
                effect = effect.uniform("reveal", 1.0_f32);
            }
            view()
                .absolute()
                .inset_0()
                .h(px(height))
                .child(effect.absolute().inset_0())
        },
    )
    .otherwise(move || fallback(&hash))
}

/// Without a GPU: a frosted strip at the edge, its opacity following reveal.
fn fallback(spec: &ScrollEdgeSpec) -> View {
    let bottom = spec.edge == Edge::Bottom;
    let height = spec.height;
    let reveal = spec.reveal.clone();
    let mut strip = view()
        .absolute()
        .left_0()
        .right_0()
        .h(px(height))
        .backdrop_blur(px(20.0))
        .bg(move || {
            if dark() {
                rgba(0x0000_0026)
            } else {
                rgba(0xffff_ff33)
            }
        });
    strip = if bottom {
        strip.bottom_0()
    } else {
        strip.top_0()
    };
    match reveal {
        Some(node) => strip.bind_opacity(&node),
        None => strip,
    }
}

/// The props of [`ScrollEdge`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ScrollEdgeProps {
    /// `"top"` (the default) or `"bottom"`.
    pub edge: Prop<Option<SharedString>>,
    /// How far the ramp reaches, in points (80 unless set).
    pub height: Prop<Option<f32>>,
    /// 0 hides it, 1 shows it fully (driven by the scroll offset).
    pub reveal: Prop<Option<f32>>,
    /// The blur at the strong edge, in points (24 unless set).
    pub blur: Prop<Option<f32>>,
}

/// A scroll edge effect for an app that lays its own bars out: a progressive
/// blur and fade at the top or bottom of the screen, drawn over the content.
///
/// Place it in the page's top (or bottom) layer, under the bars; the app drives
/// `reveal` from its scroll offset (0 at rest at the top, 1 once content has
/// scrolled under the bar), the way [`crate::NavPage`] does.
#[component]
pub fn ScrollEdge(props: ScrollEdgeProps) -> impl IntoElement {
    let edge = match props.edge.get_untracked().as_deref() {
        Some("bottom") => Edge::Bottom,
        _ => Edge::Top,
    };
    let height = props.height.get_untracked().unwrap_or(80.0);
    let blur = props.blur.get_untracked().unwrap_or(20.0);
    let reveal = props.reveal;
    let shown = animated_value(1.0);
    let shown_read = shown;
    effect(move || shown_read.set(reveal.get().unwrap_or(1.0).clamp(0.0, 1.0)));
    let node = shown.animated_node();
    let spec = ScrollEdgeSpec::new(edge, height).blur(blur).reveal(&node);
    layer(&spec).into_element()
}
