---
"cloudflare-workers-template": patch
---

Remove `.github/rulesets/gitflow-protected-branches.json`, the last committed GitHub Ruleset payload. An imported ruleset can save with fewer rules than it declares depending on plan tier, organization policy, and repository visibility, so a committed JSON file that looks authoritative can silently drift from what GitHub actually enforces.

`docs/using-this-template.md` step 5 and `docs/gitflow-and-branching.md`'s "Required repository policy" section now document the equivalent settings as a manual checklist to apply through **Settings > Rules > Rulesets** (or classic branch protection), plus how to verify what actually saved with `gh api repos/OWNER/REPOSITORY/rulesets`. A new contract test in `test/contracts/workflow.test.js` asserts the CI job the docs point at as the required status check is still literally named `test`.

No migration needed: the ruleset file was never applied automatically, so downstream projects that already configured branch protection (by importing it or by hand) keep their existing GitHub-side settings. Projects that never got around to importing it should follow the new manual checklist.
