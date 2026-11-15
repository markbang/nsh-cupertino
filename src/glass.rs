//! Liquid Glass: the material of the floating layer, drawn by a GPU shader.
//!
//! A glass surface reads what is behind it (`sample_backdrop`), bends that
//! picture through a height field — the rim refracts and magnifies what lies
//! just outside it, the middle stays flat — blurs it, tints it by variant, and
//! adds a specular rim whose lit side follows the light. The behaviour follows
//! Apple's specification of Liquid Glass and the numeric ideas of the
//! open-source implementations listed in `NOTICE`; the shading is this
//! crate's own. `docs/design-notes.md` says which part is refraction, which
//! is approximation.
//!
//! Glass belongs to the floating layer only: bars, sheets, alerts, menus and
//! floating controls. Content keeps a solid background (HIG, *Liquid Glass*).
//!
//! Without GPU shaders ([`shaders_available`]) a surface draws the material
//! fill and backdrop blur of [`crate::tokens::materials`] instead, which is
//! what this crate drew before the shader existed.

use std::sync::OnceLock;

use nsh_core::{
    AccessibilityRole, Hsla,
    element::{Animated, AnimatedNode, Children, dark, reduce_motion, shaders_available},
    geometry::px,
    prelude::*,
    shader::{Shader, UniformValue},
};

use crate::tokens::{self, glass as numbers};

/// The WGSL program of the material. One program draws one shape (`count` 1)
/// and a pair that fuses (`count` 2); `progress` moves the pair between two
/// layouts.
const SOURCE: &str = r#"
struct Uniforms {
  tint: vec4f,
  radii: vec4f,
  other_radii: vec4f,
  first: array<vec4f, 2>,
  second: array<vec4f, 2>,
  light: vec2f,
  count: f32,
  progress: f32,
  spacing: f32,
  bevel: f32,
  thickness: f32,
  lens: f32,
  specular: f32,
  bloom: f32,
  lift: f32,
  chroma: f32,
  blur: f32,
  taps: f32,
  inner: f32,
  edge: f32,
  adapt: f32,
  dark: f32,
  tilt: f32,
}

const TAU: f32 = 6.283185307;
const GOLDEN: f32 = 2.39996323;

fn hash_cell(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q = q + vec2f(dot(q, q + vec2f(45.32)));
  return fract(q.x * q.y);
}

fn corner_radius(p: vec2f, radii: vec4f) -> f32 {
  if (p.x < 0.0) {
    if (p.y < 0.0) {
      return radii.x;
    }
    return radii.w;
  }
  if (p.y < 0.0) {
    return radii.y;
  }
  return radii.z;
}

// A rounded rect with a radius per corner, a capsule (radii.x = -1) or a
// circle (radii.x = -2), as `GlassSpec` encodes them.
fn sd_one(p: vec2f, half: vec2f, radii: vec4f) -> f32 {
  if (radii.x < -1.5) {
    return length(p) - min(half.x, half.y);
  }
  if (radii.x < -0.5) {
    let r = min(half.x, half.y);
    let q = abs(p) - (half - vec2f(r));
    return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
  }
  let r = min(corner_radius(p, radii), min(half.x, half.y));
  let q = abs(p) - (half - vec2f(r));
  // A smooth max of the two axes' distances: a sharp corner's diagonal would
  // otherwise show as a seam in the lens's normal (`smax` below).
  let inner = smax(q.x, q.y, 2.5);
  return length(max(q, vec2f(0.0))) + min(inner, 0.0) - r;
}

