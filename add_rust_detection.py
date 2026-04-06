#!/usr/bin/env python3
"""
Dapper PWA — Add rust color detection to getLocalAnalysis()
Run AFTER add_rust_patterns.py succeeds.
"""

import sys

filepath = '/Users/jonathan/Desktop/dapper - deploy/src/Dapper.jsx'

# Anchor: the olive detection line (last completed color) — insert rust AFTER it
anchor = "else if (/olive suit|forest green suit|olive blazer|olive wool|olive linen|army green suit/.test(t)) { colorKey = \"olive\"; colorMatched = true }"

rust_detection = """else if (/olive suit|forest green suit|olive blazer|olive wool|olive linen|army green suit/.test(t)) { colorKey = "olive"; colorMatched = true }
    else if (/rust suit|rust blazer|rust jacket|rust wool|rust linen|rust tweed|rust houndstooth|rust herringbone|rust plaid|orange suit|burnt orange suit|terracotta suit|copper suit|cinnamon suit/.test(t)) { colorKey = "rust"; colorMatched = true }"""

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if anchor not in content:
    print("ERROR: Olive detection anchor not found.")
    print("Check that the olive detection line exists exactly as expected.")
    sys.exit(1)

if '"rust"; colorMatched = true' in content:
    print("WARNING: rust detection already present — aborting.")
    sys.exit(1)

new_content = content.replace(anchor, rust_detection, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: Rust detection added to getLocalAnalysis().")
print()
print("Detected keywords:")
print("  rust suit / rust blazer / rust jacket")
print("  rust wool / rust linen / rust tweed")
print("  rust houndstooth / rust herringbone / rust plaid")
print("  orange suit / burnt orange suit")
print("  terracotta suit / copper suit / cinnamon suit")
print()
print("Now deploy:")
print("  npm run build && git add -A && git commit -m 'feat: add rust color family (7 patterns + detection)' && git push origin main")
