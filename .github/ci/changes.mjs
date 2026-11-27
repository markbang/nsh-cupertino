#!/usr/bin/env node
// What a CI run has to do: whether its changes are docs only, which demo
// screens they can alter (.github/ci/screens.json), and whether it warms the
// caches. Writes `key=value` lines to $GITHUB_OUTPUT (stdout without it) and a
// table to $GITHUB_STEP_SUMMARY.
//
//   node .github/ci/changes.mjs                 # in Actions: reads the event
//   node .github/ci/changes.mjs --files a b c   # a pull request changing a, b, c
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const config = JSON.parse(readFileSync(join(root, ".github", "ci", "screens.json"), "utf8"));

const shotsScript = readFileSync(join(root, "tools", "check-screenshots.sh"), "utf8");
const listed = shotsScript.match(/^pages=\(([^)]*)\)/m);
if (!listed) throw new Error("tools/check-screenshots.sh has no `pages=(...)` line to read the screens from");
const SCREENS = listed[1].trim().split(/\s+/);

for (const [path, screens] of Object.entries(config.map)) {
  for (const screen of [...screens, ...config.always]) {
    if (!SCREENS.includes(screen)) {
      throw new Error(`.github/ci/screens.json maps ${path} to "${screen}", which tools/check-screenshots.sh does not list`);
    }
  }
}

function globToRegExp(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      source += glob[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += glob[i + 2] === "/" ? 2 : 1;
    } else if (c === "*") {
      source += "[^/]*";
    } else {
      source += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}
const matcher = (globs) => {
  const patterns = globs.map(globToRegExp);
  return (path) => patterns.some((pattern) => pattern.test(path));
};
const isAll = matcher(config.all);
const isNone = matcher(config.none);
const isDocs = matcher(config.docsOnly);

/** The screens one changed path can alter: "all", or a list. */
function screensOf(path) {
  if (isAll(path)) return { screens: "all", why: "shared" };
  if (Object.hasOwn(config.map, path)) return { screens: config.map[path], why: "map" };
  if (isNone(path)) return { screens: [], why: "draws no screen" };
  return { screens: "all", why: "unknown path" };
}

const args = process.argv.slice(2);
const event = process.env.GITHUB_EVENT_NAME ?? (args[0] === "--files" ? "pull_request" : "push");
const labels = JSON.parse(process.env.PR_LABELS || "[]");

let files = null;
let reason = "";
if (args[0] === "--files") {
  files = args.slice(1);
} else if (event === "pull_request") {
  // The checkout is GitHub's merge commit: its first parent is the base
  // branch's tip, so this diff is what merging the pull request changes.
  try {
    files = execFileSync("git", ["diff", "--name-only", "HEAD^1", "HEAD"], { cwd: root, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  } catch (error) {
    reason = `could not diff the merge commit (${error.message.split("\n")[0]}): every screen`;
    console.log(`::warning::${reason}`);
  }
} else {
  reason = `${event}: every screen`;
}

const rows = [];
let full = files === null || files.length === 0;
if (files && files.length === 0) reason = "the diff is empty: every screen";
const selected = new Set(config.always);
for (const path of files ?? []) {
  const { screens, why } = screensOf(path);
  rows.push([path, screens === "all" ? "all" : screens.join(", ") || "-", why]);
  if (screens === "all") full = true;
  else for (const screen of screens) selected.add(screen);
}
const docsOnly = Boolean(files?.length) && files.every(isDocs);
const pages = full ? SCREENS : SCREENS.filter((screen) => selected.has(screen));
const glassPages = Object.entries(config.glassShots)
  .filter(([screen]) => pages.includes(screen))
  .flatMap(([, shotPages]) => shotPages);

// Warm runs build what a cache misses and save it. A pull request reads the
// caches of its base branch and of its own merge ref, so main's runs save them,
// and a pull request labelled `deps` saves its own. A tag's run reads main's.
const warm = event === "pull_request"
  ? labels.includes("deps")
  : event === "schedule" || event === "workflow_dispatch" || (event === "push" && process.env.GITHUB_REF === "refs/heads/main");

const outputs = {
  docs_only: String(docsOnly),
  full: String(full),
  pages: pages.join(" "),
  glass_pages: glassPages.join(","),
  glass_pixels: String(pages.includes("glass")),
  warm: String(warm),
  demo: existsSync(join(root, "examples", "demo", "nsh.json")) ? "yes" : "no",
  theme: existsSync(join(root, "src", "bin", "gen_theme.rs")) ? "yes" : "no",
};

const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));

let summary = `### What is in this commit\n\n`;
summary += docsOnly
  ? "Docs only: the markdown link check runs, the builds do not.\n\n"
  : `Screens: ${full ? `every screen (${reason || "a shared or unknown path"})` : pages.join(", ")}\n\n`;
summary += `Caches: ${warm ? "warmed by this run" : "read only (a miss fails; label the PR `deps` to warm them)"}\n\n`;
if (rows.length) {
  summary += "| path | screens | why |\n|---|---|---|\n";
  for (const row of rows.slice(0, 200)) summary += `| \`${row[0]}\` | ${row[1]} | ${row[2]} |\n`;
  if (rows.length > 200) summary += `\n… and ${rows.length - 200} more paths\n`;
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