fn smin(a: f32, b: f32, k: f32) -> f32 {
  if (k <= 0.0) {
    return min(a, b);
  }
  let h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

fn smax(a: f32, b: f32, k: f32) -> f32 {
  return -smin(-a, -b, k);
}

// A shape's rect (x, y, width, height in points from the surface's top-left)
// as the centre and half size the SDF takes. An empty rect is the whole box:
// a single-shape surface knows no other.
fn settle(shape: vec4f) -> vec4f {
  if (shape.z <= 0.0 || shape.w <= 0.0) {
    return vec4f(0.0, 0.0, nsh.size * 0.5);
  }
  let c = vec2f(shape.x + shape.z * 0.5, shape.y + shape.w * 0.5) - nsh.size * 0.5;
  return vec4f(c.x, c.y, shape.z * 0.5, shape.w * 0.5);
}

fn sd_shape(p: vec2f) -> f32 {
  let a = mix(settle(uniforms.first[0]), settle(uniforms.second[0]), uniforms.progress);
  var d = sd_one(p - a.xy, a.zw, uniforms.radii);
  if (uniforms.count > 1.5) {
    let b = mix(settle(uniforms.first[1]), settle(uniforms.second[1]), uniforms.progress);
    d = smin(d, sd_one(p - b.xy, b.zw, uniforms.other_radii), uniforms.spacing);
  }
  return d;
}

fn sd_gradient(p: vec2f) -> vec2f {
  let e = 0.6;
  let gx = sd_shape(p + vec2f(e, 0.0)) - sd_shape(p - vec2f(e, 0.0));
  let gy = sd_shape(p + vec2f(0.0, e)) - sd_shape(p - vec2f(0.0, e));
  let g = vec2f(gx, gy);
  let l = length(g);
  return select(vec2f(0.0, -1.0), g / l, l > 1e-5);
}

// The backdrop at `p`, in points: the picture covers the box and the overflow,
// but not past the window's edge, so a point that falls outside it reads the
// box's edge instead — a bar at the top of the screen samples its own top row,
// never a transparent band.
fn backdrop_at(p: vec2f) -> vec4f {
  let size = max(nsh.size, vec2f(1.0));
  let uv = p / size;
  let pad = vec2f(nsh.overflow) * 0.98 / size;
  let c = sample_backdrop(clamp(uv, -pad, vec2f(1.0) + pad));
  if (c.a > 0.0) {
    return c;
  }
  // Past the window's edge: mirror the point back into the box, so the sheet
  // shows its own edge reflected rather than a flat band of nothing.
  let mirrored = vec2f(
    select(select(uv.x, 2.0 - uv.x, uv.x > 1.0), -uv.x, uv.x < 0.0),
    select(select(uv.y, 2.0 - uv.y, uv.y > 1.0), -uv.y, uv.y < 0.0),
  );
  return sample_backdrop(clamp(mirrored, vec2f(0.0), vec2f(1.0)));
}

fn blurred(p: vec2f, jitter: f32) -> vec3f {
  let count = max(uniforms.taps, 1.0);
  var sum = vec3f(0.0);
  var total = 0.0;
  for (var i = 0; i < 17; i = i + 1) {
    if (f32(i) >= count) {
      break;
    }
    let fi = f32(i) + 0.5;
    let angle = fi * GOLDEN + jitter;
    let radius = pow(fi / count, 0.7) * uniforms.blur;
    sum = sum + backdrop_at(p + vec2f(cos(angle), sin(angle)) * radius).rgb;
    total = total + 1.0;
  }
  return sum / max(total, 1.0);
}

fn shade(uv: vec2f) -> vec4f {
  let size = nsh.size;
  if (size.x < 1.0 || size.y < 1.0) {
    return vec4f(0.0);
  }
  let p = uv * size - size * 0.5;
  let sdf = sd_shape(p);
  let coverage = clamp(0.5 - sdf, 0.0, 1.0);
  if (coverage <= 0.0) {
    return vec4f(0.0);
  }

  // The height field: a bevel of `bevel` points at the rim, flat inside.
  let inside = -sdf;
  let t = clamp(inside / max(uniforms.bevel, 0.5), 0.0, 1.0);
  let rim = 1.0 - t;
  let normal = sd_gradient(p);

  // The lens: the bevel's slope bends the backdrop, strongest at the rim, and
  // the sheet magnifies the picture under it a little.
  let shift = normal * (uniforms.thickness * rim * rim) - p * uniforms.lens;
  let jitter = hash_cell(floor(uv * size * nsh.scale)) * 0.5;
  var rgb = blurred(p + shift, jitter);

  // A pixel of chromatic separation along the rim, as a thick edge spreads
  // the channels.
  if (uniforms.chroma > 0.0 && rim > 0.3) {
    let off = normal * (uniforms.chroma * rim);
    let weight = 0.35 * (rim - 0.3) / 0.7;
    rgb.r = mix(rgb.r, backdrop_at(p + shift + off).r, weight);
    rgb.b = mix(rgb.b, backdrop_at(p + shift - off).b, weight);
  }

  // The tint thickens where the backdrop would fight the label: a bright
  // picture under dark glass, a dark one under light glass.
  let luminance = dot(rgb, vec3f(0.2126, 0.7152, 0.0722));
  let fight = select(
    smoothstep(0.62, 0.16, luminance),
    smoothstep(0.32, 0.86, luminance),
    uniforms.dark > 0.5,
  );
  let alpha = clamp(uniforms.tint.a + uniforms.adapt * fight * 0.45, 0.0, 0.96);
  rgb = mix(rgb, uniforms.tint.rgb, alpha);

  // The light, a direction the app may turn with `tilt`.
  let c = cos(uniforms.tilt);
  let s = sin(uniforms.tilt);
  let light = vec2f(
    uniforms.light.x * c - uniforms.light.y * s,
    uniforms.light.x * s + uniforms.light.y * c,
  );
  let facing = clamp(dot(normal, light), 0.0, 1.0);

  // The specular rim: the bevel's slope catches the light, and the flat middle
  // stays flat, as a sheet of glass does.
  let sheen = pow(facing, 2.0) * pow(rim, max(uniforms.bloom, 0.05));
  rgb = rgb + vec3f(1.0) * sheen * (uniforms.specular + uniforms.lift);

  // The inner shadow opposite the light: the sheet's thickness shows.
  rgb = rgb * (1.0 - uniforms.inner * 0.28 * pow(1.0 - facing, 2.0) * rim);

  // The edge itself: a hairline, brightest where the light is.
  let line = smoothstep(1.4, 0.0, inside);
  rgb = rgb + vec3f(1.0) * line * uniforms.edge * (0.45 + 0.55 * facing);

  return vec4f(clamp(rgb, vec3f(0.0), vec3f(1.0)), coverage);
}
"#;

/// The material's WGSL source. It is compiled on first use; this is here for
/// tests that prove it still compiles.
#[doc(hidden)]
pub fn source() -> &'static str {
    SOURCE
}

