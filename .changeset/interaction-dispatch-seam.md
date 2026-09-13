---
"cloudflare-workers-discord-template": minor
---

Add the seam commands plug into, and the document that explains the bot.

**A dispatcher that takes its world as an argument.** `src/interactions.js` exports `dispatchInteraction(interaction, { env, ctx, registry, rest })` and returns a `Response`. Bindings, the execution context, the command registry, and the Discord REST client all arrive as arguments rather than imports. That is the whole design decision in this change: a test can dispatch any interaction against a registry it invented and a REST client that records calls instead of making them, with no Worker to start and no network to reach. The alternative — a dispatcher that imports the real registry and calls `fetch` — makes every command's tests slower, less precise, and eventually stubbed, and the coverage ratchet would have been the first thing to go.

`src/index.js` stays a router and hands the dispatcher the registry and a REST client bound to the runtime's `fetch`. The `unsupported interaction type` branch moved out of the router and into the dispatcher, where the interaction-type decisions now live together.

**One registry, readable from plain Node.** `src/commands/index.js` exports an empty `commands` array plus the JSDoc typedefs describing a command's definition, handler, and context. It ships empty on purpose: a template that guesses at commands makes a downstream project delete things before it can add its own.

Nothing under `src/commands/` may import a `cloudflare:` module, because the command registration script runs under plain Node and imports the same file that the Worker dispatches from. `test/contracts/commands.test.js` enforces it from outside the Workers pool — it imports the registry under plain Node and statically rejects a `cloudflare:` import in any file in that directory, so the constraint holds for commands added later, not just for the empty registry. Two copies of a command definition drift, and the failure is invisible from either side: Discord advertises a command the Worker does not handle, or the Worker handles one Discord never registered.

**An unknown command is a `200`, not a `4xx`.** A name Discord offers but the registry does not carry gets an ephemeral reply saying the commands may need registering again. Discord renders a failed interaction as its own generic notice, which tells the user nothing, and the condition is a registration mismatch — the bot's problem to explain, not the user's to decode. The reply names no part of the payload.

**The outbound half.** `src/discord/rest.js` adds `editOriginalResponse()` — `PATCH /webhooks/{application.id}/{interaction.token}/messages/@original`, confirmed against Discord's documentation ([Edit Original Interaction Response](https://docs.discord.com/developers/interactions/receiving-and-responding#edit-original-interaction-response)). The interaction token in the path is the authorization, so the call carries no bot token, and the token is valid for 15 minutes after the interaction. The API base is pinned to `v10`, since an unversioned base URL redirects to Discord's oldest supported version.

It takes `fetch` as an argument, and `createRest(fetchImpl)` binds one so handlers never touch `fetch` directly. On a non-2xx response it throws an error carrying the **status only** — not the URL, which contains the interaction token, and not the response body, which can quote the content that was sent. An error message is the single most likely thing to end up in a log line, and observability is enabled on this Worker, so a log line is a durable record. A test asserts the token does not appear in the thrown message.

**Documentation.** `docs/discord-bot.md` is new and covers only what exists: the three-step lifecycle (verify, PING/PONG, dispatch), the per-file module layout, the two rules the layout depends on, and how the Discord surface is tested with real signatures and no network. It is linked from the documentation tables in `README.md`, `claude.md`, and the document-role lists in `AGENTS.md` and `.github/copilot-instructions.md`. Later changes extend it rather than replacing it.

**Coverage.** The thresholds stay at 100% statements, branches, functions, and lines — they cannot be raised, and the new modules are fully covered at that level (62 statements, 27 branches, 13 functions). `eslint.config.js` gains `fetch` as a declared global.

Migration: none for downstream projects. A project that already copied `src/index.js` and is adopting this change should take `src/interactions.js`, `src/discord/rest.js`, and `src/commands/index.js` whole, then replace its own interaction-type branching with the `dispatchInteraction` call — the router's `fetch` handler now needs `ctx` in its signature so command handlers can reach `waitUntil`.
