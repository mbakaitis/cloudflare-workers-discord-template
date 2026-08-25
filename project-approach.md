# Project Approach: Cloudflare Workers Discord Bot Template

**Status:** draft, living document. Edit this in place as decisions are made; do not treat it as final. This is a planning artifact, not one of the audience-facing docs listed in `claude.md`'s documentation table — once a stage lands, the durable outcome belongs in `README.md`, `docs/`, `CHANGELOG.md`, or the instruction files, not here.

This document breaks down `project-goals.md` into ordered, PR-sized stages. It is mechanical/tactical: "how do we get there." Philosophical project rules (TDD, no TypeScript, environment isolation, documentation roles, versioning discipline) already live in `claude.md`/`AGENTS.md`/`.github/copilot-instructions.md` and are not repeated here — this plan assumes them as constraints on every stage below.

## Decision: cut ties with the upstream template

The repo currently ships **two** upstream-sync workflows — `upstream-sync.yml` (inherited from the generic `cloudflare-workers-template`) and `sync-upstream.yml` (added new, in this repo) — that pull changes from that upstream on a schedule and open a PR. Both are being **removed**, not reconciled.

Rationale:

- **This repo is diverging from the generic template on purpose.** Stage 1 rewrites `claude.md`/`AGENTS.md`/`copilot-instructions.md` to describe a Discord bot mission instead of a generic Workers template mission; Stage 4 replaces the generic Worker body with Discord-specific logic. Once that divergence is real, an automated sync has nothing left to reconcile — diffs against the generic upstream's mission files and `src/index.js` become permanent, by-design conflicts, not drift worth catching. The list of files a sync has to skip only grows, and the mechanism gets more fragile with every stage of this plan, not less.
- **The audience who could ever benefit from this is already narrow.** A project created via "Use this template" shares no git history with upstream and can't use a sync workflow at all. Only a fork retains the link — and forks are, and should remain, a minority of this template's consumers. Building and documenting a chain-tracking mechanism, its contract test, and its onboarding burden for that minority isn't worth what it costs everyone else who just wants a working quickstart.
- **Contributor burden compounds.** Anyone who helps maintain this template would otherwise need to understand the upstream chain, its safety gates, and its skip-list just to touch a workflow file. Removing the mechanism removes that prerequisite entirely.

This is a deliberate **no**, not a placeholder for a future replacement: no Dependabot recommendation, no scheduled dependency-bump workflow, no new documentation about how to stay current. Keeping dependencies current is left entirely to whoever maintains a given project instance.

## Staged plan

Each stage is scoped to land as one reviewable PR, follows the repo's existing red-green-refactor and documentation-in-the-same-change rules, and lists its own validation. Stages are ordered by dependency, not strictly by `project-goals.md` numbering; the mapping to those six goals is noted per stage.

### Stage 0 — Remove the upstream-sync mechanism
*Addresses: the decision above; supersedes the reconciliation work originally planned for goal 2 by deciding not to build it at all.*

