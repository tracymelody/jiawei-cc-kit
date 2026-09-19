# Python Linter

Run a full lint pass on the current project or specified files.

## Process

1. **Detect scope** from arguments:
   - `/lint` (no args) → lint all changed files vs main branch
   - `/lint .` → lint entire project
   - `/lint <path>` → lint that file/directory

2. **Run all checks**:
   ```bash
   # Get target files
   FILES="${args:-$(git diff --name-only main...HEAD | grep '\.py$')}"

   black --check $FILES
   isort --check-only $FILES
   flake8 $FILES
   mypy $FILES
   ```

3. **Report** — group issues by severity, suggest fixes for the most critical ones first.