/// The compiled program, `None` when this build cannot compile shaders.
fn program() -> Option<Shader> {
    static PROGRAM: OnceLock<Option<Shader>> = OnceLock::new();
    PROGRAM.get_or_init(|| Shader::compile(SOURCE).ok()).clone()
}

/// How much GPU work the material does.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum GlassQuality {
    /// Seventeen backdrop samples: the material's own blur.
    High,
    /// Nine: a cheaper blur, for large or moving surfaces.
    #[default]
    Balanced,
    /// One: no blur of its own, the tint carries the material (weak GPUs).
    Low,
}

impl GlassQuality {
    fn taps(self) -> f32 {
        match self {
            GlassQuality::High => 17.0,
            GlassQuality::Balanced => 9.0,
            GlassQuality::Low => 1.0,
        }
    }

    fn named(name: &str) -> Self {
        match name {
            "high" => GlassQuality::High,
            "low" => GlassQuality::Low,
            _ => GlassQuality::Balanced,
        }
    }
}

/// Which look of the material.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub enum GlassVariant {
    /// Apple's default glass: a readable sheet over scrolling content.
    #[default]
    Regular,
    /// Hardly any fill: for media behind it, never under text.
    Clear,
    /// A heavier fill, for surfaces that carry text (sheets, alerts).
    Thick,
    /// Regular glass that answers a press (see [`Glass`]'s `interactive`).
    Interactive,
    /// Regular glass in a colour of the app's.
    Tinted(Hsla),
}

/// The silhouette, the variant and the light of a glass surface.
///
/// Made with [`GlassSpec::rounded`], [`GlassSpec::capsule`] or
/// [`GlassSpec::circle`], changed with the methods below. The components
/// ([`Glass`], [`GlassButton`], [`GlassGroup`] and the bars and overlays)
/// build one from their props; an app that draws a layer of its own passes
/// one to [`background`].
#[derive(Debug, Clone, PartialEq)]
pub struct GlassSpec {
    radii: [f32; 4],
    variant: GlassVariant,
    light: f32,
    quality: GlassQuality,
    first: Vec<[f32; 4]>,
    second: Vec<[f32; 4]>,
    merge: Option<AnimatedNode>,
    spacing: f32,
}

