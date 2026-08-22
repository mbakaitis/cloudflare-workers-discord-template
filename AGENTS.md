# Agent Instructions

**Instruction contract version:** 1.3.0

Use [claude.md](claude.md) as the canonical maintenance guide for this Cloudflare Workers template.

Before editing, read the relevant section of `claude.md`. In particular:

- Preserve explicit local, staging/non-production, and production Wrangler environments.
- Keep local development independent from production resources and secrets.
- Use the Cloudflare documentation MCP server configured in `.mcp.json` or `.vscode/mcp.json` for current platform research when it is available; do not treat MCP access as deployment or account authorization.
- Use mandatory red-green-refactor TDD for behavior changes, add regression tests, and run focused tests before broader checks. Keep implementation and tooling in JavaScript with mandatory JSDoc for exported functions, Worker handlers, configuration contracts, and non-obvious behavior; do not add TypeScript.
- Update documentation, migration notes, and `CHANGELOG.md` when behavior or workflows change. Keep the document roles distinct: `README.md` is a short consumer quickstart, `docs/using-this-template.md` covers project setup, `docs/gitflow-and-branching.md` covers branching and promotion, `docs/versioning-and-changesets.md` covers releases, `docs/using-ai.md` covers AI tooling and its guardrails, and `CONTRIBUTING.md` is the only contributor-facing guide. State a fact once and link to it.
- This is a real GitHub template repository, so "template" is accurate. Keep the two consumption paths distinct: **Use this template** produces no shared history, so `upstream-sync.yml` cannot merge into it and adoption is manual; a **fork** retains history and can use the workflow. Never promise automatic flow-down for the template path.
- Skip tests, lint, and Wrangler/configuration validation for documentation-only changes that touch Markdown files alone. Verify referenced commands, paths, and links instead, and report that validation was skipped as documentation-only.
- Classify changes with Semantic Versioning and keep `package.json`, changelog, tags, and release notes consistent.
- Treat the instruction contract version separately from the package version: patch clarifications, minor compatible requirements, and major changes that require forks to revise workflows. Keep its value aligned with `claude.md` and `.github/copilot-instructions.md`.
- Treat forks as downstream projects requiring reviewed migrations; never overwrite application-specific code blindly.
- Never commit credentials, secret values, `.dev.vars`, populated `.env` files, or generated deployment state.
- Keep `.claude/settings.local.json` local and permission-scoped; do not broaden MCP permissions or add secrets to shared configuration.
- VS Code may require MCP discovery to be enabled with `chat.mcp.discovery.enabled` when relying on other clients' configuration; the repository's `.vscode/mcp.json` is the preferred VS Code configuration.
- GitHub Rulesets' metadata-restriction rules (e.g. `branch_name_pattern`) require GitHub Team or Enterprise and are rejected on Free/Pro regardless of repository visibility; this template enforces branch naming by review, not by ruleset.
- Do not commit a GitHub Ruleset or branch-protection JSON payload as an applied artifact — imported payloads can save with fewer rules than declared depending on plan and org policy. Document exact settings for maintainers to configure by hand in `docs/using-this-template.md`, and keep contract tests limited to what a checkout can observe (e.g. the CI job named `test` still exists), never live GitHub settings.

When the repository gains implementation files, follow its documented package scripts and report validation commands and any unavailable checks.
