# Discord Template Refactor Plan

**Status:** Phase 0 and Phase 1 complete; Phase 2 is next. This is a working planning artifact, not part of the consumer documentation set described in [claude.md](../claude.md) — it records the agreed scope for converting this repository from a generic Cloudflare Workers template into a Discord bot template. Delete it once the work has landed and `CHANGELOG.md` carries the history.

### Resolved during implementation

- **Coverage baseline is 100%** on statements, branches, functions, and lines — `src/index.js` is one handler with one test, so the ratchet starts at the ceiling. Istanbul works in the Workers pool as expected. Every later phase must therefore land fully covered rather than raising a number; the "raise the thresholds each phase" step is a no-op unless a phase measures *lower*, which is the failure the ratchet exists to catch.
- **`secrets.required` is supported** by the pinned Wrangler (4.131.1), at the top level and per environment, and Phase 5 uses it. Corrected in Phase 5 against Cloudflare's current documentation ([Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#secrets-configuration-property), [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)): it is *both* a local-dev warning and a deploy gate — `wrangler dev` loads only the declared names and warns about missing ones, while `wrangler deploy` and `wrangler versions upload` fail listing any declared secret not configured on that Worker. An earlier note here said it was not a deploy gate; that was read from the schema, and the documentation is explicit. Verified locally: `wrangler dev` without a `.dev.vars` warns and starts; `--dry-run` does not validate, because it never contacts the account. The deploy-time failure itself cannot be exercised from this checkout.
- **The `sharp`/libheif advisory in the test tooling is accepted, not fixed.** It arrives through `@cloudflare/vitest-pool-workers` → `miniflare` → `sharp`, all devDependencies, none bundled into the deployed Worker, and no current release of the Cloudflare test tooling resolves it. `npm audit fix --force` downgrades the pool below the `cloudflareTest` plugin API this repository uses. Do not re-open this in a later phase.

## Context

This repository is a clean copy of the `cloudflare-workers-template` boilerplate (one commit, `ec8cba3`). The Worker in [src/index.js](../src/index.js) is a placeholder that returns `OK`; everything else — environments, contract tests, Gitflow, Changesets, MCP wiring, instruction files — is the template scaffolding we want to keep.

The goal is a new template whose *default application* is a working Discord bot: it serves Discord HTTP interactions on a Worker, and a push to `main` re-registers its slash commands with Discord so nobody does that by hand. Everything must arrive test-first, and the template's own promises (environment isolation, no committed secrets, documented contract) must extend to the Discord-specific parts.

Decisions confirmed with the maintainer:

- **Two Discord applications** — separate app for non-prod and production, each with its own public key, token, and application ID.
- **Registration always PUTs in CI** — unconditional bulk overwrite after a successful deploy (no diff/skip logic). Noted caveat: new commands count toward Discord's daily application-command create limits; re-registering unchanged commands does not.
- **`discord-interactions@4.4.0` only** — Discord-maintained, zero runtime dependencies, Web Crypto `verifyKey`.
- **Three commands**: `/ping` (immediate), `/echo` (option parsing), `/slow` (deferred + follow-up).

### Platform facts verified during planning

Confirmed via the official Discord documentation MCP server (`https://docs.discord.com/mcp`) and the Cloudflare documentation MCP server, not from recall:

- Interactions arrive as `POST` with `X-Signature-Ed25519` and `X-Signature-Timestamp`; the app **must** validate every request and respond `401` on failure.
- `PING` (`type: 1`) must be answered `200` with `{"type": 1}` and a valid `Content-Type`.
- Bulk overwrite is `PUT /applications/{application.id}/commands` (global) or `.../guilds/{guild.id}/commands`, authorized with `Authorization: Bot <token>`. It overwrites *all* command types — slash, user, and message commands.
- Commands carry `integration_types` / `contexts` fields for installation and interaction context.
- Wrangler supports a `secrets.required` configuration property that validates secret presence at deploy time — a good fit here, to be confirmed against the pinned Wrangler version after `npm install`.

### MCP availability at planning time

