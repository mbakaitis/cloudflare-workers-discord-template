# Cloudflare Workers Template Maintainer Guide

**Instruction contract version:** 1.3.0

This repository is the versioned boilerplate for Cloudflare Workers. It must remain useful when copied or forked into a new Worker project and must make future Cloudflare, Wrangler, and platform changes deliberate, testable, and documented.

## Mission and scope

- Keep the smallest practical base Worker that developers can install with Wrangler and extend.
- Treat this repository as a product: preserve a clear upgrade path, stable defaults, and a changelog.
- Prefer Cloudflare's current official documentation and supported Wrangler behavior over assumptions or stale examples.
- Keep template concerns separate from application-specific business logic. A template change should be easy to identify and safely adopt.

## Source of truth and instructions

- This file is the canonical maintenance guide. `AGENTS.md` and `.github/copilot-instructions.md` are entry points for tools that use those filenames; keep them aligned with this file.
- Keep the instruction contract version in this file and its adapter files aligned. Use Semantic Versioning: patch for clarifications, minor for compatible requirements, and major for breaking instruction changes.
- Before changing platform configuration, consult current Cloudflare documentation for Workers, Wrangler, environments, compatibility dates, bindings, secrets, deployments, and testing. When available, use the configured Cloudflare documentation MCP server in `.mcp.json` or `.vscode/mcp.json` for this lookup.
- Treat MCP results as documentation research, not as authorization to change accounts, deploy code, create resources, or handle secrets. Verify important platform claims against the current official documentation and record the relevant documentation link or decision in repository docs when it affects the template contract.
- Keep `.mcp.json` and `.vscode/mcp.json` limited to non-secret server configuration. `.mcp.json` uses the Claude-compatible `mcpServers` schema; `.vscode/mcp.json` uses VS Code's `servers` schema. Keep `.claude/settings.local.json` local and permission-scoped; never add credentials or broaden MCP permissions merely to make a task convenient.
- Record important decisions and breaking changes in repository documentation. Do not rely on an issue, chat message, or implicit knowledge.
- Keep instructions actionable: name the command, file, invariant, or acceptance check whenever possible.
- GitHub Rulesets' metadata-restriction rule types (`branch_name_pattern`, `tag_name_pattern`, `commit_message_pattern`, and the author/committer email pattern rules) require GitHub Team or Enterprise and are rejected on Free/Pro regardless of repository visibility. This template does not rely on them; branch naming is enforced by review only.
- More broadly, do not commit a GitHub Ruleset or branch-protection JSON payload as if it were an applied artifact. An imported payload can save with fewer rules than it declares depending on plan tier, organization policy, and repository visibility, so a file in this repository can silently stop matching what GitHub actually enforces. Document the exact settings a maintainer configures by hand (see `docs/using-this-template.md`), and let contract tests verify only what a checkout can observe — for example, that the CI job a required status check depends on still exists and is still named `test` — never live GitHub settings.

## Required project shape

The implementation should normally include, or document why it does not include:

- A minimal Worker entry point with an explicit `fetch` handler and a small health/basic response.
- JavaScript source using ES modules with mandatory JSDoc. Document exported functions, Worker handlers, configuration contracts, and non-obvious behavior so developers and AI tools can understand the code without reconstructing intent. Do not introduce TypeScript as a project requirement.
- Wrangler configuration in the current supported format, with an explicit `compatibility_date` and Cloudflare best practices enabled:
  - **Observability enabled**: The `observability.enabled` setting captures logs and telemetry for monitoring and debugging.
  - **No generated TypeScript binding types**: This is a JavaScript project, so it does not carry a `types` script or commit generated binding types. Document bindings with JSDoc instead. A downstream project may run `npx wrangler types` on demand for editor autocomplete, but the template must not require it, document it as a workflow step, or depend on the generated file.
  - **Node.js compatibility**: For compatibility dates `2026-08-04` or later, Node.js APIs are enabled by default and no explicit flag is required.
  - Do not commit generated credentials, API tokens, or real secrets.
