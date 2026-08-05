# Ablate — System Prompt Audit

For LLM-based projects: audit system prompts for bloat, contradictions, and dead rules.

## Instructions

1. **Find all prompts**: grep for system prompts, prompt templates, instruction files
   - Look in: `prompts/`, `agents/`, `*.prompt`, `*.md` with instructions, template strings
   - Include: CLAUDE.md, agent definitions, tool descriptions

2. **For each prompt, check**:
   - **Dead rules**: Instructions that reference features/behaviors that no longer exist in code
   - **Contradictions**: Two rules that give opposite guidance
   - **Redundancy**: Same instruction stated multiple ways (pick the best one, delete the rest)
   - **Bloat**: Rules that could be one line but are a paragraph
   - **Cargo cult**: Rules copied from elsewhere that don't apply to this system

3. **For each finding**:
   - Quote the problematic line(s)
   - Explain why it's dead/contradictory/redundant
   - Propose the fix (delete, merge, shorten)

4. **Apply safe fixes directly**:
   - Delete confirmed dead rules (grep proves the feature doesn't exist)
   - Merge redundant statements
   - Shorten verbose instructions

5. **Flag for human review** (don't fix):
   - Possible contradictions (might be intentional priority ordering)
   - Rules you can't verify are dead without running the system

## Rules

- Evidence required: for every "dead rule" claim, show the grep that proves the feature is gone
- Don't rewrite prompts for style — only fix actual problems
- Commit as: "chore: ablate dead rules from [prompt name]"
