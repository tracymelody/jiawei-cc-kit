# Ablate — System Prompt Audit

Audit the current project's CLAUDE.md / system prompt for unnecessary instructions.

## Instructions

1. **Read** all CLAUDE.md files in this project (root + subdirectories).

2. **Categorize** each instruction as one of:
   - **Definitional**: Describes what the system IS (role, identity, boundaries) — keep
   - **Corrective**: Tells the model NOT to do something it might do wrong — candidate for removal
   - **Procedural**: Step-by-step HOW instructions — candidate for simplification

3. **For each corrective instruction**, assess:
   - Is this something the current model (Opus 4.6+) would do wrong WITHOUT the instruction?
   - Or was this added to fix a behavior of an older model?
   - Score: KEEP (still needed) / TEST (try removing) / DELETE (clearly outdated)

4. **For each procedural instruction**, assess:
   - Could this be replaced by just stating the goal + exit criteria?
   - Score: KEEP / SIMPLIFY (rewrite as goal) / DELETE

5. **Output a report**:
   ```
   ## Ablation Report for <project>
   
   Current: X lines across N files
   Recommended: Y lines (Z% reduction)
   
   ### DELETE (confident these are unnecessary)
   - Line/instruction + reason
   
   ### TEST (remove and observe for 1 week)
   - Line/instruction + what to watch for
   
   ### SIMPLIFY (rewrite as goal, not procedure)
   - Before → After
   
   ### KEEP
   - Line/instruction + why it's still needed
   ```

6. **Don't auto-apply** — this is an audit. Present findings for human decision.

## Rules

- Be aggressive — Boris deleted 80% and it got better
- But don't delete identity/role definitions
- Don't delete safety guardrails (they're definitional, not corrective)
- Flag instructions that reference specific model versions — those are likely stale