- Separate `local`, `staging` (non-production Cloudflare), and `production` workflows. Use Wrangler named environments and environment-specific configuration rather than ad hoc flags.
- Explicit rules for which bindings, routes, variables, and resources exist in each environment. Production resources must never be silently reused by local or staging work.
- A local-development path that works without access to production resources. Use local emulation, fixtures, or explicit local bindings where appropriate.
- A single declared Node.js version. `.nvmrc` is the source of truth; `engines.node` in `package.json` and every workflow's `node-version-file` must agree with it, and a contract test enforces that. Do not hardcode a Node version in a workflow.
- A mandatory test setup that runs quickly in CI and locally, with unit tests for the Worker handler and meaningful tests for environment-sensitive behavior.
- Documentation covering setup, development, testing, deployment, secrets, environments, and upgrades.

Do not add a service, binding, dependency, or deployment target merely because it may be useful later. Every addition needs a documented purpose, ownership, local-development story, test strategy, and rollback or removal path.

## Environment and deployment rules

Use the repository's package scripts as the stable interface for contributors. A typical contract is:

- `npm run dev`: run the Worker locally with Wrangler.
- `npm run lint`: run JavaScript lint checks.
- `npm test`: run the unit test suite.
- `npm run deploy:staging`: deploy only the named non-production environment.
- `npm run deploy:production`: deploy only production, with an explicit confirmation or CI protection where practical.

The exact scripts may change, but their intent must remain documented. Before merging deployment changes:

1. Confirm the target environment and account/project identifiers are explicit.
2. Confirm local and staging cannot point at production data stores, queues, buckets, or services by default.
3. Confirm secrets are supplied through Cloudflare's secret mechanisms or CI secret storage, never committed to source or `.env` files.
4. Confirm the compatibility date and any compatibility flags are intentional and documented.
5. Confirm a rollback or previous-version procedure exists.

For CI/CD, prefer immutable, reviewable deployments from the protected default branch. Pin or constrain action and tool versions where practical, and keep Wrangler's version aligned with the supported Cloudflare workflow. Avoid deploying from a developer laptop as the only production path.

## Testing and TDD

- Follow red-green-refactor TDD for every behavior change: write a failing test, implement the smallest change, then refactor.
- Treat solid unit and regression tests as mandatory for long-term template stability; do not merge behavior changes without focused coverage.
- Keep pure logic easy to test without a network, Cloudflare account, or deployed Worker.
- Test the Worker handler through the runtime-compatible test utilities used by the project, including success, malformed input, expected error responses, and relevant binding behavior.
- Add a regression test for every bug fixed in the template.
- Test configuration and scripts enough to catch accidental environment drift, especially staging/production target mix-ups.
- Keep tests deterministic: no live production calls, shared mutable state, wall-clock dependence, or undeclared credentials.
- Run the narrowest relevant test first, then the full required checks before merging.

At minimum, changes should pass unit tests, JavaScript linting, formatting if configured, and a Wrangler/configuration validation step. CI should run the same checks developers are instructed to run locally.

### Documentation-only changes

A change that touches only Markdown files, and no source, test, configuration, script, lockfile, or workflow file, does not require unit tests, linting, formatting, or Wrangler/configuration validation. Review it instead for accuracy: confirm that referenced commands, scripts, file paths, and internal links still exist and match the repository, and that the guidance does not contradict the instruction files. Say in the change report that validation was skipped because the change is documentation-only.

This exemption does not apply when the same change also edits code or configuration, and it does not remove the requirement to keep documentation, changelog, and migration notes consistent.

## Forks and downstream alignment

This repository is an upstream template, not a remote package that can safely overwrite application code. Design changes so a fork can compare and adopt them deliberately:

- Keep template-owned files and extension points obvious.
- Avoid edits that require blind copying over downstream business logic.
- Mark intentional downstream customizations in documentation or configuration, not by silently diverging.
- Document migration steps for renamed files, changed scripts, Wrangler schema changes, runtime changes, and removed defaults.
- Include a template version in the repository or generated project metadata when practical. A downstream project should be able to identify the upstream version it started from.
- Use a repeatable sync/rebase process and review the diff before applying upstream changes.
- Add contract tests that protect the promises of the boilerplate. When an upstream change intentionally changes a promise, update the tests and migration notes together.

Do not promise automatic flow-down unless an actual synchronization mechanism exists. Forks need human review because application code, bindings, security policy, and deployment topology are project-specific.

## Documentation requirements

Update documentation in the same change when behavior or workflow changes. Documentation is written for the people who consume the template; `CONTRIBUTING.md` and this file are the only maintainer-facing documents. The current document set is:

