# Agent Instructions

Use [claude.md](claude.md) as the canonical guide for this project.

Before editing, read the relevant section of `claude.md`. In particular:

- Preserve explicit local, non-production/staging, and production Wrangler environments, and keep bindings inside the environment they serve — never at the top level.
- Keep local development independent from production resources and secrets.
- Use the Cloudflare documentation MCP server configured in `.mcp.json` or `.vscode/mcp.json` for current platform research when it is available; do not treat MCP access as deployment or account authorization.
- Use mandatory red-green-refactor TDD for behavior changes, add regression tests, and run focused tests before broader checks.
- Skip tests, lint, and Wrangler/configuration validation for documentation-only changes that touch Markdown files alone. Verify referenced commands, paths, and links instead, and report that validation was skipped as documentation-only.
- Never commit credentials, secret values, `.dev.vars`, populated `.env` files, or generated deployment state.
- Keep `.claude/settings.local.json` local and permission-scoped; do not broaden MCP permissions or add secrets to shared configuration.
- VS Code may require MCP discovery to be enabled with `chat.mcp.discovery.enabled` when relying on other clients' configuration; the repository's `.vscode/mcp.json` is the preferred VS Code configuration.

Follow this project's documented package scripts and report validation commands and any checks that could not run.
