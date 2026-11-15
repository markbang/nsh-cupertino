#!/usr/bin/env node
// The site shows the crate's version: nsh.json carries it, the crate's
// Cargo.toml is the truth. --check fails when they drift (CI runs it).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(join(root, "Cargo.toml"), "utf8"))?.[1];
if (!version) {
  console.error("Cargo.toml has no version");
  process.exit(1);
}

const file = join(root, "site", "nsh.json");
const config = JSON.parse(readFileSync(file, "utf8"));
if (config.version === version) {
  console.log(`site/nsh.json is at ${version}`);
  process.exit(0);
}

if (process.argv.includes("--check")) {
  console.error(`site/nsh.json is at ${config.version}, Cargo.toml at ${version}`);
  process.exit(1);
}
const json = `${JSON.stringify({ ...config, version }, null, 2)}\n`;
writeFileSync(file, json);
console.log(`site/nsh.json: ${config.version} -> ${version}`);