- Delete `.github/workflows/upstream-sync.yml` and `.github/workflows/sync-upstream.yml`.
- In `test/contracts/workflow.test.js`, remove the `upstreamSyncWorkflowPath` constant, its entry in `allWorkflowPaths`, and the "defines a review-only upstream sync workflow" test. Leave the rest of that file alone — the deploy-gating, MCP config, lint, Node-version-pin, Changesets, and CI-job-naming contracts are unrelated.
- If the `UPSTREAM_REPOSITORY` repository variable was ever set, note its removal as a manual cleanup step in the PR description (it's a GitHub setting, not a committed file, so there's nothing to delete in-repo).
- Strip upstream-sync material from `claude.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `docs/using-this-template.md` (§8), and `docs/using-ai.md`. Remove it outright rather than reframing it — no replacement mechanism is being described.
- Add a `CHANGELOG.md` entry: automated upstream sync removed; this repo no longer tracks `cloudflare-workers-template`; no replacement is provided; keeping dependencies current is left to whoever maintains a given project instance.
- **Decision needed:** this removes a previously documented, working capability that an existing fork could already depend on, so treat the instruction-contract bump as **major**, not minor — a fork relying on `upstream-sync.yml` needs to learn it's gone for good, not just notice an additive change.
- Validation: `npm test` and `npm run lint`, plus a manual `grep -ri upstream` across the repo to confirm no dangling references survive outside historical files like `CHANGELOG.md`.

### Stage 1 — Re-scope the instruction files
*Addresses: goal 1.*

- Rewrite `claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md` to describe *this* repo's mission — a minimal, testable Discord bot template on Cloudflare Workers — instead of the generic Workers template's mission. No transition/migration narrative in these files; they describe the steady state, not how we got here.
- Keep everything that is genuinely still true unchanged: TDD mandate, no TypeScript, environment isolation, secrets discipline, documentation role table, versioning rules. Drop the "template repo" vs "fork" distinction insofar as it existed to explain upstream-sync eligibility — Stage 0 removes that mechanism, so there's no workflow left for the distinction to gate.
- Replace what's now specific to the generic template: "smallest practical base Worker" becomes "smallest practical Discord bot Worker"; add Discord-specific required project shape (signature verification, interaction handling, command registration) alongside the existing Wrangler/environment requirements.
- **Decided:** bumped the instruction contract version **2.0.0 → 2.1.0** (minor). It adds new required-shape items (signature verification, interaction handling, command registration) but doesn't rename a file, change a required command, or break an existing documented contract. Revisit at the end of Stage 5 in case a later stage's new required scripts force **major** instead.
- **Revisited at the end of Stage 5:** no further bump. `register`/`register:guild` are new npm scripts, but `claude.md`'s "Environment and deployment rules" section already frames its script list as illustrative ("a typical contract"), and the "command-registration story (script or documented process)" requirement was already part of the 2.1.0 required project shape — Stage 5 fulfills it rather than introducing a new requirement. Same reasoning Stage 4 used for signature verification.
- Validation: documentation-only change — no tests/lint required, but manually verify every command, path, and cross-reference named in the rewritten files still exists.

### Stage 2 — Decide and document the Discord app dependency surface
*Addresses: goal 3.*

**Decided:**

- **Signature verification:** hand-roll Ed25519 verification with native `crypto.subtle` (`importKey` + `verify`). Zero dependencies — no `discord-interactions`/`tweetnacl`. Cloudflare Workers supports Ed25519 in Web Crypto natively, so this avoids third-party supply-chain surface and Node-polyfill assumptions for ~15–20 lines of code plus a small hex-decode helper. Interaction/response type constants (`PING`/`APPLICATION_COMMAND`, `PONG`/`CHANNEL_MESSAGE_WITH_SOURCE`, etc.) are plain JS constants with JSDoc typedefs, not a TypeScript enum — `claude.md` forbids introducing TypeScript as a project requirement. Doc links: [Cloudflare Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [MDN `SubtleCrypto.verify()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify), [Discord: validating security request signatures](https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-validating-security-tokens).
- **Command registration:** a standalone Node.js script (`scripts/register-commands.js`), zero dependencies, using native `fetch` and the `node --env-file` flag (no `dotenv`). It reads a shared command-definitions module and issues a `PUT` bulk-overwrite request to Discord's REST API — global (`PUT /applications/{id}/commands`) or guild-scoped (`PUT /applications/{id}/guilds/{guild_id}/commands`) depending on a flag. `PUT` bulk-overwrite creates/updates/prunes commands to match the repo's definitions in one call. Doc link: [Discord: bulk overwrite global application commands](https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands).
- **npm scripts:** `register` (defaults to global, or targets a guild if `DISCORD_GUILD_ID` is set) and `register:guild` (explicit guild-scoped registration for fast iteration during development), both invoking `node --env-file=.dev.vars scripts/register-commands.js` (the second with a `--guild` flag). Node `>=22` (this repo's declared version) supports `--env-file` natively as a stable flag. The script reads `.dev.vars`, not a separate `.env` — see Stage 3's single-local-file decision.
- **Shared command-definitions module:** Stage 4 (Worker dispatch) and Stage 5 (registration script) read command definitions from one shared JS module rather than declaring them independently, so command name/description/response text can't drift out of sync between the two. Exact file location is decided during Stage 4 implementation.
- **Secret scope, decided together with Stage 3:** the runtime Worker receives `DISCORD_PUBLIC_KEY` (verification) and `DISCORD_APPLICATION_ID`, provisioned now even though Stage 4's minimal PING/PONG + synchronous-reply scope doesn't yet call back out to Discord's API — this avoids a future secret-provisioning step if a later stage adds outbound calls (deferred responses, message edits). The registration script additionally needs `DISCORD_TOKEN` (bot token, canonical name — not `DISCORD_BOT_TOKEN`) and optionally `DISCORD_GUILD_ID`. `DISCORD_TOKEN` is never a Worker secret. See Stage 3 for the full table and the single-file local-dev decision.

Changelog/changeset entry recording this decision lands with the Stage 4/5 implementation, not with this plan-file update alone — this stage's output is the decision and the updated plan.

### Stage 3 — Secrets and configuration streamlining
*Addresses: goal 4.*

**Decided: local secrets live in one project-scoped file, `.dev.vars`, never in machine-wide shell environment variables.** A developer working on more than one bot built from this template (a near-certainty for anyone maintaining several small Discord bots) would otherwise share one `DISCORD_TOKEN` across every checkout on the machine — easy to forget to re-export when switching projects, and since command registration is a `PUT` **bulk overwrite** (Stage 2), a stale exported token used against the wrong project directory doesn't just fail, it silently replaces another bot's real commands. Project-scoped files tie the secret to the directory the code runs from, which makes that mistake structurally impossible rather than a matter of developer discipline. This is the same isolation principle `claude.md` already states for Cloudflare resources ("production resources must never be silently reused by local or staging work"), applied to *which bot's credentials* rather than just *which environment's resources*. Cloudflare's dashboard and `wrangler secret put` are not an alternative to this — they configure secrets for a *deployed* Worker environment and have no bearing on local `wrangler dev` or a Node script run from a laptop, so the real choice was always project-scoped files vs. shell exports for local dev, not files vs. dashboard.

**Decided: one local file, not two.** `DISCORD_PUBLIC_KEY` and `DISCORD_APPLICATION_ID` are technically not sensitive (the public key is public by design; the application ID appears in invite URLs), which would justify splitting them into committed `wrangler.jsonc` `vars` and keeping only `DISCORD_TOKEN`/`DISCORD_GUILD_ID` in a gitignored file. Rejected in favor of consolidation: every Discord value a developer needs — sensitive or not — lives in a single `.dev.vars` file, so there is exactly one place to configure "the Discord stuff" rather than a sensitivity-based split a new user has to reason about. `wrangler dev` reads `DISCORD_PUBLIC_KEY`/`DISCORD_APPLICATION_ID` from `.dev.vars` automatically; the registration script (Stage 5) reads all four values from the same file via `node --env-file=.dev.vars`, since `.dev.vars` is a plain `KEY=VALUE` file and Node's `--env-file` flag accepts any filename. This is documentation-simplicity-over-technical-purity, chosen deliberately, not an oversight.

Per Stage 2's secret-scope decision, Discord-specific values split by *consumer* but not by *file*:

| Name | Consumer | Notes |
| --- | --- | --- |
| `DISCORD_PUBLIC_KEY` | Worker (runtime) | Used for Ed25519 verification. Not sensitive, but stored alongside the real secrets for one consistent setup step. |
| `DISCORD_APPLICATION_ID` | Worker (runtime) **and** registration script | Provisioned on the Worker now even though Stage 4's initial scope doesn't call back out to Discord's API, so a later stage that adds outbound calls doesn't need a new secret-provisioning step. The registration script needs it to build the bulk-overwrite URL. |
| `DISCORD_TOKEN` | Registration script only | Bot token. Canonical name is `DISCORD_TOKEN`, not `DISCORD_BOT_TOKEN`. Never a Worker secret, never committed. |
| `DISCORD_GUILD_ID` | Registration script only, optional | Enables guild-scoped command registration (`register:guild`) for fast iteration. |

- One `.dev.vars.example` (no real values) covering all four names, with comments noting which consumer reads which. `.gitignore` excludes `.dev.vars`/`.dev.vars.*` and allows `!.dev.vars.example`; the previous `.env`/`.env.*`/`!.env.example` lines are removed since no `.env` file exists in this design.
- **Decided: per-environment Discord application strategy.** Each environment gets its own Discord application — one shared by local development and `non-prod`, one dedicated to `production` — mirroring the existing non-prod/production Worker-naming split and the "production resources must never be silently reused" rule. Not one application with environment-scoped tokens.
- Extend the wrangler config guidance (`docs/using-this-template.md`) with `wrangler secret put <NAME> --env <env>` steps for the two Worker values (`DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`), and document that `DISCORD_TOKEN`/`DISCORD_GUILD_ID` are never set there since the registration script never runs inside the deployed Worker.

### Stage 4 — Core Discord bot implementation (TDD) — done
*Addresses: goal 6, built on Stages 2-3's decisions.*

Smallest viable slice, each behavior landing with a failing test first:

1. `fetch` handler rejects non-POST requests.
2. `fetch` handler verifies the Ed25519 signature on incoming interactions using native `crypto.subtle` (per Stage 2's zero-dependency decision) and returns 401 on failure.
3. Handler responds to Discord's `PING` (type 1) with `PONG` (type 1) — required for Discord to accept the interactions endpoint URL.
4. Handler responds to one sample `APPLICATION_COMMAND` interaction (e.g. `/ping` → "pong") to prove the end-to-end shape works, dispatching against the shared command-definitions module (Stage 2) rather than a Worker-local copy.
5. The shared command-definitions module itself (name, description, options, response text) lives obviously separate from Worker/environment config, so a downstream project can find "what do I customize" in one place, and so Stage 5's registration script can import the same source of truth.
- Unit tests use the same `@cloudflare/vitest-pool-workers` setup already in the repo; no live Discord calls in tests — sign fixtures locally with a test keypair.
- This stage is the natural point to reassess the Stage 1 instruction-contract version bump, since it likely adds a new required project-shape element (Discord signature verification) — treat as **minor** if it's additive to the existing contract, **major** only if it changes an existing required command or file layout.

**Decided/implemented:**

- **File layout:** `src/discord-signature.js` (`verifyDiscordRequest(request, publicKeyHex)`, pure and independently unit-tested) and `src/command-definitions.js` (the shared command-definitions module named in Stage 2/3 — resolves the open question below). `src/index.js` imports both; it holds no signature or command logic itself.
- **"Rejects non-POST" resolved as a routing split, not an HTTP error:** Discord only ever POSTs interactions, so the `fetch` handler treats any non-POST request as the non-Discord health/basic response required by `claude.md`'s project shape (`200 OK`) rather than erroring. Only a POST that fails signature verification gets a `401`; an unrecognized interaction `type` gets a `400`.
- **Interaction/response type constants** are named exports (`InteractionType`, `InteractionResponseType`) from `src/index.js` — plain JS objects with JSDoc `@see` links to Discord's docs, not a TypeScript enum, so both the handler and its tests reference symbolic names instead of magic numbers.
- **Unrecognized command names** get a fallback `"Unknown command."` reply instead of throwing, since a live bot can receive a stale interaction for a command that was since renamed or removed from `command-definitions.js`.
- **Test fixtures:** `test/helpers/discord-fixtures.js` generates a throwaway Ed25519 keypair per test with `crypto.subtle.generateKey` and signs fixture requests the same way Discord does (Ed25519 over `timestamp + body`) — no real Discord public key, no network calls, no dependency on a local `.dev.vars` file existing in CI.
- Confirmed via current Cloudflare docs that the Web Crypto API's Ed25519 support needs no compatibility flag (works with this repo's `compatibility_date`), reaffirming Stage 2's zero-dependency decision.
- **Instruction contract version:** not bumped. Stage 1 already added signature verification/interaction handling/command registration to `claude.md`'s required project shape at 2.1.0; Stage 4 fulfills that existing requirement rather than adding a new one.

### Stage 5 — Command registration script and its own test/doc coverage — done
*Addresses: goal 3/6 follow-through.*

- Implement `scripts/register-commands.js` per Stage 2's decision: zero dependencies, native `fetch`, imports the shared command-definitions module from Stage 4, reads `DISCORD_TOKEN`/`DISCORD_APPLICATION_ID`/optional `DISCORD_GUILD_ID` via `node --env-file=.dev.vars`, issues a `PUT` bulk-overwrite request (global by default, guild-scoped with `--guild` or when `DISCORD_GUILD_ID` is set).
- Add the `register` and `register:guild` npm scripts (Stage 2), matching the existing script-contract style in `claude.md`.
- Add a script-level test that doesn't hit the network (mock global `fetch` or test the payload-building/URL-selection logic in isolation).
- Document how and when to run it (once per app, or per command change) in `docs/using-this-template.md` — the single-`.dev.vars` decision from Stage 3 is already documented there.

**Decided/implemented:**

- **Testable via dependency injection, not mocked module internals.** `buildRegistrationUrl`, `buildCommandPayload`, and `resolveGuildId` are pure named exports; `registerCommands({ applicationId, token, guildId, fetchImpl })` takes `fetchImpl` as an injectable parameter (defaulting to global `fetch`) rather than reading `process.env` or calling `fetch` directly, so `test/register-commands.test.js` covers the real request shape (method, headers, body) with a mocked `fetchImpl` — no network calls, no `.dev.vars` dependency in CI. `main()` is the only part that reads `process.env`/`process.argv`, and only runs when the file is executed directly (`fileURLToPath(import.meta.url) === process.argv[1]`), never on import, so importing the module for tests has no side effects.
- **`--guild` without `DISCORD_GUILD_ID` is a hard error, not a silent fallback to global.** `resolveGuildId` throws if `guildFlag` is set but `discordGuildId` isn't, since a bulk-overwrite that lands globally when a developer meant guild-scoped is a worse failure mode than refusing to run.
- **`fetch` and `console` added to `eslint.config.js`'s globals**, alongside the existing `process` — the registration script is the first source file in this repo to use either.
- Tests live at `test/register-commands.test.js` (vitest, alongside the other unit tests, not `test/contracts/`) since they test this script's own logic, not a repo-structure contract; they run fine under the existing `@cloudflare/vitest-pool-workers` setup because the pure functions and the `fetchImpl` injection point avoid any Node-only API.
- Verified manually: running the compiled CLI directly (not through vitest) with no env vars, with `--guild` and no `DISCORD_GUILD_ID`, and with a mocked global `fetch` all behave as documented, confirming the `import.meta.url`-based main-module guard is not just a test artifact.

### Stage 6 — Documentation overhaul — done
*Addresses: goal 5, plus finishing the doc debt from Stages 0-5.*

- `README.md`: quickstart reframed around "clone/use-this-template → set Discord app credentials → deploy → see your bot respond," not the generic Workers pitch.
- `docs/using-this-template.md`: replace the generic Worker-naming walkthrough with Discord Developer Portal steps (create application, get public key/bot token/application ID, set the Interactions Endpoint URL to the deployed Worker's URL per environment), fold in Stage 3's per-environment secrets table, and confirm no upstream-sync material Stage 0 missed is still lingering.
- `docs/gitflow-and-branching.md` and `docs/versioning-and-changesets.md`: check for any generic-Worker-only language; likely need only light touch-ups since branching/release mechanics don't change.
- `docs/using-ai.md`: update the "what is already set up" table and MCP guidance only if Stage 2's research changed what an assistant should look up (e.g. Discord API docs aren't served by the Cloudflare docs MCP server, so note where to look instead).
- Cross-check every internal link and the README documentation table per `claude.md`'s "update every cross-reference" rule.

**Decided/implemented:**

- **`README.md`** rewritten: title and pitch now describe a Discord bot template (signature verification, interaction handling, command registration) instead of the generic Worker pitch. "What you get" lists `src/index.js`, `src/command-definitions.js`, and `scripts/register-commands.js` by name. The quickstart grew from 7 to 8 steps to insert "create a Discord application and fill in `.dev.vars`" and "register your test commands," and the final step now also covers setting the Interactions Endpoint URL. The everyday-commands table gained `register`/`register:guild`. `package.json`/`wrangler.jsonc` naming (still literally `cloudflare-workers-template`) was deliberately left alone — that rename is Stage 8's job, not this stage's.
- **`docs/using-this-template.md` had a real gap, not just stale wording:** the per-environment secrets table and `.dev.vars` instructions already existed from Stage 3's work, but nothing walked through *creating* a Discord application or ever mentioned the **Interactions Endpoint URL** — a documented requirement in `claude.md`'s "Required project shape." Added two new sections: "Creating your Discord applications" (Developer Portal click-path: New Application, copy Application ID/Public Key, reset and copy the bot token) and "Setting the Interactions Endpoint URL" (why it must come *after* a deployment with `DISCORD_PUBLIC_KEY` already set — Discord verifies the URL with a live signed `PING` on save — and what an inline validation error there means). "Setup is complete when" gained a matching checklist line. No lingering upstream-sync material found (`grep -rni upstream` outside `CHANGELOG.md`/`project-approach.md`/the deliberate template-vs-fork distinction turned up nothing).
- **`docs/gitflow-and-branching.md` and `docs/versioning-and-changesets.md`: no changes needed.** Read both in full; neither contains generic-Worker-only language that contradicts the Discord bot mission — branch/release mechanics are identical regardless of what the Worker does.
- **`docs/using-ai.md`:** added one paragraph noting the Cloudflare Docs MCP server doesn't cover Discord's API and pointing at `discord.com/developers/docs` directly, matching `claude.md`'s existing instruction to look Discord platform behavior up separately.
- **Link audit:** wrote a throwaway script to compute GitHub-style heading slugs for every doc touched by this stage (plus `CONTRIBUTING.md`) and checked every internal `[text](path#anchor)` link against it. Found and fixed one **pre-existing** broken anchor unrelated to this stage's new content: `README.md` linked `docs/using-this-template.md#choosing-how-to-start`, but the heading is `## 0. Choosing how to start`, which slugs to `0-choosing-how-to-start` (the leading `0.` doesn't vanish). All links added by this stage passed on the first check.
- Documentation-only change: only `.md` files touched, so per `claude.md`'s documentation-only exemption, `npm test`/`npm run lint`/Wrangler validation were skipped in favor of the accuracy review above (commands, paths, and anchors verified to exist; no contradiction with the instruction files).

