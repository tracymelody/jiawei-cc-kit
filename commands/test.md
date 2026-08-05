# Test Runner

Run the project's test suite intelligently.

## Instructions

1. **Detect test framework**:
   - Check package.json scripts (jest, vitest, mocha, playwright)
   - Check pyproject.toml / setup.cfg (pytest, unittest)
   - Check Makefile targets
   - Check for go test, cargo test, etc.

2. **Run tests**:
   - If argument provided: run only tests matching that pattern
   - If no argument: run the full suite
   - If tests are slow (>60s), run only tests related to recently changed files first

3. **On failure**:
   - Show the failing test name and assertion
   - Show the relevant source code around the failure
   - Propose a fix if the test is correct but the code is wrong
   - Propose a test fix if the code is correct but the test is stale

4. **Report**: Pass/fail count, time taken, and any action needed.

## Rules

- Never mark a test as skipped to make the suite pass
- If a test is genuinely obsolete (tests removed functionality), delete it
- If the test framework isn't installed, install it first
