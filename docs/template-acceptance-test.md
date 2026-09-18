# Template Acceptance Test

**Status:** working artifact, not part of the consumer documentation set. It is the manual run that decides whether this template is ready for 1.0. Delete it once the run is done and its findings have become issues, changesets, or documentation fixes.

This file deliberately contains **no instructions**. Every step points at the document a real consumer would use. If a phase below cannot be completed from the linked document alone, that *is* the finding — it is the whole reason to run this.

## What this test answers

One question: **can someone who has never seen this repository get from nothing to `/ping`, `/echo`, and `/slow` answering in a Discord server, using only [README.md](../README.md) and what it links to?**

Everything in `src/`, `scripts/`, and `test/` is already proven by `npm test`. What is unproven is the *path* — the ordering, the account setup, the workflow, and the documentation that describes them. Four things in particular have never run even once:

| Never run before | Proven in |
| --- | --- |
| The deploy workflow under real Cloudflare credentials | Phase 8 |
| Discord's save-time `PING` against a deployed Worker | Phase 9 |
| The `production` environment's approval gate | Phase 10 |
| Command registration authenticating with a real bot token | Phase 8 |

## Ground rules

1. **Use only the documentation.** Start at README.md and follow its links. The moment you use knowledge that is not in the docs — because you wrote them — stop and write that down. That is a documentation bug, not a shortcut.
2. **Do not fix anything mid-run.** Note it, work around it, keep going. A run interrupted by fixes stops measuring the path a consumer actually walks.
3. **Note friction, not just failure.** "Worked, but I had to scroll back twice to find the value" is a finding.
4. **Use throwaway everything.** Two disposable Discord applications, a private test server, a repository you can delete. Cheap to redo, cheap to abandon.
5. **Start from *Use this template*, not a clone.** The no-shared-history path is the one real projects take, and it is the one Phase 13 depends on.

## The run

Each phase names what it is proving, the document that drives it, and what counts as a pass. Record notes as you go in the table at the bottom.

### Phase 0 — Cold read

**Proves:** the README explains what this is before asking anyone to do anything.
**Do:** read README.md down to the quickstart, and nothing else.
**Pass:** you could tell a colleague what the template gives them, what it deliberately leaves out, and roughly what it will cost them to set up.

### Phase 1 — Two Discord applications