### Stage 7 — Live verification
*Addresses: goal 6's "test the bot live on Discord."*

- Deploy to the non-prod environment (requires `DEPLOY_ENABLED` and a real Discord application — this is manual, human-gated work, not something to automate).
- Register the sample command against that application, confirm Discord's endpoint verification succeeds, and exercise the command from an actual Discord server.
- Record the outcome (and any doc corrections it surfaces) as a follow-up commit rather than closing the loop silently.

### Stage 8 — Template identity and version reset
*Addresses: goal 1/5's "make this repo's own identity clear," and the "include a template version" requirement in `claude.md`.*

- Decide whether `package.json`'s `name`/`version` restart at something like `cloudflare-workers-discord-template@0.1.0`, or continue the inherited `0.2.1` lineage. Recommend a reset to `0.1.0` with a `CHANGELOG.md` entry explaining the fork point and linking the upstream commit/tag it started from — this is the "downstream project should be able to identify the upstream version it started from" requirement, applied one level up the chain.
- Bump the instruction contract version to whatever Stages 1/4 accumulated to, in all three instruction files together, per `claude.md`'s alignment rule.
- This is the natural point to tag a `v0.1.0`-equivalent release marking "Discord bot template, usable end to end."

## Sequencing notes

- Stage 0 is a hard prerequisite for everything else touching workflows — land the removal before any other workflow-touching stage, so nobody adds new workflow contract coverage for a mechanism that's being deleted.
- Stages 2 and 3 are decisions-and-docs only; they gate Stage 4 (implementation) but can be reviewed quickly since they don't touch code.
- Stage 4 is the only stage that needs full TDD ceremony end-to-end; keep it small and resist folding Stage 5 into the same PR.
- Stage 6 intentionally comes after implementation so documentation describes what was actually built, not what was planned.
- Stage 7 cannot be delegated to CI — it requires a real Discord application and a human watching Discord respond.
- Stage 8 is last because version/identity metadata should describe a working template, not a work-in-progress one.

## Open questions to resolve as we go (not blocking Stage 0)

- Per-environment vs. per-project Discord application strategy (Stage 3) — affects the setup doc's structure, decide before writing it.
- Package version reset vs. continuation (Stage 8) — leaning toward reset; confirm before tagging anything.

Resolved: Ed25519 verification approach, command-registration mechanism, npm script names, and secret naming/scope — see Stage 2. File location for the shared command-definitions module (`src/command-definitions.js`) and the Worker's signature-verification module (`src/discord-signature.js`) — see Stage 4.
