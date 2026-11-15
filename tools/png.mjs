// A PNG as pixels, without dependencies: `tools/glass-pixels.mjs` reads the
// web captures, `tools/android-glass-check.mjs` the emulator's (a `screencap`
// is RGBA, the browser's shot RGB).
import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";

/** A PNG as `{ width, height, pixel(x, y), luminance(x, y) }`, 8-bit, no gamma work. */
export function readPng(file) {
  const bytes = readFileSync(file);
  let at = 8;
  let header;
  const idat = [];
  while (at < bytes.length) {
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString("ascii", at + 4, at + 8);
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    at += 12 + length;
  }
  if (!header || header.depth !== 8 || header.interlace !== 0) {
    throw new Error(`${file}: only 8-bit, non-interlaced PNGs`);
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.color];
  if (!channels) throw new Error(`${file}: unsupported color type ${header.color}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = header.width * channels;
  const pixels = Buffer.alloc(stride * header.height);
  for (let y = 0; y < header.height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const last = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[i - channels] : 0;
      const b = last ? last[i] : 0;
      const c = last && i >= channels ? last[i - channels] : 0;
      let value = line[i];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = value & 0xff;
    }
  }
  const pixel = (x, y) => {
    const i = y * stride + x * channels;
    if (channels >= 3) return [pixels[i], pixels[i + 1], pixels[i + 2]];
    return [pixels[i], pixels[i], pixels[i]];
  };
  const luminance = (x, y) => {
    const [r, g, b] = pixel(x, y);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  return { width: header.width, height: header.height, pixel, luminance };
}
