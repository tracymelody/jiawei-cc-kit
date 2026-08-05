export const meta = {
  name: 'brainstorm',
  description: 'Dream Team debate: 5 standards independently assess, then clash, then converge on a decision',
  whenToUse: 'Before major decisions — architecture choices, feature scoping, tradeoffs. Use when you need a well-challenged answer, not a quick one.',
  phases: [
    { title: 'Frame', detail: 'Define the question' },
    { title: 'Positions', detail: 'Each standard thinks alone — one clear sentence per point' },
    { title: 'Clash', detail: 'Direct disagreement — name names, be sharp' },
    { title: 'Converge', detail: 'Synthesize into actionable decision' },
  ],
}

function parseArgs(a) {
  if (a && typeof a === 'object') return a
  if (typeof a === 'string') {
    const s = a.trim()
    if (s.startsWith('{') || s.startsWith('[')) {
      try { return JSON.parse(s) } catch { /* fall through */ }
    }
    return { question: s }
  }
  return {}
}
const { question, context } = parseArgs(args)
if (!question) throw new Error('Usage: {question: "Should we do X or Y?", context: "optional background"}')

const POSITION_SCHEMA = {
  type: "object",
  required: ["considered_alternatives", "position", "reasoning"],
  properties: {
    considered_alternatives: { type: "array", items: { type: "string", maxLength: 200 }, minItems: 2, maxItems: 3, description: "2-3 candidate answers you seriously considered — genuinely different directions. ONE line each, under 20 words: the alternative + why not." },
    position: { type: "string", maxLength: 250, description: "The ONE proposal you commit to — one sentence, under 25 words, everyday language" },
    reasoning: { type: "array", items: { type: "string", maxLength: 250 }, minItems: 2, maxItems: 3, description: "2-3 reasons WHY. Each item = one sentence, under 25 words, plain words." },
  },
}

const CLASH_SCHEMA = {
  type: "object",
  required: ["agrees_with", "disagrees_with", "revised_position"],
  properties: {
    agrees_with: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 3, description: "Name + why, one sentence each, under 25 words" },
    disagrees_with: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 3, description: "Name + why they're wrong, one sentence each, under 25 words" },
    revised_position: { type: "string", maxLength: 300, description: "Your updated position — one sentence, plain language" },
    non_negotiable: { type: "string", maxLength: 200, description: "The one thing you refuse to give up — one sentence" },
    ranking: { type: "array", items: { type: "string", maxLength: 120 }, maxItems: 4, description: "The OTHER four positions ranked best→worst: 'Name — why', one short line each." },
  },
}

const DECISION_SCHEMA = {
  type: "object",
  required: ["decision", "rationale", "consensus_points", "accepted_tradeoffs"],
  properties: {
    decision: { type: "string", maxLength: 300, description: "What to do — one sentence, plain words" },
    rationale: { type: "string", maxLength: 500, description: "Why this wins — 2-3 short sentences" },
    consensus_points: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 5, description: "What everyone agreed on, one sentence each" },
    accepted_tradeoffs: { type: "array", items: { type: "string", maxLength: 250 }, maxItems: 4, description: "What we gave up and why, one sentence each" },
    dissent: { type: "array", items: { type: "string", maxLength: 250 }, maxItems: 3, description: "Disagreements that didn't resolve" },
    action_items: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 5, description: "What to do next — concrete steps" },
  },
}

// ─── Standards ───────────────────────────────────────────────────

