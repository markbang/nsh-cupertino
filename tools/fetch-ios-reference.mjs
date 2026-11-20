// Rebuilds research/ios-reference/ from its reports.json: the iOS shots and
// motions, each taken from the newest report that has it, plus a manifest.
// Usage: node tools/fetch-ios-reference.mjs [--check]
// --check downloads the same files, writes nothing, and fails if the result
// differs from the committed manifest.json.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "research", "ios-reference");
const check = process.argv.includes("--check");
const themes = ["light", "dark"];

const { reports } = JSON.parse(readFileSync(join(root, "reports.json"), "utf8"));
const newestFirst = [...reports].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
const reportDir = (report) => report.url.replace(/index\.html$/, "");

const screens = [...new Set(reports.flatMap((report) => report.screens))].sort();
const motions = [...new Set(reports.flatMap((report) => report.motions))].sort();

const wanted = [];
const absent = [];
for (const screen of screens) {
  for (const theme of themes) {
    const candidates = newestFirst.filter((r) => r.screens.includes(screen) && r.themes.includes(theme));
    if (!candidates.length) absent.push({ file: `shots/${screen}.${theme}.ios.webp`, reason: "no report has this screen and theme" });
    for (const report of candidates) {
      wanted.push({ file: `shots/${screen}.${theme}.ios.webp`, url: `${reportDir(report)}shots/${screen}.${theme}.ios.webp`, report });
      break;
    }
  }
}
for (const motion of motions) {
  const report = newestFirst.find((r) => r.motions.includes(motion));
  wanted.push({ file: `motion/${motion}.mp4`, url: `${reportDir(report)}motion/${motion}.mp4`, report });
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const entries = [];
const bodies = new Map();
for (const item of wanted) {
  const response = await fetch(item.url);
  if (!response.ok) throw new Error(`${response.status} ${item.url}: the report lists it but it is not published`);
  const bytes = Buffer.from(await response.arrayBuffer());
  bodies.set(item.file, bytes);
  entries.push({ file: item.file, source: item.url, report: item.report.id, sha256: sha256(bytes), bytes: bytes.length });
}
entries.sort((a, b) => a.file.localeCompare(b.file));

const manifest = {
  rule: "Per screen and theme: the newest report (by date) that lists the screen in that theme. Per motion: the newest report that lists it. iOS only.",
  reports: "reports.json, copied verbatim from https://public.cohub.live/p/c649d081-fa43-411e-b2d0-bf1d746f3ae6/ui-compare/reports.json",
  totals: { files: entries.length, bytes: entries.reduce((sum, e) => sum + e.bytes, 0) },
  files: entries,
  absent,
};
const text = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  const current = readFileSync(join(root, "manifest.json"), "utf8");
  if (current !== text) {
    console.error("manifest.json is out of date: run node tools/fetch-ios-reference.mjs");
    process.exit(1);
  }
  console.log(`ok: ${entries.length} files, ${manifest.totals.bytes} bytes`);
  process.exit(0);
}

for (const dir of ["shots", "motion"]) rmSync(join(root, dir), { recursive: true, force: true });
for (const [file, bytes] of bodies) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), bytes);
}
writeFileSync(join(root, "manifest.json"), text);
console.log(`wrote ${entries.length} files, ${manifest.totals.bytes} bytes`);
