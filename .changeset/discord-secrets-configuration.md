---
"cloudflare-workers-template": minor
---

Document and scaffold the Discord secrets convention for this template. Adds `.dev.vars.example`, listing all four Discord values a bot instance needs (`DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, `DISCORD_GUILD_ID`) in one gitignored local file, and a new "Configuring Discord secrets" section in `docs/using-this-template.md` covering the per-environment Discord application strategy, local setup, and `wrangler secret put` steps for the deployed Worker's two values.

Key decisions, recorded in `project-approach.md` Stage 3:

- **One local file, not a sensitivity-based split.** `DISCORD_PUBLIC_KEY` and `DISCORD_APPLICATION_ID` aren't actually sensitive, which would justify committed `wrangler.jsonc` `vars` instead of a gitignored file. Chosen anyway: every Discord value lives in `.dev.vars`, so there is exactly one place to configure "the Discord stuff." `wrangler dev` reads it automatically; the registration script (a later stage) will read the same file via `node --env-file=.dev.vars`.
- **Two Discord applications, not one.** One shared by local development and `non-prod`, one dedicated to `production` — mirroring the existing non-prod/production Worker-naming split and the "production resources are never silently reused" rule, applied to bot credentials.
- **`DISCORD_TOKEN` is the canonical bot-token name** (not `DISCORD_BOT_TOKEN`) and is never a Worker secret — it only ever lives in a developer's local `.dev.vars` or wherever a future stage's CI-driven registration keeps it, never in `wrangler secret put`.
- `.gitignore`'s `.env`/`.env.*`/`!.env.example` lines are removed since this design has no `.env` file; `.dev.vars`/`.dev.vars.*`/`!.dev.vars.example` covers the single local file.

**Migration:** no action required for existing forks — this is additive documentation and an example file, not a behavior change. A project already past this stage should copy `.dev.vars.example` to `.dev.vars` and fill in real values before Stage 4/5 land the code that reads them.
