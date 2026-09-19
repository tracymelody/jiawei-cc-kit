# Blindspot Pass

Before starting work in unfamiliar terrain, scan it and surface the user's relevant unknown unknowns — then hand back a better implementation prompt. From Anthropic's Claude Code team (Thariq Shihipar): "Before any code is written is the cheapest place to find an unknown." Triggers: "blindspot", "what am I missing", "unknown unknowns", "盲点", "我漏了什么".

Reconnaissance only — report, fix nothing. (`/da` attacks the reasoning that exists; `/blindspot` finds the questions never asked.)

## Do

1. **Subject** — args if given; else the work being discussed; else the project. If you can't tell what the user already knows about this terrain, ask one question first — their knowledge defines what counts as a blindspot.
2. **Scan — focused, not exhaustive** — open the actual files of the modules the task touches, their real callers, plus one `git log` pass over that area. Look especially for: registration points (things that must also be wired somewhere non-obvious), structural exceptions (the place that breaks the repo's own convention), feature flags, migrations in flight, reverted or abandoned attempts at the same idea, async side effects, and the "everyone in this domain knows X". Minutes of scanning, not tens of minutes — heavier only via Deep (below).
3. **Filter** — a finding must be: (a) nowhere considered by the user, (b) approach-changing if it bites, (c) anchored to a specific file/commit/fact — "consider security" is banned, (d) closable by one prompt line, one decision, or one cheap check. If the user's reaction would be "I already knew that" or "true of any project" — cut it.

## Deep — only when asked

`/blindspot deep <task>`. If a fast pass hits terrain bigger than expected, offer the upgrade — never auto-escalate.

- Fan out parallel Explore agents: one each for code, git history, docs/domain — plus past Claude sessions on this project (`~/.claude/projects/<project-dir>/`) for prior attempts and decisions.
- Deep widens the scan, never the report: same filter, same one-screen cards, same assembled prompt.

## Report — one screen, MUST match conversation language

**LANGUAGE RULE (HARD):** Output in whatever language the user last spoke. 中文对话→中文报告, English conversation→English report. Code references (file paths, function names) stay as-is. Never default to English.

- **Terrain** — 1-2 sentences: what you scanned, the lay of the land.
- **Cards** — 3-5 (max 7), ranked by impact × invisibility. Each card: **the gap**, with its file/commit evidence inline → **prompt fix**, one copyable line (the constraint to state, the decision to make first, or the file to anchor on). Zero findings is a valid result — say so and stop; never pad.
- **The assembled prompt** — the task rewritten with all fixes woven in, concrete enough (paths, constraints, decisions) that a fresh session could start work without rediscovering the terrain. This is the deliverable.

*Source: thariqs.github.io/html-effectiveness/unknowns*
