# Test Runner

Run tests for the current project. Auto-detects framework and scope.

## Process

1. **Detect framework** — check which test runner the project uses:
   - `pyproject.toml` with `[tool.pytest]` or `pytest.ini` → pytest
   - `manage.py` → Django tests
   - Otherwise → `python -m unittest discover`

2. **Detect scope** from arguments:
   - `/test` (no args) → run all tests
   - `/test <path>` → run that specific file/directory
   - `/test changed` → only test files changed vs main branch:
     ```bash
     git diff --name-only main...HEAD | grep '_test\.py$\|test_.*\.py$'
     ```

3. **Run with useful defaults**:
   ```bash
   # pytest projects
   pytest -v --tb=short

   # With poetry
   poetry run pytest -v --tb=short

   # Changed files only
   pytest -v --tb=short <changed-test-files>
   ```

4. **On failure** — show only the first failing test in detail, summarize the rest.
