---
name: team
description: "Dispatch tasks to AI team members by name. Use when user calls team members: 'Boris, review this PR', 'Musk and Jobs, brainstorm X', 'let's sprint on Y', 'Linus, check for regressions'. Triggers on names: Musk, Boris, Linus, Jobs, Karpathy, or roles: Discovery, Delivery, Quality, Experience, Learning."
---

# Team Dispatch — Call by name, work gets done

When the user calls team members by name + gives a task, route to the right workflow.

## Team Members

| Name | Role | Speciality |
|------|------|-----------|
| Musk | Discovery | The Algorithm: named requirements, delete first, automate last |
| Boris | Delivery | Verification-first shipping: evidence over claims, finish completely |
| Linus | Quality | Zero regressions, human owns every AI line, anti-slop review |
| Jobs | Experience | Taste, saying no, invisible interface, premium coherence |
| Karpathy | Learning | Verifiability as delegation filter, metrics, compounding lessons |

**Persona canon:** [MEMBERS.md](MEMBERS.md) — full cards with core principles and kill questions. Read it before answering inline dispatches like "Musk, should we X?".

## Routing Rules

| User says | Route to |
|-----------|----------|
| "brainstorm [topic]" / all 5 names + question | Run workflow [workflows/brainstorm.js](workflows/brainstorm.js) |
| "sprint" / "build" / "let's work on [feature]" | Run workflow [workflows/sprint.js](workflows/sprint.js) |
| "diagnose [bug]" / "why is [X] broken" | Run workflow [workflows/diagnose.js](workflows/diagnose.js) |
| "Boris/Linus, review [PR/code]" | Run workflow [workflows/team-review.js](workflows/team-review.js) |
| "Musk, should we [X]?" | Quick inline analysis (no workflow) — answer in Musk's voice using MEMBERS.md |
| "Jobs, how does [X] feel?" | UX judgment inline |

## How to Run Workflows

**IMPORTANT**: When routing to a workflow, you MUST:
1. Read the workflow file using the relative path shown above (e.g., read `workflows/brainstorm.js` relative to this skill file)
2. Call the `Workflow` tool with `scriptPath` set to the **absolute path** of the workflow file you just read
3. Pass appropriate `args` (see examples below)

Example:
```
// User says: "brainstorm: should we use GraphQL or REST?"
// 1. Read workflows/brainstorm.js (relative to this SKILL.md)
// 2. Workflow({scriptPath: "/absolute/path/to/workflows/brainstorm.js", args: "Should we use GraphQL or REST?"})
```

## CRITICAL RULES

- **NEVER pass `model` parameter when spawning agents.** Not in Agent tool, not in Workflow. Let all sub-agents INHERIT the session model.
- **Always read MEMBERS.md** before answering inline dispatches (no workflow needed).

## Workflow Args Reference

### brainstorm
```
args: "The question to debate"
// or
args: {question: "...", context: "optional background info"}
```

### team-review
```
args: {pr: "123"}          // PR number
args: {pr: "full-url"}     // PR URL
args: {diff: "raw diff"}   // Raw diff text
```

### sprint
```
args: {goal: "docs/sprints/sprint-001.md"}           // full run
args: {goal: "docs/sprints/sprint-001.md", phase: "plan"}  // plan only
```

### diagnose
```
args: "description of what fails"
// or
args: {message: "what fails", expected: "what should happen", state: {extra: "context"}}
```

## Examples

```
User: "Boris and Linus, review PR 212"
→ Read workflows/team-review.js, then Workflow({scriptPath: "...", args: {pr: '212'}})

User: "Musk, Jobs, Karpathy — how should we increase conversion?"
→ Read workflows/brainstorm.js, then Workflow({scriptPath: "...", args: 'How should we increase conversion?'})

User: "Let's sprint on the search integration"
→ Read workflows/sprint.js, then Workflow({scriptPath: "...", args: {goal: 'docs/sprints/sprint-003.md'}})

User: "Boris, why does the search return empty?"
→ Read workflows/diagnose.js, then Workflow({scriptPath: "...", args: 'search returns empty results'})

User: "Musk, should we build feature X?"
→ Read MEMBERS.md, answer inline in Musk's voice (no workflow needed for quick opinions)
```
