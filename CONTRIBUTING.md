# Contributing

Thanks for helping improve this template. This guide is for changing **the template itself**. If you are building an application from it, read [Using this template](docs/using-this-template.md) instead.

## What this repository is

This is upstream boilerplate that other projects start from. A change here can reach every project generated from it, so the bar is different from a normal application repository:

- Keep the base Worker small. Application-specific logic belongs in projects, not here.
- Every addition needs a documented purpose, a local-development story, a test strategy, and a removal path.
- Changes must be adoptable deliberately. Downstream projects review upstream diffs; they never blind-copy them.

The full maintenance contract is [claude.md](claude.md). This document is the practical workflow.

## Prerequisites

- Node.js 22. `.nvmrc` is the source of truth, so `nvm use` picks the right version; `engines.node` in `package.json` and every workflow read from it, and a contract test keeps the three in agreement.
- npm
- A GitHub account with access to this repository

No Cloudflare account is required to contribute. The whole test suite runs locally.

```sh
git clone https://github.com/mbakaitis/workers.git
cd workers
npm install
npm test
```

## Branching

Create a short-lived branch and open a pull request. Branch names must be `feature/<name>`, `release/<name>`, or `hotfix/<name>`, using lowercase letters, numbers, dots, underscores, or hyphens after the prefix. Include the issue number when the work comes from an issue:

```sh
git switch main
git pull --ff-only
git switch -c feature/12-clarify-binding-docs
```

> **Note:** This template repository itself has no `develop` branch and deploys nothing, so contributions branch from `main` and target `main`. The `develop` → `main` promotion flow described in [Gitflow and branching](docs/gitflow-and-branching.md) is what *generated projects* use, and the deployment workflow implements it for them.

Reference issues in commit messages with a closing keyword so GitHub links and closes them on merge:

```sh
git commit -m "Clarify binding placement rules; fixes #12"
```

## The change loop

1. **Read first.** Check the relevant section of [claude.md](claude.md) and the current Cloudflare or Wrangler documentation. Do not rely on stale examples.
2. **Write a failing test.** Behavior changes follow red-green-refactor. Bug fixes get a regression test that fails before the fix.
3. **Make the smallest change** consistent with the existing patterns.
4. **Run the checks.**

   ```sh
   npm test        # unit tests plus configuration contract tests
   npm run lint
   ```

5. **Update the docs in the same change.** If you change a command, a file layout, or a workflow, update the README and the affected guide together with the code.
6. **Add a changeset** unless the change is exempt (below).
7. **Report what you ran** in the pull request, including any check you could not run and why.

### Documentation-only changes

A change that touches only Markdown files — no source, test, configuration, script, lockfile, or workflow file — does not require tests, lint, or Wrangler validation. Verify instead that the commands, paths, and links you mention actually exist, and say in the pull request that validation was skipped as documentation-only. A changeset is optional for these.

This exemption disappears the moment the same change also touches code or configuration.

## Testing expectations

`npm test` runs two suites, and both matter:

- **Unit tests** (`test/index.test.js`, Vitest via `@cloudflare/vitest-pool-workers`) exercise the Worker in the real Workers runtime through Miniflare. Cover success, malformed input, and expected error responses.
- **Contract tests** (`test/contracts/`, Node's built-in test runner) protect the promises of the boilerplate — that non-production and production Workers stay distinct, that production bindings never sit at the top level, that deployment stays opt-in, and that the release workflow keeps its shape.

Keep tests deterministic: no live Cloudflare calls, no shared mutable state, no wall-clock dependence, no undeclared credentials.

If a contract test fails, that is usually the point. When a change *intentionally* breaks a promise, update the test, the documentation, and the migration notes in the same pull request, and classify the release accordingly.

## Changesets

Record the downstream impact of anything that changes the template contract:

```sh
npm run changeset
npm run changeset:status
```

Choose `patch` for compatible fixes, docs, tests, and dependency bumps; `minor` for compatible capabilities or new extension points; `major` for breaking changes to scripts, file layout, runtime assumptions, environments, bindings, or migration requirements. Commit the generated `.changeset/*.md` file with the pull request. See [Versioning and changesets](docs/versioning-and-changesets.md) for how a changeset becomes a version and a tag.

## Keeping the instruction files in sync

Three files carry maintenance guidance for AI assistants and must agree:

| File | Role |
| --- | --- |
| [claude.md](claude.md) | Canonical maintenance guide |
| [AGENTS.md](AGENTS.md) | Entry point for tools that read `AGENTS.md` |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Entry point for GitHub Copilot |

If you change a requirement in one, update the other two in the same pull request, and update the **instruction contract version** in all three headers. That version is separate from the `package.json` version:

- **Patch** — clarify wording, fix a typo, add an example.
- **Minor** — add a compatible requirement that does not invalidate the existing project structure.
- **Major** — change a requirement so that maintainers or downstream projects must revise their workflow.

## Pull request expectations

- CI passes.
- At least one approving review, with review threads resolved.
- The diff contains no secrets, no cross-wired environments, and no unrelated lockfile or configuration churn.
- Documentation, changelog impact, and release classification agree with the code.
- The description says what changed, whether downstream projects need to act, and how to roll back.

## Please do not

- Commit secrets, `.dev.vars`, populated `.env` files, private Cloudflare account identifiers, or generated deployment state.
- Point local or non-production configuration at production data stores, queues, buckets, or services.
- Add TypeScript as a project requirement. The implementation stays JavaScript with JSDoc on exported functions, Worker handlers, configuration contracts, and non-obvious behavior.
- Add a dependency, binding, service, or deployment target because it might be useful later.
- Broaden MCP permissions or add credentials to shared configuration to make a task convenient. Keep `.claude/settings.local.json` local and permission-scoped.
- Enable `DEPLOY_ENABLED` on this template repository. It stays unset here by design.

## Where things live

| Path | Contents |
| --- | --- |
| `src/` | Worker source; `src/index.js` is the entry point |
| `test/` | Unit tests |
| `test/contracts/` | Contract tests protecting the template's promises |
| `docs/` | User-facing guides |
| `.github/workflows/` | CI, deployment, release, and upstream sync |
| `.changeset/` | Pending release notes |
| `wrangler.jsonc` | Worker names, compatibility date, environments, bindings |