- **Cloudflare** — the documentation server (`https://docs.mcp.cloudflare.com/mcp`) is connected and working. It is search-only; there is no Cloudflare account/API MCP server configured, so no tool here can inspect Workers or set secrets.
- **GitHub** (`https://api.githubcopilot.com/mcp/`) — declared in both MCP config files but unauthenticated. It needs interactive authorization (`/mcp`, or the editor's prompt) before use.
- **Discord** — an official first-party documentation server exists at `https://docs.discord.com/mcp` (`serverInfo: "Documentation - Discord"`), verified by hand with a JSON-RPC `initialize` and `tools/list`. It is read-only: documentation search plus a virtualized docs filesystem. Phase 1 adds it.

## Assumptions to confirm during implementation

- Package and Worker slug: `cloudflare-workers-discord-template` (+ `-non-prod` / `-production`).
- Upstream remote URL in docs: `https://github.com/mbakaitis/cloudflare-workers-discord-template.git` (replaces `github.com/mbakaitis/workers.git`).
- Version resets to `0.1.0` with a seed `CHANGELOG.md` entry recording derivation from `cloudflare-workers-template@1.0.0`; all work after that lands through Changesets.

## Why the phases are ordered this way

Three ordering rules, because getting them wrong is what makes test-driven development degrade into tests-written-afterwards:

1. **The contract changes before the code it governs.** `claude.md` today requires "the smallest practical base Worker" with no runtime dependencies and no Discord-specific shape. Until that text changes, every implementation phase contradicts the document reviewers and contract tests are checked against. The spec moves first, so the rest of the work has something to comply with.
2. **Instrumentation precedes the implementation it measures.** Coverage thresholds added at the end can only be pinned to whatever the suite happened to reach, and the uncovered-branch signal arrives after the design has set. Added first, pinned to the current baseline and raised each phase, they become a ratchet — new code cannot land uncovered, and the signal that a module is awkward to test arrives while it is still cheap to restructure.
3. **Documentation lands with the change that causes it, not in a final sweep.** This is already the rule in `claude.md` ("update documentation in the same change when behavior or workflow changes"). Only the end-to-end consumer narrative genuinely needs the whole path to exist, so only that part waits.

### Every phase ends green

A phase is not done until `npm test` (unit tests + contract tests + coverage thresholds) and `npm run lint` both pass, coverage thresholds are at or above where the previous phase left them, and the documentation and changeset for that phase are written. No phase leaves a known-failing check for a later phase to clean up.

## Phase 0 — Contract and provenance first

**Instruction contract.** This is a **major** instruction-contract change — project purpose, required project shape, required scripts, and required secrets all change — so raise the version to **3.0.0** in [claude.md](../claude.md), [AGENTS.md](../AGENTS.md), and [.github/copilot-instructions.md](../.github/copilot-instructions.md), and state the new requirements up front:

- An interactions endpoint with mandatory Ed25519 signature verification on every request.
- Command definitions kept as data, shared by the Worker and the registrar so the two cannot disagree.
- A separate Discord application per environment; a non-prod Worker never holds production Discord credentials.
- Never log interaction payloads, interaction tokens, or bot tokens.
- The registration script and its scripts are part of the template contract.

Mirror only the downstream-relevant parts into [claude-for-users.md](../claude-for-users.md), [AGENTS-for-users.md](../AGENTS-for-users.md), and [.github/copilot-instructions-for-users.md](../.github/copilot-instructions-for-users.md), per `claude.md`'s own mirroring rule.

*Accepted trade-off:* between Phase 0 and Phase 3 the contract describes a project shape the repository does not yet satisfy. That window stays inside this one feature branch and is never released mid-way, which is strictly better than the alternative — implementation phases that each contradict the written contract until the final phase blesses them retroactively.

**De-brand and re-point** (no behavior change):

- [package.json](../package.json): `name`, `description`, `keywords` (+ `discord`, `discord-bot`, `slash-commands`), version → `0.1.0`.
- [wrangler.jsonc](../wrangler.jsonc): all three `name` fields.
- Text references to the old project: [README.md:1](../README.md#L1), [README.md:37](../README.md#L37), [claude-for-users.md:3](../claude-for-users.md#L3), [CONTRIBUTING.md:24](../CONTRIBUTING.md#L24), [using-this-template.md:81-92](using-this-template.md#L81-L92), [using-this-template.md:251](using-this-template.md#L251).
- [CHANGELOG.md](../CHANGELOG.md): replace the inherited history with one `0.1.0` entry naming the upstream template and the version it came from. Everything after this entry is generated by Changesets at release time, so later phases record changesets rather than editing this file.
- `package-lock.json` name fields update naturally on `npm install`.

Existing contract tests in [test/contracts/environment-isolation.test.js](../test/contracts/environment-isolation.test.js) already enforce name uniqueness and the non-prod/production indicators, so they are the check for the renaming.

## Phase 1 — Instrumentation before implementation

**Coverage, as a ratchet.** Add `@vitest/coverage-istanbul` (the provider `@cloudflare/vitest-pool-workers` supports; v8 coverage does not work in the Workers pool) and configure thresholds in [vitest.config.js](../vitest.config.js) over `src/` and `scripts/lib/`.

- Measure the baseline *before* writing any Discord code. The current `src/` is one tiny handler with a passing test, so expect a high or complete baseline — pin the thresholds to exactly what is measured, not to a round aspirational number.
- Raise the thresholds in each subsequent phase's green step, by hand, so the new number appears in the diff and gets reviewed. Vitest's `coverage.thresholds.autoUpdate` would do this automatically; rejected deliberately, because a threshold that rises without anyone noticing is not a reviewed promise. 100% on `src/` and `scripts/lib/` is the realistic target for a template this small, with dependency injection making it reachable without network calls.
- Fold coverage into `npm test` so CI and local runs are identical, per the instruction contract. `coverage/` is already gitignored and ESLint-ignored.
- Add a contract test asserting the thresholds exist and are non-zero, so a future change cannot quietly delete the ratchet. It cannot assert the *value* without becoming a second place to update — the reviewed diff is the control there.
- Update the testing-expectations section of [CONTRIBUTING.md](../CONTRIBUTING.md) with the never-lower-the-threshold rule.

**Discord documentation MCP.** Red: extend the `expectedServers` map in [test/contracts/workflow.test.js:45](../test/contracts/workflow.test.js#L45) with `"discord-docs": "https://docs.discord.com/mcp"`. Green: add the server to [.mcp.json](../.mcp.json) (`mcpServers` key) and [.vscode/mcp.json](../.vscode/mcp.json) (`servers` key), `type: "http"`, URL only, no credentials — the existing test already asserts exactly two keys per server entry. This lands here, before the implementation phases, because every one of them needs current Discord documentation.

Docs for this phase: new row and bullet in [using-ai.md:12-18](using-ai.md#L12-L18) and [using-ai.md:50-59](using-ai.md#L50-L59); one line in [README.md:169](../README.md#L169), including the note that the GitHub MCP server needs interactive authorization on first use.

## Phase 2 — Interaction core (TDD)

New modules under `src/`, ES modules with JSDoc per the instruction contract. Dependency injection is not decoration here — it is what keeps the coverage ratchet reachable without a network:

| File | Responsibility |
| --- | --- |
| `src/index.js` | `fetch` router only: `GET /` health, `POST /interactions`, `405`/`404` otherwise |
| `src/discord/verify.js` | Wraps `verifyKey` from `discord-interactions`; reads the raw body text *before* `JSON.parse` |
| `src/discord/responses.js` | `pong()`, `reply()`, `ephemeral()`, `deferred()` — typed JSON helpers with `content-type: application/json` |
| `src/discord/rest.js` | `editOriginalResponse()` → `PATCH /webhooks/{application_id}/{token}/messages/@original` |
| `src/interactions.js` | Pure dispatcher: `(interaction, { env, ctx, registry, rest }) → Response` |

Behavior to drive out one test at a time:

1. `GET /` → `200 OK` (keeps [test/index.test.js](../test/index.test.js) passing, retargeted at the health path).
2. Missing or malformed signature headers → `401` with body `invalid request signature`; no JSON parsing attempted.
3. Valid signature + `type: 1` → `200` `{"type":1}` with a JSON content type.
4. Valid signature + tampered body → `401`.
5. Unknown command name → ephemeral "unknown command" reply (still `200`, so Discord shows something).
6. Non-`POST` to `/interactions` → `405`; unknown path → `404`.
7. Malformed JSON body with a valid signature → `400`.

Testing mechanics (deterministic and offline, per the instruction contract):

- Sign fixtures with a real Ed25519 key. Preferred: generate a keypair in a test helper via `crypto.subtle.generateKey({ name: "Ed25519" }, ...)` and derive the public key hex, so `verifyKey` is genuinely exercised. Confirm `Ed25519` is available in the `workerd` test pool first; if not, fall back to a committed fixture keypair plus precomputed signatures (still offline, still real verification).
- Never call the network: `rest` is injected into the dispatcher and tests pass a recording fake.
- Secrets in tests come from the test-pool `env`, never from a real Discord application.

Also: extend the `globals` list in [eslint.config.js](../eslint.config.js) (`crypto`, `fetch`, `console`, `Request`, `TextEncoder`, …) as the new modules need them.

Docs for this phase: create `docs/discord-bot.md` with the interaction lifecycle it now implements (verify → PING/PONG → dispatch), and add it to the documentation tables in [README.md](../README.md), `claude.md`, and `AGENTS.md`. Later phases extend this file rather than creating documentation at the end.

## Phase 3 — The three commands

- `src/commands/index.js` — registry of `{ definition, handler }`. **Must stay importable from plain Node** (no `cloudflare:workers` imports) so Phase 4's register script can reuse the same definitions.
- `src/commands/{ping,echo,slow}.js` — one command each, definition and handler co-located.

Tests, still one at a time:

1. `/ping` → immediate `CHANNEL_MESSAGE_WITH_SOURCE`.
2. `/echo` → echoes the string option; missing or blank option → ephemeral validation message, not a crash.
3. `/slow` → `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE` immediately, with the follow-up `PATCH` scheduled via `ctx.waitUntil`. The `waitUntil` promise is awaited through `@cloudflare/vitest-pool-workers`' execution context so the follow-up is asserted, not assumed.
4. Every command's `definition` is valid: unique lowercase name, description present, declared `integration_types` and `contexts`.

Raise the coverage thresholds to the new measured level. Extend `docs/discord-bot.md` with how to add a command and when to defer.

## Phase 4 — Registration library and CLI

- `scripts/lib/registration.js` — **pure and fully unit-tested**: builds the target URL (global vs. guild), the `Authorization: Bot <token>` headers, and the request body from the command definitions; validates required environment variables; maps a non-2xx response to a thrown error carrying status and response text. Takes `fetch` as a parameter, so it is covered by the same ratchet as `src/`.
- `scripts/register-commands.js` — thin Node CLI wrapper: reads `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, optional `DISCORD_GUILD_ID`, supports `--dry-run`, exits non-zero on failure, prints the registered command names with the token redacted. No dependencies — Node 22's global `fetch` replaces the `node-fetch` the older Discord tutorial used.
- New scripts in [package.json](../package.json): `register:non-prod` (guild-scoped), `register:production` (global), `register:dry-run`.

Tests: the library gets Vitest unit tests (global vs. guild URL selection, header shape, body equals the definition array, missing-environment failure, non-2xx surfaces status and body). The CLI wrapper gets a `node:test` contract test that spawns it with `--dry-run` and placeholder environment variables and asserts it makes no request and prints the right plan — following the `execFile` precedent already in [test/contracts/workflow.test.js:118](../test/contracts/workflow.test.js#L118). That way the wrapper is genuinely exercised rather than excluded from coverage by fiat.

Extend `docs/discord-bot.md` with how registration works and the local `--dry-run` path.

## Phase 5 — Deployment wiring, secrets, and isolation contracts

- [.github/workflows/deploy.yml](../.github/workflows/deploy.yml): add a registration step *after* the `cloudflare/wrangler-action@v3` step in the same job, so commands only change once the endpoint serving them is live. It inherits the job's `DEPLOY_ENABLED` guard and the GitHub Environment's secrets: `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, and `DISCORD_GUILD_ID` (non-prod only). `main` → global registration; `develop` → guild-scoped.
- [.gitignore](../.gitignore): add `!.dev.vars.example` — today `.dev.vars.*` would ignore the example file the setup docs need to reference.
- New committed `.dev.vars.example` with placeholder `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, `DISCORD_GUILD_ID`.
- [wrangler.jsonc](../wrangler.jsonc): add `secrets.required` for the three Worker-side secrets at top level and in both environments, if the pinned Wrangler supports it; otherwise document the requirement and drop that assertion.
- New `test/contracts/discord.test.js`:
  - `deploy.yml` runs the register script, and does so after the deploy step (assert ordering by index, not just presence).
  - The registration step is inside the `DEPLOY_ENABLED`-guarded job.
  - `production` registers globally; `non-prod` registers to a guild.
  - `wrangler.jsonc` declares the required Discord secret **names** for every environment and no Discord values.
  - No tracked file contains a Discord-token-shaped or public-key-shaped literal (guards against a pasted secret).
  - `.gitignore` still ignores `.dev.vars` / `.env`, and `.dev.vars.example` contains only placeholders.

Docs for this phase, written with the change rather than after it: the `DISCORD_*` entries in the section 4 secrets list of [using-this-template.md](using-this-template.md), the two-application requirement and where to find each app's public key / application ID / bot token, and the always-overwrite registration behavior with its daily create-limit caveat.

## Phase 6 — End-to-end narrative and release classification

Only what genuinely could not be written earlier, because it describes the assembled path:

- [README.md](../README.md): new title and "What you get"; the quickstart re-sequenced end to end — create two Discord applications, set the Discord secrets, deploy, set each app's Interactions Endpoint URL, register commands — plus the register scripts in the commands table.
- [using-this-template.md](using-this-template.md): the ordering constraint that only exists once every piece is real (the endpoint URL cannot be set before a Worker is deployed, and registration should follow it), and the updated upstream remote URL.
- `docs/discord-bot.md`: the local-development path — exposing `wrangler dev` through a tunnel so Discord can reach it — and a closing note on where out-of-scope features would attach.
- Cross-reference sweep: every documentation table, internal link, and command name mentioned anywhere still resolves. This is a documentation-only step, so per the instruction contract it is reviewed for accuracy rather than re-validated with tests.
- Confirm the instruction contract version set in Phase 0 still matches what the finished work requires, and adjust before release if any later phase changed a requirement.
- Final release classification: reconcile the per-phase changesets into the intended SemVer bump and confirm the migration notes they carry are accurate.

## Verification

1. `npm install`, then confirm whether the pinned Wrangler accepts `secrets.required` (`npx wrangler deploy --dry-run --env non-prod`).
2. Narrowest first: `npx vitest run test/interactions.test.js`, then `npm test` (unit + contracts + coverage), then `npm run lint`. Run this at the end of every phase, not just at the end.
3. `npx wrangler deploy --dry-run --env non-prod` and `--env production` as the configuration-validation step.
4. `node scripts/register-commands.js --dry-run` with placeholder environment variables — prints the exact URL, headers (token redacted), and body without contacting Discord.
5. Manual end-to-end, once a real non-prod Discord application exists: `npm run dev`, expose it with a tunnel, paste the URL as the application's Interactions Endpoint URL, and confirm Discord's save-time PING validation succeeds; then `npm run register:non-prod` and exercise `/ping`, `/echo`, `/slow` in the test guild.
6. Review the diff for pasted keys, environment cross-wiring, and lockfile churn.

## Out of scope

No KV, D1, R2, Queues, or Durable Objects; no Discord Gateway (HTTP interactions only); no component, modal, or autocomplete handling; and no OAuth flow — each would need its own documented purpose, local-development story, and test strategy per the instruction contract. `docs/discord-bot.md` will note where those would attach.