impl Default for GlassSpec {
    fn default() -> Self {
        Self::rounded(0.0)
    }
}

impl GlassSpec {
    /// A rounded rect with `radius` on every corner.
    pub fn rounded(radius: f32) -> Self {
        Self {
            radii: [radius; 4],
            variant: GlassVariant::Regular,
            light: numbers::LIGHT,
            quality: GlassQuality::Balanced,
            first: Vec::new(),
            second: Vec::new(),
            merge: None,
            spacing: 0.0,
        }
    }

    /// A rounded rect with a radius per corner — top left, top right, bottom
    /// right, bottom left (a sheet's `[14, 14, 0, 0]`).
    pub fn corners(radii: [f32; 4]) -> Self {
        Self {
            radii,
            ..Self::rounded(0.0)
        }
    }

    /// A pill: its ends are half of the shorter side.
    pub fn capsule() -> Self {
        Self {
            radii: [-1.0; 4],
            ..Self::rounded(0.0)
        }
    }

    /// A circle, in a square box (a wider box shows a capsule).
    pub fn circle() -> Self {
        Self {
            radii: [-2.0; 4],
            ..Self::rounded(0.0)
        }
    }

    /// Its look.
    pub fn variant(mut self, variant: GlassVariant) -> Self {
        self.variant = variant;
        self
    }

    /// The direction the light comes from, in degrees (315: the upper left,
    /// as Apple lights its materials).
    pub fn light(mut self, degrees: f32) -> Self {
        self.light = degrees;
        self
    }

    /// How much GPU work it does.
    pub fn quality(mut self, quality: GlassQuality) -> Self {
        self.quality = quality;
        self
    }

    /// Two shapes in one material, as [`GlassGroup`] draws them: two rects in
    /// points from the surface's top-left corner, a radius each, the rects
    /// they spring to, the progress between them and the fusion distance.
    pub fn group(
        mut self,
        from: [[f32; 4]; 2],
        to: [[f32; 4]; 2],
        radii: [f32; 2],
        progress: AnimatedNode,
        spacing: f32,
    ) -> Self {
        self.first = from.to_vec();
        self.second = to.to_vec();
        self.radii = [radii[0], radii[1], 0.0, 0.0];
        self.merge = Some(progress);
        self.spacing = spacing;
        self
    }

    /// The height of the lens and the blur radius, by variant.
    fn thickness_and_blur(&self) -> (f32, f32) {
        match self.variant {
            GlassVariant::Clear => (numbers::THICKNESS * 0.7, numbers::BLUR * 0.6),
            GlassVariant::Thick => (numbers::THICKNESS * 1.1, numbers::BLUR * 1.3),
            GlassVariant::Tinted(..) | GlassVariant::Interactive | GlassVariant::Regular => {
                (numbers::THICKNESS, numbers::BLUR)
            }
        }
    }

    /// How far beyond its box the shader reads the backdrop: the lens and the
    /// blur.
    fn overflow(&self) -> f32 {
        let (thickness, blur) = self.thickness_and_blur();
        thickness + blur
    }

    /// The fill the material tints its backdrop with, in the appearance and
    /// contrast now.
    fn tint(&self) -> Hsla {
        match self.variant {
            GlassVariant::Clear => tokens::glass_fill(numbers::CLEAR),
            GlassVariant::Thick => tokens::glass_fill(numbers::THICK),
            GlassVariant::Tinted(color) => Hsla {
                a: numbers::TINTED_ALPHA,
                ..color
            },
            GlassVariant::Interactive | GlassVariant::Regular => {
                tokens::glass_fill(numbers::REGULAR)
            }
        }
    }

    /// How much the tint may thicken over a backdrop that would hide the
    /// label (0 for clear glass, which is not for text).
    fn adapts(&self) -> f32 {
        match self.variant {
            GlassVariant::Clear => 0.0,
            _ => 1.0,
        }
    }
}

/// The press of an interactive glass surface, sprung on the UI thread.
#[derive(Clone, Copy)]
pub struct Press {
    value: AnimatedValue,
}

impl Press {
    /// A press at rest.
    pub fn new() -> Self {
        Self {
            value: animated_value(0.0),
        }
    }

