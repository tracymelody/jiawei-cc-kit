# Abstraction Police

Scan the repo for near-duplicate abstractions. Unify them. Open a PR.

## Instructions

1. Search the entire codebase for functions, classes, and utilities that do approximately the same thing:
   - Different names, 70%+ similar logic
   - Wrappers that add negligible value
   - Multiple helper/util files with overlapping scope
   - Copy-paste with minor variable renames

2. For each group of duplicates:
   - Pick the best implementation (most complete, best named, best tested)
   - Merge any unique logic from the others into it
   - Update all call sites to use the canonical version
   - Delete the duplicates

3. Create branch `patrol/abstractions-YYYY-MM-DD`, commit, open PR.

## Rules

- Only unify things that are genuinely redundant — similar is not identical
- If two functions have different edge-case handling, merge the edge cases into one
- Preserve all existing tests (update imports as needed)
- If unsure whether something is a duplicate, skip it
- PR title: "patrol: unify N duplicate abstractions"
