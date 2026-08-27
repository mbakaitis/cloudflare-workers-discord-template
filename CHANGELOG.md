# Changelog

## 0.1.0

**Template identity reset.** This release renames the package from `cloudflare-workers-template` to `cloudflare-workers-discord-template` (also updating the three Wrangler `name` fields to match) and resets the version from the inherited `0.2.1` lineage to `0.1.0`. The generic template's version numbering doesn't describe this repository's own history as a Discord bot template, so it restarts here rather than continuing as `1.0.0`. This repository forked from [`mbakaitis/cloudflare-workers-template`](https://github.com/mbakaitis/cloudflare-workers-template) at [`v0.2.1`](https://github.com/mbakaitis/cloudflare-workers-template/releases/tag/v0.2.1) (commit `7a33ef1`); every change below happened after that fork point. The instruction contract version (`claude.md`/`AGENTS.md`/`.github/copilot-instructions.md`) was already aligned at `2.1.0` and needed no further bump for this release.

### Major Changes

- a488f2c: Remove the automated upstream-sync mechanism. Both `.github/workflows/upstream-sync.yml` (inherited from the generic `cloudflare-workers-template`) and `.github/workflows/sync-upstream.yml` are deleted, along with the contract test that asserted their shape. This repository no longer tracks `cloudflare-workers-template` on a schedule or via manual dispatch, and no replacement mechanism is provided — keeping dependencies and upstream changes current is left entirely to whoever maintains a given project instance.

  **Migration:** if your fork relied on either workflow to open upstream-sync pull requests, that automation is gone for good, not paused. If you set the `UPSTREAM_REPOSITORY` repository variable for `upstream-sync.yml`, remove it — it is a GitHub setting, not a committed file, so nothing deletes it automatically. To adopt future upstream changes, add this repository as a Git remote and use `git log`, `git diff`, or `git cherry-pick` by hand; see `docs/using-this-template.md`.

### Minor Changes

- 7bf78aa: Implement the template's core Discord bot logic. The Worker's `fetch` handler now serves as a real Discord Interactions Endpoint URL: it verifies every incoming interaction's Ed25519 signature with the native Web Crypto API (`src/discord-signature.js`, zero dependencies, per the Stage 2 decision recorded in `project-approach.md`), responds to Discord's endpoint-verification `PING` with `PONG`, and dispatches `APPLICATION_COMMAND` interactions against a shared command-definitions module (`src/command-definitions.js`) containing one sample `/ping` → `"pong"` command.

  Key decisions, recorded in `project-approach.md` Stage 4:

  - **Non-POST requests are not an error.** Discord only ever POSTs interactions, so any other method (e.g. an uptime check hitting the same URL) gets the `claude.md`-required health/basic response instead of being routed through signature verification.
  - **The shared command-definitions module lives at `src/command-definitions.js`**, obviously separate from the Worker's dispatch logic and from environment/secret configuration, so a downstream project has one place to add, rename, or remove commands. `scripts/register-commands.js` (Stage 5) will import the same module so the Worker and the registration script can never drift out of sync.
  - **Interaction/response type values are named JS constants** (`InteractionType`, `InteractionResponseType`), not a TypeScript enum, consistent with `claude.md`'s no-TypeScript rule.
  - Tests sign fixture requests locally with a throwaway Ed25519 keypair (`test/helpers/discord-fixtures.js`) generated per test via `crypto.subtle` — no real Discord credentials, no network calls, nothing that depends on a local `.dev.vars` file existing in CI.

  **Migration:** no action required for existing forks that haven't customized `src/index.js` — this replaces the placeholder health-check-only handler with the documented Discord bot behavior. A fork that already added its own logic to `src/index.js` should diff against this change before adopting it, per this template's "no blind copying over downstream business logic" rule.

