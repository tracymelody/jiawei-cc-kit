# Blindspot Pass

Find what nobody thought to check in the current working diff or PR.

## Instructions

1. **Get the diff**: `git diff` (or `gh pr diff` if on a PR branch)

2. **Scan for blindspots** — things the author probably didn't think about:
   - **Registration points**: Does this new thing need to be registered/imported/configured somewhere non-obvious?
   - **Downstream consumers**: Who reads the data this change writes? Are they updated?
   - **Async side effects**: Event listeners, webhooks, cron jobs, background workers that touch this data
   - **Error paths**: What happens when the new code fails? Is there a fallback? Does it fail silently?
   - **Config/env**: Does this need a new env var, feature flag, or config entry?
   - **Docs**: Does any user-facing doc need updating?
   - **Tests**: Are there integration tests that exercise the changed path?
   - **Monitoring**: Will someone know if this breaks in production?

3. **For each blindspot found**:
   - Name the gap
   - Point to the file/line that proves it exists (grep, file read)
   - Rate impact: high / medium / low
   - Suggest the one-line fix

4. **Report** findings sorted by impact. Max 5 findings — quality over quantity.

## Rules

- Evidence required: every finding must have a file path or command that proves it
- "Consider X" without evidence = banned. Show the missing registration, the unchecked null, the orphaned listener.
- Don't repeat what lint/typecheck would catch
