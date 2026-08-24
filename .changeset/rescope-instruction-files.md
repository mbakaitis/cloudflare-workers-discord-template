---
"cloudflare-workers-template": minor
---

Rewrite `claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md` to describe this repository's actual mission — a minimal, testable Discord bot template on Cloudflare Workers — instead of the generic Workers template mission they were forked from.

The required project shape now names Discord-specific requirements alongside the existing Wrangler/environment ones: Ed25519 signature verification on every incoming interaction, handling for Discord's `PING` and `APPLICATION_COMMAND` interaction types, and a command-registration story kept separate from the deployed `fetch` handler. Everything that was already true — TDD, no TypeScript, environment isolation, secrets discipline, the documentation-role table, and the versioning rules — is unchanged.

The instruction contract version moves from 2.0.0 to **2.1.0** (minor): this adds new required-shape items but does not rename a file, change a required command, or break an existing documented contract.

**Migration:** no action required for existing forks. No application code changed in this PR — `src/index.js` still implements the generic template's handler; that lands in a later stage.
