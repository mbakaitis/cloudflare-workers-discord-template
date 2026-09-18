---
"cloudflare-workers-discord-template": minor
---

Add `template-manifest.json`, the `.template/` payload, and the setup planner.

`template-manifest.json` declares what belongs to the template rather than to a project built from it: the paths a new project prunes, the `.changeset/*.md` glob, the `.template` and `docs/images` directories, the three instruction-file pairs, the payload's copy destinations, and the files `npm run setup` will eventually delete along with itself. It is data, so it is reviewable in a diff rather than buried in a script.

`.template/` holds the downstream replacements for the four documents written from the template's point of view — `README.md`, `CHANGELOG.md`, `docs/using-ai.md`, and `docs/using-this-template.md`, which becomes a provenance stub so the inbound links in the surviving guides still resolve — with `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`, `{{TEMPLATE_REPOSITORY}}`, and `{{TEMPLATE_VERSION}}` tokens.

`scripts/lib/setup.js` is the pure half: glob resolution, the instruction-file swap/delete/keep decision, and a planner that orders copies before deletions and the script's own removal last. It writes nothing and imports nothing from the filesystem.

No behavior changes for anyone using the template today: nothing new runs, and no npm script was added. The setup CLI that applies the plan lands in a later change.

Two new contract tests back the promises: `test/contracts/manifest.template-only.test.js` fails when the manifest names a path that no longer exists, when a `.template-only.test.js` file is missing from the prune list, when a payload file uses an undeclared placeholder, or when a payload document links to something setup deletes. `test/helpers/credential-shapes.js` now holds the credential patterns that `discord.test.js` defined inline, so both scans share one definition.
