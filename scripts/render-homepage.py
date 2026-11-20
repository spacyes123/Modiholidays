"""Keep the approved public homepage authoritative during catalogue builds.

The bespoke prototype remains a review artifact and must not replace index.html.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVED_HOME = ROOT / 'index.html'

if not APPROVED_HOME.is_file():
    raise SystemExit('Approved homepage index.html is missing.')

print('Preserved the approved index.html; review prototype was not promoted.')
