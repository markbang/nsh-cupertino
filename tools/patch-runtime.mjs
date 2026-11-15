#!/usr/bin/env node
// Platform workaround (remove when NSH binds every block of a program): the
// web runtime binds the shader's uniform blocks by the names naga's GLSL
// reflection gives — one per stage, `Nsh_block_0Vertex` in the vertex shader
// and `Nsh_block_0Fragment` in the fragment one. WebGL takes them as two
// blocks, so the vertex stage's stays unbound and `glDrawArrays` is refused
// (GL_INVALID_OPERATION). This rewrites `block()` to bind every block whose
// name starts with the one asked for.
//
//   node tools/patch-runtime.mjs <built web directory>
//
// It is used by `tools/shots.sh` and the site's build only, never by an app.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PATTERN =
  /if\(!(\w+)\)return null;let (\w+)=(\w+)\.getUniformBlockIndex\((\w+),\1\);return \2===\3\.INVALID_INDEX\?null:\(\3\.uniformBlockBinding\(\4,\2,(\w+)\),\3\.createBuffer\(\)\)/;

/** The web runtime's shader code, with every block bound by prefix. */
export function patchRuntimeSource(source) {
  const match = PATTERN.exec(source);
  if (!match) return null;
  const [found, name, , gl, program, binding] = match;
  const replacement = `if(!${name})return null;let base=${name}.replace(/_block_\\d+\\w*$/,""),found=false;const total=${gl}.getProgramParameter(${program},${gl}.ACTIVE_UNIFORM_BLOCKS);for(let b=0;b<total;b++){const other=${gl}.getActiveUniformBlockName(${program},b);if(other&&other.startsWith(base)){${gl}.uniformBlockBinding(${program},b,${binding});found=true;}}return found?${gl}.createBuffer():null`;
  return source.replace(found, replacement);
}

function patchDirectory(dir) {
  const files = readdirSync(dir).filter((name) => /^nsh\.[0-9a-f]+\.js$/.test(name));
  let patched = 0;
  for (const name of files) {
    const path = join(dir, name);
    const source = readFileSync(path, "utf8");
    const patchedSource = patchRuntimeSource(source);
    if (!patchedSource) continue;
    writeFileSync(path, patchedSource);
    patched += 1;
  }
  return patched;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("usage: node tools/patch-runtime.mjs <built web directory>");
    process.exit(2);
  }
  const patched = patchDirectory(dir);
  if (!patched) {
    console.error(`no shader code to patch in ${dir}: NSH's runtime changed, drop this script`);
    process.exit(1);
  }
  console.log(`patched the shader bindings of ${patched} runtime file(s) in ${dir}`);
}