    /// The press begins: a spring, or at once with Reduce Motion.
    pub fn down(&self) {
        if reduce_motion() {
            self.value.set(numbers::PRESS_HELD);
        } else {
            self.value.spring(
                numbers::PRESS_HELD,
                spring(numbers::PRESS_DAMPING, numbers::PRESS_STIFFNESS),
            );
        }
    }

    /// It ends.
    pub fn up(&self) {
        if reduce_motion() {
            self.value.set(0.0);
        } else {
            self.value.spring(
                0.0,
                spring(numbers::RELEASE_DAMPING, numbers::RELEASE_STIFFNESS),
            );
        }
    }

    fn lens(&self) -> AnimatedNode {
        self.value
            .interpolate(&[0.0, numbers::PRESS_HELD], &[1.0, numbers::PRESS_LENS])
    }

    fn bloom(&self) -> AnimatedNode {
        self.value.interpolate(
            &[0.0, numbers::PRESS_HELD],
            &[numbers::BLOOM, numbers::PRESS_BLOOM],
        )
    }

    fn lift(&self) -> AnimatedNode {
        self.value
            .interpolate(&[0.0, numbers::PRESS_HELD], &[0.0, numbers::PRESS_LIFT])
    }

    /// The squash of the surface under the finger (none with Reduce Motion).
    fn scale(&self) -> AnimatedNode {
        self.value.interpolate(
            &[0.0, numbers::PRESS_HELD],
            &[
                1.0,
                if reduce_motion() {
                    1.0
                } else {
                    numbers::PRESS_SCALE
                },
            ],
        )
    }
}

impl Default for Press {
    fn default() -> Self {
        Self::new()
    }
}

fn spring(damping: f32, stiffness: f32) -> Spring {
    Spring {
        stiffness,
        ..Spring::default()
    }
    .damping_ratio(damping)
}

fn vector(values: [f32; 4]) -> UniformValue {
    UniformValue::List(values.map(UniformValue::Number).to_vec())
}

/// The two shape slots the shader has, as it takes them.
fn shape_slots(first: &[[f32; 4]], second: &[[f32; 4]]) -> (UniformValue, UniformValue) {
    let slots = |list: &[[f32; 4]], fallback: &[[f32; 4]]| {
        UniformValue::List(
            (0..2)
                .map(|i| vector(list.get(i).or(fallback.get(i)).copied().unwrap_or([0.0; 4])))
                .collect(),
        )
    };
    (slots(first, first), slots(second, first))
}

/// The material of a surface: an element filling its parent's box, drawn by
/// the shader, or — where no shader draws — by the material's own fill and
/// blur, which is what the bars drew before the shader existed.
///
/// It is a shader *effect*, not a fill, because its pictures reach
/// `maxSampleOffset` points beyond the box, and only an effect gets them: a
/// fill's frame is clipped to its box on iOS and squeezed into it on the web,
/// so the lens would sample the wrong pixels. An effect without a program (a
/// machine with a GPU NSH cannot open, a build without the compiler) draws
/// its children as they are; this one has none, and the fallback's fill and
/// blur stand in for it.
///
/// Add it as a container's first child; what comes after it draws over it.
/// The container must have no padding of its own (put the padding on an inner
/// view): the layer covers the container's box.
pub fn layer(spec: GlassSpec, press: Option<Press>) -> impl IntoElement {
    let shader_spec = spec.clone();
    let material_spec = spec;
    when(
        move || shaders_available() && program().is_some(),
        move || shader_layer(shader_spec.clone(), press),
    )
    .otherwise(move || material_layer(&material_spec))
}

