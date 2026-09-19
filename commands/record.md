# Record Progress

One-click progress recording at session end. Fully automatic inference, no questions asked.

## Instructions

1. **Gather info** (in parallel):
   - `git log --since="today 00:00" --oneline` — today's commits
   - `git diff --stat HEAD~5` — recent file changes
   - Review key work and decisions from current conversation
   - Read STATUS.md current content (if exists)

2. **Assess** (don't ask user):
   - What was done today? (infer from git log + conversation)
   - Any new decisions? (technical choices, user feedback, direction changes)
   - Has project status changed? (new feature shipped, cron changes, system state changes)
   - What's next? (TODOs mentioned in conversation)

3. **Update files** (only update what changed):

### STATUS.md — Snapshot (refresh)
- Update date
- Refresh system status (if changed)
- Refresh "next steps" (if priorities shifted)
- If file doesn't exist, create a basic one

### PROGRESS.md — Milestones (append at bottom)
- Only record big things (feature launches, major refactors, critical bug fixes)
- Skip trivial items ("fixed a typo" doesn't need recording)
- Format: `### YYYY-MM-DD` + one item per line
- If nothing significant happened today, skip
- If file doesn't exist, create a basic one

### DECISIONS.md — Decision log (prepend at top)
- Only append when there's a key decision (technical choice, explicit user feedback, direction change)
- Format: `## YYYY-MM-DD | [tag] One-line title`
- Content: what was decided + why + what alternatives were rejected
- If no new decisions, skip
- If file doesn't exist and there's a decision to record, create a basic one

### Memory — Sync
- Save key project status updates to memory (project type)
- Save new user feedback to memory (feedback type)
- Ensure memory and repo files are consistent (repo is source of truth)

4. **git commit + push**:
   - Commit updated files (message format: `record YYYY-MM-DD progress`)
   - Push to remote

5. **Reply to user**: briefly list what was updated (one sentence)

## Rules

- **Don't ask questions** — infer everything from git log + conversation
- **Don't repeat** — if already recorded today (STATUS.md date is today), only add new content
- **Only record big things** — PROGRESS should not contain "fix typo" "update comment" etc.
- **Use today's date** — `date +%Y-%m-%d`
- **STATUS.md stays under 50 lines**
- **PROGRESS.md one line per item** — no paragraphs
- **Repo is source of truth** — memory is an acceleration cache, key info must live in repo files
- If user attaches a message `/record <message>`, incorporate that info into the record
