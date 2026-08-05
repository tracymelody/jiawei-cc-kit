# claude-team-kit

A Claude Code plugin that gives your team an AI Dream Team — 5 expert personas for brainstorming, code review, sprints, and bug diagnosis. Works with any project (frontend, backend, fullstack).

## Install

```bash
claude plugin install <your-org>/claude-team-kit
```

Or add to your project's `.claude/settings.json`:
```json
{
  "plugins": ["<your-org>/claude-team-kit"]
}
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
| `/go` | Test → Simplify → Commit → Push → PR (one shot) |
| `/patrol` | Find and fix: dead code, duplicates, stale flags, test rot |
| `/ablate` | Audit system prompts for bloat and dead rules (LLM projects) |
| `/blindspot` | Find what nobody thought to check in the current diff |
| `/test` | Smart test runner with failure analysis |

### JIRA Integration

| Command | What it does |
|---------|-------------|
| `Create an epic for X` | Creates well-structured JIRA epics with standard format |
| `Pick up MVA-123` | Fetches ticket → creates branch → implements → verifies → pushes |

Requires `mcp-atlassian` MCP server configured. See [setup](#jira-setup).

## Usage Examples

```
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
| **mattpocock/skills** | `/grill-me` (idea sharpening), `/to-spec`, `/to-issues`, `/tdd` | `npx skills@latest add mattpocock/skills` |
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
