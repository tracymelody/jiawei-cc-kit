export const meta = {
  name: 'sprint',
  description: 'Dream Team sprint: sequential features, verified end-to-end before moving to next',
  whenToUse: 'When you have a sprint goal file and want AI to plan, build, verify, and retro.',
  phases: [
    { title: 'Plan', detail: 'Discovery (Musk): find the REAL user need, delete to essentials, order by dependency' },
    { title: 'Build & Verify', detail: 'Delivery (Boris): one feature at a time, verified end-to-end' },
    { title: 'Quality Gate', detail: 'Quality (Linus): zero regressions — a working feature that breaks is a REJECT' },
    { title: 'Experience', detail: 'Experience (Jobs): not just "does it work" but "is it excellent?"' },
    { title: 'Retro', detail: 'Learning (Karpathy): every mistake → a lesson that compounds' },
  ],
}

// ═══════════════════════════════════════════════════════════════════
// Dream Team Sprint — works with any project type.
//
// DREAM TEAM STANDARDS (each phase enforces one):
//   Plan       · Musk     — find the REAL user need, delete to essentials
//   Build      · Boris    — full-stack ownership: works end-to-end
//   Quality    · Linus    — "we don't break userspace": regression = reject
//   Experience · Jobs     — taste & simplicity: must feel excellent
//   Retro      · Karpathy — teach the fleet: lessons that transfer
//
// Key design choices:
// - SEQUENTIAL features (never parallel) — changes interact unpredictably
// - Verification = running the actual system, not just lint/tests
// - One feature at a time, verified before next
//
// Usage:
//   Workflow({name:'sprint', args:{goal:'docs/sprints/sprint-002.md'}})
//   Workflow({name:'sprint', args:{goal:'docs/sprints/sprint-002.md', phase:'plan'}})
// ═══════════════════════════════════════════════════════════════════

function parseArgs(a) {
  if (a && typeof a === 'object') return a
  if (typeof a === 'string') {
    const s = a.trim()
    if (s.startsWith('{') || s.startsWith('[')) {
      try { return JSON.parse(s) } catch { /* fall through */ }
    }
    return { goal: s, phase: 'all' }
  }
  return {}
}
const parsed = parseArgs(args)
const goalFile = parsed.goal
const runPhase = parsed.phase || 'all'

if (!goalFile) {
  throw new Error('Usage: {goal: "docs/sprints/sprint-NNN.md", phase: "plan"|"all"}')
}

// ─── Schemas ──────────────────────────────────────────────────────

const PLAN_SCHEMA = {
  type: "object",
  required: ["features"],
  properties: {
    summary: { type: "string" },
    features: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "files", "verification"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          why: { type: "string", description: "What the USER gets" },
          files: { type: "array", items: { type: "string" }, description: "Exact files to modify" },
          verification: {
            type: "array",
            items: { type: "string" },
            description: "3-5 concrete checks to verify it works (commands, curl calls, test runs, UI actions)",
          },
          depends_on: { type: "array", items: { type: "string" }, description: "Feature IDs that must be done first" },
        },
      },
    },
  },
}

const FEATURE_RESULT_SCHEMA = {
  type: "object",
  required: ["id", "status", "checks"],
  properties: {
    id: { type: "string" },
    status: { enum: ["green", "red"] },
    checks: {
      type: "array",
      items: {
        type: "object",
        required: ["check", "result", "pass"],
        properties: {
          check: { type: "string" },
          result: { type: "string", description: "Actual output or observation" },
          pass: { type: "boolean" },
          issue: { type: "string" },
        },
      },
    },
    files_changed: { type: "array", items: { type: "string" } },
    fix_iterations: { type: "number" },
    notes: { type: "string" },
  },
}

const REGRESSION_SCHEMA = {
  type: "object",
  required: ["checks"],
  properties: {
    checks: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "pass"],
        properties: {
          name: { type: "string" },
          command: { type: "string" },
          result: { type: "string" },
          pass: { type: "boolean" },
          issue: { type: "string" },
        },
      },
    },
    regressions: { type: "array", items: { type: "string" } },
    lint_pass: { type: "boolean" },
  },
}

