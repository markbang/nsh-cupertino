# Cohub Mobile iOS reference

[中文](README.zh-CN.md)

The iOS side of Cohub Mobile's UI snapshots, captured by Maestro on the iOS simulator. These are snapshots of **our own product** (Cohub Mobile), not Apple's UI and not the Android build. They are the reference for how closely `nsh-cupertino` matches the iOS look. [audit.md](audit.md) compares them with the library.

## Contents

| Path | What |
|---|---|
| `reports.json` | The report index, copied verbatim (20 reports, 34 screens, 20 motions). |
| `shots/<screen>.<theme>.ios.webp` | 67 iOS screenshots, light and dark where present. Original webp bytes. |
| `motion/<motion>.mp4` | 20 motion recordings, original mp4. Each is iOS and Android side by side: the iOS side is the left half (892 × 960 px, 30 fps). |
| `manifest.json` | Per file: source URL, report id, sha256, bytes. Plus the selection rule and the list of screen/theme pairs that have no iOS reference. |
| `audit.md`, `audit.zh-CN.md` | Fidelity audit: missing components, metric mismatches, top screens by gap. |
| `mapping.md`, `mapping.zh-CN.md` | Cohub Mobile source components → nsh-cupertino components, with status and file:line on both sides. Source values beat pixels. |

Total: 87 files, 8,270,638 bytes (about 7.9 MiB).

Screens are 720 × 1565 px, which is the 402 × 874 pt frame at about 1.79 px per pt. They are not 1170 × 2532.

## Which report each file comes from

- Per screen and theme: the newest report (by date) that lists that screen in that theme.
- Per motion: the newest report that lists it. All 20 come from `20261111-091743-4ac97ff` (PR #234, a feature branch).
- `catalog-list` has no dark variant in any report.

So a screen's light and dark files can come from different reports. `manifest.json` records the report for every file.

## Re-fetch

```sh
curl -o research/ios-reference/reports.json \
  https://public.cohub.live/p/c649d081-fa43-411e-b2d0-bf1d746f3ae6/ui-compare/reports.json   # optional: refresh the index
node tools/fetch-ios-reference.mjs          # rebuild shots/, motion/, manifest.json
node tools/fetch-ios-reference.mjs --check  # download again and fail if the result differs from manifest.json
```

The script reads `reports.json` from this folder, so the same index gives the same selection and the same manifest. It needs Node 18 or later and no packages.

To re-measure the shots:

```sh
pip install pillow
python3 tools/measure-ios-reference.py
```
