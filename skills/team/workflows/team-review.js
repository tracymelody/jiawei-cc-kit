export const meta = {
  name: 'team-review',
  description: 'Boris+Linus PR review with devil advocate challenge and blindspot scan',
  whenToUse: 'When Boris/Linus are called to review a PR or code change',
  phases: [
    { title: 'Gather', detail: 'Fetch PR diff and surrounding context' },
    { title: 'Review', detail: 'Boris (delivery) + Linus (regression) review in parallel' },
    { title: 'E2E Check', detail: 'Verify claims against real codebase — grep, file reads, not just diff' },
    { title: 'Devil Advocate', detail: 'Challenge every finding — are they REAL or speculative?' },
    { title: 'Blindspot', detail: 'What did neither reviewer think to ask?' },
    { title: 'Simplify', detail: 'Identify code simplification opportunities in changed files' },
    { title: 'Verdict', detail: 'Synthesize: ship / hold / ship-with-actions' },
  ],
}

function parseArgs(a) {
  if (a && typeof a === 'object') return a
  if (typeof a === 'string') return { pr: a }
  return {}
}
const { pr, diff } = parseArgs(args)
if (!pr && !diff) throw new Error('Usage: {pr: "212"} or {pr: "url"} or {diff: "raw diff text"}')

// ─── Schemas ──────────────────────────────────────────────────────

const REVIEW_SCHEMA = {
  type: "object",
  required: ["findings", "verdict"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        required: ["severity", "title", "detail"],
        properties: {
          severity: { enum: ["blocker", "concern", "nit", "positive"] },
          title: { type: "string", description: "One-line summary" },
          detail: { type: "string", description: "Full explanation + suggestion" },
          file: { type: "string", description: "File path if applicable" },
          line: { type: "string", description: "Line reference if applicable" },
          verifiable: { type: "string", description: "How to CHECK this finding (grep command, file to read, test to run)" },
        },
      },
    },
    verdict: { enum: ["ship", "ship-with-actions", "hold"] },
    verdict_reason: { type: "string" },
  },
}

const E2E_SCHEMA = {
  type: "object",
  required: ["checks"],
  properties: {
    checks: {
      type: "array",
      items: {
        type: "object",
        required: ["claim", "result", "confirmed"],
        properties: {
          claim: { type: "string", description: "What was claimed by a reviewer" },
          command: { type: "string", description: "What command was run to verify" },
          result: { type: "string", description: "Actual output (truncated)" },
          confirmed: { type: "boolean" },
          note: { type: "string" },
        },
      },
    },
  },
}

const DA_SCHEMA = {
  type: "object",
  required: ["challenges"],
  properties: {
    challenges: {
      type: "array",
      items: {
        type: "object",
        required: ["finding_title", "challenge", "survives"],
        properties: {
          finding_title: { type: "string" },
          challenge: { type: "string", description: "Why this finding might be WRONG or irrelevant" },
          survives: { type: "boolean", description: "Does the finding survive the challenge?" },
          reason: { type: "string" },
        },
      },
    },
  },
}

