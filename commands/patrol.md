# Patrol — Daily Codebase Hygiene

Run all patrol sub-routines on the current repo. Opens one PR per category (skip if nothing found).

## Instructions

Run these checks sequentially on the current repo:

### 1. Abstraction Police
Scan for near-duplicate abstractions (functions, classes, utilities that do ~the same thing with different names or slight variations). Look across the entire codebase, not just recent changes.

Signs of duplication:
- Two functions with different names but 70%+ similar logic
- Wrapper functions that add negligible value over what they wrap
- Multiple util files with overlapping responsibilities
- Copy-pasted code with minor variable name changes

For each finding: unify into one canonical implementation, update all call sites.

### 2. Dead Code
Find unused code through static analysis:
- Unexported functions/classes never called within their own module
- Exports never imported anywhere else in the repo
- Unreachable branches (always-true/false conditions)
- Commented-out code blocks (just delete them — git has history)
- Unused dependencies in package.json / requirements.txt / pyproject.toml

### 3. Flag & Experiment Cleanup
Find feature flags, env-var gates, or A/B test conditions that are always-on or stale:
- Flags set to `true` / `100%` in config with no conditional path remaining
- `if FEATURE_X` where `FEATURE_X` has been `true` for weeks (check git blame date)
- Dead experiment branches (the losing variant's code still present)

Remove the flag and the dead branch. Keep only the winning path.

### 4. Test Hygiene
- Tests that test nothing meaningful (empty assertions, tautologies)
- Tests that duplicate other tests (same logic, different name)
- Tests for code that no longer exists
- Snapshot files that are orphaned

## Output

For each category with findings:
1. Fix the issues on a new branch `patrol/<category>-YYYY-MM-DD`
2. Open a PR with clear description of what was cleaned
3. If no findings in a category, skip silently

If nothing found across all categories, say "Clean — nothing to patrol today."

## Rules

- Don't refactor working code — only remove/unify dead weight
- Don't touch test infrastructure or CI config
- Don't delete code you're unsure about — when in doubt, skip
- One PR per category, not one giant PR
- Keep PR descriptions concise: list what was removed/unified and why
