#!/usr/bin/env python3
"""The emulator's accessibility tree, for `tools/android-glass.sh`.

`adb shell uiautomator dump` writes the nodes a screen reader sees, with the
text of a text view (`TextBox.onInitializeAccessibilityNodeInfo` sets it) and
each node's bounds. The driver uses it to know when a seeded page has mounted,
rather than trusting a sleep; `dump` says what is on screen when it did not.

  tools/android-ui.py wait <text> [--timeout S]
  tools/android-ui.py dump

`uiautomator` fails when the window never idles (a shader redraws, a list
settles) and still writes the tree: the file is read whatever the exit code.
Exit status 1 when nothing matches.
"""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

BOUNDS = re.compile(r"\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]")
DEVICE_XML = "/sdcard/window.xml"


def adb(*args):
    return subprocess.run(("adb",) + args, capture_output=True, timeout=120)


def tree():
    """The nodes on screen as (text, description, x, y, width, height)."""
    adb("shell", "rm", "-f", DEVICE_XML)
    adb("shell", "uiautomator", "dump", DEVICE_XML)
    xml = adb("exec-out", "cat", DEVICE_XML).stdout.decode("utf-8", "replace")
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
            (node.get("text") or "", node.get("content-desc") or "", x1, y1, x2 - x1, y2 - y1)
        )
    return nodes


def main(argv):
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    command = argv[1]

    if command == "dump":
        nodes = tree()
        if not nodes:
            print("(no accessibility tree: the dump failed)")
            return 1
        for text, description, x, y, width, height in nodes:
            if text or description:
                print(f"{x},{y} {width}x{height} {text or description}")
        return 0

    if command == "wait" and len(argv) >= 3:
        wanted = argv[2]
        rest = argv[3:]
        timeout = float(rest[rest.index("--timeout") + 1]) if "--timeout" in rest else 40
        deadline = time.time() + timeout
        while time.time() < deadline:
            if any(wanted in node[0] or wanted in node[1] for node in tree()):
                return 0
            time.sleep(0.5)
        print(f"{wanted!r} did not appear", file=sys.stderr)
        return 1

    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
