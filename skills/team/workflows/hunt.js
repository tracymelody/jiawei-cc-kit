export const meta = {
  name: 'hunt',
  description: 'Adversarial fuzzer: simulate real users with hacker mindset, find deep bugs, auto-triage',
  whenToUse: 'When you want to stress-test a running system (API, web app, agent, CLI) with adversarial inputs.',
  phases: [
    { title: 'Recon', detail: 'Read previous findings — what do we already know?' },
    { title: 'Plan', detail: 'Generate attack plan: 60% targeted, 30% exploration, 10% regression' },
    { title: 'Execute', detail: 'Run attacks against the live system' },
    { title: 'Judge', detail: 'Would a real user be satisfied with each response?' },
    { title: 'Triage', detail: 'Classify severity, dedup, decide actions' },
  ],
}

// ═══════════════════════════════════════════════════════════════════
// Hunt — adversarial fuzzer for any running system.
//
// NOT a test suite. A continuous, adaptive penetration test.
// Each run reads previous findings, weights attack categories,
// and tries to find NEW issues the system has never seen.
//
// Philosophy:
// - Think like a hacker, not a QA engineer
// - "Would a real user be satisfied?" not "Did it pass?"
// - Issues that recur get tested MORE, not less
// - Adapt between runs: what worked last time → do more of it
//
// Works with: APIs, web apps, LLM agents, CLI tools, any running system
//
// Usage:
//   Workflow({script: <content>, args: {endpoint: "http://localhost:3000", attacks: 8}})
//   Workflow({script: <content>, args: {endpoint: "http://localhost:8100", focus: "auth"}})
// ═══════════════════════════════════════════════════════════════════

function parseArgs(a) {
  if (a && typeof a === 'object') return a
  if (typeof a === 'string') return { endpoint: a }
  return {}
}
const { endpoint, attacks = 6, focus } = parseArgs(args)

const STATE_DIR = 'docs/hunt'
const HISTORY_FILE = `${STATE_DIR}/history.jsonl`
const FINDINGS_FILE = `${STATE_DIR}/findings.md`

// ─── Schemas ──────────────────────────────────────────────────────

const RECON_SCHEMA = {
  type: "object",
  required: ["system_type", "attack_surface", "prior_findings"],
  properties: {
    system_type: { type: "string", description: "What kind of system: api, web_app, agent, cli, etc." },
    attack_surface: {
      type: "array",
      items: { type: "string" },
      description: "Discovered endpoints, commands, or interaction points",
    },
    prior_findings: {
      type: "array",
      items: { type: "string" },
      description: "Previous issues found (from history file), one-line each",
    },
    categories: {
      type: "array",
      items: {
        type: "object",
        required: ["category", "weight"],
        properties: {
          category: { type: "string" },
          weight: { type: "number", description: "0-10, higher = more bugs found here historically" },
        },
      },
    },
    suggestion: { type: "string", description: "What to focus on this round" },
  },
}

const PLAN_SCHEMA = {
  type: "object",
  required: ["attacks"],
  properties: {
    strategy: { type: "string", description: "One sentence: why these attacks this round" },
    attacks: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "category", "steps", "intent"],
        properties: {
          id: { type: "string", description: "Short slug" },
          category: { type: "string" },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "1-4 actions to perform (curl calls, form inputs, CLI commands)",
          },
          intent: { type: "string", description: "What bug you're trying to trigger" },
          expected_behavior: { type: "string", description: "What correct behavior looks like" },
        },
      },
    },
  },
}

const JUDGE_SCHEMA = {
  type: "object",
  required: ["verdicts"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        required: ["attack_id", "satisfied", "issues"],
        properties: {
          attack_id: { type: "string" },
          satisfied: { type: "boolean", description: "Would a real user be satisfied?" },
          issues: {
            type: "array",
            items: {
              type: "object",
              required: ["type", "description", "severity"],
              properties: {
                type: { type: "string" },
                description: { type: "string", description: "What was wrong, with evidence" },
                severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                evidence: { type: "string", description: "Actual output that proves the issue" },
              },
            },
          },
        },
      },
    },
  },
}

const TRIAGE_SCHEMA = {
  type: "object",
  required: ["new_issues", "round_summary"],
  properties: {
    new_issues: {
      type: "array",
      items: {
        type: "object",
        required: ["fingerprint", "category", "severity", "description"],
        properties: {
          fingerprint: { type: "string", description: "Dedup key: category:type:short-slug" },
          category: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          description: { type: "string" },
          evidence: { type: "string" },
          is_new: { type: "boolean", description: "Never seen before in history" },
        },
      },
    },
    round_summary: { type: "string", description: "One sentence: what this round found" },
  },
}

