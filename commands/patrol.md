# Patrol — Codebase Hygiene

Run all patrol sub-routines on the current repo. Report findings and fix what's safe to fix.

## Instructions

Run these checks sequentially on the current repo:

### 1. Abstraction Police
Scan for near-duplicate abstractions (functions, classes, utilities that do ~the same thing with different names or slight variations).

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

## Rules

- Make changes directly — don't just report
- Each category gets its own commit (if changes are made)
- Don't touch code in the middle of an active PR (check git status first)
- If unsure whether something is dead, grep for it in the full repo before deleting
