# The Discord Bot

This document describes how the bot itself works: what happens to an interaction between Discord sending it and your code answering it, and which module owns which part of that. Project setup — Discord applications, secrets, deployment — lives in [Using this template](using-this-template.md).

This template receives interactions over **HTTP**, not the Gateway. Discord sends each interaction to your Worker as a signed POST request and expects a response on that same request. There is no persistent connection, no presence, and no message-event stream. That is what makes a Worker a good fit: nothing needs to stay running between interactions.

## The interaction lifecycle

Every request to `POST /interactions` goes through the same three steps, in this order.

### 1. Verify

`src/discord/verify.js` checks the Ed25519 signature on the request and rejects anything that fails with a `401`.

Two details are not negotiable:

- **The signature covers the raw request bytes.** So the raw body is read as text and handed back to the caller unparsed. Nothing may call `request.json()` before verification, because that means parsing input that has not been authenticated yet.
- **There is no bypass.** No development flag disables verification, and a Worker with no `DISCORD_PUBLIC_KEY` configured rejects interactions rather than accepting them unverified. Discord sends deliberately invalid signatures as a routine check and removes the Interactions Endpoint URL of an application that accepts one.

A verified request whose body is not valid JSON gets a `400`: the signature proved it came from Discord, so the problem is the payload's shape, not its origin.

### 2. PING and PONG

Discord sends a `PING` (interaction type `1`) when you save an Interactions Endpoint URL, and periodically afterwards. The answer is `{"type": 1}` with a JSON content type. `src/discord/responses.js` builds it.

This is the slice Discord validates before it will accept your URL at all. If this fails, nothing else about the bot matters yet.

### 3. Dispatch

`src/interactions.js` takes the verified, parsed interaction and returns a `Response`. For an `APPLICATION_COMMAND` (type `2`) it looks up the command by name in the registry and calls its handler.

A name that is not in the registry gets a `200` with an ephemeral message, not an error status. Discord renders a failed interaction as its own generic notice, which tells the user nothing; a reply only they can see tells them what actually happened — Discord and the Worker disagree about which commands exist, which means the commands need registering again.

Interaction types this template does not serve — components, modals, autocomplete — get a deliberate `400`.

## Module layout

| File | Responsibility |
| --- | --- |
| `src/index.js` | The Worker's `fetch` handler, and only routing: health check at `/`, interactions at `POST /interactions`, `405` for the wrong method, `404` for anything else. It builds the REST client and passes the registry in. |
| `src/discord/verify.js` | Ed25519 signature verification. Returns the raw body only when the signature checks out. |
| `src/discord/responses.js` | Builders for every interaction response — `pong()`, `reply()`, `ephemeral()`, `deferred()` — each setting the JSON content type Discord requires. |
| `src/discord/rest.js` | The outbound half: editing the original response to an interaction, for work that finishes after the acknowledgement. Takes `fetch` as an argument. |
| `src/interactions.js` | The dispatcher. Pure: interaction in, `Response` out. |
| `src/commands/index.js` | The command registry. One list, read by both the Worker and the registration script. |

### Two rules the layout depends on

**The dispatcher is injected, not wired.** `dispatchInteraction(interaction, { env, ctx, registry, rest })` receives its bindings, execution context, command registry, and REST client as arguments. So a test dispatches any interaction against a registry it invented and a REST client that records calls instead of making them — no Worker to start, no network to reach, and no reason for a command's tests to be slower or less precise than a pure function's.

**The registry stays importable from plain Node.** Nothing under `src/commands/` may import a `cloudflare:` module, because the command registration script runs under plain Node and imports the same file. This is the reason the definitions are data and handlers take their dependencies as arguments. `test/contracts/commands.test.js` enforces it, from outside the Workers pool.

That single registry is the point: two copies of a command definition drift, and the failure is invisible from either side. Discord advertises a command the Worker does not handle, or the Worker handles one Discord never registered.

## Testing the bot offline

The whole suite runs with no network, no Cloudflare account, and no Discord application:

- **Signatures are real.** `vitest.config.js` generates a throwaway Ed25519 keypair per test run, gives the Worker the public half through the test pool's bindings, and lets `test/helpers/interactions.js` sign fixtures with the private half. Verification runs real cryptography against a real signature — stubbing it would assert nothing, and this is the one security-critical behavior in the template.
- **Discord is never called.** `src/discord/rest.js` takes `fetch` as an argument and the dispatcher takes `rest` as an argument, so tests inject a fake that records calls.
- **No test holds a real credential.** Test keys come from the test-pool `env`, generated for that run.

Run `npm test` for the full suite with coverage, or `npx vitest run test/interactions.test.js` for one file while you work.

## Reference

- [Receiving and responding to interactions](https://docs.discord.com/developers/interactions/receiving-and-responding) — interaction types, response types, and the follow-up endpoints
- [Validating security headers](https://docs.discord.com/developers/interactions/overview#validating-security-headers) — the signature scheme `src/discord/verify.js` implements
