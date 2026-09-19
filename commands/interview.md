# Interview — Pre-Implementation Questioning

Surface requirement-level unknowns by interviewing the user before any code is written. Complements `/blindspot` (which scans code silently) — `/interview` pulls knowledge FROM the user that Claude is missing. From Thariq Shihipar: "Before any code is written is the cheapest place to find an unknown."

## Instructions

1. **Read context**: Parse the task from args. Scan surrounding code — files mentioned, adjacent modules, recent git history in the area. Build a mental model of the terrain.

2. **Identify ambiguities** — decisions where the answer would change the implementation:
   - Architecture choices (where to put new code, which pattern to follow)
   - Scope boundaries (what's in, what's explicitly out)
   - Edge case behavior (what should happen when X fails?)
   - Integration points (which existing systems does this touch? are they stable?)
   - Non-functional requirements (performance, backwards compatibility, rollback)
   - User-facing decisions (error messages, defaults, naming)

3. **Ask questions ONE AT A TIME** — never batch. For each question:
   - State the ambiguity clearly in one sentence
   - Explain WHY it matters (which files/decisions depend on the answer)
   - Provide a **recommended default** with brief rationale — the user can accept with one word
   - Wait for the user's answer before asking the next question

4. **Prioritize by impact**: architecture-changing questions first, cosmetic questions last (or skip them).

5. **After all questions answered**, output:
   - **The assembled implementation brief** — the task rewritten with all answers woven in, concrete enough (file paths, constraints, decisions, edge case behavior) that implementation can start without rediscovering the terrain. This is the deliverable.

## Rules

- If the task is trivial (< 20 lines of obvious change), say so and skip the interview
- MAX 8 questions — if you have more, merge the less important ones into the brief as assumptions
- Skip questions whose answer is obvious from the code, CLAUDE.md, or git history
- The recommended default should be genuinely good, not a cop-out — put effort into it
- NEVER write code during the interview — code comes after
- Match the user's language (中文对话 → 中文提问, English → English)
