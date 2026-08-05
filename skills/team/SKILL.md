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

| User says | Action |
|-----------|--------|
| "brainstorm [topic]" / multiple names + question | Read [workflows/brainstorm.js](workflows/brainstorm.js), run as workflow |
| "sprint" / "build" / "let's work on [feature]" | Read [workflows/sprint.js](workflows/sprint.js), run as workflow |
| "diagnose [bug]" / "why is [X] broken" | Read [workflows/diagnose.js](workflows/diagnose.js), run as workflow |
| "Boris/Linus, review [PR/code]" | Read [workflows/team-review.js](workflows/team-review.js), run as workflow |
| "Musk, should we [X]?" | Read MEMBERS.md, answer inline in persona voice (no workflow) |
| "Jobs, how does [X] feel?" | Read MEMBERS.md, answer inline in persona voice (no workflow) |

## How to Run Workflows

When routing to a workflow:

1. **Read** the workflow `.js` file using the relative path above
2. **Call** the `Workflow` tool with the `script` parameter set to the **full file content** you just read
3. **Pass** the appropriate `args` for the workflow (see reference below)

```
// Example: user says "brainstorm: should we use GraphQL or REST?"
// Step 1: Read workflows/brainstorm.js → get file content
// Step 2: Workflow({script: <file content>, args: "Should we use GraphQL or REST?"})
```

**DO NOT** use `Workflow({name: ...})` — these workflows are not registered globally.
**DO NOT** use `Workflow({scriptPath: ...})` — the install path is dynamic and unreliable.
**ALWAYS** use `Workflow({script: <content you read>})` — this always works.

## CRITICAL RULES

- **NEVER pass `model` parameter** when spawning agents. Not in Agent tool, not in Workflow. Let all sub-agents INHERIT the session model.
- **Always read MEMBERS.md** before answering inline dispatches.
- **Use `script` not `scriptPath` or `name`** when calling Workflow.

## Workflow Args Reference

### brainstorm.js
```
args: "The question to debate"
args: {question: "...", context: "optional background info"}
```

### team-review.js
```
args: {pr: "123"}          // PR number
args: {pr: "full-url"}     // PR URL
args: {diff: "raw diff"}   // Raw diff text
```

### sprint.js
```
args: {goal: "docs/sprints/sprint-001.md"}           // full run
args: {goal: "docs/sprints/sprint-001.md", phase: "plan"}  // plan only
```

### diagnose.js
```
args: "description of what fails"
args: {message: "what fails", expected: "what should happen", state: {extra: "context"}}
```

## Examples

```
User: "Boris and Linus, review PR 212"
→ Read workflows/team-review.js
→ Workflow({script: <content>, args: {pr: "212"}})

User: "Should we use monorepo or polyrepo?"
→ Read workflows/brainstorm.js
→ Workflow({script: <content>, args: "Should we use monorepo or polyrepo?"})

User: "Let's sprint on the search integration"
→ Read workflows/sprint.js
→ Workflow({script: <content>, args: {goal: "docs/sprints/sprint-003.md"}})

User: "Why does login fail on mobile?"
→ Read workflows/diagnose.js
→ Workflow({script: <content>, args: "login fails on mobile"})

User: "Musk, should we build feature X?"
→ Read MEMBERS.md
→ Answer inline in Musk's voice (no workflow for quick opinions)
```
