---
"cloudflare-workers-discord-template": minor
---

Split the contract assertions that are true only of this template into `*.template-only.test.js` files, and relax the shipped ones to assert the promise rather than this checkout.

Contract tests ship downstream, so a test that only passes in this repository's layout is a defect in the template: a project created from it fails `npm test` on its first run through no fault of its own. Three assertions were in that category — the MCP server list pinned to exactly three names and URLs, the Wrangler environment set pinned to exactly `non-prod` and `production`, and `.dev.vars.example` required to exist and to hold nothing but `replace-me` values. All three are still worth making about *this* repository, so none of them was deleted. They moved:

- `test/contracts/instructions.template-only.test.js` — the whole of the former `test/contracts/instructions.test.js`, unchanged. The contract version it enforces is the template's, and a project that completed the instruction-file swap has no upstream file to stay in sync with. `test/helpers/instruction-files.js` stays where it is.
- `test/contracts/discord.template-only.test.js` — the `.dev.vars.example` placeholder case, and the exactness of the environment set.
- `test/contracts/workflow.template-only.test.js` — the three expected MCP server names and their exact URLs.

**What ships keeps a real promise, in a weaker form.** `discord.test.js` now asserts that both a non-production and a production environment exist in `wrangler.jsonc` without pinning the set, so a project may add a third. `workflow.test.js` no longer knows which MCP servers there should be; it asserts that `.mcp.json` and `.vscode/mcp.json` declare the *same* set, whatever it is, that every entry is exactly `{ type: "http", url }` over `https://`, and that no entry carries a credential-shaped key — `headers`, `token`, `apiKey`, `api_key`, `env`, `command`, or `args`. That is the promise worth keeping: the two files agree, and neither holds a secret.

Each relaxed case was shown to fail before it was accepted: adding a `headers` key to one server, declaring a server in only one of the two files, and dropping `env.production` from `wrangler.jsonc` each go red with a message naming the problem. The mirror cases were checked too — adding a third environment, or a fourth server to both files, passes the shipped test and fails the template-only one, which is exactly the line the split is meant to draw.

**Naming, not foldering.** The `.template-only.test.js` suffix is already matched by the `test/contracts/*.test.js` glob in `test:contracts`, so `package.json` is untouched. A `template-only/` subdirectory would force `node --test` to recurse a directory, where its default patterns also pick up non-test `.js` files under `test/`. The suffix also makes pruning file-level, which is what a future setup script needs.

Nothing here changes runtime behavior, and no threshold moved: `npm test` runs 69 Vitest cases and 54 contract cases across ten contract files, and `npm run lint` is clean.

Migration for a downstream project adopting this change: cherry-pick it, then delete the three `.template-only.test.js` files and `test/helpers/instruction-files.js` from your copy — they assert things about the template, not about your application. If you had already edited `test/contracts/instructions.test.js` or deleted `.dev.vars.example` locally to get a green suite, this change makes those edits unnecessary; take the upstream files and drop your local patch.

`claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md` each cited `test/contracts/instructions.test.js` by path as the worked example of a downstream-safe contract test. That path no longer exists and the claim behind it no longer holds, so all three now point at the relaxed `workflow.test.js` and the `.template-only.test.js` split instead. The requirement itself is unchanged — assert the promise, not this checkout — so the instruction contract version stays at 3.0.1, and nothing was mirrored into the `-for-users` files, which carry no downstream-alignment section because a single application is not maintaining a template.

`CONTRIBUTING.md` documents the convention: what belongs in a template-only file, that nothing in one may be imported by a sibling that ships, that the shipped half must keep the promise in relaxed form, and that a split is not done until the relaxed case has been seen to fail.
