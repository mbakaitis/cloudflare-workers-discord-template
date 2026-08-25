---
"cloudflare-workers-template": minor
---

Implement `scripts/register-commands.js`, the command-registration story named in Stage 2/3 of `project-approach.md`. It's a standalone, zero-dependency Node.js script — not part of the deployed Worker — that reads `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, and optionally `DISCORD_GUILD_ID` via `node --env-file=.dev.vars`, imports the shared `src/command-definitions.js` module the Worker also dispatches against, and issues a `PUT` bulk-overwrite request to Discord's REST API so a command's name, description, and behavior can never drift out of sync between what's registered and what the Worker handles.

Adds two npm scripts:

- `npm run register` — global registration by default, or guild-scoped if `DISCORD_GUILD_ID` is set in `.dev.vars`.
- `npm run register:guild` — explicit guild-scoped registration for fast iteration; fails clearly if `DISCORD_GUILD_ID` is unset, instead of silently falling back to global.

The script's URL-selection, payload-building, and guild-resolution logic are exported as pure functions and unit-tested in isolation with a mocked `fetch`, per `claude.md`'s TDD and no-live-network-calls rules — `test/register-commands.test.js` never hits Discord's API.

`docs/using-this-template.md` gains a "Registering slash commands" section covering when to run it (once per Discord application, and again after any command change) and why guild-scoped registration is the faster development loop (instant vs. up to an hour for global propagation).

**Migration:** no action required for existing forks that haven't added their own registration mechanism. A fork with its own registration script should diff against this change before adopting it.
