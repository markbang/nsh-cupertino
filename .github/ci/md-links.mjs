#!/usr/bin/env node
// Checks the relative links of the repository's markdown, offline: a link to a
// file must reach a file or directory of the checkout, and an anchor
// (`#section`, `other.md#section`) a heading or an `id`/`name` of that file,
// slugged as GitHub slugs headings. URLs with a scheme are not fetched.
//
//   node .github/ci/md-links.mjs [file.md ...]   # default: every tracked *.md
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const files = process.argv.length > 2
  ? process.argv.slice(2)
  : execFileSync("git", ["ls-files", "-z", "--", "*.md"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);

/** The text outside code: fenced blocks and inline code spans become blanks, lines kept. */
function prose(text) {
  const lines = text.split("\n");
  let fence = null;
  return lines.map((line) => {
    const open = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length && !line.trim().slice(open[1].length).trim()) fence = null;
      return "";
    }
    if (open) {
      fence = open[1];
      return "";
    }
    return line.replace(/(`+)(?:(?!\1).)+?\1/g, (span) => " ".repeat(span.length));
  });
}

function slug(heading) {
  const text = heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/(\*\*|__|\*)/g, "")
    .trim()
    .toLowerCase();
  return text.replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "").replace(/ /g, "-");
}

const anchorCache = new Map();
function anchorsOf(path) {
  if (anchorCache.has(path)) return anchorCache.get(path);
  const anchors = new Set();
  const counts = new Map();
  const add = (base) => {
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    anchors.add(n ? `${base}-${n}` : base);
  };
  const text = readFileSync(path, "utf8");
  const lines = prose(text);
  const raw = text.split("\n");
  lines.forEach((line, i) => {
    // Code is blanked in `lines`; a heading's text is read from the raw line.
    const atx = line && raw[i].match(/^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/);
    if (atx) add(slug(atx[1]));
    else if (/^\s{0,3}(=+|-+)\s*$/.test(line) && i > 0 && lines[i - 1].trim() && !/^\s{0,3}(#|[-*+]\s|\d+\.\s|>|\|)/.test(lines[i - 1])) add(slug(raw[i - 1]));
    for (const id of raw[i].matchAll(/<[a-z][^>]*\s(?:id|name)\s*=\s*["']([^"']+)["']/gi)) anchors.add(id[1]);
  });
  anchorCache.set(path, anchors);
  return anchors;
}

const failures = [];
let checked = 0;
for (const file of files) {
  const path = resolve(root, file);
  const lines = prose(readFileSync(path, "utf8"));
  lines.forEach((line, i) => {
    const targets = [
      ...[...line.matchAll(/\]\(\s*(<[^>]*>|[^)\s]*)/g)].map((m) => m[1]),
      ...[...line.matchAll(/^\s{0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/g)].map((m) => m[1]),
      ...[...line.matchAll(/<(?:a|img|source)\b[^>]*\s(?:href|src|srcset)\s*=\s*["']([^"'\s]+)/gi)].map((m) => m[1]),
    ];
    for (let target of targets) {
      target = target.replace(/^<|>$/g, "");
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//")) continue;
      checked += 1;
      const [pathPart, anchor] = target.split("#", 2);
      let decoded;
      try {
        decoded = decodeURIComponent(pathPart.split("?")[0]);
      } catch {
        failures.push({ file, line: i + 1, target, why: "the link is not valid percent-encoding" });
        continue;
      }
      const dest = decoded
        ? decoded.startsWith("/") ? join(root, decoded) : resolve(dirname(path), decoded)
        : path;
      if (dest !== root && !dest.startsWith(root + sep)) {
        failures.push({ file, line: i + 1, target, why: "it leaves the repository" });
        continue;
      }
      if (!existsSync(dest)) {
        failures.push({ file, line: i + 1, target, why: `${relative(root, dest)} does not exist` });
        continue;
      }
      if (anchor && dest.endsWith(".md") && statSync(dest).isFile()) {
        const wanted = decodeURIComponent(anchor);
        if (!anchorsOf(dest).has(wanted) && !anchorsOf(dest).has(wanted.toLowerCase())) {
          failures.push({ file, line: i + 1, target, why: `${relative(root, dest)} has no heading or id "${wanted}"` });
        }
      }
    }
  });
}

for (const failure of failures) {
  console.log(`::error file=${failure.file},line=${failure.line}::broken link ${failure.target}: ${failure.why}`);
}
console.log(`${files.length} markdown files, ${checked} relative links, ${failures.length} broken`);
process.exit(failures.length ? 1 : 0);
