# Cloudflare Workers Project Guide

This file guides AI coding tools working in this repository. It started as `claude-for-users.md` in the `cloudflare-workers-template` starter kit and was renamed to `claude.md` when this project was set up — see [Using This Template](docs/using-this-template.md) if that step hasn't happened yet.

Unlike the template it came from, this file describes *your application*, not a boilerplate meant for many future projects. There is no instruction-contract version to track and no upstream file to stay in sync with — edit it freely as your project's needs change.

## Project shape

- JavaScript source using ES modules, with JSDoc on exported functions, Worker handlers, and configuration contracts. The template defaulted to plain JavaScript over TypeScript; keep that or change it based on what this project needs, not what the template chose.
- Wrangler configuration in the current supported format, with an explicit `compatibility_date` and `observability.enabled: true` so logs and telemetry are captured.
- For compatibility dates `2026-08-04` or later, Node.js APIs are enabled by default; no explicit compatibility flag is required.
- A single declared Node.js version. Keep `.nvmrc`, `engines.node` in `package.json`, and any CI workflow's `node-version-file` pointed at the same value.

## Environments

- Keep local, non-production (staging), and production Wrangler environments separate. A binding lives inside the environment it serves — never at the top level of `wrangler.jsonc`.
- Local and non-production must never point at production data stores, queues, buckets, or other stateful resources by default.
- Supply secrets through Cloudflare's secret mechanisms or CI secret storage only. Never commit them to source, `.env` files, or `.dev.vars`.
- Keep deployment behind an explicit opt-in and require review before anything reaches production.

## Testing and TDD

- Follow red-green-refactor TDD for every behavior change: write a failing test, implement the smallest change that passes it, then refactor.
- Keep pure logic testable without a network connection, a Cloudflare account, or a deployed Worker.
- Add a regression test for every bug you fix.
- Keep tests deterministic: no live production calls, shared mutable state, wall-clock dependence, or undeclared credentials.
- Run the narrowest relevant test first, then the full required checks before merging.
- A change that touches only Markdown files doesn't need tests, lint, or configuration validation — verify instead that the commands, paths, and links it references still exist and match the repository.

## Platform research

- Before changing Wrangler configuration, compatibility dates, or bindings, check current Cloudflare documentation rather than relying on training data — the platform moves quickly enough that remembered behavior is often stale. Use the Cloudflare Docs MCP server in `.mcp.json` / `.vscode/mcp.json` if it's configured.
- Treat MCP results as research, not authorization. Reading documentation does not grant permission to deploy, change a Cloudflare account, create resources, or handle secrets.

## Change workflow

1. State the behavior being changed and add or update a focused test for it.
2. Implement the smallest change consistent with existing patterns.
3. Run focused tests, then lint/format and Wrangler configuration validation.
4. Review the diff for secrets, cross-wired environments, and unnecessary lockfile or config churn.
5. Update the README and any relevant docs when behavior or workflow changes.
6. Report the commands run and any checks that could not run.

## Secrets and permissions

- Never commit credentials, `.dev.vars`, a populated `.env` file, or generated deployment state.
- Keep `.claude/settings.local.json` (or your tool's equivalent) local and permission-scoped. Don't broaden tool permissions or add secrets to shared configuration just to make a task more convenient.
