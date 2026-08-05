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

**Persona canon:** `MEMBERS.md` in this directory — full cards with core principles and kill questions.

## Routing Rules

| User says | Route to |
|-----------|----------|
| "brainstorm [topic]" / all 5 names + question | `Workflow({name: 'brainstorm', args: topic})` |
| "sprint" / "build" / "let's work on [feature]" | `Workflow({name: 'sprint', args: {goal: '<sprint-goal-file>'}})` |
| "diagnose [bug]" / "why is [X] broken" | `Workflow({name: 'diagnose', args: message})` |
| "Boris/Linus, review [PR/code]" | `Workflow({name: 'team-review', args: {pr: '<PR number or URL>'}})` |
| "Musk, should we [X]?" | Quick inline analysis (no workflow needed) — answer in Musk's voice using MEMBERS.md |
| "Jobs, how does [X] feel?" | UX judgment inline |

## CRITICAL RULE

**NEVER pass `model` parameter when spawning agents.** Not in Agent tool, not in Workflow. Let all sub-agents INHERIT the session model.

## Process

1. Parse WHO is called (which team members)
2. Parse WHAT they're asked to do
3. Route to the appropriate workflow or inline answer
4. Report results when done
5. When spawning Agent: NO model parameter. EVER.

## Examples

```
User: "Boris and Linus, review PR 212"
→ Workflow({name: 'team-review', args: {pr: '212'}})

User: "Musk, Jobs, Karpathy — how should we increase conversion?"
→ Workflow({name: 'brainstorm', args: 'How should we increase conversion?'})

User: "Let's sprint on the search integration"
→ Workflow({name: 'sprint', args: {goal: 'docs/sprints/sprint-002.md'}})

User: "Boris, why does the search return empty?"
→ Workflow({name: 'diagnose', args: 'search returns empty results'})
```
