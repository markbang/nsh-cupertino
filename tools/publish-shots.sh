#!/usr/bin/env bash
# Publishes the PNGs of one run to the `screenshots` branch, under `main/`,
# where the docs and the release notes read them from
# (`https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/`).
#
# The web run (`ci.yml`) and the Android run (`android-ui.yml`) share the
# branch, so each adds its files and keeps the other's.
#
#   tools/publish-shots.sh docs/screenshots
set -euo pipefail
dir=${1:?usage: tools/publish-shots.sh <directory of PNGs>}
root=$(git rev-parse --show-toplevel)
shopt -s nullglob
files=("$dir"/*.png)
if [ ${#files[@]} -eq 0 ]; then
  echo "no PNGs in $dir" >&2
  exit 1
fi
sha=${GITHUB_SHA:-0000000}
sha=${sha:0:7}

work=$(mktemp -d)
git worktree add --detach "$work" HEAD >/dev/null
trap 'cd /; git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || true' EXIT
cd "$work"

# Another run may push between our fetch and our push: fetch again and keep ours.
for attempt in 1 2 3; do
  if git fetch --depth=1 origin screenshots 2>/dev/null; then
    git checkout -q -B screenshots FETCH_HEAD
  else
    # The branch's first commit: none of this checkout's files go in.
    git checkout -q --orphan screenshots
    git rm -rq --cached . >/dev/null 2>&1 || true
  fi
  mkdir -p main
  cp "${files[@]}" main/
  git add main
  if git diff --cached --quiet; then
    echo "the screenshots branch already holds these files"
    exit 0
  fi
  git -c user.name=github-actions -c user.email=github-actions@github.com \
    commit -q -m "Screenshots of $sha"
  if git push -q origin HEAD:refs/heads/screenshots; then
    echo "published ${#files[@]} files to the screenshots branch (main/)"
    exit 0
  fi
  echo "the screenshots branch moved; trying again ($attempt)"
  sleep 3
done

echo "could not publish the screenshots" >&2
exit 1
