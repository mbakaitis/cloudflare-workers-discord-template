---
"cloudflare-workers-discord-template": minor
---

Add the instrumentation the Discord implementation phases will be measured by, before writing any of that code.

**Coverage as a ratchet.** `npm test` now runs `vitest run --coverage`, measuring `src/` and `scripts/lib/` with `@vitest/coverage-istanbul` and failing below the thresholds in `vitest.config.js`. Istanbul rather than V8: tests run inside `workerd`, which does not emit the V8 coverage profile the default provider reads.

The thresholds are pinned to the measured baseline — 100% statements, branches, functions, and lines, which is what the single existing handler and its test actually reach — not to a round aspirational number. They move one way only. Raising one is a hand-edit in a reviewed diff; lowering one to make a change pass is the thing the ratchet exists to prevent. `coverage.thresholds.autoUpdate` is deliberately unused, because a threshold that rises without anyone noticing is not a promise anyone made.

Measuring first is the point of the ordering. Thresholds added after the implementation can only be pinned to whatever the suite happened to reach, and the uncovered-branch signal arrives once the design has already set. Added now, the signal that a module is awkward to test arrives while it is still cheap to restructure — which is why the coming modules take their dependencies by injection.

`test/contracts/coverage.test.js` asserts the ratchet exists: thresholds present and non-zero, the Istanbul provider, both source roots measured, `--coverage` wired into `npm test`, and `autoUpdate` off. It deliberately does not assert the threshold *values* — that would only create a second place to update, and the reviewed diff is the real control.

**Discord documentation MCP server.** `.mcp.json` and `.vscode/mcp.json` gain Discord's first-party read-only documentation server (`https://docs.discord.com/mcp`), URL only and no credentials, in both schema formats. Every implementation phase after this one needs the current interaction contract — required signature headers, response types, acknowledgement windows, bulk-overwrite registration semantics — and those are exactly the details a model recalls plausibly and wrongly. This lands before the code that depends on it.

**Also in this change.** `test/contracts/instructions.test.js` is new: it asserts the maintainer instruction files declare the same SemVer instruction contract version and that the `-for-users` files declare none, so the sync rule in `CONTRIBUTING.md` is checked rather than merely requested. All six instruction files gain the never-lower-the-threshold rule, since they are what an assistant actually reads; this is added to the unreleased 3.0.0 contract rather than bumped, as no downstream project has consumed 3.0.0 yet.

Dependency updates carried in this change: `@changesets/cli` 2.31 → 3.0.2, `eslint` 10.8 → 10.10, `wrangler` 4.124 → 4.131, `vitest` pinned to `~4.1.11` so it stays aligned with `@vitest/coverage-istanbul`. `engines.node` returns to `>=22` to match `.nvmrc`, which a dependency bump had moved to `>=24` without moving `.nvmrc`; every installed tool supports Node 22, and the contract test that pins the two together is what caught it.

`npm audit` reports a high-severity `sharp`/libheif advisory reached through `@cloudflare/vitest-pool-workers` → `miniflare` → `sharp`. It is accepted, not fixed, and the decision is recorded here so it is not re-opened each iteration: every package in that chain is a devDependency used to run tests, none of it is bundled into the deployed Worker, and no current release of the Cloudflare test tooling resolves it. `npm audit fix --force` would *downgrade* `@cloudflare/vitest-pool-workers` to 0.8.30, which predates the `cloudflareTest` plugin API this repository uses — a worse outcome than the advisory. Revisit when Cloudflare ships a pool release on a patched `miniflare`.

Documentation: the coverage ratchet and its one-way rule in `CONTRIBUTING.md` and `docs/using-ai.md`, the new MCP server in `docs/using-ai.md` and `README.md` (including that the GitHub server needs interactive authorization and stays unavailable until it gets it).

Migration: none for downstream projects. A project that already copied `vitest.config.js` and wants the ratchet should add `@vitest/coverage-istanbul`, copy the `coverage` block, and pin the thresholds to its own measured baseline rather than to this repository's 100% — the number here reflects a template with one handler in it.
