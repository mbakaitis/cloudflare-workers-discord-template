---
"cloudflare-workers-discord-template": patch
---

Fix the setup ordering in `docs/using-this-template.md` and explain where each Discord secret actually goes.

Step 3 told you to run `wrangler secret put` before it told you to run the bot locally, which put the first command that needs a Cloudflare account ahead of the entire no-account path — and did it immediately after step 2 reassured you that `--dry-run` "never contacts your account." The README had the right order all along (local at step 5, Worker secrets at step 8), so the two documents disagreed about when an account becomes necessary.

Neither document was wrong about the secrets themselves. `.dev.vars` and `wrangler secret put` are two different stores for the same three names, and a project needs both. But nothing said so plainly, so the pair read as a contradiction.

What changed, all documentation:

- **A new [Where each value goes](docs/using-this-template.md#where-each-value-goes) section** names the three stores — `.dev.vars`, Cloudflare's per-Worker encrypted store, and GitHub Environment secrets — with who reads each and which step sets it, and states that nothing synchronizes them. It is a grid of environment against store, so which names each store holds is visible per environment: `.dev.vars` is non-production only and has no production counterpart, a non-production value ends up in three places and a production value in two, and the two deliberate absences (`DISCORD_PUBLIC_KEY` everywhere in CI, `DISCORD_GUILD_ID` in production) are called out where a reader would otherwise read them as omissions. It also notes that `DISCORD_GUILD_ID` is loaded differently from the rest — `wrangler dev` reads `secrets.required` from `.dev.vars` automatically, but the registration script reads the guild ID from the shell, so the file alone is not enough.
- **[Where each value comes from](docs/using-this-template.md#where-each-value-comes-from) now says to keep your own copy of each bot token.** The public key and application ID stay readable in the Developer Portal, so they never need recording; the token is shown once and is unrecoverable, and the cost of losing it is re-entering a reset value in every store that holds it.
- **"Run it locally" now precedes "Set them on each Worker"** within step 3. Both anchors are unchanged, so existing links still resolve.
- **"Set them on each Worker" opens by saying it is the first step needing a Cloudflare account**, and that Wrangler must be authenticated.
- **The placeholder-Worker prompt is documented.** No Worker exists yet at that point, so Wrangler offers to create one to hold the secret. The docs now quote the prompt, say to answer yes, and note the two visible consequences: both Worker names appear in the dashboard before anything is deployed, and neither answers a request until the first real deploy.
- **A new subsection explains why the step cannot wait** until after the first deploy: `secrets.required` makes the deploy fail, and `deploy.yml` has no `wrangler secret put` step, so CI can never set them.
- The README gained brief notes at steps 5 and 8 pointing at the same distinction, and `docs/template-acceptance-test.md` Phase 7 now checks that a first-time reader was prepared for the account requirement and the placeholder Workers.

No action is needed in a downstream project. No code, configuration, script, or test changed, and no documented command or file path changed.
