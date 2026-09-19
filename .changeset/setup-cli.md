---
"cloudflare-workers-discord-template": minor
---

Add `npm run setup` — the one command that turns a copy of this template into a project.

```sh
npm run setup                                  # interactive
npm run setup -- --name acme-bot --yes         # unattended
npm run setup -- --name acme-bot --dry-run     # prints the plan, changes nothing
npm run setup -- --name acme-bot --ai delete   # remove the AI instruction files instead of swapping them
```

`scripts/setup.js` is a thin CLI over `scripts/lib/setup.js`, the same split `scripts/register-commands.js` uses: the script owns the filesystem, the clock, `git`, and the exit code, and every decision it makes is a pure function a test can reach. That is what makes a destructive one-shot script reviewable — a plan that deletes the wrong thing fails in a unit test rather than in somebody's new repository.

The order of operations is the contract, and `planProjectSetup` builds it: copy the `.template/` payload with its placeholders filled in, apply the identity rewrites, swap or delete the six AI instruction files, copy `.dev.vars.example` to `.dev.vars` (never over an existing one), prune, record provenance and add the `upstream` remote, then delete the script, its library, its tests, and its npm script — last, because a script that deletes itself first cannot finish.

Provenance goes in `package.json` under a `template` key: the upstream repository, the template version, the template commit, and the date. `buildProvenance` takes the clock as an argument, so the record is testable and the tests are deterministic.

Refusals, each exiting non-zero with a message naming the problem: provenance already present (setup is a one-shot, and this one cannot be forced), a dirty working tree (`--force` covers it; a dry run is exempt, since it writes nothing), a slug Cloudflare would reject, an unattended run with no `--name`, an unrecognized argument, no `template-manifest.json`, and no terminal to confirm with and no `--yes`.

`--dry-run` contacts nothing and writes nothing, asserted by spawning the real script with `fetch` replaced by a landmine. Nothing on any path prints a file's contents, so the `.dev.vars` the run creates is never echoed.

Two fixes that a project would otherwise have hit on its first `npm test`:

- `rewritePackageLock` now resets the lockfile's two versions along with its two names. `test/contracts/versioning.test.js` ships downstream and compares the lockfile against `package.json`, which setup resets to `0.0.0`.
- `test/contracts/discord.test.js`'s committed-secret scan skips a path the git index still carries but the working tree no longer has. That is exactly what a repository looks like between `npm run setup` and the commit that records it.
