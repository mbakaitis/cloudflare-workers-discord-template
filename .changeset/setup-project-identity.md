---
"cloudflare-workers-discord-template": minor
---

Add the project-identity transforms to `scripts/lib/setup.js`.

These are the pure rewrites that turn this template's identity into a project's. Each one takes text in and returns text out, so `npm run setup` — which lands in a later change — can be tested without a repository to destroy:

- `deriveWorkerNames` validates a project slug against Cloudflare's Worker naming rules (lowercase letters, digits, and dashes, no leading or trailing dash, and short enough that `<slug>-production` fits the 63-character `workers.dev` limit) and derives the three Worker names. The derived names satisfy `test/contracts/environment-isolation.test.js`, asserted directly rather than assumed.
- `rewriteWranglerNames` renames all three Workers in `wrangler.jsonc` as text, so the compatibility date, the observability block, and every `secrets.required` list survive byte for byte. It refuses to run if a name is missing, shared between environments, or appears somewhere it was not expected.
- `rewritePackageManifest` sets the name and description, resets the version to `0.0.0`, drops the `template` and `boilerplate` keywords, and removes the `setup` script. `author` and `license` are deliberately left alone; the CLI will warn about them instead.
- `rewritePackageLock` updates only the root name and `packages[""].name`, textually, rather than re-serializing a 190 kB file.
- `rewriteCoverageThresholds` lowers the ratchet in `vitest.config.js` to a floor of **80** across all four metrics and replaces the maintainer-facing ratchet comment with wording that fits a project. The provider stays `istanbul`, `thresholds.autoUpdate` stays absent, and the include patterns are untouched, so `test/contracts/coverage.test.js` still passes against the result. The template holds itself to 100% because it is three commands long; an application is not, and a first partially-covered feature that fails `npm test` teaches a new project to lower the number, which is the habit the ratchet exists to prevent.
- `substitutePlaceholders` fills in the `.template/` payload's `{{TOKEN}}` values and throws on a leftover token rather than shipping a README that greets its first reader with `{{PROJECT_NAME}}`.
- `rewriteTemplateLinks` points the surviving documents' relative setup-guide links at the upstream blob URL, anchors intact, and reports how many it rewrote.
- `removeInstructionContractSection` deletes `docs/versioning-and-changesets.md`'s "Two version numbers" section. A project's instruction files carry no contract version, so the section documents a number that does not exist — and it holds that document's last link to the pruned `CONTRIBUTING.md`.

Every transform is idempotent, which is what makes a half-finished setup run safe to repeat. An anchor a rewrite keeps is required and its absence throws; an anchor a rewrite consumes is optional, because its absence is what a second run looks like.

No behavior changes for anyone using the template today: nothing new runs, and no npm script was added.

`test/contracts/setup-transforms.template-only.test.js` runs every transform against the repository's real files, so an upstream edit that moves an anchor fails here rather than in somebody's new project. It is template-only because it imports `scripts/lib/setup.js`, which setup deletes as its last act.
