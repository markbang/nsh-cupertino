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
  chroma: f32,
  blur: f32,
  taps: f32,
  adapt: f32,
  dark: f32,
  tilt: f32,
  saturation: f32,
  frost_opacity: f32,
  frost_clamp: f32,
  frost_weight: f32,
  rim_shade: f32,
  rim_light: f32,
  body_shade: f32,
  reveal: f32,
  morph: f32,
  anchor: f32,
  min_radius: f32,
  margin: f32,
  shadow: f32,
  light_lift: f32,
  roundness: f32,
  body: f32,
  shadow_offset: f32,
  shadow_sigma: f32,
  two_scale_tint: f32,
  two_scale_alpha: f32,
  two_scale_amount: f32,
  lowered: f32,
  swell: f32,
  swell_margin: f32,
}

// A menu's body (`body` >= 0): the backdrop blurred, saturated by this much
// and tinted by `tint` at `tint.a * body`, flat, with the glass only at its
// rim (`GlassSpec::menu_body`).
const BODY_SATURATION: f32 = 1.5;

const TAU: f32 = 6.283185307;
const GOLDEN: f32 = 2.39996323;
const LUMA: vec3f = vec3f(0.2126, 0.7152, 0.0722);

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
    return vec4f(0.0, 0.0, nsh.size * 0.5 - vec2f(uniforms.margin));
  }
  let c = vec2f(shape.x + shape.z * 0.5, shape.y + shape.w * 0.5) - nsh.size * 0.5;
  return vec4f(c.x, c.y, shape.z * 0.5, shape.w * 0.5);
}

fn sd_shape(p: vec2f) -> f32 {
  let a = mix(settle(uniforms.first[0]), settle(uniforms.second[0]), uniforms.progress);
  // A growing menu rounds its corners toward a capsule: `roundness` 1 is a
  // capsule of the shape's size now, 0 its own radius.
  var radii = uniforms.radii;
  if (uniforms.roundness > 0.0) {
    radii = mix(radii, vec4f(min(a.z, a.w)), clamp(uniforms.roundness, 0.0, 1.0));
  }
  var d = sd_one(p - a.xy, a.zw, radii);
  if (uniforms.count > 1.5) {
    let b = mix(settle(uniforms.first[1]), settle(uniforms.second[1]), uniforms.progress);
    d = smin(d, sd_one(p - b.xy, b.zw, uniforms.other_radii), uniforms.spacing);
  }
  return d;
}

// The floating bar's minimized silhouette: a small pill around the selected
// tab, blended into the bar's own as `morph` runs.
fn sd_silhouette(at: vec2f) -> f32 {
  // `lowered` drops the silhouette inside the canvas (a web tab bar that keeps
  // its canvas still, `GlassSpec::lowered`); `swell` scales it about the
  // canvas's centre (`GlassSpec::swell`), its distances with it.
  let s = max(uniforms.swell, 1e-3);
  let p = (at - vec2f(0.0, uniforms.lowered)) / s;
  let d = sd_shape(p);
  if (uniforms.morph <= 0.0 || uniforms.min_radius <= 0.0) {
    return d * s;
  }
  let centre = vec2f((uniforms.anchor - 0.5) * (nsh.size.x - 2.0 * uniforms.swell_margin), 0.0);
  let min = sd_one(p - centre, vec2f(uniforms.min_radius), vec4f(-1.0, 0.0, 0.0, 0.0));
  return mix(d, min, clamp(uniforms.morph, 0.0, 1.0)) * s;
}

// The two-scale layers' box, which swells with the page's views.
fn sd_layers(p: vec2f) -> f32 {
  let s = max(uniforms.swell, 1e-3);
  return sd_shape(p / s) * s;
}

// The difference across one axis from the SDF at −e, 0 and +e: the central
// difference, except on a kink (a capsule's centre line, which the minimise
// carries into the lens tip), where the one-sided slopes have opposite signs
// and the central one cancels; there the steeper side, at the same scale.
// k is the kink's slope change the three samples imply: 1 on a capsule's
// centre line, at least 0.48 on the lens axis of the minimise's frames 4-6,
// at most 0.41 at a smooth extremum (a circle's centre line), which keeps the
// central difference. `straddles` is `sd_gradient`'s test that the stencil
// sits across a kink at all.
fn sd_slope(below: f32, at: f32, above: f32, e: f32, straddles: bool) -> f32 {
  let forward = above - at;
  let backward = at - below;
  if (straddles && forward * backward < 0.0) {
    let r = abs(forward + backward) / max(abs(forward), abs(backward));
    let k = abs(forward - backward) / e / (2.0 - r);
    if (k >= 0.45) {
      return 2.0 * select(backward, forward, abs(forward) > abs(backward));
    }
  }
  return above - below;
}