const EXPERIENCE_SCHEMA = {
  type: "object",
  required: ["scenarios", "verdict"],
  properties: {
    scenarios: { type: "array", items: { type: "object", required: ["name", "pass", "note"], properties: {
      name: { type: "string" },
      pass: { type: "boolean", description: "PASS only if the experience is excellent — functional but generic = FAIL" },
      note: { type: "string", description: "One sentence why" },
    }}},
    verdict: { type: "string", enum: ["excellent", "functional-but-generic", "broken"] },
    worst_moment: { type: "string", description: "The single worst experience observed" },
  },
}

// ─── Phase: Plan ─────────────────────────────────────────────────

phase('Plan')

const codeMap = await agent(`Gather context for sprint planning. Run these commands:

1. cat ${goalFile}
2. cat CLAUDE.md 2>/dev/null | head -80 || echo "no CLAUDE.md"
3. ls -la src/ app/ lib/ 2>/dev/null | head -30
4. cat package.json 2>/dev/null | head -20 || cat pyproject.toml 2>/dev/null | head -20 || cat go.mod 2>/dev/null | head -10 || echo "no manifest found"

Return concatenated output.`, {
  label: 'scout', phase: 'Plan', effort: 'low',
})

const plan = await agent(`You are the Planner, working to the MUSK STANDARD: find the REAL user need, then delete to essentials. You REJECT speculative features, ungrounded assumptions, anything not traceable to a real signal.

Every feature must carry a NAME — the real signal that asked for it (a user quote, a trace, a metric, a ticket). No name → delete it.

RULES:
- Features are SEQUENTIAL (never parallel) — changes interact unpredictably
- Each feature MUST include verification: 3-5 concrete checks to run AFTER implementing
- Order features by dependency (data layer first, then logic, then UI)
- Keep features small (1-3 files each)
- EVERY feature must serve a REAL user need (not internal elegance)

=== CONTEXT ===
${codeMap}
=== END ===

Decompose into 3-5 sequential features. For each:
- id: short slug
- title: what it does
- why: what the user gets
- files: exact paths to modify
- verification: commands/actions to verify it works (tests, curl calls, UI checks)
- depends_on: which features must be done first`, {
  label: 'planner', phase: 'Plan', schema: PLAN_SCHEMA, effort: 'medium',
})

log(`Plan: ${plan.features.length} features — ${plan.features.map(f => f.id).join(' → ')}`)

await agent(`Read ${goalFile}. Replace or add a "## Backlog" section with:

${plan.features.map(f => `### ${f.id}: ${f.title}\n_${f.why}_\nFiles: ${f.files.join(', ')}\nVerify: ${f.verification.map(t => `"${t}"`).join(', ')}\n`).join('\n')}

One Edit call. No other files.`, { label: 'write-plan', phase: 'Plan', effort: 'low' })

if (runPhase === 'plan') {
  return { phase: 'plan_complete', features: plan.features.map(f => ({ id: f.id, title: f.title })) }
}

// ─── Phase: Build & Verify (SEQUENTIAL) ──────────────────────────

phase('Build & Verify')

const results = []
for (const feature of plan.features) {
  log(`Building: ${feature.id} — ${feature.title}`)

  const result = await agent(`You are building to the BORIS STANDARD: you own the WHOLE vertical slice. The feature is DONE only when it passes all verification checks end-to-end. Evidence over claims: report what ACTUALLY happened, never what you expect.

## Feature: ${feature.title} (${feature.id})
Why: ${feature.why}
Files to modify: ${feature.files.join(', ')}

## Previously completed:
${results.map(r => `- ${r.id}: ${r.status}`).join('\n') || '(none yet)'}

## Process (STRICT ORDER):

### 1. READ
Read CLAUDE.md (if exists) for architecture context, then read ALL files you will modify.

### 2. IMPLEMENT
Make the changes. Follow existing patterns. Match the project's code style.

### 3. LINT & TEST
Run the project's lint/typecheck/test commands (look in package.json scripts, Makefile, pyproject.toml). Fix all errors.

### 4. VERIFY
Run each verification check:
${feature.verification.map((t, i) => `   ${i + 1}. ${t}`).join('\n')}

For each: record the result, judge if it passes.

### 5. FIX IF NEEDED
If any check fails, fix the code and re-verify. Max 3 iterations.

### 6. COMMIT
Only if checks pass: git add + commit "feat(sprint): ${feature.id} — ${feature.title}"

Return: status (green/red), all check results, files changed, iterations.`, {
    label: `build:${feature.id}`,
    phase: 'Build & Verify',
    schema: FEATURE_RESULT_SCHEMA,
    effort: 'high',
  })

  results.push(result)
  if (result) {
    const passCount = (result.checks || []).filter(c => c.pass).length
    const total = (result.checks || []).length
    log(`${feature.id}: ${result.status} — ${passCount}/${total} checks passed`)
  }
}

const greens = results.filter(r => r && r.status === 'green').length
log(`Build complete: ${greens}/${plan.features.length} green`)

// ─── Phase: Quality Gate (Linus) ─────────────────────────────────

phase('Quality Gate')

const integration = await agent(`You are LINUS. "We don't break userspace." A regression is unacceptable.

Built this sprint:
${results.filter(Boolean).map(r => `- ${r.id}: ${r.status}`).join('\n')}

REGRESSION HUNT:
1. Run the full test suite for this project (look in package.json, Makefile, etc.)
2. Run lint/typecheck
3. If there are existing E2E tests, run them
4. Check that features built in this sprint still work (re-run their verification)
5. Check for any obvious breakage in adjacent features

Report: which checks pass, which fail. A regression = used to work, now doesn't.`, {
  label: 'quality-gate', phase: 'Quality Gate', schema: REGRESSION_SCHEMA, effort: 'high',
})

