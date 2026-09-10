# Changelog

## 1.0.0

### Major Changes

- ae9f2be: Remove **Fork** as a documented starting path and delete the automated upstream-sync workflow it depended on. The plan to keep forks in sync automatically was scrapped after further analysis showed it wasn't a good approach, so the "fork gets automation, template doesn't" distinction no longer holds.

  - `.github/workflows/upstream-sync.yml` and its contract test assertion are removed.
  - `docs/using-this-template.md` now presents two starting paths — **Use this template** and **Clone only** — and sharpens the trade-off between them: the template path gives a clean, single-commit history, while cloning keeps this repository's full history but no repository of your own until you repoint the remote.
  - "Keeping up with upstream changes" is now a single manual process (`git remote add upstream` + `git cherry-pick` or `git diff`) that applies regardless of which path you started from.
  - The instruction contract (`claude.md`, `AGENTS.md`, `.github/copilot-instructions.md`) is raised to 2.0.0: it no longer requires documenting a fork path, and it now says not to document forking this repository as a supported starting path.

  Migration: if your project forked this repository to use `upstream-sync.yml`, that workflow is gone upstream — remove your own copy (and its contract test assertion, if you copied `test/contracts/workflow.test.js` too) and switch to the manual `git cherry-pick`/`git diff` process documented in `docs/using-this-template.md`. Projects that started with **Use this template** or a plain clone need no changes; they never had the automated workflow.

### Minor Changes

- 86aa2f9: Add a second, downstream-facing set of AI instruction files — `claude-for-users.md`, `AGENTS-for-users.md`, and `.github/copilot-instructions-for-users.md` — alongside the existing maintainer files. The maintainer files (`claude.md`, `AGENTS.md`, `.github/copilot-instructions.md`) describe keeping this boilerplate current for many future projects; that stops applying the moment someone builds an application from it, and asking them to hand-edit a maintainer file down to size left a document that was neither the template's guidance nor a coherent application guide.

  - `docs/using-this-template.md` step 1 now instructs new projects to `mv` the `-for-users` files over the maintainer files (or delete all six, if not using AI tooling).
  - `docs/using-ai.md`'s "The instruction files" section explains both sets and why neither is a subset of the other; `CONTRIBUTING.md` documents keeping the two sets aligned going forward.
  - The `-for-users` files carry no instruction contract version — a single application has no upstream file to stay in sync with, so the dual-version scheme this template uses for its own maintenance doesn't apply once they're renamed into place.
  - The instruction contract is raised to 2.1.0: it documents the new files as a template-owned extension point without invalidating any existing requirement.

  No migration needed for existing downstream projects: they already have their own instruction files (edited in place under the previous guidance) and are unaffected. This only changes the starting point for new projects created from the template going forward.

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
