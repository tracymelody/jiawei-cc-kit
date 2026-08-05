# Test Hygiene

Find and remove low-value tests. Open a PR.

## Instructions

1. **Tautological tests**: Tests that always pass regardless of implementation:
   - `assert True`, `expect(1).toBe(1)` with no meaningful setup
   - Tests that mock everything including the thing being tested
   - Tests where the assertion is identical to the setup

2. **Duplicate tests**: Multiple tests exercising the exact same code path with trivially different inputs that don't cover new branches.

3. **Orphan tests**: Tests for functions/classes/modules that no longer exist.
   - The import fails or the symbol is undefined
   - The file under test was deleted

4. **Orphan snapshots**: Snapshot files (`.snap`, `__snapshots__/`) with no corresponding test.

5. **Over-mocked tests**: Tests where every dependency is mocked, making the test verify only that mocks return what you told them to. These give false confidence.

6. Create branch `patrol/tests-YYYY-MM-DD`, commit, open PR.

## Rules

- Never remove tests that cover real edge cases (even if they look simple)
- Never remove integration/e2e tests — they're expensive to recreate
- Never remove tests just because they're slow
- Run the test suite after deletion to confirm nothing breaks
- PR title: "patrol: prune N low-value tests"
