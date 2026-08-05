export const meta = {
  name: 'diagnose',
  description: 'Full-stack bug trace: systematically find WHERE and WHY something breaks.',
  whenToUse: 'When a user reports a bug or unexpected behavior. Pass the failing scenario as args.',
  phases: [
    { title: 'Reproduce', detail: 'Reproduce the exact failure, capture all observations' },
    { title: 'Trace', detail: 'Follow the request through each layer of the system' },
    { title: 'Root Cause', detail: 'Identify the exact layer and line where behavior diverges' },
    { title: 'Fix Plan', detail: 'Propose minimal fix with verification steps' },
  ],
}

// ═══════════════════════════════════════════════════════════════════
// Diagnose — systematic bug tracing for multi-layer systems.
//
// The problem: bugs could be in ANY layer. This workflow traces
// through ALL layers systematically instead of guessing.
//
// Works for:
//   - Web apps (frontend → API → service → DB)
//   - LLM agents (input → routing → agent → tool → response)
//   - CLI tools (args → parsing → logic → output)
//   - Any multi-layer system
//
// Usage:
//   Workflow({name: 'diagnose', args: 'clicking submit does nothing'})
//   Workflow({name: 'diagnose', args: {message: '...', expected: '...'}})
// ═══════════════════════════════════════════════════════════════════

function parseArgs(a) {
  if (a && typeof a === 'object') return a
  if (typeof a === 'string') return { message: a }
  return {}
}
const { message, expected, state } = parseArgs(args)
if (!message) throw new Error('Usage: {message: "what fails", expected: "what should happen", state: {extra context}}')

const DIAGNOSIS_SCHEMA = {
  type: "object",
  required: ["layer", "root_cause", "evidence"],
  properties: {
    layer: { type: "string", description: "Which layer the bug lives in" },
    root_cause: { type: "string", description: "One-sentence diagnosis" },
    evidence: { type: "string", description: "The specific observation that proves this is the cause" },
    file: { type: "string", description: "Exact file path where the bug lives" },
    line_hint: { type: "string", description: "Approximate location in the file" },
    fix_proposal: { type: "string", description: "Minimal change to fix it" },
    verify_steps: { type: "string", description: "Steps to verify the fix works" },
  },
}

const REPRO_SCHEMA = {
  type: "object",
  required: ["reproduced", "observations"],
  properties: {
    reproduced: { type: "boolean" },
    steps_taken: { type: "array", items: { type: "string" }, description: "What was done to reproduce" },
    actual_behavior: { type: "string", description: "What actually happened" },
    expected_behavior: { type: "string", description: "What should have happened" },
    errors: { type: "array", items: { type: "string" }, description: "Verbatim error messages" },
    observations: { type: "array", items: { type: "string" }, description: "Facts only, one sentence each — anything unusual" },
  },
}

const TRACE_SCHEMA = {
  type: "object",
  required: ["layers", "first_failure"],
  properties: {
    layers: { type: "array", items: {
      type: "object",
      required: ["layer", "status", "evidence"],
      properties: {
        layer: { type: "string" },
        status: { type: "string", enum: ["PASS", "FAIL", "SKIPPED"] },
        evidence: { type: "string", description: "One sentence — the specific observation" },
      },
    }},
    first_failure: { type: "string", description: "The first failing layer, or 'none'" },
  },
}

// ─── Phase 1: Reproduce ──────────────────────────────────────────

phase('Reproduce')

const stateJson = state ? JSON.stringify(state) : ''
const reproduction = await agent(`You are reproducing a bug. Your job is to confirm the failure exists and capture all observable facts.

## The failing scenario:
- What fails: "${message}"
- Expected behavior: ${expected || '(not specified — judge if behavior is reasonable)'}
${stateJson ? `- Additional context: ${stateJson}` : ''}

## Steps:
1. Read CLAUDE.md (if exists) to understand how to run/test this project
2. Determine project type and how to exercise the failing scenario:
   - Web app? Start the dev server, use curl/browser
   - CLI tool? Run the command
   - Library? Write a minimal repro script
   - API? Send the request
3. Reproduce the EXACT failure. Record:
   - What steps you took
   - What actually happened (verbatim output/error)
   - Any error messages, stack traces, logs
   - Anything unusual you noticed

Report EVERYTHING you observe. Don't interpret yet — just facts.`, {
  label: 'reproduce', phase: 'Reproduce', schema: REPRO_SCHEMA, effort: 'medium',
})

