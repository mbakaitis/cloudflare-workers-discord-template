# Cloudflare Workers Project Instructions

The canonical project guidance is in [claude.md](../claude.md). Apply it to every change in this repository.

This is a Cloudflare Worker. Keep environment boundaries explicit and treat the following as required:

- Support local development plus named non-production/staging and production Wrangler environments. Keep bindings inside the environment they serve, never at the top level.
- Ensure local and non-production cannot silently use production data, bindings, or secrets.
- Use the Cloudflare documentation MCP server configured in `.mcp.json` or `.vscode/mcp.json` for current platform research when available; fall back to official Cloudflare documentation if MCP is unavailable.
- Keep credentials and secret values out of source, `.env` files, `.dev.vars`, and generated artifacts.
- Use mandatory red-green-refactor TDD for behavior changes; maintain unit and regression tests, including deterministic tests for configuration-sensitive behavior.
- Run focused tests first, then lint/format and Wrangler/configuration validation as available. Documentation-only changes that touch Markdown files alone need none of these; verify referenced commands, paths, and links instead and report the skip.
- Keep CI aligned with the documented local checks and protect production deployment.
- Update the README and any relevant docs when behavior or workflow changes.
- Treat MCP results as research only: they do not authorize deployments, account changes, resource creation, or secret access. Keep `.mcp.json` and `.vscode/mcp.json` non-secret and keep local MCP permission settings out of shared project configuration.

Keep instructions and implementation aligned. Report any check that could not be run.
