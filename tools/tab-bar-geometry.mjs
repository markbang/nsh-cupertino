// The fixture tab bar's geometry in page points, as the shader draws it
// (`src/glass.rs` `sd_one`, `sd_silhouette`): the 362 × 64 pt capsule at
// x 21-381, y 790-854, mixed toward the 25 pt disc at the selected tab (the
// fixture's middle tab, the bar's centre) as the minimise runs, the silhouette
// lowered by up to 6 pt. The two-scale layers keep the box at rest.
export const BAR = { cx: 201, cy: 822, hx: 180, hy: 32, radius: 32, lift: 6, pill: 25 };

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** The bar's rounded rect about its centre (`sd_one`, its smooth max of 2.5). */
export function sdBar(x, y) {
  const r = Math.min(BAR.radius, BAR.hx, BAR.hy);
  const qx = Math.abs(x) - (BAR.hx - r);
  const qy = Math.abs(y) - (BAR.hy - r);
  const inner = -smin(-qx, -qy, 2.5);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(inner, 0) - r;
}

/** `sd_silhouette` about the bar's centre at `progress`. */
export function sdSilhouette(x, y, progress) {
  const d = sdBar(x, y);
  if (progress <= 0) return d;
  return d + (Math.hypot(x, y) - BAR.pill - d) * Math.min(progress, 1);
}

/** The layers' box at rest, at a page point. */
export const sdLayers = (x, y) => sdBar(x - BAR.cx, y - BAR.cy);

/** The lowered silhouette at a page point. */
export const sdGlass = (x, y, progress) => sdSilhouette(x - BAR.cx, y - BAR.cy - BAR.lift * progress, progress);

/** Rec. 709 luma of an RGB pixel. */
export function luma(image, x, y) {
  const [r, g, b] = image.pixel(x, y);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