fn shader_layer(spec: GlassSpec, press: Option<Press>) -> ShaderView {
    let (thickness, blur) = spec.thickness_and_blur();
    let mut glass = shader_effect().max_sample_offset(px(spec.overflow()));
    let Some(program) = program() else {
        return glass.absolute().inset_0();
    };
    let tint = spec.clone();
    let quality = spec.quality.taps();
    let light = spec.light.to_radians();
    let (first, second) = shape_slots(&spec.first, &spec.second);
    let grouped = !spec.first.is_empty();
    let radii = if grouped {
        vector([spec.radii[0]; 4])
    } else {
        vector(spec.radii)
    };
    let other = if grouped {
        vector([spec.radii[1]; 4])
    } else {
        vector([0.0; 4])
    };
    glass = glass
        .source(program)
        .uniform("tint", move || tint.tint())
        .uniform("radii", radii)
        .uniform("other_radii", other)
        .uniform("first", first)
        .uniform("second", second)
        .uniform("count", if spec.first.len() > 1 { 2.0_f32 } else { 1.0 })
        .uniform("spacing", spec.spacing)
        .uniform("light", [light.cos(), light.sin()])
        .uniform("bevel", numbers::BEVEL)
        .uniform("thickness", thickness)
        .uniform("lens", numbers::LENS)
        .uniform("specular", numbers::SPECULAR)
        .uniform("bloom", numbers::BLOOM)
        .uniform("chroma", numbers::CHROMA)
        .uniform("blur", blur)
        .uniform("taps", quality)
        .uniform("inner", numbers::INNER)
        .uniform("edge", numbers::EDGE)
        .uniform("adapt", spec.adapts())
        .uniform("dark", move || if dark() { 1.0_f32 } else { 0.0 });
    if let Some(progress) = &spec.merge {
        glass = glass.uniform("progress", progress);
    }
    if let Some(press) = press {
        glass = glass
            .uniform("lens", &press.lens())
            .uniform("bloom", &press.bloom())
            .uniform("lift", &press.lift());
    }
    glass.absolute().inset_0()
}

/// The material without a GPU shader: the fill and blur of
/// [`crate::tokens::materials`].
fn material_layer(spec: &GlassSpec) -> View {
    let name = match spec.variant {
        GlassVariant::Clear => "ultra-thin",
        GlassVariant::Thick => "thick",
        _ => "regular",
    };
    view()
        .absolute()
        .inset_0()
        .bg(move || tokens::materials::fill(name, dark(), false))
        .backdrop_blur(tokens::materials::blur(name))
}

/// The props of [`Glass`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct GlassProps {
    /// `"rounded"` (the default), `"capsule"` or `"circle"`. A circle needs
    /// a square box; in a wider one it reads as a capsule.
    pub shape: Prop<Option<SharedString>>,
    /// The corner radius in points, for `"rounded"` (0 unless set).
    pub radius: Prop<Option<f32>>,
    /// `"regular"` (the default), `"clear"`, `"thick"`, `"interactive"` or
    /// `"tinted"`.
    pub variant: Prop<Option<SharedString>>,
    /// The colour of the `"tinted"` variant: a token name (`system-blue`,
    /// `label`), as [`crate::Icon`] takes one.
    pub tint: Prop<Option<SharedString>>,
    /// The direction the light comes from, in degrees (315: the upper left).
    pub light: Prop<Option<f32>>,
    /// `"high"` (13 blur samples), `"balanced"` (5, the default) or `"low"`
    /// (1: no blur of its own, for weak GPUs).
    pub quality: Prop<Option<SharedString>>,
    /// The surface answers presses: it squashes, its light blooms and it
    /// lenses harder while held (none of it with Reduce Motion).
    pub interactive: Prop<Option<bool>>,
    /// What draws over the glass.
    pub children: Prop<Children>,
}

/// A glass surface: the material of the floating layer, over what is behind
/// it.
///
/// Put it on bars, sheets, alerts, menus and floating controls — never on
/// content, which the HIG puts on a solid background. Text and icons added as
/// children stay crisp: the shader draws the backdrop, the platform draws the
/// content over it.
#[component]
pub fn Glass(props: GlassProps) -> impl IntoElement {
    let spec = spec_of(
        props.shape.get_untracked().as_deref(),
        props.radius.get_untracked(),
        props.variant.get_untracked().as_deref(),
        props.tint.get_untracked().as_deref(),
        props.light.get_untracked(),
        props.quality.get_untracked().as_deref(),
    );
    let interactive = props.interactive.get_untracked().unwrap_or(false)
        || spec.variant == GlassVariant::Interactive;
    let press = interactive.then(Press::new);
    let pill = matches!(
        props.shape.get_untracked().as_deref(),
        Some("capsule") | Some("circle")
    );
    let radius = props.radius.get_untracked().unwrap_or(0.0);
    let surface = view()
        .relative()
        .w_full()
        .h_full()
        .child(layer(spec.clone(), press));
    let surface = if pill {
        surface.rounded_full()
    } else {
        surface.rounded(px(radius))
    };
    match press {
        Some(press) => {
            let held = press;
            let released = press;
            surface
                .bind_scale(&press.scale())
                .on_press_down(move || held.down())
                .on_press(move || released.up())
                .child(props.children)
        }
        None => surface.child(props.children),
    }
}

