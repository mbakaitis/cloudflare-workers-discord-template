---
"cloudflare-workers-discord-template": minor
---

Re-point this repository from the generic `cloudflare-workers-template` boilerplate to a Discord bot template. This change is identity only — no Worker behavior changes, and `src/` is untouched.

- `package.json`: renamed to `cloudflare-workers-discord-template`, description now names a Discord bot on Cloudflare Workers, keywords gain `discord`, `discord-bot`, and `slash-commands`, and the version resets to `0.1.0` as the baseline for this template's own history.
- `wrangler.jsonc`: all three Worker names renamed, keeping the `-non-prod` and `-production` suffixes. The existing contract tests in `test/contracts/environment-isolation.test.js` are the check that environment isolation survived the rename.
- Stale references to the old project updated in `README.md`, `claude-for-users.md`, `CONTRIBUTING.md`, and `docs/using-this-template.md`. The upstream remote URL documented for downstream adoption is now `https://github.com/mbakaitis/cloudflare-workers-discord-template.git`.
- `CHANGELOG.md`: the inherited history is replaced with a single `0.1.0` entry recording derivation from `cloudflare-workers-template@1.0.0`. That history described releases of a differently named package with a different purpose, so carrying it forward would have implied this package shipped those versions.

Migration: none for existing downstream projects. Anything generated from the old template already has its own name and its own remote, and nothing here changes a command, a file path, or a deployment contract. A project that documented the upstream remote as `github.com/mbakaitis/workers.git` should repoint it.

Classified `minor` rather than `major` deliberately: on a `0.x` version a `major` bump would jump straight to `1.0.0`, which would claim a stable release in the middle of an unfinished branch series. The aggregate bump for the series is reconciled before release.
