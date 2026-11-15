// The lists page, looked at pixel by pixel: every row but the last of its
// group draws a hairline, in light and dark. The rule behind it (one device
// pixel at 1x, 2x and 3x) is asserted from the layout in
// ../tests/separators.rs; this file checks what a display actually draws.
//
// A screenshot needs a platform that draws (`nsh test --target web`); headless
// there is no picture, so the test passes without looking.
import { inflateSync } from "zlib";
import { expect, open, test } from "nsh/test";

interface Picture {
  width: number;
  height: number;
  rgba: Uint8Array;
}

function u32(bytes: Uint8Array, at: number): number {
  return ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
}

function decode(bytes: Uint8Array): Picture | null {
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
  let at = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let color = 0;
  const parts: Uint8Array[] = [];
  while (at < bytes.length) {
    const length = u32(bytes, at);
    const kind = String.fromCharCode(bytes[at + 4], bytes[at + 5], bytes[at + 6], bytes[at + 7]);
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (kind === "IHDR") {
      width = u32(data, 0);
      height = u32(data, 4);
      depth = data[8];
      color = data[9];
    } else if (kind === "IDAT") {
      parts.push(data);
    }
    at += 12 + length;
  }
  if (depth !== 8 || width === 0 || height === 0) return null;
  const channels = color === 6 ? 4 : color === 2 ? 3 : color === 0 ? 1 : 0;
  if (channels === 0) return null;
  let total = 0;
  for (const part of parts) total += part.length;
  const packed = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    packed.set(part, offset);
    offset += part.length;
  }
  const raw = inflateSync(packed);
  const stride = width * channels;
  const rgba = new Uint8Array(width * height * 4);
  let previous = new Uint8Array(stride);
  let read = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[read++];
    const line = raw.subarray(read, read + stride);
    read += stride;
    const row = new Uint8Array(stride);
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? row[i - channels] : 0;
      const up = previous[i];
      const corner = i >= channels ? previous[i - channels] : 0;
      let value = line[i];
      if (filter === 1) value = (value + left) & 255;
      else if (filter === 2) value = (value + up) & 255;
      else if (filter === 3) value = (value + ((left + up) >> 1)) & 255;
      else if (filter === 4) {
        const estimate = left + up - corner;
        const pa = Math.abs(estimate - left);
        const pb = Math.abs(estimate - up);
        const pc = Math.abs(estimate - corner);
        value = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : corner)) & 255;
      }
      row[i] = value;
    }
    for (let x = 0; x < width; x++) {
      const to = (y * width + x) * 4;
      const from = x * channels;
      rgba[to] = row[from];
      rgba[to + 1] = channels > 1 ? row[from + 1] : row[from];
      rgba[to + 2] = channels > 2 ? row[from + 2] : row[from];
      rgba[to + 3] = channels === 4 ? row[from + 3] : 255;
    }
    previous = row;
  }
  return { width, height, rgba };
}

/** Runs of separator gray down a column inside the rows, past their chevrons. */
function separatorRuns(picture: Picture, dark: boolean): number {
  const x = Math.min(picture.width - 1, Math.round(picture.width * 0.90));
  let runs = 0;
  let inside = false;
  for (let y = 0; y < picture.height; y++) {
    const at = (y * picture.width + x) * 4;
    const [r, g, b] = [picture.rgba[at], picture.rgba[at + 1], picture.rgba[at + 2]];
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) <= 6;
    const line = dark
      ? neutral && r >= 45 && r <= 95
      : neutral && r >= 165 && r <= 225;
    if (line && !inside) runs++;
    inside = line;
  }
  return runs;
}

for (const scheme of ["light", "dark"] as const) {
  test(`every row of the lists page has its hairline, ${scheme}`, async () => {
    const app = await open("./App.tsx", {
      storage: { "cupertino.page": "lists" },
      colorScheme: scheme,
      width: 390,
      height: 844,
    });
    let bytes: Uint8Array;
    try {
      bytes = await app.screenshot();
    } catch {
      return;
    }
    const picture = decode(bytes);
    if (!picture) return;
    // Four rows, two icon rows and two option rows have a row under them.
    expect(separatorRuns(picture, scheme === "dark")).toBeGreaterThanOrEqual(8);
  });
}
