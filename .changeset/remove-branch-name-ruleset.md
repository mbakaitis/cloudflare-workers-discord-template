---
"cloudflare-workers-template": patch
---

Remove `.github/rulesets/gitflow-branch-names.json`. GitHub rejects its `branch_name_pattern` rule on Free and Pro accounts (it requires GitHub Team or Enterprise), so the ruleset saved with an empty `rules` array and never enforced anything. `docs/using-this-template.md` step 5 now imports only `gitflow-protected-branches.json`, and branch naming is documented as a reviewed convention rather than a GitHub-enforced rule.

No migration needed: the removed rule never worked on Free/Pro, so no downstream project loses working enforcement.
