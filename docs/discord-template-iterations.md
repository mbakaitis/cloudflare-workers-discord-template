# Discord Template Iterations — Prompt Sequence

**Status:** working artifact, not part of the consumer documentation set. It turns the phased plan in [discord-template-edits.md](discord-template-edits.md) into thirteen iterations, each one a prompt you can paste into a fresh session. Delete both files once the work has landed and `CHANGELOG.md` carries the history.

Every iteration is a complete increment in the Agile sense: it ends with all checks green, documentation updated, and a changeset recorded. Nothing is left half-built for the next iteration to finish. That is what makes it safe to stop after any iteration, or to hand the next one to a different session.

## How to use this file

One iteration per session, one iteration per branch, one iteration per pull request. Paste the prompt block verbatim; each one names the files and tests it touches, so it does not depend on conversation history.

This repository branches from and targets `main` — it has no `develop` branch and deploys nothing itself (see [CONTRIBUTING.md](../CONTRIBUTING.md)'s branching note). Start each iteration with:

```sh
git switch main
git pull --ff-only
git switch -c feature/<iteration-branch-name>
```

`claude.md` is loaded automatically in this repository, so an assistant already has the maintenance contract, the TDD requirement, and the secrets rules. The standing rules below restate the few that are easiest to skip under momentum.

### Standing rules for every iteration

1. **Red before green.** Write the failing test first and *show it failing* before implementing. A test written after the code is not evidence of anything.
2. **Smallest change that passes.** Then refactor while green.
3. **Green means green.** `npm test` and `npm run lint` both pass before the iteration is done. Never leave a failing check for a later iteration.
4. **Coverage never drops.** After the ratchet exists (Iteration 3), raise the thresholds to the newly measured level in the same change, by hand, so the number appears in the diff.
5. **Docs land with the change.** If an iteration changes a command, a file layout, a secret, or a workflow, its documentation changes in the same commit.
6. **Record a changeset** (`npm run changeset`) unless the iteration touches only Markdown.
7. **No secrets, ever.** No real tokens, public keys, application IDs, or account identifiers in any tracked file — including test fixtures and example files.
8. **Report what ran.** Name the commands executed and any check that could not run, and why.
9. **Do not commit or push unless asked.** Leave the work in the tree for review.

### Iteration map

| # | Phase | Delivers |
| --- | --- | --- |
| 1 | 0 | Renamed, re-pointed repository with a green baseline |
| 2 | 0 | Instruction contract 3.0.0 describing the Discord project shape |
| 3 | 1 | Coverage ratchet wired into `npm test` |
| 4 | 1 | Official Discord documentation MCP server |
| 5 | 2 | An endpoint Discord will accept: verification + PING/PONG |
| 6 | 2 | Command dispatch seam and the bot reference doc |
| 7 | 3 | `/ping` and `/echo` |
| 8 | 3 | `/slow` — deferred response with a follow-up edit |
| 9 | 4 | Command registration from the command line |
| 10 | 5 | Declared secrets and a working local-development path |
| 11 | 5 | Registration on deploy, with isolation contract tests |
| 12 | 6 | End-to-end consumer narrative |
| 13 | 6 | Release classification and template readiness check |

---

## Iteration 1 — Rename and re-point

**Phase 0 · Delivers:** a repository that calls itself a Discord template, with the existing test suite green. **Branch:** `feature/rename-discord-template`

```text
Read docs/discord-template-edits.md, Phase 0 ("De-brand and re-point"), then apply the standing
rules in docs/discord-template-iterations.md.

First establish the baseline: run `npm install` (node_modules is not present in a fresh
checkout), then `npm test` and `npm run lint`. Report the results. Do not change anything until
the baseline is green, and tell me if it is not.

Then re-point this repository from the upstream `cloudflare-workers-template` to this project:

- package.json: name `cloudflare-workers-discord-template`, a description naming a Discord bot
  on Cloudflare Workers, keywords gaining `discord`, `discord-bot`, and `slash-commands`, and
  version reset to 0.1.0.
- wrangler.jsonc: all three `name` fields, keeping the `-non-prod` and `-production` suffixes.
- Replace the stale references to the old project: README.md line 1 and line 37,
  claude-for-users.md line 3, CONTRIBUTING.md line 24, and docs/using-this-template.md around
  lines 81-92 and line 251. The upstream remote URL becomes
  https://github.com/mbakaitis/cloudflare-workers-discord-template.git — confirm that slug with
  me before you write it if anything looks off.
- CHANGELOG.md: replace the inherited history with a single 0.1.0 entry recording that this
  template was derived from cloudflare-workers-template at version 1.0.0. Later iterations
  record changesets instead of editing this file.

Do not touch src/, the workflows, or the MCP configuration in this iteration. The existing
contract tests in test/contracts/environment-isolation.test.js are the check that the renaming
kept environment isolation intact — confirm they still pass rather than adding new tests.

Done when: npm test and npm run lint pass, no reference to the old project name remains outside
CHANGELOG.md's provenance entry (grep to prove it), and a changeset is recorded.
```

---

## Iteration 2 — Instruction contract 3.0.0

**Phase 0 · Delivers:** the written spec every later iteration complies with. **Branch:** `feature/instruction-contract-3`

```text
Read docs/discord-template-edits.md, Phase 0 ("Instruction contract"), then apply the standing
rules in docs/discord-template-iterations.md.

This is a documentation-only change, so per the instruction contract it is exempt from tests,
lint, and Wrangler validation — review it for accuracy instead, and say so in your report.

Raise the instruction contract version to 3.0.0 in claude.md, AGENTS.md, and
.github/copilot-instructions.md, and add these requirements to the project shape:

- An interactions endpoint that performs mandatory Ed25519 signature verification on every
  request and returns 401 when verification fails.
- Command definitions kept as data and shared by the Worker and the registration script, so the
  two cannot disagree about what exists.
- A separate Discord application per environment. A non-production Worker never holds production
  Discord credentials.
- Never log interaction payloads, interaction tokens, or bot tokens.
- The command registration script and its npm scripts are part of the template contract.

Then mirror only the downstream-relevant parts into claude-for-users.md, AGENTS-for-users.md, and
.github/copilot-instructions-for-users.md, per claude.md's own mirroring rule. Template-
maintenance-only material — mission and scope, the contract version itself, upstream adoption —
stays out of the -for-users files.

The bump is major because it changes the required project shape, required scripts, and required
secrets. Note in the change that the repository will not satisfy the new shape until Iteration 8
completes, that this window stays inside this feature branch series, and that nothing is released
mid-way.

Done when: all six instruction files agree, the three maintainer files carry 3.0.0, the
-for-users files carry no version, and every command, path, and file name you reference exists.
```

---

## Iteration 3 — The coverage ratchet

**Phase 1 · Delivers:** coverage measured and enforced before any Discord code exists. **Branch:** `feature/coverage-ratchet`

```text
Read docs/discord-template-edits.md, Phase 1 ("Coverage, as a ratchet"), then apply the standing
rules in docs/discord-template-iterations.md.

Add coverage enforcement to the test suite, before there is any Discord code to measure. That
ordering is the point: thresholds added at the end can only be pinned to whatever the suite
happened to reach.

- Add @vitest/coverage-istanbul. The Workers pool does not support the v8 provider, so istanbul
  is required — verify that against the Cloudflare documentation MCP server before installing,
  and cite what you find.
- Configure coverage in vitest.config.js over src/ and scripts/lib/ (the latter does not exist
  yet; make the config tolerate that, or note it and add the path in Iteration 9).
- Measure the baseline first and report it. Then pin the thresholds to exactly what you measured.
  Do not pick a round aspirational number, and do not use coverage.thresholds.autoUpdate — a
  threshold that rises without review is not a reviewed promise.
- Fold coverage into `npm test` so CI and local runs are identical.
- Add a contract test asserting the coverage thresholds exist in vitest.config.js and are
  non-zero, so a later change cannot quietly delete the ratchet. Do not assert the specific
  values — that would create a second place to update. Write this test failing first.
- Add the never-lower-the-threshold rule to the testing-expectations section of CONTRIBUTING.md.

Confirm coverage/ is already gitignored and ESLint-ignored rather than re-adding it.

Done when: npm test runs coverage and enforces thresholds, the new contract test passes and
failed before the config existed, npm run lint passes, CONTRIBUTING.md documents the rule, and a
changeset is recorded.
```

---

## Iteration 4 — Official Discord documentation MCP

**Phase 1 · Delivers:** first-party Discord documentation available to every later iteration. **Branch:** `feature/discord-docs-mcp`

```text
Read docs/discord-template-edits.md, Phase 1 ("Discord documentation MCP"), then apply the
standing rules in docs/discord-template-iterations.md.

Add Discord's official documentation MCP server. It is read-only — documentation search plus a
virtualized docs filesystem — and it carries no credentials, which is why it belongs in the
committed configuration.

Red first: extend the expectedServers map in test/contracts/workflow.test.js (around line 45)
with "discord-docs": "https://docs.discord.com/mcp" and show the test failing.

Green: add the server to .mcp.json under the mcpServers key and to .vscode/mcp.json under the
servers key, with type "http" and the URL only. The existing test asserts exactly two keys per
server entry, so do not add anything else.

Docs in the same change:
- docs/using-ai.md: a row in the "What is already set up" table and a bullet in the "MCP servers"
  section, matching how the Cloudflare and GitHub servers are described.
- README.md: extend the MCP line in "AI is already wired in" to mention it, and note that the
  GitHub MCP server needs interactive authorization on first use — it is unauthenticated in a
  fresh checkout, which is worth saying out loud.
- Keep the existing point that neither configuration file contains a token.

Done when: npm test and npm run lint pass, the contract test failed before the config change,
both MCP files agree, and a changeset is recorded.
```

---

## Iteration 5 — An endpoint Discord will accept

**Phase 2 · Delivers:** a Worker whose URL passes Discord's endpoint validation. **Branch:** `feature/interaction-verification`

```text
Read docs/discord-template-edits.md, Phase 2, then apply the standing rules in
docs/discord-template-iterations.md.

Before writing code, confirm the current requirements against Discord's documentation MCP server
(https://docs.discord.com/mcp) and cite what you find: the signature headers, the mandatory
verification, the 401 on failure, and the PING/PONG contract including its Content-Type
requirement.

This iteration delivers the slice Discord itself validates when you save an Interactions Endpoint
URL: verify the signature, answer PING with PONG, reject everything malformed.

Add discord-interactions@^4.4.0 as the template's first runtime dependency — Discord-maintained,
zero transitive dependencies, Web Crypto verifyKey. Then build:

- src/discord/verify.js — wraps verifyKey. It must read the raw body text BEFORE any JSON.parse,
  because the signature covers the raw bytes.
- src/discord/responses.js — pong(), reply(), ephemeral(), deferred() helpers, each returning a
  Response with content-type: application/json.
- src/index.js — a fetch router only: GET / health, POST /interactions, 405 for the wrong method,
  404 for an unknown path.

Drive these out one failing test at a time, in this order:
1. GET / returns 200 OK (retarget the existing test/index.test.js at the health path).
2. Missing or malformed signature headers return 401 with body "invalid request signature", and
   no JSON parsing is attempted.
3. A validly signed type 1 payload returns 200 {"type":1} with a JSON content type.
4. A valid signature over a tampered body returns 401.
5. A validly signed but malformed JSON body returns 400.
6. Non-POST to /interactions returns 405; an unknown path returns 404.

Test mechanics matter here. Sign fixtures with a real Ed25519 key: first check whether
crypto.subtle.generateKey({ name: "Ed25519" }, ...) works in the workerd test pool. If it does,
generate a keypair in a test helper and derive the public key hex, so verifyKey is genuinely
exercised. If it does not, fall back to a committed fixture keypair with precomputed signatures
and say which path you took. Either way: no network, no real Discord application, and the test
public key comes from the test-pool env.

Extend the globals list in eslint.config.js as the new modules need (crypto, fetch, console,
Request, TextEncoder, and so on) rather than disabling rules.

Raise the coverage thresholds to the newly measured level in this change.

Done when: npm test and npm run lint pass, each behavior above has a test that failed first, the
coverage thresholds went up, and a changeset is recorded.
```

---

## Iteration 6 — Dispatch seam and the bot reference doc

**Phase 2 · Delivers:** command routing with a tested empty registry, and the doc later iterations extend. **Branch:** `feature/interaction-dispatch`

```text
Read docs/discord-template-edits.md, Phase 2, then apply the standing rules in
docs/discord-template-iterations.md.

Add the dispatch seam that Iterations 7 and 8 plug commands into:

- src/interactions.js — a pure dispatcher with the signature (interaction, { env, ctx, registry,
  rest }) returning a Response. Injecting registry and rest is not decoration: it is what keeps
  every later test offline and the coverage ratchet reachable.
- src/discord/rest.js — editOriginalResponse(), a PATCH to
  /webhooks/{application_id}/{token}/messages/@original. Verify that path against Discord's
  documentation MCP server and cite it. It takes fetch as a parameter so tests never touch the
  network.
- src/commands/index.js — the registry, empty or with a placeholder for now. It MUST stay
  importable from plain Node with no cloudflare:workers imports, because Iteration 9's
  registration script imports the same definitions. Add a test that proves it: import it from a
  node:test contract test.

Tests, failing first:
1. A type 2 interaction naming a command that is not in the registry returns 200 with an
   ephemeral "unknown command" reply — 200 rather than an error status, so Discord shows the user
   something.
2. The dispatcher returns 401/400 behavior unchanged from Iteration 5 (regression coverage that
   the seam did not break verification).
3. src/commands/index.js imports cleanly in plain Node.

Then create docs/discord-bot.md covering only what now exists: the interaction lifecycle —
verify, PING/PONG, dispatch — and the module layout with each file's responsibility. Add it to
the documentation tables in README.md, claude.md, and AGENTS.md. Later iterations extend this
file; do not write ahead of the code.

Raise the coverage thresholds to the newly measured level.

Done when: npm test and npm run lint pass, the new tests failed first, docs/discord-bot.md exists
and is linked from all three tables, thresholds went up, and a changeset is recorded.
```

---

## Iteration 7 — `/ping` and `/echo`

**Phase 3 · Delivers:** two working commands, immediate reply and option parsing. **Branch:** `feature/ping-echo-commands`

```text
Read docs/discord-template-edits.md, Phase 3, then apply the standing rules in
docs/discord-template-iterations.md.

Add the first two commands, each as src/commands/<name>.js with its definition and handler
co-located, registered in src/commands/index.js.

Check the current application-command object against Discord's documentation MCP server before
writing definitions, and cite it — in particular integration_types and contexts, which every
definition in this template should declare explicitly rather than relying on defaults.

- /ping — replies immediately with CHANNEL_MESSAGE_WITH_SOURCE. The minimal worked example.
- /echo — takes a required string option and echoes it back. This is the option-parsing example,
  so it must handle a missing or blank option by replying with an ephemeral validation message
  rather than throwing.

Tests, failing first:
1. /ping returns an immediate CHANNEL_MESSAGE_WITH_SOURCE with the expected content.
2. /echo returns the submitted string.
3. /echo with the option absent returns an ephemeral validation message, not a crash.
4. /echo with a blank or whitespace-only option does the same.
5. Every definition in the registry is valid: unique lowercase name, non-empty description, and
   declared integration_types and contexts. Write this as a registry-wide test, so it
   automatically covers commands added later.

Extend docs/discord-bot.md with how to add a command — the file to create, the registry entry,
the test to write — using these two as the worked example.

Raise the coverage thresholds to the newly measured level.

Done when: npm test and npm run lint pass, all five tests failed first, docs/discord-bot.md
documents the pattern, thresholds went up, and a changeset is recorded.
```

---

## Iteration 8 — `/slow`, deferred and followed up

**Phase 3 · Delivers:** the pattern any real bot needs for work that outlasts Discord's 3-second window. **Branch:** `feature/slow-command-deferred`

```text
Read docs/discord-template-edits.md, Phase 3, then apply the standing rules in
docs/discord-template-iterations.md.

Add /slow, the deferred-response example. Confirm the deferral contract against Discord's
documentation MCP server first and cite it: the acknowledgement window, the deferred response
type, and how the follow-up edit is addressed.

Behavior: acknowledge immediately with DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, then perform the
slow work and edit the original response through src/discord/rest.js, scheduled with
ctx.waitUntil so the Worker is not killed before the follow-up completes.

Tests, failing first:
1. /slow returns DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE immediately.
2. The follow-up PATCH is actually issued — await the ctx.waitUntil promises through
   @cloudflare/vitest-pool-workers' execution context and assert against an injected recording
   fake for rest. Asserting that a promise was scheduled is not enough; assert the call happened
   and carried the right body.
3. A failing follow-up does not throw out of the handler or reject the deferred acknowledgement.
   Decide how it should behave, make it deliberate, and document it.
4. The slow work itself is deterministic in tests — no wall-clock dependence, no real timers, no
   network.

Extend docs/discord-bot.md with when to defer, what the 3-second window means in practice, and
why the follow-up runs in waitUntil.

Raise the coverage thresholds. At this point src/ is feature-complete, so report what full
coverage of src/ actually looks like and whether anything is unreachable — if it is, that is a
design signal worth acting on, not excluding.

Done when: npm test and npm run lint pass, the tests failed first, docs/discord-bot.md covers
deferral, thresholds went up, and a changeset is recorded.
```

---

## Iteration 9 — Registration from the command line

**Phase 4 · Delivers:** `npm run register:*` actually registers commands with Discord. **Branch:** `feature/command-registration`

```text
Read docs/discord-template-edits.md, Phase 4, then apply the standing rules in
docs/discord-template-iterations.md.

Build command registration. Confirm the bulk-overwrite endpoints and authorization header against
Discord's documentation MCP server and cite them — including the warning that bulk overwrite
replaces ALL command types, and the note that new commands count toward daily create limits.

Split the work so the logic is testable and the I/O is thin:

- scripts/lib/registration.js — pure and fully unit-tested. Builds the target URL (global
  /applications/{id}/commands versus guild /applications/{id}/guilds/{guild}/commands), the
  Authorization: Bot <token> header, and the request body from the command definitions imported
  from src/commands/index.js. Validates required environment variables. Maps a non-2xx response
  to a thrown error carrying both the status and the response text. Takes fetch as a parameter.
- scripts/register-commands.js — a thin Node CLI wrapper. Reads DISCORD_TOKEN,
  DISCORD_APPLICATION_ID, and optional DISCORD_GUILD_ID; supports --dry-run; exits non-zero on
  failure; prints the registered command names. It must redact the token in every code path,
  including error output. No dependencies — Node 22's global fetch replaces the node-fetch older
  tutorials use.
- package.json scripts: register:non-prod (guild-scoped), register:production (global),
  register:dry-run.

Tests, failing first:
1. Global versus guild URL selection.
2. The Authorization header shape.
3. The request body equals the command definitions array.
4. A missing required environment variable fails with a clear message and makes no request.
5. A non-2xx response surfaces both status and response body.
6. --dry-run issues no request at all.
7. The CLI wrapper itself: spawn it with --dry-run and placeholder environment variables from a
   node:test contract test, following the execFile precedent already in
   test/contracts/workflow.test.js around line 118. Assert it makes no network call, prints the
   plan, and does not print the token. Do not exclude the wrapper from coverage instead of
   testing it.

Add scripts/lib/ to the coverage configuration if Iteration 3 deferred it, then raise the
thresholds.

Extend docs/discord-bot.md with how registration works, the global-versus-guild distinction, and
the --dry-run path. Add the new scripts to the commands table in README.md.

Done when: npm test and npm run lint pass, the tests failed first, `node scripts/register-
commands.js --dry-run` with placeholder values prints the plan and contacts nothing, thresholds
went up, and a changeset is recorded.
```

---

## Iteration 10 — Declared secrets and the local path

**Phase 5 · Delivers:** `npm run dev` works from documented placeholders, with secrets declared per environment. **Branch:** `feature/discord-secrets-config`

```text
Read docs/discord-template-edits.md, Phase 5, then apply the standing rules in
docs/discord-template-iterations.md.

Make the Discord secrets explicit and the local-development path real, without a Cloudflare
account or a production application.

- wrangler.jsonc: declare the Worker-side secret names — DISCORD_PUBLIC_KEY,
  DISCORD_APPLICATION_ID, DISCORD_TOKEN — at top level and in both environments, using the
  secrets.required property. Check first whether the pinned Wrangler version supports it (search
  the Cloudflare documentation MCP server, then confirm with `npx wrangler deploy --dry-run
  --env non-prod`). If it does not, document the requirement instead and say so — do not invent
  configuration Wrangler will reject.
- .gitignore: add `!.dev.vars.example`. Today `.dev.vars.*` would ignore the very example file
  the setup docs need to reference. Confirm the negation actually works with `git check-ignore -v`.
- Add a committed .dev.vars.example containing placeholder DISCORD_PUBLIC_KEY,
  DISCORD_APPLICATION_ID, DISCORD_TOKEN, and DISCORD_GUILD_ID. Obvious placeholders only, never a
  real value, and nothing that could be mistaken for one.

Tests, failing first, in a new test/contracts/discord.test.js:
1. wrangler.jsonc declares the required Discord secret names for every environment.
2. wrangler.jsonc contains no Discord values, only names.
3. No tracked file contains a Discord-token-shaped or public-key-shaped literal. Write this as a
   repository scan — it is the guard against a pasted secret, so make it catch a realistic
   mistake, and verify it by temporarily planting a fake value and watching it fail.
4. .gitignore still ignores .dev.vars and .env while allowing .dev.vars.example.
5. .dev.vars.example contains only placeholders.

Document in docs/using-this-template.md: the two-application requirement, where to find each
app's public key, application ID, and bot token, why the two applications must not share
credentials, and how .dev.vars.example becomes a local .dev.vars.

Done when: npm test and npm run lint pass, the scan test demonstrably catches a planted fake,
`npx wrangler deploy --dry-run` succeeds for both environments, and a changeset is recorded.
```

---

## Iteration 11 — Registration on deploy

**Phase 5 · Delivers:** a push to `main` registers production commands with no manual step. **Branch:** `feature/deploy-registration`

```text
Read docs/discord-template-edits.md, Phase 5, then apply the standing rules in
docs/discord-template-iterations.md.

Wire registration into deployment. This is the requirement that started the project: a push to
production re-registers commands so nobody does it by hand.

.github/workflows/deploy.yml gains a registration step AFTER the cloudflare/wrangler-action@v3
step, in the same job, so commands only change once the endpoint that serves them is live. It
inherits the job's DEPLOY_ENABLED guard and the GitHub Environment's secrets: DISCORD_TOKEN,
DISCORD_APPLICATION_ID, and DISCORD_GUILD_ID for non-prod. main registers globally; develop
registers to the guild.

Registration is an unconditional bulk overwrite on every deploy — that was a deliberate choice,
not an oversight. Do not add diff-or-skip logic.

Tests, failing first, extending test/contracts/discord.test.js:
1. deploy.yml runs the registration script, and does so after the deploy step. Assert the
   ordering by step index, not merely that both appear — order is the actual promise.
2. The registration step sits inside the DEPLOY_ENABLED-guarded job, so an unconfigured project
   never contacts Discord.
3. The production path registers globally and the non-prod path registers to a guild.
4. Each path references only its own environment's secrets — no cross-wiring.

Documentation in the same change:
- docs/using-this-template.md: the DISCORD_* entries in the section 4 secrets list, per
  environment; that registration happens automatically on deploy; and the daily create-limit
  caveat — new commands count against it, re-registering unchanged commands does not.
- docs/gitflow-and-branching.md: mention command registration in the promotion and rollback
  narrative if the existing text would otherwise be incomplete. Registration is not rolled back
  by redeploying an older Worker, and a reader deserves to know that.

Done when: npm test and npm run lint pass, the ordering test failed first, and a changeset is
recorded. The workflow itself cannot run here — say so, and name what a real project must do to
verify it.
```

---

## Iteration 12 — End-to-end consumer narrative

**Phase 6 · Delivers:** documentation someone can follow start to finish without prior context. **Branch:** `feature/discord-template-docs`

```text
Read docs/discord-template-edits.md, Phase 6, then apply the standing rules in
docs/discord-template-iterations.md.

This is the documentation-only iteration, exempt from tests and lint per the instruction contract
— verify accuracy instead, and say so in your report. Write only what needed the whole path to
exist; everything else was documented in the iteration that built it.

- README.md: a new title and "What you get" describing a Discord bot template. Re-sequence the
  quickstart end to end: create two Discord applications, clone and install, name the Workers,
  run locally, set the Discord and Cloudflare secrets, enable deployment, deploy, set each
  application's Interactions Endpoint URL to the deployed Worker, then register commands. Keep it
  short and task-oriented, and keep the detail in docs/.
- docs/using-this-template.md: the ordering constraint that only becomes visible once everything
  is real — the endpoint URL cannot be set until a Worker is deployed, and registration should
  follow it — plus setting the Interactions Endpoint URL per environment.
- docs/discord-bot.md: the local-development path, exposing `wrangler dev` through a tunnel so
  Discord can reach it. Be precise that a local tunnel is local emulation, not a deployed
  Cloudflare environment — claude.md requires that distinction. Close with a note on where the
  out-of-scope features (Gateway, components and modals, autocomplete, OAuth, storage bindings)
  would attach.
- Cross-reference sweep: every documentation table, internal link, command name, and file path
  mentioned anywhere in the repository resolves. Check the README table, claude.md's document
  table, AGENTS.md, CONTRIBUTING.md, and the -for-users files. Report anything you fixed.

Done when: a reader can follow README.md from nothing to a working bot without reading this plan,
every referenced path and command exists, and no document contradicts another.
```

---

## Iteration 13 — Release classification and readiness

**Phase 6 · Delivers:** a coherent release and a template that is ready to try in a new repository. **Branch:** `feature/discord-template-release`

```text
Read docs/discord-template-edits.md, Phase 6, then apply the standing rules in
docs/discord-template-iterations.md.

Close out the refactor.

1. Run the full validation and report every result: npm test (unit, contracts, coverage
   thresholds), npm run lint, `npx wrangler deploy --dry-run --env non-prod`, `--env production`,
   and `node scripts/register-commands.js --dry-run` with placeholder values.
2. Review the complete diff of this branch series against the starting commit, specifically for:
   pasted keys or account identifiers, non-prod pointing at anything production, application
   logic that drifted into template scaffolding, and unnecessary lockfile churn.
3. Reconcile the per-iteration changesets: run npm run changeset:status, confirm the aggregate
   bump matches the intent, and confirm the migration notes are accurate for someone adopting
   this template.
4. Confirm the instruction contract version set in Iteration 2 still matches what the finished
   work actually requires. If any iteration changed a requirement, correct it now — before
   release, not after.
5. Confirm the repository now satisfies the project shape claude.md requires, closing the window
   Iteration 2 opened deliberately.
6. Delete docs/discord-template-edits.md and docs/discord-template-iterations.md. They are
   working artifacts; the changelog and the consumer documentation carry the history now.

Then tell me plainly whether this template is ready to test with a new repository, and what the
acceptance test is: create a repository from the template, follow README.md without any other
context, and end with a bot responding to /ping, /echo, and /slow in a test guild. List anything
that test would exercise for the first time — the deploy workflow, real Discord endpoint
validation, the production approval gate — since none of it can be verified from this checkout.

Done when: every check above has a reported result, the release classification is coherent, and
you have named what only a real repository can prove.
```

---

## Exit criteria

The sequence is complete when a new repository created from this template can, following only
`README.md`, reach a deployed Worker whose Discord application responds to `/ping`, `/echo`, and `/slow`.

Three things cannot be verified from this checkout and will be exercised for the first time by that test: the deploy workflow running end to end under real credentials, Discord's own validation of a live Interactions Endpoint URL, and the production environment's approval gate. Iteration 13 is expected to name them rather than claim them as passing.
