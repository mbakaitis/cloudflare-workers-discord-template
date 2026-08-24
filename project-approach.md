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
- Validation: documentation-only change — no tests/lint required, but manually verify every command, path, and cross-reference named in the rewritten files still exists.

### Stage 2 — Decide and document the Discord app dependency surface
*Addresses: goal 3.*

Research (Cloudflare docs MCP + Discord developer docs) and decide, before writing code:

- Signature verification approach: `discord-interactions` (small, Workers/edge-friendly, uses Web Crypto) vs. hand-rolled `SubtleCrypto` Ed25519 verification. Prefer the smallest dependency that keeps the Worker's cold-start fast and avoids Node-only APIs, consistent with the "no service/dependency added merely because it may be useful later" rule.
- Command-registration story: a one-off Node script (run locally or in CI, not in the Worker) that calls Discord's `PUT /applications/{id}/commands` endpoint. Decide if this needs a dependency or is a plain `fetch` script.
- Whether any of this needs a new `npm` script (`register-commands`?) and how that fits the existing script contract in `claude.md`.
- Record the decision and its rationale (and the doc link) directly in this plan's own follow-up commit message and in `CHANGELOG.md`/`claude.md` once implemented — not left as a chat-only decision.

Output of this stage is a decision, committed as an update to this plan file plus a changeset-worthy note; no application code yet.

### Stage 3 — Secrets and configuration streamlining
*Addresses: goal 4.*

- Enumerate the Discord-specific secrets a bot needs: `DISCORD_PUBLIC_KEY` (verification, not secret but environment-specific), `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, optionally `DISCORD_GUILD_ID` for guild-scoped command testing.
- Add a `.dev.vars.example` (no real values) so local dev has a documented shape without committing secrets — check `.gitignore` already excludes `.dev.vars`.
- Decide the per-environment secret story consistent with the existing non-prod/production isolation rule: each environment gets its own Discord application (recommended — mirrors "production resources must never be silently reused") or one application with environment-scoped tokens. This needs to be an explicit, documented choice, not left implicit.
- Extend the wrangler config guidance (`docs/using-this-template.md` §4-equivalent) with `wrangler secret put <NAME> --env <env>` steps for each secret above.

### Stage 4 — Core Discord bot implementation (TDD)
*Addresses: goal 6, built on Stages 2-3's decisions.*

Smallest viable slice, each behavior landing with a failing test first:

1. `fetch` handler rejects non-POST requests.
2. `fetch` handler verifies the Ed25519 signature on incoming interactions and returns 401 on failure.
3. Handler responds to Discord's `PING` (type 1) with `PONG` (type 1) — required for Discord to accept the interactions endpoint URL.
4. Handler responds to one sample `APPLICATION_COMMAND` interaction (e.g. `/ping` → "pong") to prove the end-to-end shape works.
5. Config surface for bot-specific strings (command name, response text) kept obviously separate from Worker/environment config, so a downstream project can find "what do I customize" in one place.
- Unit tests use the same `@cloudflare/vitest-pool-workers` setup already in the repo; no live Discord calls in tests — sign fixtures locally with a test keypair.
- This stage is the natural point to reassess the Stage 1 instruction-contract version bump, since it likely adds a new required project-shape element (Discord signature verification) — treat as **minor** if it's additive to the existing contract, **major** only if it changes an existing required command or file layout.

### Stage 5 — Command registration script and its own test/doc coverage
*Addresses: goal 3/6 follow-through.*

- Implement the registration script decided in Stage 2.
- Add a script-level test that doesn't hit the network (mock `fetch` or test the payload-building logic in isolation).
- Document how and when to run it (once per app, or per command change) in `docs/using-this-template.md`.

### Stage 6 — Documentation overhaul
*Addresses: goal 5, plus finishing the doc debt from Stages 0-5.*

- `README.md`: quickstart reframed around "clone/use-this-template → set Discord app credentials → deploy → see your bot respond," not the generic Workers pitch.
- `docs/using-this-template.md`: replace the generic Worker-naming walkthrough with Discord Developer Portal steps (create application, get public key/bot token/application ID, set the Interactions Endpoint URL to the deployed Worker's URL per environment), fold in Stage 3's per-environment secrets table, and confirm no upstream-sync material Stage 0 missed is still lingering.
- `docs/gitflow-and-branching.md` and `docs/versioning-and-changesets.md`: check for any generic-Worker-only language; likely need only light touch-ups since branching/release mechanics don't change.
- `docs/using-ai.md`: update the "what is already set up" table and MCP guidance only if Stage 2's research changed what an assistant should look up (e.g. Discord API docs aren't served by the Cloudflare docs MCP server, so note where to look instead).
- Cross-check every internal link and the README documentation table per `claude.md`'s "update every cross-reference" rule.

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

- Ed25519 verification library choice (Stage 2) — needs a short spike/comparison before committing.
- Per-environment vs. per-project Discord application strategy (Stage 3) — affects the setup doc's structure, decide before writing it.
- Package version reset vs. continuation (Stage 8) — leaning toward reset; confirm before tagging anything.