// A distance field has a gradient of length 1 almost everywhere (the eikonal
// equation); a central-difference gradient well below 1 means the stencil
// straddles a kink, where the two sides' slopes cancel. 0.68 sits in the
// measured gap: at most 0.567 at the lens tip of frames 4-6 (both renders),
// at least 0.794 on a circle's centre line 0.5-0.83 pt from its centre,
// where the slope test alone also fires (up to 0.639 at a capsule's cap
// centre).
fn sd_gradient(p: vec2f, at: f32) -> vec2f {
  let e = 0.6;
  let left = sd_silhouette(p - vec2f(e, 0.0));
  let right = sd_silhouette(p + vec2f(e, 0.0));
  let up = sd_silhouette(p - vec2f(0.0, e));
  let down = sd_silhouette(p + vec2f(0.0, e));
  let straddles = length(vec2f(right - left, down - up)) / (2.0 * e) < 0.68;
  let gx = sd_slope(left, at, right, e, straddles);
  let gy = sd_slope(up, at, down, e, straddles);
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
  let uv = p / size + vec2f(0.5);
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

fn apply_saturation(color: vec3f, amount: f32) -> vec3f {
  let l = dot(color, LUMA);
  return clamp(mix(vec3f(l), color, amount), vec3f(0.0), vec3f(1.0));
}

// A short, cheap blur: iOS 27's glass blurs by a few points, not twenty, so the
// structure under the bar survives. The ghost is the same disc weighted toward
// white texels (the frost's `blurWeight`): it is what makes dark glass read as
// lit rather than smoked.
fn sample(p: vec2f, jitter: f32) -> vec3f {
  let count = max(min(uniforms.taps, 33.0), 1.0);
  var sum = vec3f(0.0);
  var ghost = vec3f(0.0);
  var weight = 0.0;
  for (var i = 0; i < 33; i = i + 1) {
    if (f32(i) >= count) {
      break;
    }
    let fi = f32(i) + 0.5;
    let angle = fi * GOLDEN + jitter;
    let radius = pow(fi / count, 0.7) * uniforms.blur;
    let c = backdrop_at(p + vec2f(cos(angle), sin(angle)) * radius).rgb;
    let w = 1.0 + uniforms.frost_weight * pow(dot(c, LUMA), 2.0);
    sum = sum + c;
    ghost = ghost + c * w;
    weight = weight + w;
  }
  let cloud = sum / count;
  let lit = ghost / max(weight, 1e-4);
  // frost = op * cloud + (1 - op) * held, as `liquid_glass_widgets` writes it:
  // a positive clamp keeps the ghost at most that much darker than the cloud,
  // a negative one at most that much brighter.
  let held = select(
    max(lit, cloud - vec3f(uniforms.frost_clamp)),
    min(lit, cloud - vec3f(uniforms.frost_clamp)),
    uniforms.frost_clamp > 0.0,
  );
  let frost = select(uniforms.frost_opacity, 1.0, uniforms.body >= 0.0);
  return mix(held, cloud, frost);
}

fn shade(uv: vec2f) -> vec4f {
  let size = nsh.size;
  if (size.x < 1.0 || size.y < 1.0) {
    return vec4f(0.0);
  }
  let p = uv * size - size * 0.5;
  let sdf = sd_silhouette(p);
  let coverage = clamp(0.5 - sdf, 0.0, 1.0) * clamp(uniforms.reveal, 0.0, 1.0);
  // The web tab bar's two-scale layers keep the bar's box while they carry any
  // of the body (`two_scale_amount` > 0), and the silhouette may have shrunk
  // inside it: there this canvas draws the page itself over them, from the
  // backdrop picture (which leaves the layers out), so no layer shows outside
  // the glass. Opaque to 0.5 pt past their box, so their own edge, a pixel
  // wide, is covered whole; then a 1 pt ramp to nothing over the page.
  var ring = 0.0;
  if (uniforms.two_scale_alpha > 0.0 && uniforms.two_scale_amount > 0.0 && uniforms.morph > 0.0) {
    ring = clamp(1.5 - sd_layers(p), 0.0, 1.0);
  }
  if (coverage <= 0.0 && ring > 0.0) {
    return vec4f(backdrop_at(p).rgb, ring);
  }
  if (coverage <= 0.0) {
    // The drop shadow lives in the margin around the shape: the shape lowered
    // by 6 pt, blurred over 9. Above and to the sides of the glass, the page
    // keeps what the next sibling draws; only this soft dark edge is added.
    if (uniforms.shadow <= 0.0) {
      return vec4f(0.0);
    }
    // A measured shadow: the shape lowered by `shadow_offset`, blurred by a
    // Gaussian of `shadow_sigma` (a logistic stand-in for its CDF), fading
    // with `reveal` as the shape does.
    if (uniforms.shadow_sigma > 0.0) {
      let lowered = sd_silhouette(p - vec2f(0.0, uniforms.shadow_offset));
      let soft = uniforms.shadow * clamp(uniforms.reveal, 0.0, 1.0)
        / (1.0 + exp(1.702 * lowered / uniforms.shadow_sigma));
      return vec4f(vec3f(0.0), soft);
    }
    let below = sd_silhouette(p - vec2f(0.0, 6.0));
    let soft = clamp(0.5 - below / 9.0, 0.0, 1.0) * uniforms.shadow;
    return vec4f(vec3f(0.0), soft);
  }

  // The height field: a bevel of `bevel` points at the rim, flat inside.
  let inside = -sdf;
  let t = clamp(inside / max(uniforms.bevel, 0.5), 0.0, 1.0);
  let rim = 1.0 - t;

  // The web tab bar's two-scale body (`GlassSpec::two_scale`, tokens `bar`):
  // the ghost and the frost are CSS backdrop layers under this canvas, so the
  // body here is the measured tint alone, at `two_scale_alpha` over them.
  // `hand` gives the body to the layers between 1.5 and 6 pt inside the edge,
  // past the hairline, the rim light's core and the rim's shade, which stay
  // the glass's; `two_scale_amount` (1 expanded, 0 minimised, on its own
  // clock) crossfades it with the shader's own body while the layers stay
  // whole under it.
  var hand = 0.0;
  if (uniforms.two_scale_alpha > 0.0) {
    // Only over the layers: a lowered silhouette leaves their box at its foot.
    let over = min(inside, -sd_layers(p));
    hand = smoothstep(1.5, 6.0, over) * clamp(uniforms.two_scale_amount, 0.0, 1.0);
  }
  if (hand >= 1.0) {
    return vec4f(vec3f(uniforms.two_scale_tint), coverage * uniforms.two_scale_alpha);
  }

  let normal = sd_gradient(p, sdf);

  // The lens: a paraxial lens of 1.24 over `thickness` shifts the picture at
  // the rim by (n - 1) * thickness * slope; a press also magnifies the sheet.
  let flat = uniforms.body >= 0.0;
  let shift = normal * (uniforms.thickness * pow(rim, 1.6)) - p * select(uniforms.lens, 0.0, flat);
  let jitter = hash_cell(floor((uv * size - vec2f(uniforms.swell_margin)) * nsh.scale)) * 0.5;
  var rgb = sample(p + shift, jitter);

  // A pixel of chromatic separation along the rim, as a thick edge spreads the
  // channels.
  if (uniforms.chroma > 0.0 && rim > 0.5) {
    let off = normal * (uniforms.chroma * rim);
    let weight = 0.22 * (rim - 0.5) / 0.5;
    rgb.r = mix(rgb.r, backdrop_at(p + shift + off).r, weight);
    rgb.b = mix(rgb.b, backdrop_at(p + shift - off).b, weight);
  }

  // Dark glass pulls a bright backdrop down (`bodyShade`), and both
  // appearances lift toward white where the backdrop is dark: the frost's
  // clamp does that, and the tint adds its 12 % (dark) or 53 % (light).
  var luminance = dot(rgb, LUMA);
  rgb = rgb * (1.0 - select(uniforms.body_shade, 0.0, flat) * luminance);

  // The tint thickens only where the backdrop would fight a label, and never
  // past 70 %: it is a tint on glass, not an opaque slab.
  let fight = select(
    smoothstep(0.62, 0.16, luminance),
    smoothstep(0.32, 0.86, luminance),
    uniforms.dark > 0.5,
  );
  let adaptive = clamp(uniforms.tint.a + uniforms.adapt * fight * 0.16, 0.0, 0.7);
  let alpha = select(adaptive, clamp(uniforms.tint.a * uniforms.body, 0.0, 1.0), flat);
  if (flat) {
    rgb = apply_saturation(rgb, mix(BODY_SATURATION, 1.0, uniforms.dark));
  }
  rgb = mix(rgb, uniforms.tint.rgb, alpha);

  if (!flat) {
    rgb = apply_saturation(rgb, uniforms.saturation);
  }
  // iOS 27's light glass over a white page of dark rows reads almost white;
  // our 24 pt cloud still carries a little of the strokes, so the light
  // material lifts a further 10 % toward white.
  rgb = mix(rgb, vec3f(1.0), select(uniforms.light_lift, 0.0, flat));
  luminance = dot(rgb, LUMA);

  // The light, a direction the app may turn with `tilt` (iOS 27 lights the
  // light material from below and the dark one from above).
  let c = cos(uniforms.tilt);
  let s = sin(uniforms.tilt);
  let light = vec2f(
    uniforms.light.x * c - uniforms.light.y * s,
    uniforms.light.x * s + uniforms.light.y * c,
  );
  // Both ends of the light axis catch it alike: iOS's rim peaks are equal
  // top and bottom (tab bar 102 / 101 dark, back button 54 / 54).
  let axis = abs(dot(normal, light));
  let lobe = axis * axis * axis;

  // The iOS 27 rim light: a sharp core one point inside the hairline, a tail
  // a few points into the body, on the two ends of the light axis; stronger
  // where the body is dark. Plus a soft sheen across the surface.
  let ease = pow(1.0 - clamp(luminance, 0.0, 1.0), 0.3);
  let core = exp(-max(inside - 0.7, 0.0) / 1.4);
  let tail = exp(-max(inside - 0.7, 0.0) / 7.0);
  rgb = rgb + vec3f(1.0) * uniforms.rim_light * lobe * ease * (0.30 * core + 0.05 * tail);
  let along = clamp(0.5 + 0.5 * dot((p - vec2f(0.0, uniforms.lowered)) / max((size - vec2f(2.0 * uniforms.swell_margin)) * 0.5, vec2f(1.0)), light), 0.0, 1.0);
  rgb = rgb + vec3f(1.0) * select(uniforms.specular, 0.0, flat) * 0.055 * pow(along, 2.0) * (1.0 - 0.5 * rim);

  // The hairline: the backdrop at its own position, darkened; strongest at
  // the ends of the light axis and fading across it. On a white page the fill cannot
  // separate the glass from the page — this line and the soft band inside it
  // are what make the shape a surface rather than a smudge.
  let line = smoothstep(1.1, 0.0, inside);
  let ends = 0.55 + 0.45 * axis;
  rgb = rgb - vec3f(1.0) * line * uniforms.rim_shade * 0.10 * clamp(ends, 0.0, 1.0);
  rgb = rgb - vec3f(1.0) * smoothstep(6.0, 0.0, inside) * uniforms.rim_shade * 0.04;

  // The very edge catches the light: a bright hairline all round, stronger
  // at the ends of the light axis.
  rgb = rgb + vec3f(1.0) * line * ease * (0.18 + 0.35 * axis);

  let surface = clamp(rgb, vec3f(0.0), vec3f(1.0));
  if (hand <= 0.0) {
    return over_ring(surface, coverage, coverage, ring, p);
  }
  // Over the layers L the canvas must show
  // hand·(β·tint + (1 − β)·L) + (1 − hand)·surface: alpha 1 − hand·(1 − β)
  // and the straight colour that gives it.
  let beta = uniforms.two_scale_alpha;
  let opacity = 1.0 - hand * (1.0 - beta);
  let colour = (hand * beta * vec3f(uniforms.two_scale_tint) + (1.0 - hand) * surface) / opacity;
  return over_ring(clamp(colour, vec3f(0.0), vec3f(1.0)), coverage * opacity, coverage, ring, p);
}

// The glass (`rgb` at `alpha`, its silhouette covering `coverage` of the
// pixel) over the page drawn in the ring outside it (`ring`).
fn over_ring(rgb: vec3f, alpha: f32, coverage: f32, ring: f32, p: vec2f) -> vec4f {
  let cover = ring * (1.0 - coverage);
  if (cover <= 0.0) {
    return vec4f(rgb, alpha);
  }
  let a = alpha + cover;
  return vec4f((rgb * alpha + backdrop_at(p).rgb * cover) / max(a, 1e-4), min(a, 1.0));
}
"#;

/// The clip of a growing glass shape: an effect that draws its children
/// only inside the shape [`GlassSpec::grow`] draws, with the same rects,
/// progress, radius and roundness, so a menu's items are cut by the round
/// top of the shape they grow in.
const CLIP_SOURCE: &str = r#"
struct Uniforms {
  first: vec4f,
  second: vec4f,
  radius: f32,
  progress: f32,
  roundness: f32,
  pad: f32,
}

fn centred(shape: vec4f) -> vec4f {
  let c = vec2f(shape.x + shape.z * 0.5, shape.y + shape.w * 0.5) - nsh.size * 0.5;
  return vec4f(c.x, c.y, shape.z * 0.5, shape.w * 0.5);
}

fn shade(uv: vec2f) -> vec4f {
  let p = uv * nsh.size - nsh.size * 0.5;
  let a = mix(centred(uniforms.first), centred(uniforms.second), uniforms.progress);
  let half = max(a.zw, vec2f(0.0));
  let round = min(half.x, half.y);
  let r = min(mix(uniforms.radius, round, clamp(uniforms.roundness, 0.0, 1.0)), round);
  let q = abs(p - a.xy) - half + vec2f(r);
  let d = length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
  let c = sample_content(uv);
  return vec4f(c.rgb, c.a * clamp(0.5 - d, 0.0, 1.0));
}
"#;

fn clip_program() -> Option<Shader> {
    static PROGRAM: OnceLock<Option<Shader>> = OnceLock::new();
    PROGRAM
        .get_or_init(|| Shader::compile(CLIP_SOURCE).ok())
        .clone()
}

/// An effect that shows its children only inside a shape growing from
/// `from` to `to` (rects in points from its top-left corner) as `progress`
/// runs, its corners a capsule's at `roundness` 1 and `radius` at 0. Without
/// a shader program it draws them as they are.
pub(crate) fn clip(
    from: Signal<[f32; 4]>,
    to: Signal<[f32; 4]>,
    radius: f32,
    progress: AnimatedNode,
    roundness: AnimatedNode,
) -> ShaderView {
    let effect = shader_effect();
    let Some(program) = clip_program() else {
        return effect;
    };
    effect
        .source(program)
        .uniform("first", move || vector(from.get()))
        .uniform("second", move || vector(to.get()))
        .uniform("radius", radius)
        .uniform("progress", &progress)
        .uniform("roundness", &roundness)
}

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

/// Whether the material is the shader here (else the fill and blur of
/// [`crate::tokens::materials`] stand in for it).
pub(crate) fn shader_draws() -> bool {
    shaders_available() && program().is_some()
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
            GlassQuality::High => 33.0,
            GlassQuality::Balanced => 17.0,
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
    reveal: Option<AnimatedNode>,
    morph: Option<AnimatedNode>,
    anchor: f32,
    anchor_node: Option<AnimatedNode>,
    blur: Option<f32>,
    margin: f32,
    shadow: f32,
    material_only: bool,
    grow: Option<Grow>,
    body: Option<Body>,
    soft_shadow: Option<(f32, f32)>,
    shadow_amount: Option<AnimatedNode>,
    two_scale: bool,
    two_scale_amount: Option<AnimatedNode>,
    lowered: Option<AnimatedNode>,
    swell: Option<AnimatedNode>,
    swell_margin: f32,
}

/// A menu's flat body ([`GlassSpec::menu_body`]).
#[derive(Debug, Clone, PartialEq)]
struct Body {
    fill: [Hsla; 2],
    amount: AnimatedNode,
}

/// One shape growing between two rects ([`GlassSpec::grow`]).
#[derive(Debug, Clone, PartialEq)]
struct Grow {
    from: Signal<[f32; 4]>,
    to: Signal<[f32; 4]>,
    progress: AnimatedNode,
    roundness: AnimatedNode,
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
            reveal: None,
            morph: None,
            anchor: 0.5,
            anchor_node: None,
            blur: None,
            margin: 0.0,
            shadow: 0.0,
            material_only: false,
            grow: None,
            body: None,
            soft_shadow: None,
            shadow_amount: None,
            two_scale: false,
            two_scale_amount: None,
            lowered: None,
            swell: None,
            swell_margin: 0.0,
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

    /// One shape that grows from the rect `from` to the rect `to` (points
    /// from the surface's top-left corner, as the signals hold them now) as
    /// `progress` runs 0 to 1 (past 1 it overshoots), its corners a capsule's
    /// while `roundness` is 1 and `radius` at 0: a glass control turning into
    /// the menu it opens ([`crate::GlassMenu`]).
    pub(crate) fn grow(
        mut self,
        from: Signal<[f32; 4]>,
        to: Signal<[f32; 4]>,
        radius: f32,
        progress: AnimatedNode,
        roundness: AnimatedNode,
    ) -> Self {
        self.radii = [radius; 4];
        self.grow = Some(Grow {
            from,
            to,
            progress,
            roundness,
        });
        self
    }

    /// A flat body instead of the glass's: the backdrop blurred and tinted by
    /// `fill` (light, dark) at its alpha times `amount`, the glass's lens,
    /// hairline and rim light only at the edge. A menu's material.
    pub(crate) fn menu_body(mut self, fill: [Hsla; 2], amount: AnimatedNode) -> Self {
        self.body = Some(Body { fill, amount });
        self
    }

    /// A Gaussian drop shadow in both appearances: black at `alpha`, the
    /// shape lowered by `offset` and blurred by `sigma` points, in a margin
    /// of `margin` points; it fades with [`GlassSpec::reveal`].
    pub(crate) fn soft_shadow(mut self, margin: f32, alpha: f32, offset: f32, sigma: f32) -> Self {
        self.margin = margin.max(0.0);
        self.shadow = alpha;
        self.soft_shadow = Some((offset, sigma));
        self
    }

    /// The soft shadow at `amount` times its alpha: 1 shows it, 0 drops it at
    /// once (a menu drops its shadow as it closes).
    pub(crate) fn shadow_amount(mut self, amount: AnimatedNode) -> Self {
        self.shadow_amount = Some(amount);
        self
    }

    /// The height of the lens and the blur radius, by variant.
    fn thickness_and_blur(&self) -> (f32, f32) {
        if let Some(blur) = self.blur {
            return (numbers::THICKNESS, blur);
        }
        match self.variant {
            GlassVariant::Clear => (numbers::THICKNESS * 0.6, numbers::BLUR * 0.55),
            GlassVariant::Thick => (numbers::THICKNESS, numbers::BLUR * 1.35),
            GlassVariant::Tinted(..) | GlassVariant::Interactive | GlassVariant::Regular => {
                (numbers::THICKNESS, numbers::BLUR)
            }
        }
    }

    /// How much of the material shows: 0 hides it (a bar at rest over the top
    /// of its content), 1 is the full material. The scroll edge drives it.
    pub fn reveal(mut self, value: &AnimatedNode) -> Self {
        self.reveal = Some(*value);
        self
    }

    /// Draws the fill and blur of [`crate::tokens::materials`] instead of the
    /// shader, whatever the GPU can do: the "material" side of a comparison.
    pub fn material_only(mut self, only: bool) -> Self {
        self.material_only = only;
        self
    }

    /// The tab bar's two-scale body ([`tokens::bar`]) where [`two_scale_active`]
    /// holds: the shader draws the measured tint over [`two_scale_layers`],
    /// which must sit right under it, and keeps its own rim. Elsewhere, and as
    /// the bar minimises, the shader's own body.
    pub(crate) fn two_scale(mut self, on: bool) -> Self {
        self.two_scale = on;
        self
    }

    /// How much of the body the two-scale layers carry, 0 to 1, as an animated
    /// value: the shader crossfades its own body in as it falls, and while it
    /// is above 0 covers the layers wherever the minimising silhouette has
    /// left their box. 1 unless set.
    pub(crate) fn two_scale_amount(mut self, amount: &AnimatedNode) -> Self {
        self.two_scale_amount = Some(*amount);
        self
    }

    /// Drops the silhouette by `amount` points inside the canvas, as an
    /// animated value, where the surface's own box would otherwise move: the
    /// canvas and what lies under it stay where they are.
    pub(crate) fn lowered(mut self, amount: &AnimatedNode) -> Self {
        self.lowered = Some(*amount);
        self
    }

    /// Scales the silhouette, its rim and the two-scale layers' box about the
    /// canvas's centre by `scale`, an animated value (1 at rest), inside a
    /// canvas `margin` points larger on every side than the shape, which the
    /// caller gives the layer (negative insets of `margin`).
    pub(crate) fn swell(mut self, scale: &AnimatedNode, margin: f32) -> Self {
        self.swell = Some(*scale);
        self.margin = margin.max(0.0);
        self.swell_margin = margin.max(0.0);
        self
    }

    /// Morphs the silhouette into the minimized floating bar of a
    /// [`crate::GlassTabBar`]: `progress` runs 0 (the bar) to 1 (a pill of
    /// about 50 pt around the tab at `anchor`).
    pub fn minimized(mut self, progress: &AnimatedNode, anchor: f32) -> Self {
        self.morph = Some(*progress);
        self.anchor = anchor.clamp(0.0, 1.0);
        self
    }

    /// Room for the drop shadow around the shape, in points: the layer's box
    /// grows by it and the shader draws the shadow in the part outside the
    /// shape. `0` draws none.
    pub fn shadow(mut self, margin: f32, strength: f32) -> Self {
        self.margin = margin.max(0.0);
        self.shadow = strength;
        self
    }

    /// The blur radius, in points, over the variant's own: a bar keeps a
    /// frosted 18 pt so text behind it cannot be read, where a small control
    /// stays crisp at 5.
    pub fn blur(mut self, blur: f32) -> Self {
        self.blur = Some(blur);
        self
    }

    /// Where the minimised pill sits, as a fraction of the bar's width, as an
    /// animated value: it slides when the chosen tab changes while the bar is
    /// minimised.
    pub fn anchor(mut self, anchor: &AnimatedNode) -> Self {
        self.anchor_node = Some(*anchor);
        self
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
        self.value.interpolate(
            &[0.0, numbers::PRESS_HELD],
            &[numbers::LENS, numbers::PRESS_LENS],
        )
    }

    /// The squash of the surface under the finger (none with Reduce Motion).
    pub(crate) fn scale(&self) -> AnimatedNode {
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

/// The frost's opacity, clamp and weight for the appearance.
fn frost(dark: bool) -> [f32; 3] {
    if dark {
        numbers::FROST_DARK
    } else {
        numbers::FROST
    }
}

/// The hairline's darkening and the rim light's strength for the appearance.
fn rim(dark: bool) -> [f32; 2] {
    if dark {
        numbers::RIM_DARK
    } else {
        numbers::RIM
    }
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
        move || !material_spec.material_only && shader_draws(),
        move || shader_layer(shader_spec.clone(), press),
    )
    .otherwise(move || material_layer(&material_spec))
}

fn shader_layer(spec: GlassSpec, press: Option<Press>) -> ShaderView {
    let (thickness, blur) = spec.thickness_and_blur();
    let shadow = spec
        .shadow_amount
        .as_ref()
        .map(|amount| amount.mul(spec.shadow));
    let mut glass = shader_effect().max_sample_offset(px(spec.overflow()));
    let Some(program) = program() else {
        return glass.absolute().inset_0();
    };
    let tint = spec.clone();
    let two_scale = spec.two_scale;
    let quality = spec.quality.taps();
    let light_degrees = spec.light;
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
        .uniform("tint", move || match &tint.body {
            Some(body) => body.fill[usize::from(dark())],
            None => tint.tint(),
        })
        .uniform("radii", radii)
        .uniform("other_radii", other)
        .uniform("first", first)
        .uniform("second", second)
        .uniform("count", if spec.first.len() > 1 { 2.0_f32 } else { 1.0 })
        .uniform("spacing", spec.spacing)
        .uniform("light", move || {
            // iOS 27 lights its light material from below and its dark one
            // from above, unless the app chose a direction of its own.
            let degrees = if light_degrees == numbers::LIGHT {
                if dark() {
                    numbers::LIGHT_DARK
                } else {
                    numbers::LIGHT
                }
            } else {
                light_degrees
            };
            let angle = degrees.to_radians();
            [angle.cos(), angle.sin()]
        })
        .uniform("bevel", numbers::BEVEL)
        .uniform("thickness", thickness)
        .uniform("lens", numbers::LENS)
        .uniform("specular", numbers::SPECULAR)
        .uniform("chroma", numbers::CHROMA)
        .uniform("blur", blur)
        .uniform("taps", quality)
        .uniform("adapt", spec.adapts())
        .uniform("dark", move || if dark() { 1.0_f32 } else { 0.0 })
        .uniform("saturation", move || {
            if dark() {
                numbers::SATURATION_DARK
            } else {
                numbers::SATURATION
            }
        })
        .uniform("frost_opacity", move || frost(dark())[0])
        .uniform("frost_clamp", move || frost(dark())[1])
        .uniform("frost_weight", move || frost(dark())[2])
        .uniform("rim_shade", move || rim(dark())[0])
        .uniform("rim_light", move || rim(dark())[1])
        .uniform(
            "body_shade",
            move || if dark() { numbers::BODY_SHADE } else { 0.0 },
        )
        .uniform("reveal", 1.0_f32)
        .uniform("roundness", 0.0_f32)
        .uniform("morph", 0.0_f32)
        .uniform("anchor", spec.anchor)
        .uniform("min_radius", numbers::MIN_RADIUS)
        .uniform("margin", spec.margin)
        .uniform("body", -1.0_f32)
        .uniform("shadow_offset", spec.soft_shadow.map_or(0.0, |s| s.0))
        .uniform("shadow_sigma", spec.soft_shadow.map_or(0.0, |s| s.1))
        .uniform("light_lift", move || if dark() { 0.0_f32 } else { 0.10 })
        .uniform("two_scale_tint", move || {
            if two_scale && two_scale_active() {
                tokens::bar::of(dark()).tint_level() / 255.0
            } else {
                0.0
            }
        })
        .uniform("two_scale_alpha", move || {
            if two_scale && two_scale_active() {
                tokens::bar::of(dark()).tint_alpha()
            } else {
                0.0
            }
        })
        .uniform("two_scale_amount", 1.0_f32)
        .uniform("lowered", 0.0_f32)
        .uniform("swell", 1.0_f32)
        .uniform("swell_margin", spec.swell_margin);
    if let Some(reveal) = &spec.reveal {
        glass = glass.uniform("reveal", reveal);
    }
    // A bound shadow replaces the reactive one: a binding that runs later
    // would overwrite the animated value with a number.
    glass = match &shadow {
        Some(shadow) => glass.uniform("shadow", shadow),
        None => glass.uniform("shadow", move || {
            if spec.soft_shadow.is_none() && dark() {
                0.0_f32
            } else {
                spec.shadow
            }
        }),
    };
    if let Some(morph) = &spec.morph {
        glass = glass.uniform("morph", morph);
    }
    if let Some(amount) = &spec.two_scale_amount {
        glass = glass.uniform("two_scale_amount", amount);
    }
    if let Some(lowered) = &spec.lowered {
        glass = glass.uniform("lowered", lowered);
    }
    if let Some(swell) = &spec.swell {
        glass = glass.uniform("swell", swell);
    }
    if let Some(anchor) = &spec.anchor_node {
        glass = glass.uniform("anchor", anchor);
    }
    if let Some(progress) = &spec.merge {
        glass = glass.uniform("progress", progress);
    }
    if let Some(grow) = spec.grow.clone() {
        let (from, to) = (grow.from, grow.to);
        glass = glass
            .uniform("first", move || {
                UniformValue::List(vec![vector(from.get()), vector([0.0; 4])])
            })
            .uniform("second", move || {
                UniformValue::List(vec![vector(to.get()), vector([0.0; 4])])
            })
            .uniform("count", 1.0_f32)
            .uniform("progress", &grow.progress)
            .uniform("roundness", &grow.roundness);
    }
    if let Some(body) = &spec.body {
        glass = glass.uniform("body", &body.amount);
    }
    if let Some(press) = press {
        glass = glass.uniform("lens", &press.lens());
    }
    glass.absolute().inset_0()
}

/// Whether the tab bar draws iOS's two-scale body ([`tokens::bar`]) here: on
/// the web, where two CSS backdrop layers give the two blur scales, while the
/// shader draws, in normal contrast and without Reduce Transparency.
///
/// The native builds keep the shader's one-disc body: their shader reads one
/// backdrop picture without mips, and whether a platform blur layer under it
/// stays out of that picture, and blurs with a Gaussian of the same σ, is
/// unmeasured there (`docs/design-notes.md`, "What still differs from Apple"). Increased contrast swaps in the near-opaque
/// `glass-regular`, which the measured tint does not describe. Reading it
/// subscribes to the appearance and the theme.
pub(crate) fn two_scale_active() -> bool {
    matches!(nsh_core::element::os(), nsh_core::platform::Os::Web)
        && shader_draws()
        && !reduce_transparency()
        && standard_regular_fill()
}

/// Whether `glass-regular` is the standard-contrast value of the appearance
/// (not the increased-contrast one a [`crate::Theme`] swaps in).
fn standard_regular_fill() -> bool {
    let now = tokens::glass_fill(numbers::REGULAR);
    tokens::role(numbers::REGULAR)
        .map(|role| role.value(dark(), false))
        .is_some_and(|standard| (standard.a - now.a).abs() < 0.02)
}

/// Whether the user asked for less transparency: the browser's
/// `prefers-reduced-transparency`, asked when called. NSH's environment has
/// no such flag, so the native builds answer `false`.
pub(crate) fn reduce_transparency() -> bool {
    #[cfg(target_arch = "wasm32")]
    {
        media_matches("(prefers-reduced-transparency: reduce)")
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        false
    }
}

/// `window.matchMedia(query).matches`; `false` where there is no
/// `matchMedia` (a worker, a host without a window).
#[cfg(target_arch = "wasm32")]
fn media_matches(query: &str) -> bool {
    use wasm_bindgen::{JsCast, JsValue};

    let global = js_sys::global();
    let Ok(function) = js_sys::Reflect::get(&global, &JsValue::from_str("matchMedia")) else {
        return false;
    };
    let Some(function) = function.dyn_ref::<js_sys::Function>() else {
        return false;
    };
    let Ok(list) = function.call1(&global, &JsValue::from_str(query)) else {
        return false;
    };
    js_sys::Reflect::get(&list, &JsValue::from_str("matches"))
        .ok()
        .and_then(|matches| matches.as_bool())
        .unwrap_or(false)
}

/// The two blur scales of the tab bar's body ([`tokens::bar`]), as CSS
/// backdrop layers of the bar's box and `radius`: the ghost, opaque, then the
/// frost at α2 over it. They go right under a [`layer`] of a spec with
/// [`GlassSpec::two_scale`]`(on)`, which draws the tint over them, and show
/// only with `on` and while [`two_scale_active`] holds.
///
/// `shown` is 1 while the layers carry any of the body
/// ([`GlassSpec::two_scale_amount`] above 0) and 0 after: they stay whole, so
/// the shader's crossfade over them is exact. A view keeps its box and cannot
/// follow the silhouette into the pill; the shader covers what of them lies
/// outside the glass. The opacity is the layers' own: on an ancestor it would
/// make a Backdrop Root and blank the filters.
pub(crate) fn two_scale_layers(on: bool, radius: f32, shown: AnimatedNode) -> impl IntoElement {
    view()
        .absolute()
        .inset_0()
        .pointer_events(PointerEvents::None)
        .when(on, |layers| {
            layers
                .child(two_scale_pair(false, radius, shown))
                .child(two_scale_pair(true, radius, shown))
        })
}

/// The ghost and the frost of one appearance.
fn two_scale_pair(dark_pair: bool, radius: f32, shown: AnimatedNode) -> impl IntoElement {
    when(
        move || dark() == dark_pair && two_scale_active(),
        move || {
            let fit = tokens::bar::of(dark_pair);
            // The material's saturation, on the ghost only (the frost reads the
            // ghost): CSS `saturate()` keeps Rec. 709 luma, which the fit is in.
            let saturation = if dark_pair {
                numbers::SATURATION_DARK
            } else {
                numbers::SATURATION
            };
            view()
                .absolute()
                .inset_0()
                .child(
                    view()
                        .absolute()
                        .inset_0()
                        .rounded(px(radius))
                        .backdrop_blur(px(tokens::bar::GHOST_SIGMA))
                        .backdrop_saturate(saturation)
                        .bind_opacity(&shown),
                )
                .child(
                    view()
                        .absolute()
                        .inset_0()
                        .rounded(px(radius))
                        .backdrop_blur(px(tokens::bar::FROST_SIGMA))
                        .bind_opacity(&shown.mul(fit.frost_alpha())),
                )
                .into_element()
        },
    )
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
    /// The surface answers presses: it squashes and lenses harder while
    /// held (none of it with Reduce Motion).
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

/// A floating control of glass: a capsule that springs under the finger,
/// with an icon or a short title inside.
///
/// It is the `interactive` variant of [`Glass`]: a press squashes it to
/// 96,5 % and lenses the backdrop harder, and Reduce Motion collapses every
/// step.
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

#[cfg(test)]
mod tests {
    #[test]
    fn the_clip_shader_compiles_and_reads_the_content() {
        let shader = nsh_core::shader::Shader::compile(super::CLIP_SOURCE).expect("it compiles");
        let declared: Vec<&str> = shader.uniforms().iter().map(|f| &*f.name).collect();
        for name in ["first", "second", "radius", "progress", "roundness"] {
            assert!(declared.contains(&name), "{name}: {declared:?}");
        }
        assert!(
            shader
                .inputs()
                .contains(nsh_core::shader::ShaderInput::Content)
        );
    }
}