if (integration) {
  const checkPass = (integration.checks || []).filter(j => j.pass).length
  log(`Quality Gate (Linus): ${checkPass}/${(integration.checks || []).length} checks passed`)
  if (integration.regressions?.length) {
    log(`REGRESSIONS FOUND: ${integration.regressions.join(', ')}`)
  }
}

// ─── Phase: Experience (Jobs) ────────────────────────────────────

phase('Experience')

const experience = await agent(`You are JOBS. "It functions" is the floor, not the bar.

Built: ${results.filter(Boolean).map(r => r.id).join(', ')}

USE the features as a real user would. Judge the EXPERIENCE:
1. Is the happy path smooth and intuitive?
2. Are error states handled gracefully (not stack traces or cryptic messages)?
3. Is naming/copy clear and professional?
4. Are there any moments where the user would hesitate or be confused?
5. Does it feel polished or thrown together?

Each scenario: PASS if excellent, FAIL if generic/confusing/clunky.
"It works" is not enough. It must feel great.

Run the application, test the features, report what you observe.`, {
  label: 'experience', phase: 'Experience', schema: EXPERIENCE_SCHEMA, effort: 'high',
})

const expPass = (experience?.scenarios || []).filter(s => s.pass).length
const expTotal = (experience?.scenarios || []).length
log(`Experience (Jobs): ${experience?.verdict || 'not run'} — ${expPass}/${expTotal} scenarios pass`)

// ─── Phase: Retro ────────────────────────────────────────────────

phase('Retro')

await agent(`You are running the Retrospective to the KARPATHY STANDARD — lessons must TRANSFER in one read and COMPOUND over time.

Write the Outcome section of ${goalFile}.

Sprint results:
- Features: ${results.filter(Boolean).map(r => `${r.id}(${r.status})`).join(', ')}
- Quality Gate (Linus): ${integration ? `${(integration.checks || []).filter(j => j.pass).length}/${(integration.checks || []).length} checks passed` : 'not run'}
- Experience (Jobs): ${experience ? `${experience.verdict} — ${expPass}/${expTotal} scenarios pass${experience.worst_moment ? `; worst: ${experience.worst_moment}` : ''}` : 'not run'}
- Regressions: ${integration?.regressions?.length ? integration.regressions.join(', ') : 'none'}

Write:
1. Concise outcome: what works, what doesn't
2. Lessons learned (only if backed by specific evidence from THIS sprint)
3. Next steps
4. Rule candidates: 0-3 one-liners worth adding to CLAUDE.md, ONLY for mistakes that would recur

Read the file, Edit the ## Outcome section. No other files.`, {
  label: 'retro', phase: 'Retro', effort: 'low',
})

return {
  features: plan.features.length,
  green: greens,
  quality: integration ? { pass: (integration.checks || []).filter(j => j.pass).length, total: (integration.checks || []).length } : null,
  experience: experience ? { verdict: experience.verdict, pass: expPass, total: expTotal } : null,
  results: results.filter(Boolean).map(r => ({ id: r.id, status: r.status })),
}