// ─── Phase 1: Recon ──────────────────────────────────────────────

phase('Recon')

const recon = await agent(`You are doing recon for an adversarial testing round.

## Steps:
1. mkdir -p ${STATE_DIR}
2. Read ${HISTORY_FILE} if it exists (JSONL of previous findings)
3. Read ${FINDINGS_FILE} if it exists (human-readable findings log)
4. Read CLAUDE.md to understand the project
5. ${endpoint ? `Check system health: curl -s ${endpoint}/health or equivalent` : 'Determine how to interact with this system (read package.json, Makefile, etc.)'}
6. Explore the attack surface:
   - For APIs: find route definitions, OpenAPI specs
   - For web apps: find pages, forms, auth flows
   - For LLM agents: find prompts, tool definitions, guardrails
   - For CLIs: find command definitions, flag parsing

${focus ? `FOCUS THIS ROUND ON: ${focus}` : ''}

Determine:
- What kind of system is this?
- What are the interaction points?
- What did previous rounds find?
- What should we focus on this round?

Think like a penetration tester doing reconnaissance.`, {
  label: 'recon', phase: 'Recon', schema: RECON_SCHEMA, effort: 'medium',
})

const systemType = recon?.system_type || 'unknown'
const surface = (recon?.attack_surface || []).join(', ')
log(`Recon: ${systemType} system, ${(recon?.attack_surface || []).length} attack points`)
log(`Strategy: ${recon?.suggestion || 'explore broadly'}`)

// ─── Phase 2: Plan ───────────────────────────────────────────────

phase('Plan')

const attackCategories = systemType === 'agent' || systemType === 'llm_agent'
  ? `- state_poisoning: multi-turn contradictions to corrupt session
- boundary_probing: edge cases in data (empty, huge, unicode, null)
- model_confusion: ambiguous inputs that cause wrong routing
- governance_bypass: creative jailbreak/prompt injection attempts
- tool_abuse: triggering tool edge cases (bad params, timeouts)
- multi_intent: multiple conflicting requests in one message
- language_attack: mixed language, unicode, very long messages
- regression: re-test previously found bugs
- exploration: completely new angles`
  : `- input_validation: malformed data, SQL injection, XSS, path traversal
- auth_bypass: broken access control, privilege escalation, session issues
- boundary: edge cases (empty, null, huge payloads, unicode, special chars)
- state_corruption: race conditions, concurrent mutations, stale state
- error_handling: triggering unhandled exceptions, stack trace leaks
- business_logic: valid-but-wrong inputs that break business rules
- performance: inputs that cause timeouts or resource exhaustion
- regression: re-test previously found bugs
- exploration: completely new angles`

const plan = await agent(`You are planning adversarial attacks against a ${systemType} system.

## System:
${endpoint ? `Endpoint: ${endpoint}` : 'Local system (see recon)'}
Attack surface: ${surface}
Prior findings: ${(recon?.prior_findings || []).join('; ') || 'none (first run)'}

## Attack budget: ${attacks} attacks this round

## Available categories:
${attackCategories}

## Attack distribution:
- 60% targeted (categories with prior hits or high suspicion)
- 30% exploration (new angles nobody tried)
- 10% regression (verify old bugs are still fixed)

${focus ? `USER FOCUS: concentrate on "${focus}" category` : ''}

Generate ${attacks} attacks. For each:
- Think like a HACKER, not a QA engineer
- Multi-step attacks are better than single requests
- Combine categories for creative attacks
- Each attack should test something DIFFERENT

The goal is to find bugs a normal test suite would MISS.`, {
  label: 'planner', phase: 'Plan', schema: PLAN_SCHEMA, effort: 'high',
})

log(`Plan: ${(plan?.attacks || []).length} attacks — ${plan?.strategy || ''}`)

// ─── Phase 3: Execute ────────────────────────────────────────────

phase('Execute')

const execResults = await parallel((plan?.attacks || []).map(attack => () =>
  agent(`Execute this adversarial attack against the system.

## Attack: ${attack.id}
Category: ${attack.category}
Intent: ${attack.intent}
Expected correct behavior: ${attack.expected_behavior}

## Steps to execute:
${attack.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Instructions:
- Execute EXACTLY as planned — don't soften the attack
- Record the FULL response at each step (first 500 chars if long)
- Note any errors, timeouts, unexpected responses
- If multi-step: carry state between steps (cookies, session IDs, etc.)
${endpoint ? `- Server: ${endpoint}` : '- Use whatever interface the system exposes'}

Return the raw results. Do NOT judge whether it passed — that's the next phase.`, {
    label: `exec:${attack.id}`,
    phase: 'Execute',
    effort: 'medium',
  })
))