const reproSummary = reproduction ? [
  `Reproduced: ${reproduction.reproduced}`,
  `Actual: ${reproduction.actual_behavior || '(unknown)'}`,
  `Steps: ${(reproduction.steps_taken || []).join(' → ') || 'none'}`,
  `Errors: ${(reproduction.errors || []).join('; ') || 'none'}`,
  `Notes: ${(reproduction.observations || []).join(' | ')}`,
].join('\n') : '(reproduction failed — no data)'

log(`Reproduction: ${reproduction?.reproduced ? 'confirmed' : 'could not reproduce'}`)

// ─── Phase 2: Trace ──────────────────────────────────────────────

phase('Trace')

const trace = await agent(`You are tracing a bug through the full stack. You have reproduction data below.

## Reproduction:
${reproSummary}

## Your job — trace through each layer of the system:

First, determine the architecture by reading CLAUDE.md and key files. Then trace through EACH layer relevant to this project:

For a web application:
- Input/Request: Was the request well-formed? Correct URL, headers, body?
- Routing: Did it reach the right handler?
- Validation: Were inputs validated and transformed correctly?
- Business Logic: Did the core logic execute correctly?
- Data Layer: Did DB queries/API calls return expected data?
- Response: Was the response formatted and sent correctly?
- Frontend: Did the client handle the response correctly?

For a CLI/library:
- Input Parsing: Were args/config parsed correctly?
- Configuration: Were settings/env vars loaded correctly?
- Core Logic: Did the main algorithm work?
- I/O: Were files/network calls handled correctly?
- Output: Was the result formatted correctly?

For each layer: PASS (working correctly), FAIL (this is where it breaks), or SKIPPED (not relevant).
Evidence = one sentence per layer, the specific observation.
Stop at the FIRST layer that fails — that's likely the root cause.

READ the actual source files at each layer. grep for relevant function names. Check logs if available.`, {
  label: 'trace', phase: 'Trace', schema: TRACE_SCHEMA, effort: 'high',
})

const traceSummary = (trace?.layers || []).map(l => `${l.layer}: ${l.status} — ${l.evidence}`).join('\n') || '(trace failed)'

log(`Trace complete — first failure: ${trace?.first_failure || '?'}`)

// ─── Phase 3: Root Cause ─────────────────────────────────────────

phase('Root Cause')

const diagnosis = await agent(`You have the full trace of a bug. Now identify the ROOT CAUSE.

## Trace Results (per layer):
${traceSummary}
First failure: ${trace?.first_failure || 'unknown'}

## Reproduction facts:
${reproSummary}

## Rules for root cause identification:
- It must be in ONE specific layer (not "multiple factors")
- It must point to a specific FILE and approximate LOCATION
- It must explain WHY the current code produces the wrong behavior
- It must propose a MINIMAL fix (smallest change that fixes it)
- It must include verification steps (how to confirm the fix works)

Be PRECISE. "The code is unclear" is not a root cause. Point to a specific line/function and explain what it does wrong.`, {
  label: 'root-cause', phase: 'Root Cause', schema: DIAGNOSIS_SCHEMA, effort: 'high',
})

log(`ROOT CAUSE: [${diagnosis.layer}] ${diagnosis.root_cause}`)
log(`File: ${diagnosis.file}`)
log(`Fix: ${diagnosis.fix_proposal}`)
log(`Verify: ${diagnosis.verify_steps}`)

// ─── Phase 4: Record ─────────────────────────────────────────────

phase('Fix Plan')

await agent(`Record this diagnosed bug. Create or update docs/bugs.md with this entry at the TOP:

---
### [${diagnosis.layer}] ${message.slice(0, 60)}
**Status**: open
**Symptom**: "${message}"
**Expected**: ${expected || '(correct behavior)'}
**Root Cause**: ${diagnosis.root_cause}
**File**: ${diagnosis.file} ${diagnosis.line_hint || ''}
**Fix**: ${diagnosis.fix_proposal}
**Verify**: ${diagnosis.verify_steps}
---

If docs/bugs.md exists, insert at top (after header). If not, create with header "# Bug Registry" first.`, {
  label: 'record-bug', phase: 'Fix Plan', effort: 'low',
})

log(`Bug recorded in docs/bugs.md — ready for human review.`)

return {
  message,
  expected,
  diagnosis,
  trace,
  reproduction,
}
