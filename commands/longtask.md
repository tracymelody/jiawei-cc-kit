# /longtask - Track Multi-Session Tasks

Track tasks too large for one session. Lightweight wrapper around a markdown file.

## Usage

- `/longtask add <description>` — add a new task
- `/longtask list` — show all tasks
- `/longtask done <id>` — mark complete
- `/longtask drop <id>` — remove a task

## Storage

File: `.claude/longtasks.md` in the current project directory. Create if missing.

## Format

```markdown
# Long Tasks

- [ ] LT-1: <description> (created YYYY-MM-DD)
- [x] LT-2: <description> (created YYYY-MM-DD, done YYYY-MM-DD)
```

Simple checklist. No status machines, no AI gates. When you finish a task, mark it done.
