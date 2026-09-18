---
"cloudflare-workers-discord-template": patch
---

Keep `package-lock.json` in step with `package.json` when a version is cut.

`changeset version` rewrites `package.json` and `CHANGELOG.md` but never touches the lockfile, so every release so far would have shipped a lockfile still naming the previous version. The `version` script now runs `npm install --package-lock-only` after the bump. Nothing else in the lockfile moves — no dependency is re-resolved, because no dependency range changed — and `node_modules` is untouched.

The drift is harmless to `npm ci`, which does not verify the root package's version, and that is exactly why it survives unnoticed. It matters for anything that reads the lockfile as a description of the package: provenance, supply-chain tooling, and a downstream project trying to work out which template version it started from.

`test/contracts/versioning.test.js` is new and ships downstream. It asserts the lockfile's `version` and `name` — in both the root object and `packages[""]` — match `package.json`, and that the `version` script still refreshes the lockfile. Both sync assertions were verified against injected drift rather than merely written: a lockfile temporarily set to `9.9.9` with a mismatched name fails both, and reverting restores green.

Migration: none. A project created from an earlier copy of this template can adopt the one-line script change and the contract test together, and should run `npm install --package-lock-only` once to correct any drift it already has.