/// The spec a component's props describe.
pub(crate) fn spec_of(
    shape: Option<&str>,
    radius: Option<f32>,
    variant: Option<&str>,
    tint: Option<&str>,
    light: Option<f32>,
    quality: Option<&str>,
) -> GlassSpec {
    let spec = match shape {
        Some("capsule") => GlassSpec::capsule(),
        Some("circle") => GlassSpec::circle(),
        _ => GlassSpec::rounded(radius.unwrap_or(0.0)),
    };
    let spec = spec.variant(match variant {
        Some("clear") => GlassVariant::Clear,
        Some("thick") => GlassVariant::Thick,
        Some("interactive") => GlassVariant::Interactive,
        Some("tinted") => {
            GlassVariant::Tinted(tint.map(tokens::system).unwrap_or_else(tokens::system_blue))
        }
        _ => GlassVariant::Regular,
    });
    let spec = match light {
        Some(degrees) => spec.light(degrees),
        None => spec,
    };
    match quality {
        Some(name) => spec.quality(GlassQuality::named(name)),
        None => spec,
    }
}

/// The props of [`GlassButton`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct GlassButtonProps {
    /// The button's text; leave it out for an icon-only button.
    pub title: Prop<Option<SharedString>>,
    /// An icon before the title, by name ([`crate::icon::NAMES`]).
    pub icon: Prop<Option<SharedString>>,
    /// What screen readers say.
    pub label: Prop<Option<SharedString>>,
    /// Dimmed and not pressable.
    pub disabled: Prop<Option<bool>>,
}

/// The events of a [`GlassButton`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum GlassButtonEvent {
    /// It was pressed.
    Press,
}

/// A floating control of glass: a capsule that springs and blooms under the
/// finger, with an icon or a short title inside.
///
/// It is the `interactive` variant of [`Glass`]: a press squashes it to
/// 96,5 %, widens the specular rim and lenses the backdrop harder, and Reduce
/// Motion collapses every step.
#[component]
pub fn GlassButton(props: GlassButtonProps, cx: Scope<GlassButtonEvent>) -> impl IntoElement {
    let press = Press::new();
    let spec = GlassSpec::capsule().variant(GlassVariant::Interactive);
    let disabled = props.disabled.get_untracked().unwrap_or(false);
    let title = props.title.get_untracked();
    let icon_name = props.icon.get_untracked();
    let label = props
        .label
        .get_untracked()
        .or_else(|| title.clone())
        .unwrap_or_default();
    let color = if disabled {
        tokens::tertiary_label()
    } else {
        tokens::label()
    };
    let held = press;
    let released = press;
    let mut button = nsh_base::button()
        .relative()
        .min_h(px(44.0))
        .rounded_full()
        .accessibility_label(label)
        .role(AccessibilityRole::Button)
        .disabled(disabled)
        .bind_scale(&press.scale())
        .on_press_down(move || held.down())
        .on_press(move || {
            released.up();
            cx.emit(GlassButtonEvent::Press);
        })
        .child(layer(spec.clone(), Some(press)))
        .child(
            view()
                .flex_row()
                .items_center()
                .justify_center()
                .gap(px(6.0))
                .px(px(16.0))
                .min_h(px(44.0))
                .when_some(icon_name, |v, name| {
                    v.child(crate::icon::icon(&name, 20.0).text_color(color))
                })
                .when_some(title, |v, title| {
                    v.child(
                        text(title)
                            .text_size(px(17.0))
                            .line_height(px(22.0))
                            .font_weight(FontWeight(600))
                            .text_color(color),
                    )
                }),
        );
    if disabled {
        button = button.opacity(0.5);
    }
    button
}

