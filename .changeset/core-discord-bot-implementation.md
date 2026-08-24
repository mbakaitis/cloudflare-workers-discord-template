---
"cloudflare-workers-template": minor
---

Implement the template's core Discord bot logic. The Worker's `fetch` handler now serves as a real Discord Interactions Endpoint URL: it verifies every incoming interaction's Ed25519 signature with the native Web Crypto API (`src/discord-signature.js`, zero dependencies, per the Stage 2 decision recorded in `project-approach.md`), responds to Discord's endpoint-verification `PING` with `PONG`, and dispatches `APPLICATION_COMMAND` interactions against a shared command-definitions module (`src/command-definitions.js`) containing one sample `/ping` → `"pong"` command.

Key decisions, recorded in `project-approach.md` Stage 4:

- **Non-POST requests are not an error.** Discord only ever POSTs interactions, so any other method (e.g. an uptime check hitting the same URL) gets the `claude.md`-required health/basic response instead of being routed through signature verification.
- **The shared command-definitions module lives at `src/command-definitions.js`**, obviously separate from the Worker's dispatch logic and from environment/secret configuration, so a downstream project has one place to add, rename, or remove commands. `scripts/register-commands.js` (Stage 5) will import the same module so the Worker and the registration script can never drift out of sync.
- **Interaction/response type values are named JS constants** (`InteractionType`, `InteractionResponseType`), not a TypeScript enum, consistent with `claude.md`'s no-TypeScript rule.
- Tests sign fixture requests locally with a throwaway Ed25519 keypair (`test/helpers/discord-fixtures.js`) generated per test via `crypto.subtle` — no real Discord credentials, no network calls, nothing that depends on a local `.dev.vars` file existing in CI.

**Migration:** no action required for existing forks that haven't customized `src/index.js` — this replaces the placeholder health-check-only handler with the documented Discord bot behavior. A fork that already added its own logic to `src/index.js` should diff against this change before adopting it, per this template's "no blind copying over downstream business logic" rule.
