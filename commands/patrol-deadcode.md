# Dead Code Cleanup

Find and remove dead code through static analysis. Open a PR.

## Instructions

1. **Unused exports**: Find exported symbols never imported elsewhere in the repo.
   - `grep -r` for the export name across all source files
   - If zero hits outside its own file → dead

2. **Unused internal functions**: Functions/methods never called within their module.

3. **Unreachable code**: 
   - Branches after unconditional return/throw
   - `if (false)` or always-true conditions
   - Catch blocks for exceptions that can't be thrown

4. **Commented-out code**: Blocks of commented code (not explanatory comments). Git has history — delete them.

5. **Orphan files**: Source files not imported/required by anything in the dependency graph.

6. **Unused dependencies**: Packages in manifest files never imported in source code.
   - Check: `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`

7. If the project has test coverage data (coverage/, .nyc_output/, htmlcov/), cross-reference: functions with 0% coverage across all test runs are strong candidates.

8. Create branch `patrol/deadcode-YYYY-MM-DD`, commit changes, open PR.

## Rules

- Never delete something only used in tests — that's not dead
- Never delete CLI entry points, signal handlers, or plugin hooks (they may be called externally)
- Check for dynamic usage patterns (`getattr`, `__getitem__`, reflection) before removing
- When unsure, skip — false positives waste reviewer time
- PR title: "patrol: remove N dead code items"
