# Go — Test, Simplify, Ship

Verify the current change works, simplify the code, then commit + push + open PR.

## Instructions

1. **Verify**: Run the project's test suite and lint. If anything fails, fix it before proceeding.
   - Look for: `npm test`, `bun test`, `pytest`, `go test`, `make test`, or whatever this repo uses
   - Also run lint/typecheck if configured
   - If tests don't exist for the change, write a minimal one first

2. **Simplify**: Review all uncommitted changes for:
   - Unnecessary abstractions (could inline?)
   - Verbose code that could be terser without losing clarity
   - Leftover debug code, TODOs from this session, commented-out experiments
   - Imports that are no longer needed
   - Apply fixes directly — don't ask

3. **Ship**:
   - Stage relevant files (not `.env`, credentials, or unrelated changes)
   - Commit with a clear message describing what and why
   - Push to remote
   - If on a feature branch, open a PR with a concise summary

4. **Report**: One line — what shipped and the PR URL (if created).

## Rules

- If tests fail and you can't fix in 3 attempts, stop and tell me what's wrong
- Don't simplify test files — only production code
- Don't batch unrelated changes into one commit
- If there's nothing to commit (clean working tree), just say so