const BLINDSPOT_SCHEMA = {
  type: "object",
  required: ["terrain", "cards"],
  properties: {
    terrain: { type: "string", description: "1-2 sentences: what was scanned" },
    cards: {
      type: "array",
      items: {
        type: "object",
        required: ["gap", "evidence", "impact"],
        properties: {
          gap: { type: "string", description: "The blindspot neither reviewer caught" },
          evidence: { type: "string", description: "File/commit/fact that proves this gap exists" },
          impact: { enum: ["high", "medium", "low"] },
          action: { type: "string", description: "One-line fix or decision needed" },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: "object",
  required: ["verdict", "summary", "action_items"],
  properties: {
    verdict: { enum: ["ship", "ship-with-actions", "hold"] },
    summary: { type: "string", description: "2-3 sentence synthesis" },
    surviving_findings: {
      type: "array",
      items: { type: "string" },
      description: "Findings that survived DA challenge + E2E verification",
    },
    blindspots: {
      type: "array",
      items: { type: "string" },
      description: "Blindspots with high/medium impact",
    },
    action_items: {
      type: "array",
      items: { type: "string" },
      description: "What must be done before/after merge",
    },
  },
}

// ─── Phase 1: Gather ─────────────────────────────────────────────

phase('Gather')

const prContext = await agent(`Gather full context for PR review. Run these commands:

1. gh pr view ${pr} --json title,body,files,additions,deletions,baseRefName,headRefName
2. gh pr diff ${pr}

Return the FULL output of both commands concatenated. Do not truncate the diff.`, {
  label: 'gather-pr', phase: 'Gather', effort: 'low',
})

log(`PR context gathered`)

// ─── Phase 2: Review (Boris + Linus in parallel) ─────────────────

phase('Review')

const reviewResults = await parallel([
  () => agent(`You are BORIS — delivery-focused engineer. You ship fast, think pragmatically.

YOUR REVIEW LENS:
- Is the API contract clean and unambiguous for consumers?
- Any gaps in the migration path (old→new)? Will someone deploy half of this?
- Dead code or unnecessary complexity left behind?
- Will this break in production? Edge cases in real traffic?
- Test coverage adequate — does it test BEHAVIOR not just mocking?
- Does the PR prove itself — a test, command, or check that verifies the change works?

CRITICAL: For every concern/blocker finding, you MUST include a "verifiable" field:
a grep command, file to read, or test to run that PROVES this is real — not speculation.

=== PR CONTEXT ===
${typeof prContext === 'string' ? prContext : JSON.stringify(prContext)}
=== END ===

Severity: blocker (must fix before merge), concern (should fix, not blocking), nit (style/preference), positive (good stuff).`, {
    label: 'boris', phase: 'Review', schema: REVIEW_SCHEMA, effort: 'high',
  }),

  () => agent(`You are LINUS — quality-obsessed engineer. "We don't break userspace."

YOUR REVIEW LENS:
- Does this break existing clients still using the old format?
- Race conditions or ordering issues?
- Can any value be None/null where code assumes it exists?
- Silent failures — system appears to work but gives wrong results?
- Are tests testing REAL behavior, or mocking so much they test mocks?
- Any remaining references to old patterns that cause inconsistency?
- Ownership: could the author explain EVERY line? Generated-looking code nobody can explain = blocker.
- Churn: does this fix a real regression or user problem? Trivial no-value churn = reject.

CRITICAL: For every concern/blocker finding, you MUST include a "verifiable" field:
a grep command, file to read, or test to run that PROVES this is real — not speculation.

=== PR CONTEXT ===
${typeof prContext === 'string' ? prContext : JSON.stringify(prContext)}
=== END ===

Severity: blocker (must fix before merge), concern (should fix, not blocking), nit (style/preference), positive (good stuff).`, {
    label: 'linus', phase: 'Review', schema: REVIEW_SCHEMA, effort: 'high',
  }),
])

const boris = reviewResults[0]
const linus = reviewResults[1]

const allFindings = [
  ...(boris?.findings || []).map(f => ({ ...f, reviewer: 'Boris' })),
  ...(linus?.findings || []).map(f => ({ ...f, reviewer: 'Linus' })),
]
const concerns = allFindings.filter(f => f.severity === 'blocker' || f.severity === 'concern')

log(`Boris: ${boris?.verdict || '?'} (${boris?.findings?.length || 0} findings)`)
log(`Linus: ${linus?.verdict || '?'} (${linus?.findings?.length || 0} findings)`)
log(`Total concerns/blockers to verify: ${concerns.length}`)

// ─── Phase 3: E2E Check ─────────────────────────────────────────

phase('E2E Check')

const verifiableFindings = concerns.filter(f => f.verifiable)
const e2ePrompt = verifiableFindings.length > 0
  ? verifiableFindings.map((f, i) => `${i + 1}. [${f.reviewer}] "${f.title}" — verify with: ${f.verifiable}`).join('\n')
  : 'No verifiable claims from reviewers. Run: git log --oneline -5 on the PR branch to confirm what\'s committed.'

const e2e = await agent(`You are the E2E VERIFIER. Reviewers made claims — your job is to CHECK them against the REAL codebase. Run commands, read files, prove or disprove.

DO NOT SPECULATE. Run the command. Report what you see.

=== CLAIMS TO VERIFY ===
${e2ePrompt}
=== END ===

For each claim: run the verification command, report ACTUAL output, confirm or deny.`, {
  label: 'e2e-verify', phase: 'E2E Check', schema: E2E_SCHEMA, effort: 'medium',
})

if (e2e) {
  const confirmed = (e2e.checks || []).filter(c => c.confirmed).length
  log(`E2E: ${confirmed}/${(e2e.checks || []).length} claims confirmed`)
}

// ─── Phase 4: Devil's Advocate ───────────────────────────────────

phase('Devil Advocate')

const da = await agent(`You are the DEVIL'S ADVOCATE. Your job is to ATTACK every finding from the reviewers. Find reasons why each concern is WRONG, irrelevant, or speculative.

You are not trying to be helpful — you are trying to KILL findings that don't deserve to survive.

Challenge types:
- "This can't actually happen because..." (impossible scenario)
- "This is by design because..." (feature not bug)
- "This is speculative — no evidence it occurs" (no proof)
- "This is true but doesn't matter because..." (low/no impact)
- "This is a preference, not a defect" (style taste — die here)

=== FINDINGS TO CHALLENGE ===
${concerns.map((f, i) => `${i + 1}. [${f.reviewer}/${f.severity}] ${f.title}: ${f.detail}`).join('\n\n')}
=== END ===

=== E2E VERIFICATION RESULTS ===
${e2e ? JSON.stringify(e2e.checks, null, 2) : 'No E2E data'}
=== END ===

For each finding: challenge it HARD. Then honestly say: does it survive? A finding survives ONLY if:
- It has concrete evidence (E2E confirmed it, or logic is irrefutable)
- It would cause real user-facing impact
- It's not "by design" or an accepted tradeoff`, {
  label: 'devil-advocate', phase: 'Devil Advocate', schema: DA_SCHEMA, effort: 'high',
})

if (da) {
  const surviving = (da.challenges || []).filter(c => c.survives).length
  log(`Devil's Advocate: ${surviving}/${(da.challenges || []).length} findings survive`)
}

// ─── Phase 5: Blindspot ──────────────────────────────────────────

phase('Blindspot')

const blindspot = await agent(`You are the BLINDSPOT SCANNER. The reviewers checked what they could see. Your job is to find what NOBODY THOUGHT TO ASK.

You are looking for:
- Registration points (things that must ALSO be wired somewhere non-obvious)
- Structural exceptions (the place that breaks the repo's own convention)
- Feature flags that gate this behavior
- Downstream consumers nobody mentioned (analytics pipelines, monitoring, other services)
- Async side effects (event listeners, webhooks, cron jobs that read this data)
- The "everyone who works on this codebase knows X" that the PR author assumed

DO NOT repeat what Boris and Linus already found. Only NEW gaps.

=== PR CONTEXT ===
${typeof prContext === 'string' ? prContext.slice(0, 3000) : ''}
=== END ===

=== WHAT REVIEWERS ALREADY COVERED ===
${allFindings.map(f => `- ${f.title}`).join('\n')}
=== END ===

Scan the codebase around the changed files:
- Read the files that IMPORT from the changed modules
- Check for other places that emit/read custom events
- Check for analytics/monitoring that references the old field names
- Check docs, configs, deployment scripts

Report 3-5 cards MAX. Each must have file/commit evidence.`, {
  label: 'blindspot', phase: 'Blindspot', schema: BLINDSPOT_SCHEMA, effort: 'high',
})

if (blindspot) {
  log(`Blindspot: ${(blindspot.cards || []).length} gaps found`)
  for (const card of (blindspot.cards || [])) {
    log(`  • [${card.impact}] ${card.gap}`)
  }
}

// ─── Phase 6: Simplify ──────────────────────────────────────────

phase('Simplify')

const changedFiles = await agent(`Run: gh pr view ${pr} --json files --jq '.files[].path' 2>/dev/null || gh pr diff ${pr} --name-only
Return ONLY the file list, one per line. No commentary.`, {
  label: 'list-files', phase: 'Simplify', effort: 'low',
})

const codeFiles = (typeof changedFiles === 'string' ? changedFiles : '').split('\n').filter(f => f.trim() && /\.(py|ts|tsx|js|jsx|go|rs|java|kt|rb|swift)$/.test(f.trim()))
const fileList = codeFiles.map(f => `- ${f}`).join('\n')

const SIMPLIFY_DIMENSIONS = [
  { key: 'reuse', label: 'reuse', lens: `REUSE — Flag new code that re-implements something the codebase already has. Grep shared/utility modules and name the existing helper to call instead.` },
  { key: 'simplification', label: 'simplification', lens: `SIMPLIFICATION — Flag unnecessary complexity: redundant state, copy-paste with slight variation, deep nesting, dead code left behind. Name the simpler form.` },
  { key: 'efficiency', label: 'efficiency', lens: `EFFICIENCY — Flag wasted work: redundant computation, repeated I/O, independent operations run sequentially, memory leaks from captured environments. Name the cheaper alternative.` },
  { key: 'altitude', label: 'altitude', lens: `ALTITUDE — Check that each change is at the right depth. Special cases layered on shared infrastructure = fragile bandaid. Prefer generalizing the mechanism.` },
]

let simplifyResults = []
if (codeFiles.length > 0) {
  const findings = await parallel(SIMPLIFY_DIMENSIONS.map(dim => () =>
    agent(`Review the diff below through ONE lens only:

${dim.lens}

=== DIFF (PR #${pr}) ===
${typeof prContext === 'string' ? prContext.slice(prContext.indexOf('diff --git') || 0) : ''}
=== END DIFF ===

Changed files:
${fileList}

Read each changed file for full context. For each finding: file, line number, one-line summary, and the concrete cost. Do NOT report correctness bugs — only cleanup opportunities.

If the code is already clean from your angle, say so.`, {
      label: `simplify:${dim.label}`,
      phase: 'Simplify',
    })
  ))

  const completedFindings = findings.filter(Boolean)
  log(`Simplify: ${completedFindings.length}/${SIMPLIFY_DIMENSIONS.length} dimensions reported`)

  if (completedFindings.length > 0) {
    const allSimplifyFindings = completedFindings.map((f, i) => `[${SIMPLIFY_DIMENSIONS[i].key}] ${typeof f === 'string' ? f : JSON.stringify(f)}`).join('\n\n')
    simplifyResults = [allSimplifyFindings]
  }
} else {
  log('Simplify: no eligible code files in PR, skipping')
}

// ─── Phase 7: Verdict ────────────────────────────────────────────

phase('Verdict')

const survivingFindings = (da?.challenges || []).filter(c => c.survives).map(c => c.finding_title)
const highBlindspots = (blindspot?.cards || []).filter(c => c.impact === 'high' || c.impact === 'medium')

const verdict = await agent(`You are the FINAL JUDGE. Synthesize all review phases into a clear verdict.

=== SURVIVING FINDINGS (passed DA challenge) ===
${survivingFindings.length ? survivingFindings.map(f => `• ${f}`).join('\n') : '(none — all findings were challenged away)'}

=== E2E VERIFICATION ===
${e2e ? (e2e.checks || []).map(c => `• ${c.claim}: ${c.confirmed ? 'CONFIRMED' : 'NOT CONFIRMED'} — ${c.note || ''}`).join('\n') : 'N/A'}

=== BLINDSPOTS ===
${highBlindspots.length ? highBlindspots.map(c => `• [${c.impact}] ${c.gap} → ${c.action}`).join('\n') : '(none with high/medium impact)'}

=== CODE SIMPLIFICATION ===
${simplifyResults.length > 0 ? simplifyResults[0].slice(0, 500) : '(no simplifications found)'}

=== REVIEWER VERDICTS ===
Boris: ${boris?.verdict || '?'} — ${boris?.verdict_reason || ''}
Linus: ${linus?.verdict || '?'} — ${linus?.verdict_reason || ''}

Rules:
- "ship" = no surviving blockers, no high-impact blindspots
- "ship-with-actions" = safe to merge but specific things must happen before/after
- "hold" = blocker confirmed by E2E, must fix before merge

Action items: be SPECIFIC (grep command to run, line to change, test to add). Not "consider X".`, {
  label: 'verdict', phase: 'Verdict', schema: VERDICT_SCHEMA, effort: 'medium',
})

log(`\n━━━ FINAL VERDICT: ${verdict?.verdict?.toUpperCase()} ━━━`)
log(verdict?.summary || '')
if (verdict?.action_items?.length) {
  log(`\nAction items:`)
  for (const item of verdict.action_items) {
    log(`  → ${item}`)
  }
}

return {
  boris_verdict: boris?.verdict,
  linus_verdict: linus?.verdict,
  surviving_findings: survivingFindings,
  blindspots: blindspot?.cards || [],
  simplify_reported: simplifyResults.length > 0,
  final_verdict: verdict?.verdict,
  action_items: verdict?.action_items || [],
  summary: verdict?.summary,
}