**Proves:** the two-application model is explained well enough to follow without cross-wiring it, and that the install step names the scopes and permissions instead of leaving you to choose.
**Do:** README step 1, which sends you to [Create your Discord applications](using-this-template.md#3-create-your-discord-applications) and then [Install the non-production application in your test server](using-this-template.md#install-the-non-production-application-in-your-test-server).
**Pass:** two applications exist, the non-production one is installed in your test server, and you have every value the docs ask for — without having guessed which application a value belongs to, or which scopes and bot permissions to check in the URL generator.

### Phase 2 — Repository and install

**Proves:** the *Use this template* path, the declared Node version, and the AI instruction-file swap.
**Do:** README steps 2–3, then [Replace the AI instruction files](using-this-template.md#1-create-and-clone-your-repository).
**Pass:** clean install on the Node version `.nvmrc` declares; after the swap, the repository carries no maintainer-facing instruction content and nothing references the files you renamed away.

### Phase 3 — Naming

**Proves:** renaming is a bounded, documented edit rather than a search-and-replace hunt.
**Do:** README step 4.
**Pass:** no occurrence of `cloudflare-workers-discord-template` remains where it matters, and `npm test` still passes — the contract tests should confirm the rename rather than you eyeballing it.

### Phase 4 — Local, with no accounts

**Proves:** the "steps 1–6 need no Cloudflare account" claim on the README.
**Do:** README steps 5–6.
**Pass:** `npm run dev` serves the health path and answers `401` to an unsigned interaction, and `npm test` passes on a machine that has never touched Cloudflare or Discord.

### Phase 5 — Local tunnel (first contact with real Discord)

**Proves:** the interaction contract against real Discord traffic, before any deploy exists to confuse the diagnosis.
**Do:** [Developing against a local tunnel](discord-bot.md#developing-against-a-local-tunnel).
**Pass:** the Interactions Endpoint URL saves against your tunnel, `/ping` and `/echo` answer, and `/slow` shows a loading state that later resolves.
**Also do, deliberately:** put the *wrong* application's public key in `.dev.vars` and try to save the URL. Discord should refuse it. Confirming the failure mode matters more than confirming the success one.

### Phase 6 — Branches, environments, and repository rules

**Proves:** the GitHub-side setup, including the parts no test can observe.
**Do:** README steps 7 and 9, driven by [Configure GitHub environments and secrets](using-this-template.md#5-configure-github-environments-and-secrets) and [Configure branch protection](using-this-template.md#6-configure-branch-protection).
**Pass:** the Discord secrets are at *environment* scope, not repository scope; `production` requires a reviewer; the required status check name matches the CI job; and the ruleset verification command in the docs shows what the table claims it will.

### Phase 7 — Worker secrets

**Proves:** the promise that a deploy names its missing secrets.
**Do:** README step 8 / [Set them on each Worker](using-this-template.md#set-them-on-each-worker).
**Pass:** deliberately leave one secret unset and attempt a real deploy of that environment. It should fail and say which. Then set it.
**Also note:** this is the first step that needs a Cloudflare account, and the Workers do not exist yet, so Wrangler prompts to create each one as a placeholder. Confirm the docs prepared you for both — an unexpected auth wall, or two Workers appearing in the dashboard before you deployed anything, are exactly the kind of surprise this phase exists to catch.

### Phase 8 — First non-production deploy ⚠️ never run before

**Proves:** the deploy workflow, end to end, under real credentials — lint, test, deploy, then registration.
**Do:** merge to `develop`.
**Pass:** every step appears in the job log in the documented order, the registration step prints `ping, echo, slow`, and **no token appears anywhere in the log**. Read the whole log, not the green check.

### Phase 9 — Point Discord at the deployed Worker ⚠️ never run before

**Proves:** the ordering constraint the docs make a point of, and Discord's validation of a deployed endpoint.
**Do:** [Point each Discord application at its Worker](using-this-template.md#8-point-each-discord-application-at-its-worker).
**Pass:** the URL saves; all three commands answer in your test server; `/slow` resolves its loading state. Note whether the docs prepared you for commands being *listed but dead* between Phase 8 and this one — that gap is the thing most likely to confuse a first-time reader.

### Phase 10 — Production promotion ⚠️ never run before

**Proves:** the approval gate and global registration.
**Do:** open and merge `develop` → `main`, per [Gitflow and branching](gitflow-and-branching.md).
**Pass:** the job waits for approval rather than deploying; after approval it deploys production and registers globally; the production application's endpoint URL saves; global commands eventually appear. Note how long "eventually" actually was — the docs say it propagates, and a number would be better.

### Phase 11 — Rollback rehearsal

**Proves:** the specific claim in [Rollback](gitflow-and-branching.md#rollback) that a reverting commit rolls back the Worker *and* the command list, in that order.
**Do:** change a command's description, ship it, then revert it on `main`.
**Pass:** both the deploy and the registration run on the revert, and Discord ends up showing the older description.

### Phase 12 — Bulk overwrite

**Proves:** the registration behavior [The Discord bot](discord-bot.md#registering-commands) warns about.
**Do:** remove a command from the registry, deploy, then put it back.
**Pass:** the command disappears from Discord on the first deploy and returns on the second, with no manual unregistration step.

### Phase 13 — Upstream adoption

**Proves:** the adoption path works from a repository that shares no history with this one.
**Do:** [Keeping up with upstream changes](using-this-template.md#10-keeping-up-with-upstream-changes), using any small commit from this repository.
**Pass:** the remote, fetch, and cherry-pick work as written from a *Use this template* repository.

### Phase 14 — The guardrails (optional)

**Proves:** the claims in [Using AI with this template](using-ai.md).
**Do:** ask an assistant for something a contract test forbids — pointing non-production at a production resource is the canonical one — and try lowering a coverage threshold.
**Pass:** both produce failing tests rather than a merged change.

## Teardown

Keep the test guild and the non-production application if you plan to re-run this after fixes; they are the cheap half. Delete the Cloudflare Workers and the production Discord application if this was a one-off, and revoke the API token either way.

## Notes

Fill this in as you go. Severity: **blocker** (cannot proceed from the docs), **friction** (possible but annoying or ambiguous), **polish** (fine, could be better).

Findings are being fixed on `feature/acceptance-testing-updates` as the run proceeds.

| Phase | What happened | Doc gap or friction | Severity | Proposed fix |
| --- | --- | --- | --- | --- |
| 0 | Passed. | None. | — | — |
| 1 | Applications created and installed via **OAuth2 > URL Generator**. | The docs said to build an install link but never said *which* scopes or bot permissions to select, so the choice fell to the reader — and the widely-copied answer (`bot` + `Send Messages`) grants more than this template needs. | Friction | **Fixed.** [Install the non-production application in your test server](using-this-template.md#install-the-non-production-application-in-your-test-server) now names the scopes (`applications.commands`, with `bot` optional and why), states that no bot permissions are needed and why, and says that the list is a property of *your* features once you add any. |
| 2 | `npm test` failed straight after the documented instruction-file swap. | `test/contracts/instructions.test.js` asserted the template's own file layout, so every downstream project failed it on first run: the in-place files carry no contract version once swapped, and the `-for-users` counterparts are gone. A contract test that only passes upstream is worse than no test. | **Blocker** | **Fixed.** The audit now detects the layout (template / project / no AI files) and applies the matching rule, and additionally fails a *half*-finished swap, which nothing caught before. Logic in `test/helpers/instruction-files.js`, fixture-covered per layout. The test itself has since been renamed `test/contracts/instructions.template-only.test.js` and is deleted by a project created from the template. |

Worth capturing separately, because they are hard to reconstruct afterwards:

- **Total elapsed time**, and which phase took longest.
- **Every moment you used knowledge that is not in the docs.** These are the highest-value findings in the whole run.
- **Anything you expected to exist and did not** — a command, a file, a section, a link.

## The 1.0 gate

Tag 1.0 when all of these hold:

1. Every phase passed, from a repository created with *Use this template*.
2. No blocker remains. Each one is fixed, and the affected phase re-run — not the whole test.
3. Friction and polish findings are recorded somewhere durable (issues, or changesets if the fix landed), not just in this file.
4. The four never-run-before items in the table at the top are all marked proven.
5. This file is deleted in the same change that cuts the release.

If a phase fails for a reason outside the template — a Cloudflare account limit, a Discord outage, a GitHub plan restriction — mark it N/A with the reason. Do not let it block the tag, but do check whether the docs should have warned you about it.
