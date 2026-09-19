---
"cloudflare-workers-discord-template": minor
---

Prove the setup claim: a fresh project is green with zero edits

`npm run setup` promised to turn a copy of this template into a working project. Nothing checked that the result held together. Two checks now do, at two speeds.

`test/contracts/setup-acceptance.template-only.test.js` runs inside `npm test`. It builds a project from `git archive HEAD` into a temporary directory, runs setup there unattended, and asserts the shape of what comes out: nothing template-only left behind, the changesets gone but their configuration kept, every `.template/` destination written with no `{{PLACEHOLDER}}` surviving, the package, lockfile and Workers renamed, provenance recorded and the `setup` script removed, the coverage thresholds at the floor, every relative Markdown link resolving, and no credential-shaped literal anywhere. It takes about half a second and installs nothing.

`.github/workflows/template-acceptance.yml` is the half that proves "green". It does the same build in CI and then runs `npm ci`, `npm run lint`, and the full `npm test` inside the generated project. It is a separate workflow rather than a job in `ci.yml` so the required status check named `test` keeps meaning the job in `ci.yml`, and so `template-manifest.json` can prune the whole file — it spawns a script that deletes itself during setup.

The list of paths a project must not inherit is written out in the test rather than read from the manifest. Deriving it from the manifest would make the two agree by construction, and an entry dropped from the manifest would then be dropped from the test with it.

No action for downstream projects: both checks are template-only and are pruned by setup.
