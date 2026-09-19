---
"cloudflare-workers-discord-template": minor
---

Add `npm run setup:github` — apply the GitHub-side structure, then check what GitHub actually saved.

```sh
npm run setup:github -- --dry-run          # print every gh command, run none
npm run setup:github                       # apply, leaving deployment disabled
npm run setup:github -- --enable-deploy    # also set DEPLOY_ENABLED=true
```

It creates or updates the `non-prod` environment restricted to `develop`, the `production` environment restricted to `main` with required reviewers, and a `protected-branches` ruleset covering both branches with exactly the rules in `docs/using-this-template.md`, "Configure branch protection" — including the `test` required status check. `DEPLOY_ENABLED` is the deployment opt-in, so it is set only with `--enable-deploy` or an explicit yes at the prompt.

Then it reads every one of those resources back and prints a comparison against what it asked for, naming each divergence and exiting non-zero if there is one. That readback is the reason this script exists rather than a committed ruleset payload: GitHub accepts a ruleset and stores whatever the plan tier, organization policy, and repository visibility allow, saying nothing about what it dropped. A `201` is not evidence. No `branch_name_pattern` rule is requested at all — it is a metadata-restriction rule type, rejected on Free and Pro regardless of visibility, so asking for it would guarantee a divergence on the plans most projects are on.

It never sets a secret value. `gh secret list` returns names, so the report says which secret names exist per environment and names the missing ones, and calls out that `DISCORD_PUBLIC_KEY` is absent from CI on purpose — only the Worker verifies signatures, and it reads that from its own Cloudflare secret.

`--dry-run` runs no `gh` at all, not even the preflight: `gh auth status` contacts GitHub, and "prints what it would do" has to mean it.

Unlike `npm run setup`, this script is permanent. It is idempotent and it verifies rather than only applying, so re-running it is the supported way to re-check a repository's settings after a plan change, an organization policy change, or a visibility change. `template-manifest.json` therefore does not prune `scripts/setup-github.js`, `scripts/lib/setup-github.js`, or `test/contracts/setup-github.test.js`, and `test/contracts/setup-github.template-only.test.js` holds that decision as an assertion.

Every decision lives in `scripts/lib/setup-github.js` — the `gh` argument lists, the payloads, and the diff between a requested configuration and a readback — so all of it is unit-tested offline at the repository's 100% coverage ratchet. The CLI wrapper is exercised as a spawned process against a `gh` of the test's own first on `PATH`, which proves both that a dry run invokes it zero times and that a readback missing a rule fails the run.

No action for downstream projects created from an earlier version: the script is new, and a project can adopt it by copying `scripts/setup-github.js`, `scripts/lib/setup-github.js`, their two tests, and the `setup:github` package script.