const STANDARDS = [
  {
    key: 'musk',
    name: 'Discovery (Musk)',
    lens: 'delete the problem — question whether it should exist at all',
    prompt: `You are MUSK. First-principles thinker. The Algorithm, in order: question every requirement (it must carry a PERSON's name, not a department), delete, simplify, accelerate, automate LAST.

Your instinct: delete before optimize. Deletion is a cheap reversible experiment — you can always add the 10% back.

You ask: Is this the RIGHT problem? Who exactly asked for it? Can we eliminate it entirely?

It's OK to be wrong. It's not OK to be confident and wrong.`,
  },
  {
    key: 'boris',
    name: 'Delivery (Boris)',
    lens: 'shortest path to something shipped and touchable, end-to-end',
    prompt: `You are BORIS. Full-stack pragmatist. You ship end-to-end in one sprint or it's too big.

Your instinct: shortest path to something a user can touch — WITH a pass/fail check built in. Evidence over claims: a real test, a real conversation. "It should work" is not a position.

You ask: What blocks what? What can we reuse? What's the verification loop that PROVES it works?`,
  },
  {
    key: 'linus',
    name: 'Quality (Linus)',
    lens: 'protect what works — reversibility, zero regressions',
    prompt: `You are LINUS. You protect what works. Every change is guilty until proven innocent.

Your instinct: the working system has invisible value. Breaking it costs more than the improvement gains. Churn that fixes no real problem is pointless make-believe work — reject it.

You ask: What breaks? What's the rollback plan? How do we PROVE nothing regressed?`,
  },
  {
    key: 'jobs',
    name: 'Experience (Jobs)',
    lens: 'premium feel — if the user has to think, it is wrong',
    prompt: `You are JOBS. Taste is your weapon. "It functions" is the floor, not the bar.

Your instinct: if a user has to think about it, it's wrong. The best interface is invisible. Focus means saying NO to good ideas so the great one gets everything.

You ask: Will users LOVE this? Does it feel premium or generic? What do we cut so the rest can be excellent?`,
  },
  {
    key: 'karpathy',
    name: 'Learning (Karpathy)',
    lens: 'evidence and measurement — no data, no claim',
    prompt: `You are KARPATHY. Evidence over intuition. If you can't point to data, it's a guess.

Your instinct: automate what you can VERIFY; keep human judgment where verification is soft. Good decisions teach lessons that compound.

You ask: What's the metric? What evidence supports this? What would we measure by Friday to know it worked?`,
  },
]

// ─── Phase 1: Frame ──────────────────────────────────────────────

phase('Frame')
log(`Question: "${question}"`)

// ─── Phase 2: Positions (parallel) ──────────────────────────────

phase('Positions')

const ctx = context || ''

const positions = await parallel(STANDARDS.map(s => () =>
  agent(`${s.prompt}

QUESTION: "${question}"

${ctx ? `CONTEXT:\n${ctx}\n` : ''}
THE FIVE STANDARDS IN THIS DEBATE:
${STANDARDS.map(x => `- ${x.name}: ${x.lens}`).join('\n')}

DIFFERENTIATE: the others will already give the obvious answer. Your position must be one only YOUR standard would fight for.

HOW TO WRITE:
- Short sentences. Confident. Clear.
- Position = one sentence, under 25 words. What should we do?
- Each reasoning bullet = one sentence, under 25 words. Why?
- Alternatives = one line each, under 20 words: the alternative + why you rejected it.
- Use words anyone understands. No jargon.
- FORBIDDEN: "we should measure first" / "more research needed" — say what to BUILD.
- English only.`, {
    label: `pos:${s.key}`,
    phase: 'Positions',
    schema: POSITION_SCHEMA,
    effort: 'high',
  })
))

positions.filter(Boolean).forEach((p, i) => {
  const reasons = Array.isArray(p.reasoning) ? p.reasoning.join(' | ') : p.reasoning
  log(`[${STANDARDS[i].name}] ${p.position}\n   → ${reasons}`)
})

log(`\n━━━ POSITIONS COMPLETE ━━━`)

// ─── Phase 3: Clash (parallel) ──────────────────────────────────

phase('Clash')

const allPositions = STANDARDS.map((s, i) => {
  if (!positions[i]) return `${s.name}: (no response)`
  const reasons = Array.isArray(positions[i].reasoning) ? positions[i].reasoning.join('; ') : positions[i].reasoning
  return `${s.name}: "${positions[i].position}" — ${reasons}`
}).join('\n')