const completedAttacks = execResults.filter(Boolean)
log(`Executed: ${completedAttacks.length}/${(plan?.attacks || []).length} attacks`)

// ─── Phase 4: Judge ──────────────────────────────────────────────

phase('Judge')

const attackResults = (plan?.attacks || []).map((attack, i) => ({
  ...attack,
  result: execResults[i] || '(execution failed)',
}))

const judgment = await agent(`You are the JUDGE. Review each attack result and decide: would a real user be satisfied?

This is NOT pass/fail testing. It's user-satisfaction judgment:
- A correct-but-unhelpful response = NOT satisfied
- A wrong response that sounds confident = critical issue
- An error that's handled gracefully = might be OK
- A timeout or empty response = definitely not satisfied
- Leaking internal info (stack traces, env vars) = critical

## Attack Results:
${attackResults.map(a => `### ${a.id} (${a.category})
Intent: ${a.intent}
Expected: ${a.expected_behavior}
Actual: ${typeof a.result === 'string' ? a.result.slice(0, 600) : JSON.stringify(a.result).slice(0, 600)}`).join('\n\n')}

For each: is the user satisfied? If not, what specifically is wrong?
Be HARSH but FAIR. Security issues and data correctness > style complaints.`, {
  label: 'judge', phase: 'Judge', schema: JUDGE_SCHEMA, effort: 'high',
})

const issues = (judgment?.verdicts || []).filter(v => !v.satisfied)
log(`Judge: ${issues.length}/${(judgment?.verdicts || []).length} attacks found issues`)

// ─── Phase 5: Triage ─────────────────────────────────────────────

phase('Triage')

const allIssues = issues.flatMap(v => (v.issues || []).map(i => ({ ...i, attack_id: v.attack_id })))

const triage = await agent(`Triage ${allIssues.length} issues found this round.

## Issues:
${allIssues.map((i, idx) => `${idx + 1}. [${i.severity}/${i.type}] ${i.description} (attack: ${i.attack_id})`).join('\n')}

## Prior findings (for dedup):
${(recon?.prior_findings || []).join('\n') || '(none)'}

## Tasks:
1. Assign a fingerprint to each (category:type:short-slug) for dedup
2. Mark which are NEW vs previously seen
3. Generate a one-sentence round summary

Critical/high issues that are NEW → most important for the team to know.`, {
  label: 'triage', phase: 'Triage', schema: TRIAGE_SCHEMA, effort: 'medium',
})

// Record results
const newIssues = (triage?.new_issues || []).filter(i => i.is_new)
if (newIssues.length > 0 || allIssues.length > 0) {
  const historyEntry = JSON.stringify({
    attacks: (plan?.attacks || []).length,
    issues_found: allIssues.length,
    new_issues: newIssues.length,
    severities: { critical: allIssues.filter(i => i.severity === 'critical').length, high: allIssues.filter(i => i.severity === 'high').length, medium: allIssues.filter(i => i.severity === 'medium').length, low: allIssues.filter(i => i.severity === 'low').length },
    summary: triage?.round_summary || '',
  })

  await agent(`Record hunt results:

1. Append to ${HISTORY_FILE}:
${historyEntry}

2. Append to ${FINDINGS_FILE} (create if missing, with header "# Hunt Findings"):

### Round (today's date)
${triage?.round_summary || 'No summary'}

${(triage?.new_issues || []).map(i => `- **[${i.severity}]** ${i.description} (${i.fingerprint})`).join('\n') || '- No new issues'}

mkdir -p ${STATE_DIR} first if needed.`, {
    label: 'record', phase: 'Triage', effort: 'low',
  })
}

log(`\n━━━ HUNT COMPLETE ━━━`)
log(triage?.round_summary || 'No summary')
if (newIssues.length > 0) {
  log(`\nNEW issues (${newIssues.length}):`)
  for (const i of newIssues) {
    log(`  [${i.severity}] ${i.description}`)
  }
}

return {
  attacks_run: (plan?.attacks || []).length,
  issues_found: allIssues.length,
  new_issues: newIssues.length,
  summary: triage?.round_summary,
  findings: triage?.new_issues || [],
}
