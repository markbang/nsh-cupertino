#!/usr/bin/env node
// Builds site/src/api.json from the component docs' prop tables, so the site's
// API tables are the documentation's own, not a copy that drifts.
//
// `--check` writes nothing and exits 1 when the committed file is stale.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs", "components");
const target = join(root, "site", "src", "api.ts");

const cells = (line) => {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
};

const isSeparator = (line) => cells(line).every((cell) => /^:?-{3,}:?$/.test(cell));

/** The tables of one doc, as groups named by the heading above them. */
function tables(markdown) {
  const lines = markdown.split("\n");
  const found = [];
  let heading = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = /^##\s+(.+)$/.exec(line);
    if (match) {
      heading = match[1].replace(/`/g, "").replace(/\s+/g, " ").trim();
      continue;
    }
    if (!line.startsWith("|")) continue;
    const header = cells(line);
    const next = lines[i + 1] ?? "";
    if (!next.startsWith("|") || !isSeparator(next)) continue;
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].startsWith("|"); j++) {
      const row = cells(lines[j]);
      if (isSeparator(lines[j])) continue;
      rows.push(row);
    }
    // The docs put a component's events in a line under its prop table.
    let events = "";
    for (let k = j; k < Math.min(j + 4, lines.length); k++) {
      const match = /^Events:\s*(.+)$/.exec(lines[k].trim());
      if (!match) continue;
      const parts = [match[1]];
      for (let m = k + 1; m < lines.length && lines[m].trim(); m++) parts.push(lines[m].trim());
      events = parts.join(" ").replace(/`/g, "").replace(/\*\*/g, "");
      break;
    }
    found.push({ heading, header, rows, events });
    i = j - 1;
  }
  return found;
}

const out = {};
for (const name of readdirSync(docs).sort()) {
  if (!name.endsWith(".md") || name.endsWith(".zh-CN.md")) continue;
  const id = name.replace(/\.md$/, "");
  const groups = [];
  for (const table of tables(readFileSync(join(docs, name), "utf8"))) {
    if (table.header.includes("TSX") && table.header.includes("Rust")) {
      groups.push({
        title: table.heading || "Props",
        kind: "props",
        events: table.events,
        rows: table.rows.map(([tsx, rust, type, fallback, note]) => ({
          tsx: tsx ?? "",
          rust: rust ?? "",
          type: type ?? "",
          default: fallback ?? "",
          note: note ?? "",
        })),
      });
    } else if (id === "icon" && table.header[0] === "Name") {
      groups.push({
        title: "Names",
        kind: "names",
        events: "",
        rows: table.rows.map(([names, note]) => ({ name: names ?? "", note: note ?? "" })),
      });
    }
  }
  if (groups.length) out[id] = groups;
}

const header = `// Generated from docs/components/*.md by tools/site-api.mjs: do not edit.
export interface ApiRow { tsx: string; rust: string; type: string; default: string; note: string }
export interface ApiName { name: string; note: string }
export interface ApiGroup {
  title: string;
  kind: "props" | "names";
  events: string;
  rows: (ApiRow | ApiName)[];
}

export const API: Record<string, ApiGroup[]> = `;
const json = `${header}${JSON.stringify(out, null, 2)};\n`;
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(target, "utf8");
  } catch {}
  if (current !== json) {
    console.error("site/src/api.ts is stale: run `node tools/site-api.mjs`");
    process.exit(1);
  }
  console.log("site/src/api.ts matches docs/components");
} else {
  writeFileSync(target, json);
  console.log(`wrote ${target}: ${Object.keys(out).length} components`);
}