| File | Audience and role |
| --- | --- |
| `README.md` | Consumers: what the template is, quickstart, prerequisites, commands, and links onward. Keep it short and task-oriented; move detail into `docs/`. |
| `docs/using-this-template.md` | Consumers: one-time project setup — how to start (GitHub template vs. fork vs. clone), Worker naming, environment isolation, bindings, secrets, repository rules, upstream adoption. |
| `docs/gitflow-and-branching.md` | Consumers: branches, pull requests, promotion, deployment gating, and rollback. |
| `docs/versioning-and-changesets.md` | Consumers: recording changesets, the release pull request, cutting versions and tags. |
| `docs/using-ai.md` | Consumers: how AI tooling is wired in — instruction files, MCP servers, the contract-test and human-gate guardrails, and how to adapt the instruction files downstream. |
| `CONTRIBUTING.md` | Contributors to this template: prerequisites, TDD loop, required checks, changesets, instruction-file sync, pull request expectations. |
| `CHANGELOG.md` | User-visible changes, migration notes, and release references where available. |

Keep these roles distinct rather than duplicating content: state a fact in one document and link to it from the others. When renaming, splitting, or adding a document, update every cross-reference, including the README documentation table and the instruction files.

This repository is a real GitHub template repository, so "template" is accurate terminology. Documentation must distinguish the two consumption paths, because they are not equivalent: a repository created with **Use this template** shares no commit history with upstream, so `.github/workflows/upstream-sync.yml` cannot merge into it and upstream adoption is manual; a **fork** retains history and an upstream link, so the sync workflow works. Do not describe automatic flow-down for the template path.

Documentation must also distinguish local emulation from deployed Cloudflare behavior. Do not call a local test equivalent to an integration test unless it actually exercises the relevant Cloudflare service.

## Versioning and release discipline

Use Semantic Versioning for the template package and any published artifacts:

- **Patch**: backward-compatible fixes, docs, test improvements, and dependency updates that do not alter the supported template contract.
- **Minor**: backward-compatible features, new optional capabilities, or new extension points.
- **Major**: breaking changes to scripts, file layout, runtime assumptions, Wrangler configuration, environments, bindings, or migration requirements.

The instruction contract version describes the requirements agents and downstream maintainers are expected to follow. It is separate from the software/template version in `package.json`:

- **Patch**: clarify wording, fix a typo, or add examples without changing the required workflow.
- **Minor**: add a compatible requirement or capability that does not invalidate the existing project structure.
- **Major**: change a requirement in a way that requires forks or maintainers to revise their workflow, such as changing the project language, renaming required files, changing required commands, or altering deployment and environment contracts.

Keep the instruction contract version aligned across `claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md`. Every release or instruction-contract change should state whether downstream forks need action and include migration guidance when required.

Keep `package.json` version, `CHANGELOG.md`, tags, and release notes consistent. Do not edit the version casually in feature commits if releases are automated; follow the repository's chosen release tool once established. Use conventional commit messages only if the repository adopts them and documents the required format. Dependencies must be reviewed for runtime, license, security, and Wrangler compatibility impact.

Every release should state:

- what changed;
- whether downstream forks need action;
- the migration or rollback procedure;
- the supported Node.js, Wrangler, and runtime versions;
- the validation performed.

## Change workflow

1. Read the relevant Cloudflare documentation and current local docs.
2. State the behavior or contract being changed and add or update a focused test.
3. Implement the smallest change consistent with existing patterns.
4. Run focused tests, then JavaScript lint/format and configuration validation. Skip these for documentation-only Markdown changes and verify the documentation's accuracy instead.
5. Review the generated diff for secrets, environment cross-wiring, accidental application-specific code, and unnecessary lockfile or config churn.
6. Update README/guides, changelog, migration notes, and version metadata as required.
7. Report commands run and any checks that could not run.

Never commit secrets, `.dev.vars`, `.env*` files containing values, Cloudflare account identifiers that are intended to remain private, generated deployment state, or local caches. Keep ignore rules current.

## Definition of done

A template change is complete only when the code, tests, configuration, documentation, downstream impact, and release classification agree. A reviewer should be able to clone or fork the repository, follow the documented commands, run tests locally without production access, identify each environment, and understand exactly how to adopt the change.
