# jiawei-cc-kit

An opinionated Claude Code plugin — AI Dream Team (5 expert personas) for brainstorming, code review, sprints, bug diagnosis, and code quality patrol. Works with any project (frontend, backend, fullstack).

## Install

```bash
claude plugin install tracymelody/jiawei-cc-kit
```

## What's included

### The Dream Team (5 Personas)

| Name | Role | When they shine |
|------|------|----------------|
| **Musk** | Discovery | Deleting unnecessary work, questioning requirements |
| **Boris** | Delivery | Shipping fast with verification built in |
| **Linus** | Quality | Catching regressions, protecting what works |
| **Jobs** | Experience | Taste, UX polish, saying no to mediocrity |
| **Karpathy** | Learning | Metrics, evidence, compounding lessons |

### Workflows

| Command | What it does |
|---------|-------------|
| `Musk, Jobs, Boris — should we use X or Y?` | **Brainstorm**: 5 independent positions → clash → converge on a decision |
| `Boris and Linus, review PR 123` | **Team Review**: parallel review + E2E verify + devil's advocate + blindspot scan + simplify |
| `Let's sprint on feature X` | **Sprint**: plan → sequential build → quality gate → experience check → retro |
| `Diagnose: clicking submit does nothing` | **Diagnose**: reproduce → trace through layers → root cause → fix plan |
| `Hunt bugs in this API` | **Hunt**: adversarial fuzzing — hacker mindset, adaptive, auto-triage |

### Slash Commands

| Command | What it does |
|---------|-------------|
| `/interview` | **NEW** — Interview you before coding to surface requirement-level unknowns. Outputs an assembled implementation brief. |
| `/blindspot` | Scan the current diff/area for unknown unknowns — things nobody thought to check |
| `/da` | Devil's advocate — Claude + Gemini cross-challenge the current decision |
| `/ablate` | Audit system prompts for bloat, dead rules, and cargo-culted instructions |
| `/go` | Test → Simplify → Commit → Push → PR (one shot) |
| `/patrol` | Find and fix: dead code, duplicates, stale flags, test rot |
| `/test` | Smart test runner with failure analysis |
| `/lint` | Python linter (black, isort, flake8, mypy) on changed files |
| `/record` | Auto-record progress to STATUS.md, PROGRESS.md, DECISIONS.md |
| `/longtask` | Track tasks too large for one session |

### Hooks

| Hook | Type | What it does |
|------|------|-------------|
| `protect-tests` | PreToolUse | **NEW** — Blocks Claude from "fixing" tests by deleting, skipping, or commenting out assertions. Protects the entire verification chain. |

Install the hook:
```bash
cp hooks/protect-tests.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/protect-tests.sh
```

Add to `~/.claude/settings.json` under `hooks.PreToolUse`:
```json
{
  "matcher": "Edit|Write|MultiEdit",
  "hooks": [{
    "type": "command",
    "command": "~/.claude/hooks/protect-tests.sh",
    "timeout": 10
  }]
}
```

### JIRA Integration

| Command | What it does |
|---------|-------------|
| `Create an epic for X` | Creates well-structured JIRA epics with standard format |
| `Pick up MVA-123` | Fetches ticket → creates branch → implements → verifies → pushes |

Requires `mcp-atlassian` MCP server configured. See [setup](#jira-setup).

## Usage Examples

```
# Interview before a complex task
/interview Add multi-tenant support to the auth module

# Scan for blindspots in current changes
/blindspot

# Brainstorm a decision
"Should we use GraphQL or REST for the new API?"

# Review a PR with the team
"Boris and Linus, review PR 45"

# Sprint on a feature
"Let's sprint on docs/sprints/sprint-003.md"

# Diagnose a bug
"Diagnose: the search API returns empty results for queries with spaces"

# Quick quality pass
/patrol
/go
```

## Requirements

- Claude Code CLI v1.0+
- `gh` CLI (for PR workflows)
- `jq` (for hooks)
- `mcp-atlassian` MCP server (optional, for JIRA integration)

## JIRA Setup

1. Install the `mcp-atlassian` MCP server
2. Configure with your Atlassian credentials
3. Add JIRA MCP tools to your allowed permissions in `.claude/settings.json`

## Customization

### Adapting personas

Edit `skills/team/MEMBERS.md` to adjust the personas. The kill questions and core principles drive their behavior in workflows.

### Adding project-specific verification

The sprint workflow reads your project's CLAUDE.md for context. Add verification commands there:
```markdown
## Testing
- `npm test` — unit tests
- `npm run e2e` — end-to-end
- `curl localhost:3000/health` — server health check
```

## Recommended Companion Plugins

This plugin focuses on team workflows and code quality. For other capabilities, install these alongside:

| Plugin | What it adds | Install |
|--------|-------------|---------|
| **DreambigOu/ELI5** | Audience-adaptive explanations (ELI5, ELI-manager, ELI-senior) | `claude plugin install DreambigOu/ELI5` |
| **mattpocock/skills** | `/grill-me` (idea sharpening), `/to-spec`, `/to-issues`, `/tdd`, `/teach` | `npx skills@latest add mattpocock/skills` |
| **chrome-devtools-mcp** | Browser debugging, screenshots, performance analysis | `claude plugin install chrome-devtools-mcp` |
| **figma** | Design ↔ code bridge, Figma file editing | `claude plugin install figma` |
| **code-review** | Automated PR review with confidence scoring | `claude plugin install code-review` |
| **frontend-design** | High-quality UI/component generation | `claude plugin install frontend-design` |

Plugins are additive — install as many as you need. They don't conflict.

## Philosophy

This plugin encodes battle-tested patterns for AI-assisted development:

1. **Independent perspectives before convergence** — brainstorm gets 5 genuinely different angles before synthesizing
2. **Adversarial verification** — findings must survive a devil's advocate challenge
3. **Evidence over claims** — every review finding needs a verifiable check, not speculation
4. **Sequential building** — features are built and verified one at a time (changes interact)
5. **Compounding lessons** — every sprint retro feeds rules that improve future sessions
6. **Interview before implementation** — surface unknowns before writing code, not after
7. **Protect the verification chain** — tests are sacred; never disable them to fake green