const clashes = await parallel(STANDARDS.map((s, i) => () =>
  agent(`${s.prompt}

${ctx ? `CONTEXT:\n${ctx}\n` : ''}
You stated: "${positions[i]?.position || '?'}"

ALL positions:
${allPositions}

NOW RESPOND (short, direct):
- Disagree with at least 2 people. Name them. One sentence each — why they're wrong.
- Agree where genuine.
- Rank the OTHER four positions best→worst — one short line each. Judge the position, not the person.
- Concede only to ARGUMENTS, not to consensus.
- Revised position: one sentence.
- Non-negotiable: one sentence.
- Every line under 25 words. English only.`, {
    label: `clash:${s.key}`,
    phase: 'Clash',
    schema: CLASH_SCHEMA,
    effort: 'high',
  })
))

clashes.filter(Boolean).forEach((c, i) => {
  log(`[${STANDARDS[i].name}] → ${c.revised_position}`)
})

log(`\n━━━ CLASH COMPLETE ━━━`)

// ─── Phase 4: Converge ──────────────────────────────────────────

phase('Converge')

const fullDebate = STANDARDS.map((s, i) => {
  const p = positions[i]
  const c = clashes[i]
  const reasons = Array.isArray(p?.reasoning) ? p.reasoning.join('; ') : (p?.reasoning || '')
  return `## ${s.name}
Position: ${p?.position || '?'}
Reasoning: ${reasons}
After clash: ${c?.revised_position || '(unchanged)'}
Non-negotiable: ${c?.non_negotiable || '(none)'}
Agrees: ${(c?.agrees_with || []).join('; ')}
Disagrees: ${(c?.disagrees_with || []).join('; ')}
Ranks others: ${(c?.ranking || []).join(' | ') || '(none)'}`
}).join('\n\n')

const decision = await agent(`You witnessed a full debate between 5 experts:

QUESTION: "${question}"

${ctx ? `CONTEXT:\n${ctx}\n` : ''}
=== DEBATE ===
${fullDebate}
=== END ===

SYNTHESIZE (plain language, no jargon):
- Decision: one sentence. What do we DO?
- Rationale: why this wins, 2-3 sentences, simple words.
- What everyone agreed on (one sentence each).
- What we're giving up (be honest).
- Disagreements that didn't resolve (if any).
- Action items: what to do next. Concrete.

Council rule: weigh the cross-rankings — a position ranked high by its RIVALS carries extra weight; a position only its author likes carries less.

Every bullet: ONE short sentence, under 25 words.

You may propose something NONE of them suggested if you see a better path.`, {
  label: 'synthesizer',
  phase: 'Converge',
  schema: DECISION_SCHEMA,
  effort: 'high',
})

log(`\n━━━ DECISION ━━━`)
log(`${decision.decision}`)
log(`\nRationale: ${decision.rationale}`)
if (decision.consensus_points?.length) log(`\nConsensus:\n${decision.consensus_points.map(c => `  • ${c}`).join('\n')}`)
if (decision.accepted_tradeoffs?.length) log(`\nTradeoffs:\n${decision.accepted_tradeoffs.map(t => `  • ${t}`).join('\n')}`)
if (decision.dissent?.length) log(`\nDissent:\n${decision.dissent.map(d => `  ⚡ ${d}`).join('\n')}`)
if (decision.action_items?.length) log(`\nNext:\n${decision.action_items.map((a, i) => `  ${i+1}. ${a}`).join('\n')}`)

return {
  question,
  positions: STANDARDS.map((s, i) => ({ standard: s.key, position: positions[i]?.position, reasoning: positions[i]?.reasoning || [], considered_alternatives: positions[i]?.considered_alternatives || [] })),
  clashes: STANDARDS.map((s, i) => ({ standard: s.key, revised: clashes[i]?.revised_position, non_negotiable: clashes[i]?.non_negotiable })),
  decision,
}
