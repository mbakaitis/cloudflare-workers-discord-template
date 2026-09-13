---
"cloudflare-workers-discord-template": minor
---

Serve the slice of the Discord contract that Discord itself validates: verify the signature, answer `PING` with `PONG`, reject everything else.

**The endpoint.** `src/index.js` becomes a router and nothing more — `GET /` for health, `POST /interactions` for Discord, `405` for the wrong method on that path, `404` for anything else. The interaction logic lives beside it so the security-critical decision sits in one tested place:

- `src/discord/verify.js` wraps `verifyKey` from `discord-interactions`. It reads the raw body only after both signature headers are present, and returns the raw text rather than a parsed object, because the signature covers the raw bytes and nothing may parse them first.
- `src/discord/responses.js` builds `pong()`, `reply()`, `ephemeral()`, and `deferred()`, each with the `application/json` content type Discord requires on interaction responses — including the `PING` acknowledgement, which is the first thing it checks when an Interactions Endpoint URL is saved.

Verification fails closed. A missing `DISCORD_PUBLIC_KEY` rejects interactions rather than accepting them unverified, and there is no development flag that turns the check off. Discord sends deliberately invalid signatures as a routine audit and removes the endpoint URL of an app that accepts one, so a bypass would not merely be unsafe — it would break the bot.

An unverified request gets `401 invalid request signature` and its body is never parsed. That ordering has its own test: a request with no signature headers *and* an unparseable body must still fail as `401`, never `400`. A `400` there would prove the Worker parsed attacker-controlled input before authenticating it.

**Runtime dependency.** `discord-interactions@^4.4.0`, the template's first — Discord-maintained, no transitive dependencies, and Web Crypto only, so it runs in `workerd` untouched. The bundle is 22.5 KiB (5.15 KiB gzipped).

**Tests sign for real.** `vitest.config.js` generates a throwaway Ed25519 keypair per test run and supplies the public half to the test pool as `DISCORD_PUBLIC_KEY`, with the private half used only by `test/helpers/interactions.js` to sign fixtures. `verifyKey` therefore does real cryptography against a real signature instead of being stubbed, which is the only way a test of this module means anything. Generating the pair per run also keeps every key-shaped literal out of the repository and keeps test credentials unmistakably distinct from a real Discord application's. `workerd` was confirmed to support `generateKey`, `importKey`, `sign`, and raw/pkcs8 export for Ed25519, so no committed fixture keypair was needed.

Nine behaviors are covered: the health route, three flavors of rejected signature, a valid signature over a tampered body, `PING`/`PONG` with its content type, a signed but malformed JSON body, an unhandled interaction type, and the `405`/`404` routing edges.

Coverage stays at 100% of statements, branches, functions, and lines — but now over 41 statements rather than 1, which is the actual strengthening. The thresholds did not rise because they were already at the ceiling. The ratchet did its job along the way: it failed the run on an untested `400` branch, which then got the test it was missing.

`eslint.config.js` gains `crypto`, `Request`, and `TextEncoder` as declared globals rather than inline disable comments at each use site.

Migration: none for a downstream project that has not yet customized `src/index.js`. A project that has one must merge its own routes with the new router and keep `POST /interactions` verifying first. The Worker now reads `env.DISCORD_PUBLIC_KEY`; a later change declares it as a per-environment secret, and until then a local `.dev.vars` supplies it.