/// One shape of a [`GlassGroup`]: a rect in points from the group's top-left
/// corner, and its corner radius.
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct GlassRect {
    /// From the group's left edge.
    pub x: f32,
    /// From the group's top edge.
    pub y: f32,
    /// Its width.
    pub width: f32,
    /// Its height.
    pub height: f32,
    /// Its corner radius (`-1` for a capsule, `-2` for a circle).
    pub radius: f32,
}

impl GlassRect {
    /// A rounded rect.
    pub fn new(x: f32, y: f32, width: f32, height: f32, radius: f32) -> Self {
        Self {
            x,
            y,
            width,
            height,
            radius,
        }
    }

    /// A circle of `side` points at (`x`, `y`).
    pub fn circle(x: f32, y: f32, side: f32) -> Self {
        Self::new(x, y, side, side, -2.0)
    }

    fn rect(&self) -> [f32; 4] {
        [self.x, self.y, self.width, self.height]
    }
}

/// The props of [`GlassGroup`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct GlassGroupProps {
    /// The shapes now: one or two.
    #[prop(default)]
    pub shapes: Prop<Vec<GlassRect>>,
    /// Where they spring to while `merged` is set; left out, they stay.
    #[prop(default)]
    pub merged_shapes: Prop<Vec<GlassRect>>,
    /// Fuse the shapes into the `merged_shapes` ones: one material region,
    /// a spring of 250 ms (at once with Reduce Motion).
    pub merged: Prop<Option<bool>>,
    /// How many points apart two shapes still fuse into one (`0`: only
    /// where they touch).
    pub spacing: Prop<Option<f32>>,
    /// The look of the material.
    pub variant: Prop<Option<SharedString>>,
    /// What draws over the glass, positioned by the app as the shapes are.
    pub children: Prop<Children>,
}

/// Two glass shapes in one material: they share a sampling region and, within
/// `spacing`, fuse into one silhouette with a smooth neck.
///
/// This is the crate's reading of Apple's `GlassEffectContainer`: the shapes
/// are described as rects and drawn by one shader, so the lens and the
/// specular follow the fused outline, and `merged` springs them between two
/// layouts. It takes at most two shapes, and it does not morph a shape's
/// *content* between layouts: more shapes, or a material per shape, need one
/// [`Glass`] each and lose the shared region.
#[component]
pub fn GlassGroup(props: GlassGroupProps) -> impl IntoElement {
    let from = props.shapes.get_untracked();
    let to = props.merged_shapes.get_untracked();
    let merged = props.merged;
    let progress = animated_value(0.0);
    let shown = stored(false);
    effect(move || {
        let wanted = merged.get().unwrap_or(false);
        if shown.get() == wanted {
            return;
        }
        shown.replace(wanted);
        let wanted = if wanted { 1.0 } else { 0.0 };
        if reduce_motion() {
            progress.set(wanted);
        } else {
            progress.spring(
                wanted,
                spring(numbers::MERGE_DAMPING, numbers::MERGE_STIFFNESS),
            );
        }
    });
    let target = if to.is_empty() { from.clone() } else { to };
    let slot =
        |list: &[GlassRect], index: usize| list.get(index).map(GlassRect::rect).unwrap_or([0.0; 4]);
    let radii = [
        from.first().map(|shape| shape.radius).unwrap_or(0.0),
        from.get(1).map(|shape| shape.radius).unwrap_or(0.0),
    ];
    let spec = spec_of(
        None,
        None,
        props.variant.get_untracked().as_deref(),
        None,
        None,
        None,
    )
    .group(
        [slot(&from, 0), slot(&from, 1)],
        [slot(&target, 0), slot(&target, 1)],
        radii,
        progress.animated_node(),
        props.spacing.get_untracked().unwrap_or(0.0),
    );
    view()
        .relative()
        .child(layer(spec.clone(), None))
        .child(props.children)
}

/// The glass a material name of the bars stands for: `thin` and `ultra-thin`
/// read as clear glass, `thick` is the heavier fill of a sheet, and
/// `regular` and `chrome` are the default.
pub(crate) fn material_spec(name: &str, corners: [f32; 4]) -> GlassSpec {
    let variant = match name {
        "ultra-thin" | "thin" => GlassVariant::Clear,
        "thick" => GlassVariant::Thick,
        _ => GlassVariant::Regular,
    };
    GlassSpec::corners(corners).variant(variant)
}
