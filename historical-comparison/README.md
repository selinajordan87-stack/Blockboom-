# Isolated historical iPhone comparison

Prepared for a separate public repository named `Blockboom-viewport-history`.
Copy this directory's contents to that repository's root and publish Pages
from its main branch, root directory. Do not select this folder as the live
Blockboom- Pages source.

- A: 6946d9f1a78d56a2b1360ddfe9df0a255cadf5c8 (early Pages-ready v0.1).
- B: abd4d3742fd5b9dc9cccf8380403499ce6447a5b (current main when prepared).
- Only asset paths, save keys, document titles and manifest scope differ.
- A/B save prefixes: `blockboom.history-comparison.a.` / `.b.`.
- No live saves are read or written; no service workers are registered.
- Original game CSS, viewport meta, renderer and gameplay are retained.
- Both built using the same installed dependencies; not tested on an iPhone.

Regenerate from the original repository with:
`node scripts/build-history-comparison.mjs /absolute/output/path`

The larger textured/chunk-world rendering arrived in d09541f; the connected
living-world expansion in b1ccf11. These are candidates for a later bisect,
only if the phone comparison establishes a difference.
