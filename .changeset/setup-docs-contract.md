---
"cloudflare-workers-discord-template": minor
---

Document `npm run setup` and `npm run setup:github`, and raise the instruction contract to **3.1.0**.

The documentation set now describes setup as one command rather than a checklist. No document tells a reader to do something a script now does.

- **`docs/using-this-template.md`** — step 1 ends in `npm run setup` instead of three `mv` commands, with a table of everything the run does and the two things it deliberately leaves alone. Step 2 explains what setup named and why rather than asking for a hand edit. "Run it locally" no longer copies `.dev.vars.example`, because setup already did and the example is pruned. Steps 5 and 6 lead with `npm run setup:github` and keep their tables as the reference for what it applies and how to check the readback. "Setup is complete when" now asks for the provenance record and a clean divergence report. Every heading is unchanged, so every inbound anchor still resolves.
- **`README.md`** — the quickstart is ten steps instead of eleven: cloning, installing, and setup are one step, and the separate renaming step is gone. Step 8 offers `npm run setup:github` before the by-hand walkthrough.
- **`docs/using-ai.md`** — the instruction-file swap is described in the past tense, as something setup did, and the guardrails section says plainly that no contract test can check live GitHub settings and that `setup:github`'s readback is the substitute. `.template/docs/using-ai.md` and `.template/README.md` carry the matching changes.
- **`docs/template-acceptance-test.md`** — Phase 3 is now `npm run setup` in a real *Use this template* repository followed by `npm test` and `npm run lint` with zero edits, which is the template's central claim and the one thing the archive-based checks cannot prove. Phase 6 covers `setup:github`'s readback, including the private-repository case where required reviewers do not save. The old manual-renaming phase is gone, so the count and every cross-reference are unchanged.
- **`CONTRIBUTING.md`** — a new section on `template-manifest.json` and `.template/` as template-owned surface: what belongs in each, why the payload is files rather than strings in a script, the standing rule that anything template-only must be registered in the manifest in the same change, and the converse — that `npm run setup:github` is permanent and must stay out of `prune` and `selfDelete`.

**Instruction contract 3.1.0** — minor, because the additions are compatible and invalidate no existing project structure. `claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md` all gain:

- `template-manifest.json` and `.template/` in the required project shape, with the registration rule and the permanent-script exception.
- `npm run setup` and `npm run setup:github` in the environment and deployment scripts contract.
- A revised GitHub Rulesets stance. Applying with `npm run setup:github` and verifying the readback is now the documented path; committing a payload as an applied artifact is still forbidden; contract tests still never check live GitHub settings.

Mirrored into `claude-for-users.md`, `AGENTS-for-users.md`, and `.github/copilot-instructions-for-users.md`: only the GitHub-settings rule, which a project still needs. The manifest and `.template/` are not mirrored — a project has already pruned them.

**Migration for a project created from an earlier version of this template.** No action is required; you can ignore this release. Your project has no `template-manifest.json` and no setup script, and nothing here changes how your Worker, tests, or deploy workflow behave.

If you would like the pruning anyway, `template-manifest.json` in this repository is the list of what to delete: its `prune` array names the files, `pruneGlobs` covers the pending changesets, `pruneDirectories` covers `.template/` itself, and `selfDelete` names the setup script and its npm script. Two things worth copying rather than deleting: `scripts/setup-github.js` with its library and tests, and a coverage floor in `vitest.config.js` your application can actually reach.
