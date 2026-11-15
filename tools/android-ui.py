#!/usr/bin/env python3
"""The emulator's accessibility tree, for `tools/android-glass.sh`.

`adb shell uiautomator dump` prints the nodes a screen reader sees, with the
text of a text view (`TextBox.onInitializeAccessibilityNodeInfo` sets it) and
the bounds of each. The driver uses it to know when a page has mounted and to
press a control by its text, rather than by a coordinate guessed from a layout.

  tools/android-ui.py wait <text> [--timeout S] [--exact]
  tools/android-ui.py tap <text> [--exact]
  tools/android-ui.py scroll-to <text> [--tries N] [--exact]
  tools/android-ui.py dump

Exit status 1 when nothing matches.
"""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

BOUNDS = re.compile(r"\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]")


def adb(*args, **kwargs):
    return subprocess.run(("adb",) + args, capture_output=True, timeout=120, **kwargs)


def tree():
    """The nodes on screen as (text, description, x, y, width, height)."""
    if adb("shell", "uiautomator", "dump", "/sdcard/window.xml").returncode != 0:
        return []
    xml = adb("exec-out", "cat", "/sdcard/window.xml").stdout.decode("utf-8", "replace")
    start = xml.find("<?xml")
    if start < 0:
        return []
    try:
        root = ET.fromstring(xml[start:])
    except ET.ParseError:
        return []
    nodes = []
    for node in root.iter("node"):
        found = BOUNDS.search(node.get("bounds") or "")
        if not found:
            continue
        x1, y1, x2, y2 = (int(v) for v in found.groups())
        nodes.append(
            (
                node.get("text") or "",
                node.get("content-desc") or "",
                x1,
                y1,
                x2 - x1,
                y2 - y1,
            )
        )
    return nodes


def matches(node, wanted, exact):
    for value in (node[0], node[1]):
        if not value:
            continue
        if value == wanted if exact else wanted in value:
            return True
    return False


def find(wanted, exact):
    for node in tree():
        if matches(node, wanted, exact):
            return node
    return None


def centre(node):
    _, _, x, y, width, height = node
    return x + width // 2, y + height // 2


def main(argv):
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    command, wanted = argv[1], argv[2]
    rest = argv[3:]
    exact = "--exact" in rest
    option = lambda name, fallback: (
        float(rest[rest.index(name) + 1]) if name in rest else fallback
    )

    if command == "dump":
        for text, description, x, y, width, height in tree():
            print(f"{x},{y} {width}x{height} {text or description}")
        return 0

    if command == "wait":
        deadline = time.time() + option("--timeout", 40)
        while time.time() < deadline:
            if find(wanted, exact):
                return 0
            time.sleep(0.5)
        print(f"{wanted!r} did not appear", file=sys.stderr)
        return 1

    if command == "tap":
        node = find(wanted, exact)
        if node is None:
            print(f"{wanted!r} is not on screen", file=sys.stderr)
            return 1
        x, y = centre(node)
        print(f"tap {wanted!r} at {x},{y}")
        return adb("shell", "input", "tap", str(x), str(y)).returncode

    if command == "scroll-to":
        tries = int(option("--tries", 8))
        for attempt in range(tries + 1):
            node = find(wanted, exact)
            if node is not None:
                _, _, _, y, _, height = node
                # In the reading band: under the bar, above the screen's edge.
                if 240 <= y + height // 2 <= 2160:
                    return 0
            if attempt == tries:
                break
            adb("shell", "input", "swipe", "540", "1650", "540", "750", "400")
            time.sleep(0.8)
        print(f"could not scroll to {wanted!r}", file=sys.stderr)
        return 1

    print(f"unknown command {command!r}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
