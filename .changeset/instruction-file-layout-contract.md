---
"cloudflare-workers-discord-template": patch
---

Fix the instruction-file contract test so it passes in a downstream project.

`test/contracts/instructions.test.js` asserted this repository's file layout rather than the promise behind it: three maintainer instruction files declaring one agreed contract version, three `-for-users` counterparts declaring none. A project that followed the documented setup step and renamed the counterparts into place therefore failed `npm test` on its first run — the in-place files no longer carry a version, and the counterparts no longer exist.

The audit now detects which layout it is looking at and applies the rule that belongs to it:

- **The template's layout** — counterparts present — keeps the full contract: all six files, one identical Semantic Version across the maintainer three, no version on the counterparts.
- **A project's layout** — counterparts gone — requires only that no in-place file still declares a contract version. Which of the three a project keeps is its own business.
- **No instruction files at all** — the documented "delete all six" path — has nothing to check.

Anything else is a half-finished swap, which now fails with a message naming each file involved. That state was previously invisible, and "skip the counterpart when it is missing" would have kept it that way.

No action is needed in a downstream project beyond adopting the change: if `npm test` was already failing on this test after setup, it stops. The logic moved to `test/helpers/instruction-files.js` and is covered by fixture cases for every layout, including the failure modes.

Instruction contract version 3.0.0 → 3.0.1: `claude.md` and its adapter files now state that a contract test which only passes in this repository's layout is a template defect, since contract tests ship downstream. That sharpens an existing rule rather than adding a requirement.