- 30f1e76: Document and scaffold the Discord secrets convention for this template. Adds `.dev.vars.example`, listing all four Discord values a bot instance needs (`DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, `DISCORD_GUILD_ID`) in one gitignored local file, and a new "Configuring Discord secrets" section in `docs/using-this-template.md` covering the per-environment Discord application strategy, local setup, and `wrangler secret put` steps for the deployed Worker's two values.

  Key decisions, recorded in `project-approach.md` Stage 3:

  - **One local file, not a sensitivity-based split.** `DISCORD_PUBLIC_KEY` and `DISCORD_APPLICATION_ID` aren't actually sensitive, which would justify committed `wrangler.jsonc` `vars` instead of a gitignored file. Chosen anyway: every Discord value lives in `.dev.vars`, so there is exactly one place to configure "the Discord stuff." `wrangler dev` reads it automatically; the registration script (a later stage) will read the same file via `node --env-file=.dev.vars`.
  - **Two Discord applications, not one.** One shared by local development and `non-prod`, one dedicated to `production` — mirroring the existing non-prod/production Worker-naming split and the "production resources are never silently reused" rule, applied to bot credentials.
  - **`DISCORD_TOKEN` is the canonical bot-token name** (not `DISCORD_BOT_TOKEN`) and is never a Worker secret — it only ever lives in a developer's local `.dev.vars` or wherever a future stage's CI-driven registration keeps it, never in `wrangler secret put`.
  - `.gitignore`'s `.env`/`.env.*`/`!.env.example` lines are removed since this design has no `.env` file; `.dev.vars`/`.dev.vars.*`/`!.dev.vars.example` covers the single local file.

  **Migration:** no action required for existing forks — this is additive documentation and an example file, not a behavior change. A project already past this stage should copy `.dev.vars.example` to `.dev.vars` and fill in real values before Stage 4/5 land the code that reads them.

- 0e2aec0: Implement `scripts/register-commands.js`, the command-registration story named in Stage 2/3 of `project-approach.md`. It's a standalone, zero-dependency Node.js script — not part of the deployed Worker — that reads `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, and optionally `DISCORD_GUILD_ID` via `node --env-file=.dev.vars`, imports the shared `src/command-definitions.js` module the Worker also dispatches against, and issues a `PUT` bulk-overwrite request to Discord's REST API so a command's name, description, and behavior can never drift out of sync between what's registered and what the Worker handles.

  Adds two npm scripts:

  - `npm run register` — global registration by default, or guild-scoped if `DISCORD_GUILD_ID` is set in `.dev.vars`.
  - `npm run register:guild` — explicit guild-scoped registration for fast iteration; fails clearly if `DISCORD_GUILD_ID` is unset, instead of silently falling back to global.

  The script's URL-selection, payload-building, and guild-resolution logic are exported as pure functions and unit-tested in isolation with a mocked `fetch`, per `claude.md`'s TDD and no-live-network-calls rules — `test/register-commands.test.js` never hits Discord's API.

  `docs/using-this-template.md` gains a "Registering slash commands" section covering when to run it (once per Discord application, and again after any command change) and why guild-scoped registration is the faster development loop (instant vs. up to an hour for global propagation).

  **Migration:** no action required for existing forks that haven't added their own registration mechanism. A fork with its own registration script should diff against this change before adopting it.

- 8d9bb96: Rewrite `claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md` to describe this repository's actual mission — a minimal, testable Discord bot template on Cloudflare Workers — instead of the generic Workers template mission they were forked from.

  The required project shape now names Discord-specific requirements alongside the existing Wrangler/environment ones: Ed25519 signature verification on every incoming interaction, handling for Discord's `PING` and `APPLICATION_COMMAND` interaction types, and a command-registration story kept separate from the deployed `fetch` handler. Everything that was already true — TDD, no TypeScript, environment isolation, secrets discipline, the documentation-role table, and the versioning rules — is unchanged.

  The instruction contract version moves from 2.0.0 to **2.1.0** (minor): this adds new required-shape items but does not rename a file, change a required command, or break an existing documented contract.

  **Migration:** no action required for existing forks. No application code changed in this PR — `src/index.js` still implements the generic template's handler; that lands in a later stage.

## 0.2.1

### Patch Changes

- 7907eec: Remove `.github/rulesets/gitflow-branch-names.json`. GitHub rejects its `branch_name_pattern` rule on Free and Pro accounts (it requires GitHub Team or Enterprise), so the ruleset saved with an empty `rules` array and never enforced anything. `docs/using-this-template.md` step 5 now imports only `gitflow-protected-branches.json`, and branch naming is documented as a reviewed convention rather than a GitHub-enforced rule.

  No migration needed: the removed rule never worked on Free/Pro, so no downstream project loses working enforcement.

- 5edb3da: Remove `.github/rulesets/gitflow-protected-branches.json`, the last committed GitHub Ruleset payload. An imported ruleset can save with fewer rules than it declares depending on plan tier, organization policy, and repository visibility, so a committed JSON file that looks authoritative can silently drift from what GitHub actually enforces.

  `docs/using-this-template.md` step 5 and `docs/gitflow-and-branching.md`'s "Required repository policy" section now document the equivalent settings as a manual checklist to apply through **Settings > Rules > Rulesets** (or classic branch protection), plus how to verify what actually saved with `gh api repos/OWNER/REPOSITORY/rulesets`. A new contract test in `test/contracts/workflow.test.js` asserts the CI job the docs point at as the required status check is still literally named `test`.

  No migration needed: the ruleset file was never applied automatically, so downstream projects that already configured branch protection (by importing it or by hand) keep their existing GitHub-side settings. Projects that never got around to importing it should follow the new manual checklist.

## 0.2.0

### Minor Changes

- c274786: Rewrite the documentation for the people who consume this template, make it a real GitHub template repository, and drop the TypeScript type generation that a JavaScript project does not need.

  Documentation:

  - The repository now has GitHub's template flag enabled, so **Use this template** works and "template" is accurate terminology.
  - `README.md` is now a short consumer quickstart: what you get, seven numbered start-up steps, a command table, an "AI is already wired in" section, and a documentation map.
  - Added `CONTRIBUTING.md` for people improving the template itself, including the required checks, the documentation-only exemption, and the rule that the three instruction files and their contract version stay in sync.
  - Renamed `docs/project-setup.md` to `docs/using-this-template.md` and added a "Choosing how to start" section covering **Use this template** vs. **fork** vs. **clone**. This documents a real constraint: a template-generated repository shares no commit history with upstream, so `upstream-sync.yml` cannot merge into it and upstream adoption is manual; forks retain history and can use the workflow.
  - Split `docs/gitflow.md` into `docs/gitflow-and-branching.md` (branches, promotion, rollback) and `docs/versioning-and-changesets.md` (recording changesets, the release pull request, cutting versions and tags).
  - Added `docs/using-ai.md` covering the instruction files, the MCP servers, the contract tests and human gates that make AI assistance safe here, and how to adapt the instruction files for a downstream project.

  Configuration:

  - Removed the documented `npm run types` step and the requirement to generate TypeScript binding types. This project is JavaScript with JSDoc: without a `tsconfig.json` nothing was type-checked, the generated file is gitignored so it never existed on a fresh clone, and test-driven development covers the risk. `src/index.js` no longer annotates a handler with a type that could not resolve. A project that wants editor autocomplete for its own bindings can still run `npx wrangler types` on demand.
  - Pinned one supported Node.js version. `.nvmrc` is the source of truth for nvm and similar version managers, `engines.node` declares `>=22`, and all four workflows now read `node-version-file: .nvmrc` instead of hardcoding a version. A contract test keeps them in agreement.
  - Strengthened the MCP contract test to require both servers, identical URLs, and no extra keys in both `.mcp.json` and `.vscode/mcp.json`, so neither file can drift or gain a credential unnoticed.
  - Raised the instruction contract to 1.2.0: documentation-only Markdown changes are exempt from tests, lint, and Wrangler validation; the document set and its audiences are specified; generated binding types are explicitly not part of the project shape; the Node.js version must be declared once; and the template-versus-fork distinction is a documented requirement.

  Projects already created from this template need no migration. The `types` script never shipped, so nothing that worked before stops working. If your own documentation referenced `npm run types` or the old documentation filenames, update those references.

### Patch Changes

- 132d0e6: Add a review-only workflow for proposing upstream template changes to forks after downstream lint and test checks pass.

## 0.1.1

### Patch Changes

- 86683c3: Operationalize Changesets-based Semantic Versioning releases.

## Unreleased

- Add a scheduled and manually triggered upstream sync workflow that proposes reviewed fork updates and runs downstream checks before adoption.
- Operationalize SemVer releases with Changesets configuration, scripts, contract coverage, and a `main`-branch release workflow that creates version tags for the private template.
- Enable Cloudflare Workers best practices: add observability logging to Wrangler configuration for automatic telemetry capture.
- Add `npm run types` script to generate TypeScript types for Worker bindings and runtime APIs using `wrangler types`.
- Document type generation and observability configuration in project development workflow.
- Add contract tests to enforce environment isolation: verify separate Worker names, prevent production bindings at top level, and catch accidental environment misconfiguration.
- Update `project-setup.md` with environment isolation enforcement documentation, including contract test overview and manual configuration steps for adding environment-specific bindings (D1, R2, KV, etc.).
- Update the `test:contracts` npm script to run all contract tests in `test/contracts/` instead of a single file.
- Add ESLint configuration, lint scripts, and CI/deployment quality gates for JavaScript source and tests.
- Add the hosted GitHub MCP server to the shared MCP configuration so authenticated tools can inspect repository issues and data.
- Make GitHub deployment opt-in with the `DEPLOY_ENABLED` repository variable so the template does not deploy to Cloudflare.
- Document manual feature, release, and hotfix branch creation plus GitHub issue-closing commit references.
- Configure the GitHub Issues extension to generate Gitflow-prefixed issue branches from sanitized issue types and titles.
- Add documented Gitflow branches for local feature work, non-production deployment, and production deployment.
- Add named Wrangler environments and GitHub Actions CI/deployment workflows.
- Add API-ready GitHub ruleset payloads for branch naming and protected branches.
- Separate ongoing Gitflow guidance from one-time fork setup instructions.
- Run CI tests on pull requests only; deployment tests remain as the pre-deployment gate for `develop` and `main`.
