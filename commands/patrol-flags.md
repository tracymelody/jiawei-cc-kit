# Feature Flag & Experiment Cleanup

Find stale feature flags and always-on experiments. Remove dead paths. Open a PR.

## Instructions

1. **Find flag definitions**: Search for feature flag patterns:
   - Environment variable checks: `os.getenv("FEATURE_*")`, `process.env.FEATURE_*`
   - Config-based flags: `config.features.*`, `settings.*_enabled`
   - LaunchDarkly / Unleash / custom flag systems
   - Simple boolean gates: `if ENABLE_*`, `if use_new_*`

2. **Identify stale flags**:
   - Flag hardcoded to `True`/`true` with no conditional branch
   - `git blame` shows the flag was set to 100% more than 2 weeks ago
   - Both branches exist but one is clearly the "old" path (naming, comments, commit history)

3. **For each stale flag**:
   - Remove the flag check
   - Keep only the winning/active code path
   - Delete the losing path entirely
   - Remove the flag from config files, env templates, documentation

4. Create branch `patrol/flags-YYYY-MM-DD`, commit, open PR.

## Rules

- Never remove a flag less than 2 weeks old — it might be mid-rollout
- Never remove flags in shared libraries without checking all consumers
- If a flag controls a paid feature or A/B test, skip it (those are intentional gates)
- Document which flags were removed in the PR description
- PR title: "patrol: clean up N stale feature flags"
